'use client'

import React from 'react'
import type { DiagnosticScores } from '@/types/seo'

interface ScoreCardsProps {
  scores: DiagnosticScores
  previous?: DiagnosticScores
}

const tone = (score: number) =>
  score >= 70 ? 'text-emerald-700' : score >= 40 ? 'text-amber-700' : 'text-rose-700'

const barTone = (score: number) =>
  score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'

const ITEMS = [
  { key: 'overall', label: '綜合評分', hint: '三個維度平均' },
  { key: 'seo', label: '傳統 SEO', hint: 'Google 排名基礎' },
  { key: 'geo', label: '生成式 GEO', hint: 'AI 引用與爬蟲' },
  { key: 'aio', label: '解答引擎 AEO', hint: '可被擷取為答案' }
] as const

export const ScoreCards: React.FC<ScoreCardsProps> = ({ scores, previous }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {ITEMS.map(({ key, label, hint }) => {
      const value = scores[key]
      const delta = previous ? value - previous[key] : undefined
      const isOverall = key === 'overall'
      return (
        <div
          key={key}
          className={`rounded-xl border p-4 ${isOverall ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}
        >
          <div className={`text-sm ${isOverall ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-3xl font-semibold tabular-nums ${isOverall ? 'text-white' : tone(value)}`}>{value}</span>
            <span className={`text-sm ${isOverall ? 'text-slate-400' : 'text-slate-400'}`}>/ 100</span>
            {delta !== undefined && delta !== 0 && (
              <span className={`ml-auto text-sm font-semibold tabular-nums ${delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
              </span>
            )}
          </div>
          <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${isOverall ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <div className={`h-full rounded-full ${isOverall ? 'bg-blue-400' : barTone(value)}`} style={{ width: `${value}%` }} />
          </div>
          <div className={`mt-2 text-xs ${isOverall ? 'text-slate-400' : 'text-slate-400'}`}>{hint}</div>
        </div>
      )
    })}
  </div>
)
