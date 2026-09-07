import { validateTargetUrl } from '../../middleware/ssrfGuard.js'

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (SEO Diagnostic Engine Bot)'

export interface FetchResult {
  ok: boolean
  status: number
  url: string
  html: string | null
  error: string | null
}

/**
 * 安全的 HTTP 網頁抓取函式 (含 Cookie 追蹤轉址控制、超時控制與 SSRF 防禦)
 */
export const fetchHtml = async (targetUrl: string, timeoutMs = 20000): Promise<FetchResult> => {
  const ssrfCheck = await validateTargetUrl(targetUrl)
  if (!ssrfCheck.ok || !ssrfCheck.normalizedUrl) {
    return {
      ok: false,
      status: 400,
      url: targetUrl,
      html: null,
      error: ssrfCheck.error || '網址未通過安全性檢驗'
    }
  }

  let currentUrl = ssrfCheck.normalizedUrl
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const cookieJar = new Map<string, string>()
  const maxRedirects = 10

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
        const location = response.headers.get('location')
        if (!location) {
          clearTimeout(timer)
          return {
            ok: false,
            status: response.status,
            url: currentUrl,
            html: null,
            error: `轉址異常 (HTTP ${response.status}) 未提供 Location 標頭`
          }
        }

        const nextUrl = new URL(location, currentUrl).href
        const redirectSsrf = await validateTargetUrl(nextUrl)
        if (!redirectSsrf.ok || !redirectSsrf.normalizedUrl) {
          clearTimeout(timer)
          return {
            ok: false,
            status: 400,
            url: nextUrl,
            html: null,
            error: `轉址目標安全性阻擋: ${redirectSsrf.error || '未通過 SSRF 檢驗'}`
          }
        }

        currentUrl = redirectSsrf.normalizedUrl
        continue
      }

      clearTimeout(timer)

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          url: currentUrl,
          html: null,
          error: `HTTP 狀態碼錯誤: ${response.status} ${response.statusText}`
        }
      }

      const html = await response.text()
      return {
        ok: true,
        status: response.status,
        url: currentUrl,
        html,
        error: null
      }
    }

    clearTimeout(timer)
    return {
      ok: false,
      status: 310,
      url: currentUrl,
      html: null,
      error: '轉址次數過多 (超過 10 次轉址上限)'
    }
  } catch (err: unknown) {
    clearTimeout(timer)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const message = isTimeout
      ? `網頁請求逾時 (${timeoutMs / 1000} 秒)`
      : err instanceof Error
      ? err.message
      : '網路請求失敗'

    return {
      ok: false,
      status: 0,
      url: currentUrl,
      html: null,
      error: message
    }
  }
}
