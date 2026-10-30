'use client'

import React from 'react'
import type { SinglePageAnalysis } from '@/types/seo'

interface PayloadPanelProps {
  page: SinglePageAnalysis
  thresholds?: { htmlWarnBytes: number, base64WarnBytes: number, ttfbSlowMs: number }
}

const DEFAULTS = { htmlWarnBytes: 1_500_000, base64WarnBytes: 100_000, ttfbSlowMs: 800 }

const formatBytes = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} MB`
  return `${Math.round(bytes / 1000)} KB`
}

const Stat: React.FC<{ label: string, value: string, warn: boolean, hint: string }> = ({ label, value, warn, hint }) => (
  <div className={`rounded-lg border p-3 ${warn ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
    <div className="text-xs text-slate-500">{label}</div>
    <div className={`mt-1 text-xl font-bold tabular-nums ${warn ? 'text-amber-700' : 'text-slate-900'}`}>{value}</div>
    <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
  </div>
)

export const PayloadPanel: React.FC<PayloadPanelProps> = ({ page, thresholds = DEFAULTS }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        label="HTML 原始體積"
        value={formatBytes(page.htmlBytes)}
        warn={page.htmlBytes > thresholds.htmlWarnBytes}
        hint={`建議低於 ${formatBytes(thresholds.htmlWarnBytes)}`}
      />
      <Stat
        label="伺服器回應 (TTFB)"
        value={`${page.ttfbMs} ms`}
        warn={page.ttfbMs > thresholds.ttfbSlowMs}
        hint={`建議低於 ${thresholds.ttfbSlowMs} ms`}
      />
      <Stat
        label="內嵌 Base64 圖片"
        value={page.base64ImageCount ? `${page.base64ImageCount} 張 / ${formatBytes(page.base64Bytes)}` : '0'}
        warn={page.base64Bytes > thresholds.base64WarnBytes}
        hint="建議改為外部 WebP 圖檔"
      />
      <Stat
        label="缺少 alt 的圖片"
        value={`${page.missingAltCount} / ${page.imageCount}`}
        warn={page.missingAltCount > 0}
        hint="影響圖片搜尋與無障礙"
      />
    </div>

    {page.missingAltImages.length > 0 && (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900">
          缺少 alt 的圖片清單{page.missingAltCount > page.missingAltImages.length ? ` (顯示前 ${page.missingAltImages.length} 張)` : ''}
        </h4>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {page.missingAltImages.map((src, i) => (
            <li key={`${src}-${i}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
              {src.startsWith('http') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded bg-slate-100 object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-slate-100" />
              )}
              <a
                href={src.startsWith('http') ? src : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 truncate font-mono text-xs text-slate-600 hover:text-blue-600"
                title={src}
              >
                {src.split('/').pop() || src}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
