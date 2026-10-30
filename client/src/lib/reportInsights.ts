import type { DiagnosticFinding, DiagnosticReport } from '@/types/seo'

export const DIMENSION_LABEL = { seo: 'SEO', geo: 'GEO', aio: 'AEO' } as const
export const SEVERITY_LABEL = { high: '高', medium: '中', low: '低' } as const
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const

export const issuesOf = (report: DiagnosticReport): DiagnosticFinding[] =>
  report.findings
    .filter(f => f.kind === 'issue')
    .sort((a, b) =>
      SEVERITY_ORDER[a.severity ?? 'medium'] - SEVERITY_ORDER[b.severity ?? 'medium'] || a.delta - b.delta
    )

/**
 * 預估修正這些問題後綜合分數可提升多少
 * 每個維度最多加到 100 分，三個維度等權平均 (與預設規則權重一致)
 */
export const estimateGain = (report: DiagnosticReport, issues: DiagnosticFinding[]): number => {
  const gain = { seo: 0, geo: 0, aio: 0 }
  for (const f of issues) gain[f.dimension] += Math.max(0, -f.delta)
  const capped = (['seo', 'geo', 'aio'] as const).map(d => Math.min(gain[d], 100 - report.scores[d]))
  return Math.round(capped.reduce((a, b) => a + b, 0) / 3)
}

export interface CompareRow {
  label: string
  own: string
  rival: string
  /** 競品較好時為 true，用來標示差距 */
  rivalBetter: boolean
}

export interface CompareResult {
  rows: CompareRow[]
  /** 自家有、競品沒有的問題 (競品在這些地方做得比較好) */
  gaps: DiagnosticFinding[]
  /** 競品有、自家沒有的問題 (自家的優勢) */
  advantages: DiagnosticFinding[]
  missingSchemas: string[]
  estimatedCatchUp: number
}

const yesNo = (v: boolean) => (v ? '有' : '無')

/** 比較兩份單頁報告，找出競品領先的項目 */
export const compareReports = (own: DiagnosticReport, rival: DiagnosticReport): CompareResult => {
  const a = own.primaryAnalysis
  const b = rival.primaryAnalysis
  const ownIssues = issuesOf(own)
  const rivalIssueIds = new Set(issuesOf(rival).map(f => f.checkId))
  const ownIssueIds = new Set(ownIssues.map(f => f.checkId))
  const gaps = ownIssues.filter(f => !rivalIssueIds.has(f.checkId))
  const advantages = issuesOf(rival).filter(f => !ownIssueIds.has(f.checkId))
  const missingSchemas = b.detectedSchemaTypes.filter(t => !a.detectedSchemaTypes.includes(t))
  const aiAllowed = (r: DiagnosticReport) => r.robotsTxt?.allAiAllowed ?? true

  const num = (label: string, x: number, y: number, unit = '') => ({
    label,
    own: `${x}${unit}`,
    rival: `${y}${unit}`,
    rivalBetter: y > x
  })

  const rows: CompareRow[] = [
    { label: 'Title 長度', own: `${a.title.length} 字`, rival: `${b.title.length} 字`, rivalBetter: false },
    { label: 'Meta 描述長度', own: `${a.metaDescription.length} 字`, rival: `${b.metaDescription.length} 字`, rivalBetter: false },
    num('H2 / H3 標題數', a.h2List.length + a.h3List.length, b.h2List.length + b.h3List.length, ' 個'),
    num('問答型標題', a.matchedQuestionHeadings.length, b.matchedQuestionHeadings.length, ' 個'),
    num('表格', a.tableCount, b.tableCount, ' 個'),
    num('清單', a.listCount, b.listCount, ' 組'),
    num('數據片段', a.factualNumberCount, b.factualNumberCount, ' 處'),
    num('內文字數', a.wordCount, b.wordCount),
    {
      label: 'Schema 類型',
      own: a.detectedSchemaTypes.join('、') || '無',
      rival: b.detectedSchemaTypes.join('、') || '無',
      rivalBetter: missingSchemas.length > 0
    },
    { label: 'FAQPage', own: yesNo(a.hasFaqSchema), rival: yesNo(b.hasFaqSchema), rivalBetter: b.hasFaqSchema && !a.hasFaqSchema },
    { label: '首段直接解答', own: yesNo(a.directAnswerSnippetFound), rival: yesNo(b.directAnswerSnippetFound), rivalBetter: b.directAnswerSnippetFound && !a.directAnswerSnippetFound },
    { label: '作者標記', own: yesNo(Boolean(a.authorTags)), rival: yesNo(Boolean(b.authorTags)), rivalBetter: Boolean(b.authorTags) && !a.authorTags },
    { label: 'AI 爬蟲全部開放', own: yesNo(aiAllowed(own)), rival: yesNo(aiAllowed(rival)), rivalBetter: aiAllowed(rival) && !aiAllowed(own) }
  ]

  return {
    rows,
    gaps,
    advantages,
    missingSchemas,
    estimatedCatchUp: estimateGain(own, gaps)
  }
}
