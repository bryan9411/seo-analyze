/**
 * 診斷規則設定檔型別定義 (對應 server/rules/rules.json)
 *
 * 規則檔分為：
 * - thresholds：各項門檻數值 (例如 Title 長度上下限)
 * - lexicons / selectors：字詞庫、正規表示式與 DOM 選擇器
 * - aiCrawlers：robots.txt 檢核的 AI 爬蟲清單
 * - dimensions / checks：評分維度與逐條檢核規則
 * - compliance：前端長條圖的指標達標率計算
 */

export type Dimension = 'seo' | 'geo' | 'aio'
export type Severity = 'high' | 'medium' | 'low'

/** 規則中可引用門檻值：以 "$thresholds.<key>" 字串表示 */
export type RuleValue = number | string | boolean | Array<number | string> | null

export type ConditionOp =
  | 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte'
  | 'between' | 'truthy' | 'falsy' | 'in' | 'contains' | 'matches'

export type Condition =
  | { metric: string, op: ConditionOp, value?: RuleValue }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }

/** 依指標數量計分，例如每張缺 alt 圖片扣 2 分，最多扣 10 分 */
export interface ScaledPoints {
  per: number
  metric: string
  cap: number
}

export type Points = number | ScaledPoints

export interface PainPointTemplate {
  title: string
  detail: string
}

export interface CheckCase {
  when?: Condition
  delta?: Points
  severity?: Severity
  issue?: string
  strength?: string
  painPoint?: PainPointTemplate
}

export interface CheckRule {
  id: string
  dimension: Dimension
  enabled?: boolean
  description?: string
  /** 由上而下比對，命中第一個 case 後停止 */
  cases: CheckCase[]
}

export interface DimensionConfig {
  label: string
  baseScore: number
  weight: number
}

export interface CompliancePart {
  when?: Condition
  points: Points
}

export interface ComplianceRule {
  id: string
  name: string
  benchmark: number
  enabled?: boolean
  parts: CompliancePart[]
}

export interface AiCrawlerRule {
  crawlerId: string
  name: string
  engine: string
  userAgent: string
  isCritical: boolean
  descriptionIfAllowed: string
  descriptionIfBlocked: string
}

export interface RulesConfig {
  version: string
  updatedAt?: string
  description?: string
  thresholds: Record<string, number>
  score: { min: number, max: number }
  statusBands: { good: number, warning: number }
  lexicons: {
    fluffWords: string[]
    questionKeywords: string[]
    /** FAQ 問句判定 (正規表示式字串)，比 questionKeywords 嚴格 */
    faqQuestionPatterns: string[]
    directAnswerPatterns: string[]
    statsUnits: string[]
    factUnits: string[]
    authoritativeDomainPatterns: string[]
    articlePathKeywords: string[]
  }
  selectors: {
    author: string[]
    publishDate: string[]
    mainContent: string[]
    boilerplate: string[]
  }
  aiCrawlers: AiCrawlerRule[]
  dimensions: Record<Dimension, DimensionConfig>
  checks: CheckRule[]
  compliance: ComplianceRule[]
}

/** 預先編譯過的規則 (正規表示式只在載入時建立一次) */
export interface CompiledRules {
  config: RulesConfig
  loadedAt: string
  /** 版本 + 載入時間，作為快取鍵的一部分 */
  fingerprint: string
  regex: {
    fluff: RegExp | null
    faqQuestion: RegExp[]
    directAnswer: RegExp | null
    stats: RegExp
    facts: RegExp
    authoritativeDomain: RegExp[]
  }
}
