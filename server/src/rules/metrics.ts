import type { DiscoveryReport, RobotsTxtReport, SinglePageAnalysis } from '../types/seo.js'
import type { Metrics } from './engine.js'

/**
 * 將頁面分析結果攤平成 "primary.xxx" 指標：
 * - 數字 / 布林 / 字串直接使用
 * - 字串陣列提供 xxxCount 與 xxxText (以「、」串接)
 * - 其他陣列提供 xxxCount
 * 分析器新增欄位時會自動出現在規則檔可用的指標中
 */
const flattenPage = (prefix: string, page: SinglePageAnalysis, out: Metrics) => {
  for (const [key, value] of Object.entries(page)) {
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
      out[`${prefix}.${key}`] = value
    } else if (Array.isArray(value)) {
      out[`${prefix}.${key}Count`] = value.length
      if (value.every(v => typeof v === 'string')) {
        out[`${prefix}.${key}Text`] = (value as string[]).slice(0, 5).join('、')
      }
    }
  }
}

const kb = (bytes: number) => Math.round(bytes / 1024)

/**
 * 建立規則引擎使用的指標表
 * primary.* 為主頁、site.* 為主頁 + 抽樣頁彙總、robots.* / discovery.* 為站台層級檢測
 */
export const buildMetrics = (
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[],
  robotsTxt?: RobotsTxtReport,
  discovery?: DiscoveryReport
): Metrics => {
  const m: Metrics = {}
  flattenPage('primary', primary, m)

  // 常用別名
  m['primary.titleLength'] = primary.title.length
  m['primary.metaLength'] = primary.metaDescription.length
  m['primary.h1Count'] = primary.h1List.length
  m['primary.htmlKB'] = kb(primary.htmlBytes)
  m['primary.base64KB'] = kb(primary.base64Bytes)
  const fluffSample = primary.foundFluffWords.slice(0, 3).map(f => f.word).join('、')
  m['primary.fluffSample'] = fluffSample
  m['primary.fluffSampleNote'] = fluffSample ? `，如：${fluffSample}` : ''

  const pages = allAnalyses.length || 1
  const any = (fn: (a: SinglePageAnalysis) => boolean) => allAnalyses.some(fn)
  const sum = (fn: (a: SinglePageAnalysis) => number) => allAnalyses.reduce((acc, a) => acc + fn(a), 0)
  const schemaTypes = Array.from(new Set(allAnalyses.flatMap(a => a.detectedSchemaTypes)))

  m['site.pageCount'] = allAnalyses.length
  m['site.anyArticleSchema'] = any(a => a.hasArticleSchema)
  m['site.anyOrganizationSchema'] = any(a => a.hasOrganizationSchema)
  m['site.anyPersonSchema'] = any(a => a.hasPersonSchema)
  m['site.anyFaqSchema'] = any(a => a.hasFaqSchema)
  m['site.anyLocalBusinessSchema'] = any(a => a.hasLocalBusinessSchema)
  m['site.anyStatsOrData'] = any(a => a.hasStatsOrData)
  m['site.anyDirectAnswer'] = any(a => a.directAnswerSnippetFound)
  m['site.anyAuthoritativeOutbound'] = any(a => a.authoritativeOutbound)
  m['site.anyCsr'] = any(a => a.isLikelyCsr)
  m['site.totalCitations'] = sum(a => a.citationCount)
  m['site.totalFluff'] = sum(a => a.fluffCount)
  m['site.totalQuestionHeadings'] = sum(a => a.matchedQuestionHeadings.length)
  m['site.totalMissingAlt'] = sum(a => a.missingAltCount)
  m['site.avgTables'] = sum(a => a.tableCount) / pages
  m['site.avgTablesRounded'] = Math.round(sum(a => a.tableCount) / pages)
  m['site.avgLists'] = sum(a => a.listCount) / pages
  m['site.schemaTypesSample'] = schemaTypes.slice(0, 3).join('、') || 'Article/Organization'
  m['site.phoneCount'] = new Set(allAnalyses.flatMap(a => a.matchedPhones)).size
  m['site.addressCount'] = new Set(allAnalyses.flatMap(a => a.matchedAddresses)).size

  const blockedCritical = robotsTxt?.crawlers.filter(c => c.isCritical && c.status === 'blocked') || []
  m['robots.available'] = Boolean(robotsTxt)
  m['robots.fetched'] = Boolean(robotsTxt?.fetched)
  m['robots.blockedCount'] = robotsTxt?.blockedBotsCount ?? 0
  m['robots.blockedCriticalCount'] = blockedCritical.length
  m['robots.blockedCriticalNames'] = blockedCritical.map(b => `${b.engine} (${b.name})`).join('、')

  m['discovery.checked'] = Boolean(discovery?.checked)
  m['discovery.hasLlmsTxt'] = Boolean(discovery?.llmsTxt.exists)
  m['discovery.hasSitemap'] = Boolean(discovery?.sitemap.exists)

  return m
}
