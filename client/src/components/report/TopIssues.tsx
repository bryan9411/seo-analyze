'use client'

import React from 'react'
import { CheckCircle2, ChevronRight, PartyPopper } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import type { HistoryEntry } from '@/lib/history'
import { DIMENSION_LABEL, estimateGain, issuesOf } from '@/lib/reportInsights'
import { SeverityBadge } from './SeverityBadge'

interface TopIssuesProps {
  report: DiagnosticReport
  previous?: HistoryEntry
  onShowAll?: () => void
}

const TOP_N = 5

/** 總覽：最該先修的問題 + 上次檢測後已修正的項目 */
export const TopIssues: React.FC<TopIssuesProps> = ({ report, previous, onShowAll }) => {
  const issues = issuesOf(report)
  const top = issues.slice(0, TOP_N)
  const gain = estimateGain(report, top)
  const currentKeys = new Set(issues.map(f => f.checkId))
  const fixed = (previous?.issues || []).filter(i => !currentKeys.has(i.key))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">最該先修的 {Math.min(TOP_N, issues.length)} 件事</h3>
        {gain > 0 && <span className="text-sm text-slate-500">修完預估綜合分數 +{gain}</span>}
      </div>

      {issues.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
          <PartyPopper className="h-4 w-4" />
          目前規則下沒有待改善的問題。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {top.map(f => (
            <li key={f.checkId} className="flex items-start gap-3 py-2.5 text-sm">
              <SeverityBadge severity={f.severity} />
              <span className="mt-0.5 w-10 shrink-0 text-xs font-medium text-slate-400">{DIMENSION_LABEL[f.dimension]}</span>
              <span className="flex-1 leading-relaxed text-slate-800">{f.message}</span>
              {f.delta < 0 && <span className="shrink-0 tabular-nums text-slate-500">+{-f.delta}</span>}
            </li>
          ))}
          {fixed.map(i => (
            <li key={`fixed-${i.key}`} className="flex items-start gap-3 py-2.5 text-sm">
              <span className="inline-flex shrink-0 items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                已修正
              </span>
              <span className="flex-1 text-slate-400 line-through">{i.message}</span>
            </li>
          ))}
        </ul>
      )}

      {issues.length > TOP_N && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline cursor-pointer"
        >
          查看全部 {issues.length} 個問題
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
