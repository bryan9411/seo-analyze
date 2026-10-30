'use client'

import React, { useMemo } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { SinglePageAnalysis } from '@/types/seo'

interface AiTextViewProps {
  page: SinglePageAnalysis
}

type Segment = { text: string, kind?: 'answer' | 'fact' }

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 將首段解答句與數據片段切成可高亮的區段 */
const buildSegments = (text: string, answer: string, facts: string[]): Segment[] => {
  const patterns: Array<{ re: string, kind: Segment['kind'] }> = []
  if (answer) patterns.push({ re: escapeRegex(answer.slice(0, 60)), kind: 'answer' })
  facts.filter(Boolean).forEach(f => patterns.push({ re: escapeRegex(f), kind: 'fact' }))
  if (patterns.length === 0) return [{ text }]

  const re = new RegExp(patterns.map(p => `(${p.re})`).join('|'), 'g')
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) out.push({ text: text.slice(last, idx) })
    const groupIndex = m.slice(1).findIndex(Boolean)
    out.push({ text: m[0], kind: patterns[groupIndex]?.kind })
    last = idx + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

export const AiTextView: React.FC<AiTextViewProps> = ({ page }) => {
  const segments = useMemo(
    () => buildSegments(page.aiViewText, page.directAnswerText, page.sampleFacts),
    [page.aiViewText, page.directAnswerText, page.sampleFacts]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 leading-relaxed">
        模擬 AI 爬蟲讀取原始 HTML、移除導覽列與頁尾後看到的前 {page.aiViewText.length} 字。
        AI 引擎多半只會擷取開頭的段落，重點越早出現越容易被引用。
      </p>

      {page.isLikelyCsr && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            原始 HTML 只有 {page.mainTextLength} 字，內容疑似由 JavaScript 產生。ChatGPT、Perplexity、Claude 等 AI 爬蟲大多不執行 JavaScript，
            會看到幾乎空白的頁面。建議改用伺服器端渲染 (SSR) 或靜態產生 (SSG)。
          </span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-white px-2 py-0.5 font-mono border border-slate-200">內容來源：&lt;{page.contentSource}&gt;</span>
          <span>主內容共 {page.mainTextLength.toLocaleString()} 字</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
          {segments.map((s, i) =>
            s.kind === 'answer' ? (
              <mark key={i} className="rounded bg-emerald-100 px-0.5 text-emerald-900">{s.text}</mark>
            ) : s.kind === 'fact' ? (
              <mark key={i} className="rounded bg-blue-100 px-0.5 text-blue-900">{s.text}</mark>
            ) : (
              <React.Fragment key={i}>{s.text}</React.Fragment>
            )
          )}
          {page.mainTextLength > page.aiViewText.length && <span className="text-slate-400"> …</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span><mark className="rounded bg-emerald-100 px-1 text-emerald-900">綠色</mark> 首段直接解答句</span>
          <span><mark className="rounded bg-blue-100 px-1 text-blue-900">藍色</mark> 量化數據</span>
        </div>
      </div>

      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          {page.directAnswerSnippetFound
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {page.directAnswerSnippetFound ? '前幾段有直接定義或結論' : '前幾段沒有找到「是指、總結來說、根據」等直接解答句型'}
        </li>
        <li className="flex items-center gap-2">
          {page.sampleFacts.length >= 3
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          全頁偵測到 {page.factualNumberCount} 個數據片段
        </li>
        <li className="flex items-center gap-2">
          {page.matchedQuestionHeadings.length > 0
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {page.matchedQuestionHeadings.length > 0
            ? `問答型標題：${page.matchedQuestionHeadings.slice(0, 3).join('、')}`
            : '沒有問答型標題'}
        </li>
      </ul>
    </div>
  )
}
