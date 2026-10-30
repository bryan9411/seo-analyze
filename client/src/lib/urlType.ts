const ARTICLE_PATH_REGEX = /\/(article|articles|blog|blogs|post|posts|news|story|stories|p|detail|product|products|item|items)\//i

/**
 * 依網址判斷預設分析範疇：
 * 首頁或淺層路徑 → 全站抽樣；文章、商品等深層路徑 → 單頁診斷
 */
export const suggestSiteWide = (rawUrl: string): boolean | null => {
  const value = rawUrl.trim()
  if (!value) return null
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    const path = u.pathname.replace(/\/index\.(html?|php)$/i, '/')
    if (path === '/' || path === '') return true
    const segments = path.split('/').filter(Boolean)
    if (ARTICLE_PATH_REGEX.test(`${path}/`) || segments.length >= 2 || /\.(html?|php|aspx?)$/i.test(path)) return false
    return null
  } catch {
    return null
  }
}
