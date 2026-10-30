import type {
  CheckRule,
  Condition,
  Dimension,
  Points,
  RuleValue,
  RulesConfig,
  Severity
} from './types.js'

export type MetricValue = number | string | boolean | null | undefined
export type Metrics = Record<string, MetricValue>

export interface RuleFinding {
  checkId: string
  dimension: Dimension
  kind: 'issue' | 'strength'
  severity?: Severity
  delta: number
  message: string
}

export interface RulePainPoint {
  checkId: string
  dimension: Dimension
  severity: Severity
  text: string
}

export interface RuleEvaluation {
  scores: Record<Dimension, number>
  findings: RuleFinding[]
  painPoints: RulePainPoint[]
}

const resolveValue = (v: RuleValue | undefined, thresholds: Record<string, number>): RuleValue | undefined => {
  if (typeof v === 'string' && v.startsWith('$thresholds.')) {
    return thresholds[v.slice('$thresholds.'.length)]
  }
  if (Array.isArray(v)) return v.map(x => resolveValue(x, thresholds) as number | string)
  return v
}

const toNumber = (v: MetricValue): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') return v.length
  return 0
}

export const evaluateCondition = (cond: Condition, metrics: Metrics, thresholds: Record<string, number>): boolean => {
  if ('all' in cond) return cond.all.every(c => evaluateCondition(c, metrics, thresholds))
  if ('any' in cond) return cond.any.some(c => evaluateCondition(c, metrics, thresholds))
  if ('not' in cond) return !evaluateCondition(cond.not, metrics, thresholds)

  const actual = metrics[cond.metric]
  const expected = resolveValue(cond.value, thresholds)

  switch (cond.op) {
    case 'truthy': return Boolean(actual)
    case 'falsy': return !actual
    case 'eq': return typeof expected === 'number' ? toNumber(actual) === expected : actual === expected
    case 'ne': return typeof expected === 'number' ? toNumber(actual) !== expected : actual !== expected
    case 'lt': return toNumber(actual) < Number(expected)
    case 'lte': return toNumber(actual) <= Number(expected)
    case 'gt': return toNumber(actual) > Number(expected)
    case 'gte': return toNumber(actual) >= Number(expected)
    case 'between': {
      const [min, max] = (expected as number[]) || []
      const n = toNumber(actual)
      return n >= Number(min) && n <= Number(max)
    }
    case 'in': return Array.isArray(expected) && expected.some(e => e === actual)
    case 'contains': return typeof actual === 'string' && actual.includes(String(expected))
    case 'matches': return typeof actual === 'string' && new RegExp(String(expected)).test(actual)
    default: return false
  }
}

export const resolvePoints = (p: Points | undefined, metrics: Metrics): number => {
  if (p === undefined) return 0
  if (typeof p === 'number') return p
  const raw = p.per * toNumber(metrics[p.metric])
  return p.cap < 0 ? Math.max(p.cap, raw) : Math.min(p.cap, raw)
}

/** 將 "{primary.titleLength}" 這類佔位符替換成指標值 */
export const renderTemplate = (tpl: string, metrics: Metrics): string =>
  tpl.replace(/\{([\w.]+)\}/g, (_, key: string) => {
    const v = metrics[key]
    return v === undefined || v === null ? '' : String(v)
  })

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const runCheck = (check: CheckRule, metrics: Metrics, thresholds: Record<string, number>) => {
  const matched = check.cases.find(c => !c.when || evaluateCondition(c.when, metrics, thresholds))
  return matched
}

/**
 * 依規則檔逐條執行檢核，計算各維度分數、問題 / 優勢與痛點
 */
export const evaluateRules = (config: RulesConfig, metrics: Metrics): RuleEvaluation => {
  const { thresholds, dimensions, score } = config
  const totals: Record<Dimension, number> = {
    seo: dimensions.seo.baseScore,
    geo: dimensions.geo.baseScore,
    aio: dimensions.aio.baseScore
  }
  const findings: RuleFinding[] = []
  const painPoints: RulePainPoint[] = []

  for (const check of config.checks) {
    if (check.enabled === false) continue
    const c = runCheck(check, metrics, thresholds)
    if (!c) continue

    const delta = resolvePoints(c.delta, metrics)
    totals[check.dimension] += delta

    if (c.issue) {
      findings.push({
        checkId: check.id,
        dimension: check.dimension,
        kind: 'issue',
        severity: c.severity ?? 'medium',
        delta,
        message: renderTemplate(c.issue, metrics)
      })
    }
    if (c.strength) {
      findings.push({
        checkId: check.id,
        dimension: check.dimension,
        kind: 'strength',
        delta,
        message: renderTemplate(c.strength, metrics)
      })
    }
    if (c.painPoint) {
      painPoints.push({
        checkId: check.id,
        dimension: check.dimension,
        severity: c.severity ?? 'medium',
        text: `【${renderTemplate(c.painPoint.title, metrics)}】\n${renderTemplate(c.painPoint.detail, metrics)}`
      })
    }
  }

  return {
    scores: {
      seo: clamp(Math.round(totals.seo), score.min, score.max),
      geo: clamp(Math.round(totals.geo), score.min, score.max),
      aio: clamp(Math.round(totals.aio), score.min, score.max)
    },
    findings,
    painPoints
  }
}

/** 依規則檔計算長條圖各項指標達標率 (0 ~ 100) */
export const evaluateCompliance = (config: RulesConfig, metrics: Metrics) =>
  config.compliance
    .filter(m => m.enabled !== false)
    .map(m => {
      const raw = m.parts.reduce((acc, p) => {
        if (p.when && !evaluateCondition(p.when, metrics, config.thresholds)) return acc
        return acc + resolvePoints(p.points, metrics)
      }, 0)
      const rate = clamp(Math.round(raw), 0, 100)
      const { good, warning } = config.statusBands
      const status: 'good' | 'warning' | 'danger' = rate >= good ? 'good' : rate >= warning ? 'warning' : 'danger'
      return { name: m.name, rate, benchmark: m.benchmark, status }
    })

/** 依維度權重計算綜合分數 */
export const weightedOverall = (config: RulesConfig, scores: Record<Dimension, number>): number => {
  const dims: Dimension[] = ['seo', 'geo', 'aio']
  const totalWeight = dims.reduce((acc, d) => acc + config.dimensions[d].weight, 0) || 1
  return Math.round(dims.reduce((acc, d) => acc + scores[d] * config.dimensions[d].weight, 0) / totalWeight)
}
