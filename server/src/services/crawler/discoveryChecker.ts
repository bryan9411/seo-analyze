import type { DiscoveryReport, RobotsTxtReport } from '../../types/seo.js'
import { fetchHtml } from './httpFetcher.js'

const PROBE_MAX_BYTES = 64 * 1024

/**
 * 探測 /llms.txt 是否存在
 * 許多網站對任意路徑回傳 200 的 HTML 頁面 (soft 404)，因此內容是 HTML 時視為不存在
 */
export const checkLlmsTxt = async (origin: string): Promise<DiscoveryReport['llmsTxt']> => {
  const url = `${origin}/llms.txt`
  const res = await fetchHtml(url, 6000, { maxBytes: PROBE_MAX_BYTES })
  const text = res.html?.trim() || ''
  const exists = res.ok && text.length > 0 && !/^</.test(text)
  return { exists, url, snippet: exists ? text.slice(0, 300) : undefined }
}

/**
 * 探測 sitemap：優先使用 robots.txt 宣告的網址，否則嘗試 /sitemap.xml
 */
export const checkSitemap = async (
  origin: string,
  robotsTxt?: RobotsTxtReport
): Promise<DiscoveryReport['sitemap']> => {
  const declared = robotsTxt?.sitemaps?.[0]
  const url = declared || `${origin}/sitemap.xml`
  const res = await fetchHtml(url, 6000, { maxBytes: PROBE_MAX_BYTES })
  const exists = res.ok && (/<(urlset|sitemapindex)[\s>]/i.test(res.html || '') || /\.gz$/i.test(url))
  return { exists, url, source: declared ? 'robots' : 'default' }
}
