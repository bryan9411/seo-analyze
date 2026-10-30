import * as cheerio from 'cheerio'
import type { CrawlResult, SampledPage } from '../../types/seo.js'
import { fetchHtml } from './httpFetcher.js'
import { extractInternalArticleLinks } from './linkExtractor.js'
import { fetchContentFeedArticles } from './contentFeedAdapter.js'
import { checkRobotsTxt } from './robotsTxtChecker.js'

export interface CrawlOptions {
  isSiteWide?: boolean
  sampleLimit?: number
}

/**
 * 網頁爬取服務 (支援單頁與抽樣)
 */
export const crawlTarget = async (
  targetUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> => {
  const { isSiteWide = false, sampleLimit = 10 } = options
  const crawlStartTime = Date.now()
  const MAX_TOTAL_CRAWL_MS = 23000

  // 平行抓取首頁、robots.txt 與 (若適用) 平台結構化內容饋送
  const shouldFetchIypFeed = isSiteWide && targetUrl.includes('life.iyp.com.tw')
  const [primaryResult, robotsTxt, feedLinks] = await Promise.all([
    fetchHtml(targetUrl, 25000),
    checkRobotsTxt(targetUrl),
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

  const primary$ = cheerio.load(primaryResult.html)
  const primaryTitle = primary$('title').text().trim() || primaryResult.url

  const result: CrawlResult = {
    isSiteWide,
    primaryUrl: primaryResult.url,
    primaryTitle,
    primaryHtml: primaryResult.html,
    sampledPages: [],
    robotsTxt
  }

  // 若為單頁模式，直接回傳
  if (!isSiteWide) {
    return result
  }

  // 全站模式：搜集候選子頁面
  const candidateLinks: string[] = [...feedLinks]

  // 從首頁 HTML 中萃取同網域內部連結
  const htmlLinks = extractInternalArticleLinks(primaryResult.html, primaryResult.url)
  candidateLinks.push(...htmlLinks)

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

  if (uniqueCandidates.length === 0) {
    return result
  }

  // 控制總爬蟲時間預算與併發佇列 (避免因單頁體積龐大導致全站抽樣超過反向代理 30 秒逾時上限)
  const sampledPages: SampledPage[] = []
  const concurrency = 5
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (cursor < uniqueCandidates.length) {
      const elapsed = Date.now() - crawlStartTime
      const remainingBudget = MAX_TOTAL_CRAWL_MS - elapsed
      if (remainingBudget <= 2500) {
        break
      }

      const pageUrl = uniqueCandidates[cursor++]
      const perPageTimeout = Math.min(10000, remainingBudget)
      const pageRes = await fetchHtml(pageUrl, perPageTimeout)
      if (pageRes.ok && pageRes.html) {
        const page$ = cheerio.load(pageRes.html)
        const pageTitle = page$('title').text().trim() || pageUrl
        sampledPages.push({
          url: pageRes.url,
          title: pageTitle,
          html: pageRes.html
        })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueCandidates.length) }, () => worker())
  )

  result.sampledPages = sampledPages
  return result
}
