import type { CrawlResult, PageFetchMeta, SampledPage } from '../../types/seo.js'
import { fetchHtml, type FetchResult } from './httpFetcher.js'
import { extractInternalArticleLinks } from './linkExtractor.js'
import { fetchContentFeedArticles } from './contentFeedAdapter.js'
import { checkRobotsTxt } from './robotsTxtChecker.js'
import { checkLlmsTxt, checkSitemap } from './discoveryChecker.js'

export interface CrawlOptions {
  isSiteWide?: boolean
  sampleLimit?: number
  articlePathKeywords?: string[]
  /** 回報爬取階段進度 (例如抽樣到第幾頁) */
  onProgress?: (message: string) => void
}

const toMeta = (res: FetchResult): PageFetchMeta => ({
  status: res.status,
  htmlBytes: res.htmlBytes,
  ttfbMs: res.ttfbMs,
  base64ImageCount: res.base64ImageCount,
  base64Bytes: res.base64Bytes,
  xRobotsTag: res.xRobotsTag,
  truncated: res.truncated
})

/**
 * 網頁爬取服務 (支援單頁與抽樣)
 */
export const crawlTarget = async (
  targetUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> => {
  const { isSiteWide = false, sampleLimit = 10, articlePathKeywords, onProgress } = options
  const crawlStartTime = Date.now()
  const MAX_TOTAL_CRAWL_MS = 23000
  const origin = new URL(targetUrl).origin

  // 平行抓取首頁、robots.txt、llms.txt 與 (若適用) 平台結構化內容饋送；sitemap 需等 robots.txt 的宣告
  const shouldFetchIypFeed = isSiteWide && targetUrl.includes('life.iyp.com.tw')
  const robotsPromise = checkRobotsTxt(targetUrl)
  const discoveryPromise = Promise.all([
    checkLlmsTxt(origin),
    robotsPromise.then(robots => checkSitemap(origin, robots))
  ]).catch(() => null)

  onProgress?.('正在連線目標網址並檢測 robots.txt 與 AI 爬蟲權限')
  const [primaryResult, robotsTxt, feedLinks] = await Promise.all([
    fetchHtml(targetUrl, 25000, { expectHtml: true }),
    robotsPromise,
    shouldFetchIypFeed
      ? fetchContentFeedArticles(
          'https://www.iyp.com.tw/graphql',
          'https://life.iyp.com.tw',
          sampleLimit + 2,
          6000
        ).catch(() => [] as string[])
      : Promise.resolve([] as string[])
  ])

  if (!primaryResult.ok || !primaryResult.html) {
    throw new Error(`無法連線至該網址: ${primaryResult.error || '未知錯誤'}`)
  }

  const sampledPages: SampledPage[] = []

  if (isSiteWide) {
    // 全站模式：搜集候選子頁面
    const candidateLinks: string[] = [
      ...feedLinks,
      ...extractInternalArticleLinks(primaryResult.html, primaryResult.url, articlePathKeywords)
    ]

    // 去重並過濾主頁自身
    const primaryUrlObj = new URL(primaryResult.url)
    const primaryDecodedPath = decodeURIComponent(primaryUrlObj.pathname)
    const uniqueCandidates = Array.from(new Set(candidateLinks))
      .filter((link) => {
        try {
          const u = new URL(link)
          return (
            decodeURIComponent(u.pathname) !== primaryDecodedPath &&
            u.href !== primaryUrlObj.href
          )
        } catch {
          return false
        }
      })
      .slice(0, sampleLimit)

    // 控制總爬蟲時間預算與併發佇列 (避免因單頁體積龐大導致全站抽樣超過反向代理 30 秒逾時上限)
    const concurrency = 5
    let cursor = 0

    const worker = async (): Promise<void> => {
      while (cursor < uniqueCandidates.length) {
        const remainingBudget = MAX_TOTAL_CRAWL_MS - (Date.now() - crawlStartTime)
        if (remainingBudget <= 2500) {
          break
        }

        const pageUrl = uniqueCandidates[cursor++]
        const perPageTimeout = Math.min(10000, remainingBudget)
        const pageRes = await fetchHtml(pageUrl, perPageTimeout, { expectHtml: true })
        if (pageRes.ok && pageRes.html) {
          sampledPages.push({ url: pageRes.url, html: pageRes.html, meta: toMeta(pageRes) })
          onProgress?.(`正在抽樣檢測內部頁面 (${sampledPages.length}/${uniqueCandidates.length})`)
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(concurrency, uniqueCandidates.length) }, () => worker())
    )
  }

  const discoveryResult = await discoveryPromise
  return {
    isSiteWide,
    primaryUrl: primaryResult.url,
    primaryHtml: primaryResult.html,
    primaryMeta: toMeta(primaryResult),
    sampledPages,
    robotsTxt,
    discovery: discoveryResult
      ? { checked: true, llmsTxt: discoveryResult[0], sitemap: discoveryResult[1] }
      : {
          checked: false,
          llmsTxt: { exists: false, url: `${origin}/llms.txt` },
          sitemap: { exists: false, url: `${origin}/sitemap.xml`, source: 'default' }
        }
  }
}
