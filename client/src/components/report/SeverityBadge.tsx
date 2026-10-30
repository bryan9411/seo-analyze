import React from 'react'
import { SEVERITY_LABEL } from '@/lib/reportInsights'

const STYLES = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200'
} as const

export const SeverityBadge: React.FC<{ severity?: 'high' | 'medium' | 'low' }> = ({ severity = 'medium' }) => (
  <span className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-xs font-medium ${STYLES[severity]}`}>
    {SEVERITY_LABEL[severity]}
  </span>
)
