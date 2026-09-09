/** AI 爬蟲授權項目 */
export interface AiCrawlerPermission {
  crawlerId: string
  name: string
  engine: 'ChatGPT (OpenAI)' | 'Perplexity AI' | 'Claude (Anthropic)' | 'Google (Gemini/AEO)' | 'Google (Gemini/AIO)'
  userAgent: string
  status: 'allowed' | 'blocked'
  description: string
  isCritical: boolean
}

/** robots.txt 檢核結果 */
export interface RobotsTxtReport {
  fetched: boolean
  url: string
  contentSnippet?: string
  crawlers: AiCrawlerPermission[]
  allAiAllowed: boolean
  blockedBotsCount: number
  hasCustomRules: boolean
}

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
  // 圖片與 alt
  imageCount: number
  missingAltCount: number
  authorTags: string
  publishDate: string
  outboundLinksCount: number
  authoritativeOutbound: boolean
  wordCount: number
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
  tableCount: number
  listCount: number
  listItemCount: number
  fluffCount: number
  foundFluffWords: Array<{ word: string, count: number }>
  matchedQuestionHeadings: string[]
  factualNumberCount: number
  bodyTextSnippet: string
}

export interface SampledPage {
  url: string
  title: string
  html: string
}

export interface DiagnosticScores {
  overall: number
  seo: number
  geo: number
  aio: number
  aeo?: number
}

export interface AuditSampleItem {
  no: number
  type: string
  title: string
  url: string
}

export interface BeforeAfterComparison {
  beforeTitle: string
  afterTitle: string
  beforeMeta: string
  afterMeta: string
  beforeH1: string
  afterH1: string
}

export interface ImprovementItem {
  order: number
  title: string
  roi: string
  description: string
  comparison?: BeforeAfterComparison
  codeSnippet?: string
}

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

export interface ComplianceMetric {
  name: string
  rate: number
  benchmark: number
  status: 'good' | 'warning' | 'danger'
}

export interface FactDensityMetrics {
  factualCount: number
  fluffCount: number
  factualPercent: number
  fluffPercent: number
  sampleFacts?: string[]
  sampleFluff?: Array<{ word: string, count: number }>
}

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

export type DiagnosticMode = 'ALL' | 'SEO' | 'GEO' | 'AIO' | 'AEO'
