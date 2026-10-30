/**
 * 後端型別：報告結構來自 @seo-analyze/shared，這裡只放爬蟲內部使用的型別
 */
import type { DiscoveryReport, RobotsTxtReport } from '@seo-analyze/shared'

export type * from '@seo-analyze/shared'

/** 抓取單頁時量測的傳輸資訊 */
export interface PageFetchMeta {
  status: number
  htmlBytes: number
  ttfbMs: number
  base64ImageCount: number
  base64Bytes: number
  xRobotsTag: string
  truncated: boolean
}

/** 抽樣文章頁面 */
export interface SampledPage {
  url: string
  html: string
  meta: PageFetchMeta
}

/** 爬蟲輸出結果 */
export interface CrawlResult {
  isSiteWide: boolean
  primaryUrl: string
  primaryHtml: string
  primaryMeta: PageFetchMeta
  sampledPages: SampledPage[]
  robotsTxt?: RobotsTxtReport
  discovery: DiscoveryReport
}

