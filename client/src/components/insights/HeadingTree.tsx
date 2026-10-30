'use client'

import React from 'react'
import type { SinglePageAnalysis } from '@/types/seo'

interface HeadingTreeProps {
  page: SinglePageAnalysis
}

const LEVEL_STYLES: Record<number, string> = {
  1: 'bg-slate-900 text-white',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-indigo-50 text-indigo-700',
  4: 'bg-slate-100 text-slate-600',
  5: 'bg-slate-100 text-slate-500',
  6: 'bg-slate-100 text-slate-500'
}

export const HeadingTree: React.FC<HeadingTreeProps> = ({ page }) => {
  const questionSet = new Set(page.matchedQuestionHeadings)
  const faqSet = new Set(page.faqCandidates.map(f => f.question))
  const skippedFlags = page.headings.map((h, i) => i > 0 && h.level > page.headings[i - 1].level + 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-medium ${page.h1List.length === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          H1 × {page.h1List.length}{page.h1List.length === 1 ? '' : page.h1List.length === 0 ? ' (缺少)' : ' (過多)'}
        </span>
        <span className={`rounded-full px-2.5 py-1 font-medium ${page.headingSkipCount ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          跳階 {page.headingSkipCount} 處
        </span>
        <span className={`rounded-full px-2.5 py-1 font-medium ${page.emptyHeadingCount ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          空白標題 {page.emptyHeadingCount} 個
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">共 {page.headings.length} 個標題</span>
      </div>

      {page.headings.length === 0 ? (
        <p className="text-sm text-slate-500">頁面沒有任何 H1 ~ H6 標題。</p>
      ) : (
        <ol className="max-h-[420px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
          {page.headings.map((h, i) => {
            const skipped = skippedFlags[i]
            const extraH1 = h.level === 1 && page.h1List.length > 1
            const isQuestion = questionSet.has(h.text) || faqSet.has(h.text)
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
                style={{ paddingLeft: `${(h.level - 1) * 18}px` }}
              >
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${LEVEL_STYLES[h.level]}`}>
                  H{h.level}
                </span>
                <span className={`leading-relaxed ${skipped || extraH1 ? 'text-rose-700' : 'text-slate-800'}`}>{h.text}</span>
                {skipped && <span className="shrink-0 rounded bg-rose-50 px-1.5 text-[11px] text-rose-700">跳階</span>}
                {extraH1 && <span className="shrink-0 rounded bg-rose-50 px-1.5 text-[11px] text-rose-700">多重 H1</span>}
                {isQuestion && <span className="shrink-0 rounded bg-emerald-50 px-1.5 text-[11px] text-emerald-700">問答標題</span>}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
