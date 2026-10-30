/**
 * SEO / GEO / AEO 診斷報告型別 (前後端共用)
 * 只放型別宣告，請一律以 `import type` 引用
 */

/** 主流 AI 爬蟲存取授權項目 */
export interface AiCrawlerPermission {
  crawlerId: string
  name: string
  engine: string
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
  /** robots.txt 中宣告的 Sitemap 網址 */
  sitemaps: string[]
}

/** llms.txt 與 sitemap.xml 探測結果 */
export interface DiscoveryReport {
  checked: boolean
  llmsTxt: { exists: boolean, url: string, snippet?: string }
  sitemap: { exists: boolean, url: string, source: 'robots' | 'default' }
}

export interface HeadingNode {
  level: number
  text: string
}

export interface FaqCandidate {
  question: string
  answer: string
}

/** 單一頁面爬取後的語意特徵 */
export interface SinglePageAnalysis {
  url: string
  title: string
  metaDescription: string
  metaKeywords: string
  canonical: string
  robots: string
  isNoindex: boolean
  lang: string
  hasViewport: boolean
  h1List: string[]
  h2List: string[]
  h3List: string[]
  /** 依出現順序排列的 H1 ~ H6 */
  headings: HeadingNode[]
  headingSkipCount: number
  emptyHeadingCount: number
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterCard: string
  // 圖片與 Alt 標籤
  imageCount: number
  missingAltCount: number
  missingAltImages: string[]
  // 傳輸與體積
  htmlBytes: number
  ttfbMs: number
  base64ImageCount: number
  base64Bytes: number
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
  hasLocalBusinessSchema: boolean
  faqQuestionsCount: number
  citationCount: number
  hasStatsOrData: boolean
  directAnswerSnippetFound: boolean
  directAnswerText: string
  // 在地商家 NAP
  matchedPhones: string[]
  matchedAddresses: string[]
  hasMapEmbed: boolean
  // AIO 訊號
  tableCount: number
  listCount: number
  listItemCount: number
  fluffCount: number
  foundFluffWords: Array<{ word: string, count: number }>
  matchedQuestionHeadings: string[]
  faqCandidates: FaqCandidate[]
  factualNumberCount: number
  sampleFacts: string[]
  // AI 爬蟲純文字視角
  aiViewText: string
  mainTextLength: number
  contentSource: string
  isLikelyCsr: boolean
  bodyTextSnippet: string
}

/** 健檢評分矩陣 */
export interface DiagnosticScores {
  overall: number
  seo: number
  geo: number
  aio: number
  aeo?: number
}

/** 抽查檢驗之頁面清單項目 */
export interface AuditSampleItem {
  no: number
  type: string
  title: string
  url: string
  score: number
  issueCount: number
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

/** 診斷報告結構化內容 */
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

/** 規則引擎逐條檢核結果 */
export interface DiagnosticFinding {
  checkId: string
  dimension: 'seo' | 'geo' | 'aio'
  kind: 'issue' | 'strength'
  severity?: 'high' | 'medium' | 'low'
  delta: number
  message: string
}

/** 依頁面內容自動產生的可複製檔案 */
export interface GeneratedAssets {
  llmsTxt: string
  faqJsonLd?: string
  localBusinessJsonLd?: string
}

/** 前端 SERP 預覽使用的像素寬度上限 (來自規則檔) */
export interface SerpLimits {
  titlePixels: number
  descPixelsDesktop: number
  descPixelsMobile: number
}

/** 診斷報告主體完整資料結構 */
export interface DiagnosticReport {
  /** 伺服器產生的報告識別碼，用於建立分享連結 */
  reportId: string
  targetUrl: string
  pageTitle: string
  isSiteWide: boolean
  analyzedPageCount: number
  timestamp: string
  durationMs: number
  cached: boolean
  rulesVersion: string
  scores: DiagnosticScores
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
  findings: DiagnosticFinding[]
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
  discovery: DiscoveryReport
  generated: GeneratedAssets
  serpLimits: SerpLimits
}

/** 診斷模式列舉 */
export type DiagnosticMode = 'ALL' | 'SEO' | 'GEO' | 'AIO' | 'AEO'
