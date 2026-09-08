/**
 * SEO / GEO / AIO 分析與診斷型別定義
 */

/** 主流 AI 爬蟲存取授權項目 */
export interface AiCrawlerPermission {
  crawlerId: string
  name: string
  engine: 'ChatGPT (OpenAI)' | 'Perplexity AI' | 'Claude (Anthropic)' | 'Google (Gemini/AIO)'
  userAgent: string
  status: 'allowed' | 'blocked'
  description: string
  isCritical: boolean
}

/** robots.txt 健檢分析報告 */
export interface RobotsTxtReport {
  fetched: boolean
  url: string
  contentSnippet?: string
  crawlers: AiCrawlerPermission[]
  allAiAllowed: boolean
  blockedBotsCount: number
  hasCustomRules: boolean
}

/** 單一頁面爬取後的語意特徵 */
export interface SinglePageAnalysis {
  url: string
  title: string
  metaDescription: string
  metaKeywords: string
  canonical: string
  robots: string
  h1List: string[]
  h2List: string[]
  h3List: string[]
  ogTitle: string
  ogImage: string
  // 圖片與 Alt 標籤
  imageCount: number
  missingAltCount: number
  // E-E-A-T 訊號
  authorTags: string
  publishDate: string
  outboundLinksCount: number
  authoritativeOutbound: boolean
  wordCount: number
  // GEO (生成式引擎優化) 訊號
  jsonLdScriptsCount: number
  detectedSchemaTypes: string[]
  hasArticleSchema: boolean
  hasOrganizationSchema: boolean
  hasPersonSchema: boolean
  hasFaqSchema: boolean
  faqQuestionsCount?: number
  citationCount: number
  hasStatsOrData: boolean
  directAnswerSnippetFound: boolean
  matchedPhones?: string[]
  matchedAddresses?: string[]
  hasMapEmbed?: boolean
  hasServiceAreaDesc?: boolean
  // AIO 訊號
  tableCount: number
  listCount: number
  listItemCount: number
  fluffCount: number
  foundFluffWords: Array<{ word: string, count: number }>
  matchedQuestionHeadings: string[]
  factualNumberCount: number
  sampleFacts?: string[]
  bodyTextSnippet: string
}

/** 抽樣文章頁面 */
export interface SampledPage {
  url: string
  title: string
  html: string
}

/** 爬蟲輸出結果 */
export interface CrawlResult {
  isSiteWide: boolean
  primaryUrl: string
  primaryTitle: string
  primaryHtml: string
  sampledPages: SampledPage[]
  robotsTxt?: RobotsTxtReport
}

/** 健檢評分矩陣 */
export interface DiagnosticScores {
  overall: number
  seo: number
  geo: number
  aio: number
}

/** 抽查檢驗之頁面清單項目 */
export interface AuditSampleItem {
  no: number
  type: string
  title: string
  url: string
}

/** 改造前後對照表 */
export interface BeforeAfterComparison {
  beforeTitle: string
  afterTitle: string
  beforeMeta: string
  afterMeta: string
  beforeH1: string
  afterH1: string
}

/** 優先改善建議項目 */
export interface ImprovementItem {
  order: number
  title: string
  roi: string
  description: string
  comparison?: BeforeAfterComparison
  codeSnippet?: string
}

/** 四大結構化章節內容 */
export interface SeoSection {
  title: string
  titleMetaAnalysis: string
  eeatAnalysis: string
  painPoints: string[]
}

export interface GeoSection {
  title: string
  schemaAnalysis: string
  geoEntityAnalysis: string
  painPoints: string[]
}

export interface AioSection {
  title: string
  infoDensityAnalysis: string
  qaRelevanceAnalysis: string
  painPoints: string[]
}

export interface ImprovementSection {
  title: string
  items: ImprovementItem[]
}

export interface StructuredSections {
  seoSection: SeoSection
  geoSection: GeoSection
  aioSection: AioSection
  improvementSection: ImprovementSection
}

/** 前端長條圖關鍵指標達標率 */
export interface ComplianceMetric {
  name: string
  rate: number
  benchmark: number
  status: 'good' | 'warning' | 'danger'
}

/** 前端圓環圖事實密度 */
export interface FactDensityMetrics {
  factualCount: number
  fluffCount: number
  factualPercent: number
  fluffPercent: number
  sampleFacts?: string[]
  sampleFluff?: Array<{ word: string, count: number }>
}

/** 診斷報告主體完整資料結構 */
export interface DiagnosticReport {
  targetUrl: string
  pageTitle: string
  isSiteWide: boolean
  analyzedPageCount: number
  timestamp: string
  scores: DiagnosticScores
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
  seoIssues: string[]
  seoStrengths: string[]
  geoIssues: string[]
  geoStrengths: string[]
  aioIssues: string[]
  aioStrengths: string[]
  totalPhones: string[]
  totalAddresses: string[]
  allPages: AuditSampleItem[]
  sections: StructuredSections
  primaryAnalysis: SinglePageAnalysis
  robotsTxt?: RobotsTxtReport
}

/** 診斷模式列舉 */
export type DiagnosticMode = 'ALL' | 'SEO' | 'GEO' | 'AIO'
