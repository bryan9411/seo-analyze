import type {
  CrawlResult,
  DiagnosticReport,
  AuditSampleItem,
  DiagnosticMode
} from '../../types/seo.js'
import type { CompiledRules } from '../../rules/types.js'
import { analyzeSinglePage } from './pageAnalyzer.js'
import { evaluateDiagnostics, scoreSinglePage } from './scoreCalculator.js'
import { buildStructuredSections } from './sectionBuilder.js'
import { generateAssets } from './assetGenerator.js'

/**
 * 執行 SEO / GEO / AEO 診斷服務
 * 整次診斷使用同一份規則，避免規則在診斷途中被更新造成前後不一致
 */
export const runDiagnostics = (
  crawlData: CrawlResult,
  rules: CompiledRules,
  _mode: DiagnosticMode = 'ALL'
): Omit<DiagnosticReport, 'durationMs' | 'cached' | 'reportId'> => {
  // 主頁面分析
  const primaryAnalysis = analyzeSinglePage(crawlData.primaryHtml, crawlData.primaryUrl, rules, crawlData.primaryMeta)

  // 抽樣頁面分析
  const sampledAnalyses = crawlData.sampledPages.map(page =>
    analyzeSinglePage(page.html, page.url, rules, page.meta)
  )

  const allAnalyses = [primaryAnalysis, ...sampledAnalyses]
  const isSiteWide = crawlData.isSiteWide && sampledAnalyses.length > 0

  // 計算評分與達標率
  const evalResult = evaluateDiagnostics(rules, primaryAnalysis, allAnalyses, crawlData.robotsTxt, crawlData.discovery)

  // 彙整電話與地址
  const totalPhones = Array.from(new Set(allAnalyses.flatMap(a => a.matchedPhones)))
  const totalAddresses = Array.from(new Set(allAnalyses.flatMap(a => a.matchedAddresses)))

  // 彙整抽查頁面清單 (每頁附上單頁分數)
  const allPages: AuditSampleItem[] = allAnalyses.map((analysis, index) => ({
    no: index,
    type: index === 0 ? '🌐 主頁面 / 首頁' : `📄 抽樣文章 ${index}`,
    title: analysis.title || '（無標題）',
    url: analysis.url,
    ...scoreSinglePage(rules, analysis, crawlData.robotsTxt)
  }))

  // 產生結構化診斷區塊與改善建議
  const sections = buildStructuredSections(crawlData.primaryUrl, primaryAnalysis, {
    totalAddresses,
    totalPhones,
    evalResult,
    allAnalyses,
    robotsTxt: crawlData.robotsTxt,
    rules: rules.config
  })

  const { thresholds } = rules.config
  const { painPoints: _painPoints, ...evalFields } = evalResult

  return {
    targetUrl: crawlData.primaryUrl,
    pageTitle: primaryAnalysis.title || crawlData.primaryUrl,
    isSiteWide,
    analyzedPageCount: allAnalyses.length,
    timestamp: new Date().toISOString(),
    rulesVersion: rules.config.version,
    ...evalFields,
    totalPhones,
    totalAddresses,
    allPages,
    sections,
    primaryAnalysis,
    robotsTxt: crawlData.robotsTxt,
    discovery: crawlData.discovery,
    generated: generateAssets(primaryAnalysis, allAnalyses, totalPhones, totalAddresses),
    serpLimits: {
      titlePixels: thresholds['serp.titlePixels'] ?? 580,
      descPixelsDesktop: thresholds['serp.descPixelsDesktop'] ?? 920,
      descPixelsMobile: thresholds['serp.descPixelsMobile'] ?? 680
    }
  }
}
