import * as cheerio from 'cheerio'

const EXCLUDED_EXTENSIONS_REGEX = /\.(css|js|png|jpg|jpeg|gif|svg|pdf|zip|ico|woff|woff2|ttf|mp4|webp|json|xml)$/i
const DEFAULT_ARTICLE_PATH_KEYWORDS = ['article', 'post', 'blog', 'news', 'story', 'detail', 'view', 'item']

/**
 * 計算連結優先級分數
 */
const getLinkPriorityScore = (urlStr: string, keywords: string[]): number => {
  let score = 0
  const lower = urlStr.toLowerCase()

  for (const kw of keywords) {
    if (lower.includes(kw)) score += 5
  }
  // 包含數字 ID 通常為特定文章頁
  if (/\d+/.test(lower)) score += 3

  return score
}

/**
 * 判斷目標網址是否為首頁或根路徑
 */
export const isHomepageOrRoot = (rawUrl: string): boolean => {
  try {
    let u = rawUrl.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    const parsed = new URL(u)
    const p = parsed.pathname
    return p === '' || p === '/' || p === '/index.html' || p === '/index.php'
  } catch {
    return false
  }
}

/**
 * 從 HTML 頁面中萃取同網域且高相關性的內部文章連結
 */
export const extractInternalArticleLinks = (
  html: string,
  baseUrl: string,
  keywords: string[] = DEFAULT_ARTICLE_PATH_KEYWORDS
): string[] => {
  try {
    const $ = cheerio.load(html)
    const baseObj = new URL(baseUrl)
    const candidateSet = new Set<string>()

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim()
      if (!href) return

      // 忽略錨點與特殊 scheme
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      try {
        const resolved = new URL(href, baseUrl)

        // 嚴格同主機限制
        if (resolved.hostname.toLowerCase() === baseObj.hostname.toLowerCase()) {
          const path = resolved.pathname

          // 排除靜態資源檔案與首頁
          if (EXCLUDED_EXTENSIONS_REGEX.test(path)) return
          if (path === '/' || path === '' || path === '/index.html' || path === '/index.php') return

          // 統一保留 origin + pathname (排除 hash 與多餘 query)
          candidateSet.add(resolved.origin + resolved.pathname)
        }
      } catch {
        // 忽略無效連結
      }
    })

    // 依文章特徵排序：包含文章相關路徑或帶數字 ID 的排前面 (分數先算好，避免排序時重複計算)
    return Array.from(candidateSet)
      .map(link => ({ link, score: getLinkPriorityScore(link, keywords) }))
      .sort((a, b) => b.score - a.score)
      .map(x => x.link)
  } catch {
    return []
  }
}
