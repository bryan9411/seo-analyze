import type {
  CrawlResult,
  DiagnosticReport,
  AuditSampleItem,
  DiagnosticMode
} from '../../types/seo.js'
import { analyzeSinglePage } from './pageAnalyzer.js'
import { evaluateDiagnostics } from './scoreCalculator.js'
import { buildStructuredSections } from './sectionBuilder.js'

/**
 * 執行 SEO / GEO / AIO 診斷服務
 */
export const runDiagnostics = (
  crawlData: CrawlResult,
  mode: DiagnosticMode = 'ALL'
): DiagnosticReport => {
  // 主頁面分析
  const primaryAnalysis = analyzeSinglePage(crawlData.primaryHtml, crawlData.primaryUrl)

  // 抽樣頁面分析
  const sampledAnalyses = crawlData.sampledPages.map(page =>
    analyzeSinglePage(page.html, page.url)
  )

  const allAnalyses = [primaryAnalysis, ...sampledAnalyses]
  const isSiteWide = crawlData.isSiteWide && sampledAnalyses.length > 0

  // 計算評分與達標率
  const evalResult = evaluateDiagnostics(primaryAnalysis, allAnalyses, crawlData.robotsTxt)

  // 彙整電話與地址
  const totalPhones = Array.from(new Set(allAnalyses.flatMap(a => a.matchedPhones || [])))
  const totalAddresses = Array.from(new Set(allAnalyses.flatMap(a => a.matchedAddresses || [])))

  // 彙整抽查頁面清單
  const allPages: AuditSampleItem[] = [
    {
      no: 0,
      type: '🌐 主頁面 / 首頁',
      title: primaryAnalysis.title || '（無標題）',
      url: crawlData.primaryUrl
    },
    ...crawlData.sampledPages.map((page, index) => ({
      no: index + 1,
      type: `📄 抽樣文章 ${index + 1}`,
      title: page.title || '（無標題）',
      url: page.url
    }))
  ]

  // 產生結構化診斷區塊與改善建議
  const sections = buildStructuredSections(crawlData.primaryUrl, primaryAnalysis, {
    totalAddresses,
    totalPhones,
    evalResult,
    allAnalyses,
    robotsTxt: crawlData.robotsTxt
  })

  return {
    targetUrl: crawlData.primaryUrl,
    pageTitle: primaryAnalysis.title || '（無標題）',
    isSiteWide,
    analyzedPageCount: allAnalyses.length,
    timestamp: new Date().toISOString(),
    scores: evalResult.scores,
    complianceMetrics: evalResult.complianceMetrics,
    factDensity: evalResult.factDensity,
    seoIssues: evalResult.seoIssues,
    seoStrengths: evalResult.seoStrengths,
    geoIssues: evalResult.geoIssues,
    geoStrengths: evalResult.geoStrengths,
    aioIssues: evalResult.aioIssues,
    aioStrengths: evalResult.aioStrengths,
    totalPhones,
    totalAddresses,
    allPages,
    sections,
    primaryAnalysis,
    robotsTxt: crawlData.robotsTxt
  }
}
