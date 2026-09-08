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

  // 平行抓取首頁與 robots.txt
  const [primaryResult, robotsTxt] = await Promise.all([
    fetchHtml(targetUrl),
    checkRobotsTxt(targetUrl)
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
  const candidateLinks: string[] = []

  // 若為具備專屬內容 API 饋送之平台站點，優先整合結構化饋送
  if (targetUrl.includes('life.iyp.com.tw')) {
    try {
      const apiLinks = await fetchContentFeedArticles(
        'https://www.iyp.com.tw/graphql',
        'https://life.iyp.com.tw',
        sampleLimit + 2
      )
      candidateLinks.push(...apiLinks)
    } catch {
      // 降級改由 HTML 萃取
    }
  }

  // 從首頁 HTML 中萃取同網域內部連結
  const htmlLinks = extractInternalArticleLinks(primaryResult.html, primaryResult.url)
  candidateLinks.push(...htmlLinks)

  // 去重並過濾主頁自身
  const primaryUrlObj = new URL(primaryResult.url)
  const uniqueCandidates = Array.from(new Set(candidateLinks))
    .filter((link) => {
      try {
        const u = new URL(link)
        return u.pathname !== primaryUrlObj.pathname && u.href !== primaryUrlObj.href
      } catch {
        return false
      }
    })
    .slice(0, sampleLimit)

  if (uniqueCandidates.length === 0) {
    return result
  }

  // 抓取抽樣頁面
  const sampledPages: SampledPage[] = []
  const fetchPromises = uniqueCandidates.map(async (pageUrl) => {
    const pageRes = await fetchHtml(pageUrl, 15000)
    if (pageRes.ok && pageRes.html) {
      const page$ = cheerio.load(pageRes.html)
      const pageTitle = page$('title').text().trim() || pageUrl
      return {
        url: pageRes.url,
        title: pageTitle,
        html: pageRes.html
      }
    }
    return null
  })

  const resolvedPages = await Promise.all(fetchPromises)
  for (const page of resolvedPages) {
    if (page) sampledPages.push(page)
  }

  result.sampledPages = sampledPages
  return result
}
