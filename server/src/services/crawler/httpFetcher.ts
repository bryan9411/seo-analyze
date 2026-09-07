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
 * 安全的 HTTP 網頁抓取函式 (含超時控制與 SSRF 防禦)
 */
export const fetchHtml = async (targetUrl: string, timeoutMs = 20000): Promise<FetchResult> => {
  // 抓取前驗證 SSRF
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

  const url = ssrfCheck.normalizedUrl
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    })

    clearTimeout(timer)

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        url,
        html: null,
        error: `HTTP 狀態碼錯誤: ${response.status} ${response.statusText}`
      }
    }

    const html = await response.text()
    return {
      ok: true,
      status: response.status,
      url: response.url || url,
      html,
      error: null
    }
  } catch (err: unknown) {
    clearTimeout(timer)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const message = isTimeout ? `網頁請求逾時 (${timeoutMs / 1000} 秒)` : err instanceof Error ? err.message : '網路請求失敗'

    return {
      ok: false,
      status: 0,
      url,
      html: null,
      error: message
    }
  }
}
