'use client'

import React, { useEffect, useRef, useState } from 'react'
import { RefreshCw, Share2, Download, ChevronDown, FileText, FileDown, Printer, Image as ImageIcon, ExternalLink } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { exportMarkdown, exportWord } from '@/lib/exporters'
import { downloadScoreCard } from '@/lib/scoreCard'

interface ReportHeaderProps {
  report: DiagnosticReport
  readOnly?: boolean
  isLoading?: boolean
  onRerun?: () => void
  onShare?: () => void
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ report, readOnly, isLoading, onRerun, onShare }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const run = async (fn: () => unknown) => {
    setMenuOpen(false)
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      alert(err instanceof Error ? err.message : '匯出失敗')
    } finally {
      setBusy(false)
    }
  }

  const btn = 'inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer'

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <a href={report.targetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-lg font-semibold text-slate-900 hover:text-blue-700">
          <span className="truncate">{report.pageTitle}</span>
          <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
        </a>
        <p className="mt-0.5 text-xs text-slate-500">
          {new Date(report.timestamp).toLocaleString('zh-TW')} · {report.isSiteWide ? `全站抽樣 ${report.analyzedPageCount} 頁` : '單頁診斷'} · 耗時 {(report.durationMs / 1000).toFixed(1)} 秒 · 規則 v{report.rulesVersion}
          {report.cached && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">快取結果</span>}
        </p>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2">
        {!readOnly && onRerun && (
          <button type="button" onClick={onRerun} disabled={isLoading} className={btn}>
            <RefreshCw className="h-4 w-4" />
            重新檢測
          </button>
        )}
        {!readOnly && onShare && (
          <button type="button" onClick={onShare} className={btn}>
            <Share2 className="h-4 w-4" />
            分享
          </button>
        )}
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen(o => !o)} disabled={busy} className={btn} aria-haspopup="menu" aria-expanded={menuOpen}>
            <Download className="h-4 w-4" />
            匯出
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-30 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {[
                { label: 'Word 報告', icon: FileDown, fn: () => exportWord(report) },
                { label: 'Markdown', icon: FileText, fn: () => exportMarkdown(report) },
                { label: 'PDF (列印)', icon: Printer, fn: () => window.print() },
                { label: '分數卡圖片', icon: ImageIcon, fn: () => downloadScoreCard(report) }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => run(item.fn)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <item.icon className="h-4 w-4 text-slate-400" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
