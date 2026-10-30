'use client'

import React, { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { DIMENSION_LABEL, issuesOf } from '@/lib/reportInsights'
import { SeverityBadge } from './SeverityBadge'

type DimFilter = 'all' | 'seo' | 'geo' | 'aio'

/** 問題清單：合併 SEO / GEO / AEO，可依維度篩選，並列出已做好的項目 */
export const IssueList: React.FC<{ report: DiagnosticReport }> = ({ report }) => {
  const [dim, setDim] = useState<DimFilter>('all')
  const [showStrengths, setShowStrengths] = useState(false)

  const issues = useMemo(() => issuesOf(report), [report])
  const strengths = useMemo(() => report.findings.filter(f => f.kind === 'strength'), [report])
  const count = (d: DimFilter) => (d === 'all' ? issues.length : issues.filter(f => f.dimension === d).length)
  const visible = dim === 'all' ? issues : issues.filter(f => f.dimension === dim)
  const visibleStrengths = dim === 'all' ? strengths : strengths.filter(f => f.dimension === dim)

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
        {(['all', 'seo', 'geo', 'aio'] as const).map(d => (
          <button
            key={d}
            type="button"
            onClick={() => setDim(d)}
            className={`rounded-full px-3 py-1 text-sm cursor-pointer ${dim === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {d === 'all' ? '全部' : DIMENSION_LABEL[d]} <span className="tabular-nums opacity-70">{count(d)}</span>
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={showStrengths} onChange={e => setShowStrengths(e.target.checked)} />
          顯示已做好的項目
        </label>
      </div>

      <ul className="divide-y divide-slate-100">
        {visible.map(f => (
          <li key={f.checkId} className="flex items-start gap-3 px-4 py-3 text-sm">
            <SeverityBadge severity={f.severity} />
            <span className="mt-0.5 w-10 shrink-0 text-xs font-medium text-slate-400">{DIMENSION_LABEL[f.dimension]}</span>
            <span className="flex-1 leading-relaxed text-slate-800">{f.message}</span>
            <span className="shrink-0 text-xs tabular-nums text-slate-400">{f.delta < 0 ? `${f.delta} 分` : '提示'}</span>
          </li>
        ))}
        {visible.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">這個維度沒有待改善問題。</li>}
        {showStrengths && visibleStrengths.map(f => (
          <li key={`s-${f.checkId}`} className="flex items-start gap-3 bg-emerald-50/40 px-4 py-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="mt-0.5 w-10 shrink-0 text-xs font-medium text-slate-400">{DIMENSION_LABEL[f.dimension]}</span>
            <span className="flex-1 leading-relaxed text-slate-700">{f.message}</span>
            {f.delta > 0 && <span className="shrink-0 text-xs tabular-nums text-emerald-700">+{f.delta} 分</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
