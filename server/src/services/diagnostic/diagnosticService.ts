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
 * 執行完整 SEO / GEO / AIO 深度診斷服務
 */
export const runDiagnostics = (
  crawlData: CrawlResult,
  mode: DiagnosticMode = 'ALL'
): DiagnosticReport => {
  // 1. 分析主頁面
  const primaryAnalysis = analyzeSinglePage(crawlData.primaryHtml, crawlData.primaryUrl)

  // 2. 分析抽樣頁面
  const sampledAnalyses = crawlData.sampledPages.map(page =>
    analyzeSinglePage(page.html, page.url)
  )

  const allAnalyses = [primaryAnalysis, ...sampledAnalyses]
  const isSiteWide = crawlData.isSiteWide && sampledAnalyses.length > 0

  // 3. 計算評分與達標率 (納入 robots.txt AI 授權狀態)
  const evalResult = evaluateDiagnostics(primaryAnalysis, allAnalyses, crawlData.robotsTxt)

  // 4. 搜集匯整全站電話與地址特徵 (若有)
  const totalPhones = Array.from(new Set(allAnalyses.flatMap(a => a.matchedPhones || [])))
  const totalAddresses = Array.from(new Set(allAnalyses.flatMap(a => a.matchedAddresses || [])))

  // 5. 彙整抽查檢驗之頁面清單
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

  // 6. 建構四大結構化章節與具體方案
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
