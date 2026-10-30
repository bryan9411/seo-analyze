import type {
  SinglePageAnalysis,
  DiagnosticScores,
  ComplianceMetric,
  FactDensityMetrics,
  RobotsTxtReport,
  DiscoveryReport,
  DiagnosticFinding
} from '../../types/seo.js'
import type { CompiledRules, Dimension } from '../../rules/types.js'
import { buildMetrics } from '../../rules/metrics.js'
import {
  evaluateCompliance,
  evaluateRules,
  weightedOverall,
  type RulePainPoint
} from '../../rules/engine.js'

export interface EvaluationResult {
  scores: DiagnosticScores
  findings: DiagnosticFinding[]
  painPoints: Record<Dimension, string[]>
  seoIssues: string[]
  seoStrengths: string[]
  geoIssues: string[]
  geoStrengths: string[]
  aioIssues: string[]
  aioStrengths: string[]
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
}

/**
 * 計算內容事實密度 (客觀數據 vs 宣傳詞)
 */
const calculateFactDensity = (allAnalyses: SinglePageAnalysis[]): FactDensityMetrics => {
  const factualCount = allAnalyses.reduce((acc, a) => acc + a.factualNumberCount, 0)
  const fluffCount = allAnalyses.reduce((acc, a) => acc + a.fluffCount, 0)

  // 聚合客觀事實樣本
  const sampleFacts = Array.from(new Set(allAnalyses.flatMap(a => a.sampleFacts))).slice(0, 15)

  // 聚合商業宣傳詞樣本
  const fluffMap = new Map<string, number>()
  for (const a of allAnalyses) {
    for (const item of a.foundFluffWords) {
      fluffMap.set(item.word, (fluffMap.get(item.word) || 0) + item.count)
    }
  }
  const sampleFluff = Array.from(fluffMap, ([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count)

  const total = factualCount + fluffCount
  const factualPercent = total === 0 ? 50 : Math.round((factualCount / total) * 100)

  return {
    factualCount,
    fluffCount,
    factualPercent,
    fluffPercent: 100 - factualPercent,
    sampleFacts,
    sampleFluff
  }
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const

const groupPainPoints = (painPoints: RulePainPoint[]): Record<Dimension, string[]> => {
  const sorted = [...painPoints].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  return {
    seo: sorted.filter(p => p.dimension === 'seo').map(p => p.text),
    geo: sorted.filter(p => p.dimension === 'geo').map(p => p.text),
    aio: sorted.filter(p => p.dimension === 'aio').map(p => p.text)
  }
}

/**
 * 健檢分數與達標率量化評估器 (所有門檻、配分與文案皆來自規則檔)
 */
export const evaluateDiagnostics = (
  rules: CompiledRules,
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[],
  robotsTxt?: RobotsTxtReport,
  discovery?: DiscoveryReport
): EvaluationResult => {
  const metrics = buildMetrics(primary, allAnalyses, robotsTxt, discovery)
  const result = evaluateRules(rules.config, metrics)
  const overall = weightedOverall(rules.config, result.scores)

  const pick = (dimension: Dimension, kind: 'issue' | 'strength') =>
    result.findings.filter(f => f.dimension === dimension && f.kind === kind).map(f => f.message)

  return {
    scores: {
      overall,
      seo: result.scores.seo,
      geo: result.scores.geo,
      aio: result.scores.aio,
      aeo: result.scores.aio
    },
    findings: result.findings,
    painPoints: groupPainPoints(result.painPoints),
    seoIssues: pick('seo', 'issue'),
    seoStrengths: pick('seo', 'strength'),
    geoIssues: pick('geo', 'issue'),
    geoStrengths: pick('geo', 'strength'),
    aioIssues: pick('aio', 'issue'),
    aioStrengths: pick('aio', 'strength'),
    complianceMetrics: evaluateCompliance(rules.config, metrics),
    factDensity: calculateFactDensity(allAnalyses)
  }
}

/**
 * 單頁快速評分 (抽樣清單使用)：只看該頁本身
 */
export const scoreSinglePage = (rules: CompiledRules, page: SinglePageAnalysis, robotsTxt?: RobotsTxtReport) => {
  const result = evaluateRules(rules.config, buildMetrics(page, [page], robotsTxt))
  return {
    score: weightedOverall(rules.config, result.scores),
    issueCount: result.findings.filter(f => f.kind === 'issue' && f.severity !== 'low').length
  }
}
