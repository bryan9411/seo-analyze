import { validateTargetUrl } from '../../middleware/ssrfGuard.js'

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (SEO Diagnostic Engine Bot)'

const BASE64_DATA_URI_REGEX = /data:[^;,"'\s\]\\]+;base64,[A-Za-z0-9+/=\\]{200,}/g
const NEXT_FLIGHT_SCRIPT_REGEX = /<script[^>]*>self\.__next_f\.push\([\s\S]*?<\/script>/gi

/** 單頁 HTML 讀取上限，超過即截斷以避免記憶體暴增 */
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024

/**
 * 清理 HTML 中巨型內嵌 Base64 圖片資料與無關的 hydration 腳本，防止記憶體暴增 (OOM)
 * 清理前先統計 Base64 數量與體積，供「網頁肥胖度」檢測使用
 */
const sanitizeHtmlPayload = (rawHtml: string) => {
  let base64ImageCount = 0
  let base64Bytes = 0
  const html = rawHtml
    .replace(BASE64_DATA_URI_REGEX, (m) => {
      base64ImageCount++
      base64Bytes += m.length
      return 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
    })
    .replace(NEXT_FLIGHT_SCRIPT_REGEX, '')
  return { html, base64ImageCount, base64Bytes }
}

export interface FetchResult {
  ok: boolean
  status: number
  url: string
  html: string | null
  error: string | null
  htmlBytes: number
  ttfbMs: number
  base64ImageCount: number
  base64Bytes: number
  xRobotsTag: string
  truncated: boolean
}

export interface FetchOptions {
  maxBytes?: number
  /** 僅接受 HTML / XML 回應 (網頁本體使用；robots.txt 等純文字檔不需要) */
  expectHtml?: boolean
}

const failure = (status: number, url: string, error: string): FetchResult => ({
  ok: false,
  status,
  url,
  html: null,
  error,
  htmlBytes: 0,
  ttfbMs: 0,
  base64ImageCount: 0,
  base64Bytes: 0,
  xRobotsTag: '',
  truncated: false
})

/** 以串流讀取回應本體，超過上限即停止 */
const readBodyCapped = async (response: Response, maxBytes: number) => {
  if (!response.body) return { text: '', bytes: 0, truncated: false }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  let truncated = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    bytes += value.byteLength
    if (bytes >= maxBytes) {
      truncated = true
      await reader.cancel().catch(() => {})
      break
    }
  }
  return { text: Buffer.concat(chunks).toString('utf8'), bytes, truncated }
}

/**
 * 安全的 HTTP 網頁抓取函式 (含 Cookie 追蹤轉址控制、超時控制與 SSRF 防禦)
 */
export const fetchHtml = async (
  targetUrl: string,
  timeoutMs = 30000,
  options: FetchOptions = {}
): Promise<FetchResult> => {
  const { maxBytes = DEFAULT_MAX_BYTES, expectHtml = false } = options
  const ssrfCheck = await validateTargetUrl(targetUrl)
  if (!ssrfCheck.ok || !ssrfCheck.normalizedUrl) {
    return failure(400, targetUrl, ssrfCheck.error || '網址未通過安全性檢驗')
  }

  let currentUrl = ssrfCheck.normalizedUrl
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const cookieJar = new Map<string, string>()
  const maxRedirects = 10
  const startedAt = Date.now()

  try {
    for (let i = 0; i < maxRedirects; i++) {
      const cookieHeader = Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')

      const headers: Record<string, string> = {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader
      }

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers,
        redirect: 'manual'
      })

      // 提取 Set-Cookie (支援 Node.js fetch getSetCookie)
      const setCookieHeaders = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [response.headers.get('set-cookie')].filter(Boolean) as string[]

      for (const sc of setCookieHeaders) {
        const parts = sc.split(';')[0].split('=')
        if (parts.length >= 2) {
          cookieJar.set(parts[0].trim(), parts.slice(1).join('=').trim())
        }
      }

      // 處理 301, 302, 303, 307, 308 轉址
      if (response.status >= 300 && response.status < 400) {
        response.body?.cancel().catch(() => {})
        const location = response.headers.get('location')
        if (!location) {
          clearTimeout(timer)
          return failure(response.status, currentUrl, `轉址異常 (HTTP ${response.status}) 未提供 Location 標頭`)
        }

        const nextUrl = new URL(location, currentUrl).href
        const redirectSsrf = await validateTargetUrl(nextUrl)
        if (!redirectSsrf.ok || !redirectSsrf.normalizedUrl) {
          clearTimeout(timer)
          return failure(400, nextUrl, `轉址目標安全性阻擋: ${redirectSsrf.error || '未通過 SSRF 檢驗'}`)
        }

        currentUrl = redirectSsrf.normalizedUrl
        continue
      }

      if (!response.ok) {
        clearTimeout(timer)
        response.body?.cancel().catch(() => {})
        return failure(response.status, currentUrl, `HTTP 狀態碼錯誤: ${response.status} ${response.statusText}`)
      }

      const ttfbMs = Date.now() - startedAt
      const contentType = response.headers.get('content-type') || ''
      if (expectHtml && contentType && !/html|xml/i.test(contentType)) {
        clearTimeout(timer)
        response.body?.cancel().catch(() => {})
        return failure(415, currentUrl, `目標網址不是 HTML 網頁 (Content-Type: ${contentType})`)
      }

      const { text, bytes, truncated } = await readBodyCapped(response, maxBytes)
      clearTimeout(timer)
      const { html, base64ImageCount, base64Bytes } = sanitizeHtmlPayload(text)

      return {
        ok: true,
        status: response.status,
        url: currentUrl,
        html,
        error: null,
        htmlBytes: bytes,
        ttfbMs,
        base64ImageCount,
        base64Bytes,
        xRobotsTag: response.headers.get('x-robots-tag') || '',
        truncated
      }
    }

    clearTimeout(timer)
    return failure(310, currentUrl, '轉址次數過多 (超過 10 次轉址上限)')
  } catch (err: unknown) {
    clearTimeout(timer)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const message = isTimeout
      ? `網頁請求逾時 (${timeoutMs / 1000} 秒)`
      : err instanceof Error
      ? err.message
      : '網路請求失敗'

    return failure(0, currentUrl, message)
  }
}
