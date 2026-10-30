import type { CheckCase, Condition, Points, RulesConfig } from './types.js'

const OPS = new Set(['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'between', 'truthy', 'falsy', 'in', 'contains', 'matches'])
const DIMENSIONS = ['seo', 'geo', 'aio'] as const
const SEVERITIES = new Set(['high', 'medium', 'low'])

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isStrArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(s => typeof s === 'string')

/**
 * 驗證規則設定檔，回傳錯誤清單 (空陣列代表通過)
 * 只檢查結構與引用，不判斷規則內容合不合理
 */
export const validateRules = (raw: unknown): string[] => {
  const errors: string[] = []
  const err = (path: string, msg: string): void => {
    errors.push(`${path}: ${msg}`)
  }

  if (!isObj(raw)) return ['根節點必須是 JSON 物件']
  const cfg = raw as unknown as RulesConfig

  if (typeof cfg.version !== 'string' || !cfg.version) err('version', '必須是非空字串')

  if (!isObj(cfg.thresholds)) {
    err('thresholds', '必須是物件')
  } else {
    for (const [k, v] of Object.entries(cfg.thresholds)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) err(`thresholds.${k}`, '必須是數字')
    }
  }
  const thresholds = isObj(cfg.thresholds) ? cfg.thresholds : {}

  if (!isObj(cfg.score) || typeof cfg.score.min !== 'number' || typeof cfg.score.max !== 'number') {
    err('score', '必須包含數字 min 與 max')
  }
  if (!isObj(cfg.statusBands) || typeof cfg.statusBands.good !== 'number' || typeof cfg.statusBands.warning !== 'number') {
    err('statusBands', '必須包含數字 good 與 warning')
  }

  // 字詞庫與正規表示式
  if (!isObj(cfg.lexicons)) {
    err('lexicons', '必須是物件')
  } else {
    const keys = [
      'fluffWords', 'questionKeywords', 'faqQuestionPatterns', 'directAnswerPatterns',
      'statsUnits', 'factUnits', 'authoritativeDomainPatterns', 'articlePathKeywords'
    ] as const
    for (const k of keys) {
      if (!isStrArray(cfg.lexicons[k])) err(`lexicons.${k}`, '必須是字串陣列')
    }
    for (const k of ['faqQuestionPatterns', 'authoritativeDomainPatterns'] as const) {
      const list = cfg.lexicons[k]
      if (!isStrArray(list)) continue
      list.forEach((src, i) => {
        try {
          new RegExp(src)
        } catch (e) {
          err(`lexicons.${k}[${i}]`, `正規表示式無效 (${(e as Error).message})`)
        }
      })
    }
  }

  if (!isObj(cfg.selectors)) {
    err('selectors', '必須是物件')
  } else {
    for (const k of ['author', 'publishDate', 'mainContent', 'boilerplate'] as const) {
      if (!isStrArray(cfg.selectors[k])) err(`selectors.${k}`, '必須是字串陣列')
    }
  }

  if (!Array.isArray(cfg.aiCrawlers)) {
    err('aiCrawlers', '必須是陣列')
  } else {
    cfg.aiCrawlers.forEach((c, i) => {
      for (const k of ['crawlerId', 'name', 'engine', 'userAgent', 'descriptionIfAllowed', 'descriptionIfBlocked'] as const) {
        if (typeof c?.[k] !== 'string') err(`aiCrawlers[${i}].${k}`, '必須是字串')
      }
      if (typeof c?.isCritical !== 'boolean') err(`aiCrawlers[${i}].isCritical`, '必須是 true / false')
    })
  }

  if (!isObj(cfg.dimensions)) {
    err('dimensions', '必須是物件')
  } else {
    for (const d of DIMENSIONS) {
      const dim = cfg.dimensions[d]
      if (!isObj(dim) || typeof dim.baseScore !== 'number' || typeof dim.weight !== 'number') {
        err(`dimensions.${d}`, '必須包含 label、數字 baseScore 與 weight')
      }
    }
  }

  const checkValueRef = (path: string, v: unknown) => {
    if (typeof v === 'string' && v.startsWith('$thresholds.')) {
      const key = v.slice('$thresholds.'.length)
      if (!(key in thresholds)) err(path, `引用了不存在的門檻值 ${key}`)
    }
  }

  const checkCondition = (path: string, c: unknown): void => {
    if (!isObj(c)) return err(path, '條件必須是物件')
    if ('all' in c || 'any' in c) {
      const list = (c.all ?? c.any) as unknown
      if (!Array.isArray(list) || list.length === 0) return err(path, 'all / any 必須是非空陣列')
      list.forEach((sub, i) => checkCondition(`${path}.${'all' in c ? 'all' : 'any'}[${i}]`, sub))
      return
    }
    if ('not' in c) return checkCondition(`${path}.not`, c.not)

    const cond = c as Extract<Condition, { metric: string }>
    if (typeof cond.metric !== 'string' || !cond.metric) err(`${path}.metric`, '必須是指標名稱字串')
    if (!OPS.has(cond.op)) err(`${path}.op`, `不支援的運算子 ${String(cond.op)}`)
    if (cond.op === 'between') {
      if (!Array.isArray(cond.value) || cond.value.length !== 2) err(`${path}.value`, 'between 需要 [最小值, 最大值]')
    } else if (!['truthy', 'falsy'].includes(cond.op) && cond.value === undefined) {
      err(`${path}.value`, `運算子 ${cond.op} 需要 value`)
    }
    if (cond.op === 'matches' && typeof cond.value === 'string') {
      try {
        new RegExp(cond.value)
      } catch {
        err(`${path}.value`, '正規表示式無效')
      }
    }
    const values = Array.isArray(cond.value) ? cond.value : [cond.value]
    values.forEach((v, i) => checkValueRef(`${path}.value${Array.isArray(cond.value) ? `[${i}]` : ''}`, v))
  }

  const checkPoints = (path: string, p: Points | undefined) => {
    if (p === undefined || typeof p === 'number') return
    if (!isObj(p) || typeof p.per !== 'number' || typeof p.metric !== 'string' || typeof p.cap !== 'number') {
      err(path, '必須是數字，或 { per, metric, cap } 物件')
    }
  }

  // 檢核規則
  if (!Array.isArray(cfg.checks)) {
    err('checks', '必須是陣列')
  } else {
    const ids = new Set<string>()
    cfg.checks.forEach((check, i) => {
      const base = `checks[${i}]${check?.id ? `(${check.id})` : ''}`
      if (typeof check?.id !== 'string' || !check.id) err(`${base}.id`, '必須是非空字串')
      else if (ids.has(check.id)) err(`${base}.id`, 'id 重複')
      else ids.add(check.id)
      if (!DIMENSIONS.includes(check?.dimension)) err(`${base}.dimension`, '必須是 seo / geo / aio')
      if (!Array.isArray(check?.cases) || check.cases.length === 0) {
        err(`${base}.cases`, '必須是非空陣列')
        return
      }
      check.cases.forEach((rawCase, j) => {
        const cp = `${base}.cases[${j}]`
        if (!isObj(rawCase)) return err(cp, '必須是物件')
        const c = rawCase as CheckCase
        if (c.when !== undefined) checkCondition(`${cp}.when`, c.when)
        checkPoints(`${cp}.delta`, c.delta)
        if (c.severity !== undefined && !SEVERITIES.has(c.severity)) err(`${cp}.severity`, '必須是 high / medium / low')
        for (const k of ['issue', 'strength'] as const) {
          if (c[k] !== undefined && typeof c[k] !== 'string') err(`${cp}.${k}`, '必須是字串')
        }
        if (c.painPoint !== undefined && (!isObj(c.painPoint) || typeof c.painPoint.title !== 'string' || typeof c.painPoint.detail !== 'string')) {
          err(`${cp}.painPoint`, '必須包含字串 title 與 detail')
        }
      })
    })
  }

  if (!Array.isArray(cfg.compliance)) {
    err('compliance', '必須是陣列')
  } else {
    cfg.compliance.forEach((m, i) => {
      const base = `compliance[${i}]${m?.id ? `(${m.id})` : ''}`
      if (typeof m?.name !== 'string') err(`${base}.name`, '必須是字串')
      if (typeof m?.benchmark !== 'number') err(`${base}.benchmark`, '必須是數字')
      if (!Array.isArray(m?.parts)) return err(`${base}.parts`, '必須是陣列')
      m.parts.forEach((p, j) => {
        if (p.when !== undefined) checkCondition(`${base}.parts[${j}].when`, p.when)
        if (p.points === undefined) err(`${base}.parts[${j}].points`, '必填')
        checkPoints(`${base}.parts[${j}].points`, p.points)
      })
    })
  }

  return errors
}
