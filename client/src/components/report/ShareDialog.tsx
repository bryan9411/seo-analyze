'use client'

import React, { useEffect, useState } from 'react'
import { X, Copy, Check, Download, Loader2 } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { downloadScoreCard } from '@/lib/scoreCard'

interface ShareDialogProps {
  report: DiagnosticReport
  onClose: () => void
}

type ShareState =
  | { status: 'loading' }
  | { status: 'ready', url: string, expiresAt: string }
  | { status: 'error', message: string }

export const ShareDialog: React.FC<ShareDialogProps> = ({ report, onClose }) => {
  const [state, setState] = useState<ShareState>({ status: 'loading' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.reportId })
    })
      .then(async res => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) setState({ status: 'error', message: data.message || data.error })
        else setState({ status: 'ready', url: `${window.location.origin}/r/${data.id}`, expiresAt: data.expiresAt })
      })
      .catch(() => !cancelled && setState({ status: 'error', message: '無法連線伺服器' }))
    return () => {
      cancelled = true
    }
  }, [report.reportId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    if (state.status !== 'ready') return
    await navigator.clipboard.writeText(state.url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="share-title" className="text-base font-semibold text-slate-900">分享這份報告</h2>
          <button type="button" onClick={onClose} aria-label="關閉" className="rounded p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          {state.status === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />正在建立連結…</p>
          )}
          {state.status === 'error' && <p className="text-sm text-rose-700">{state.message}</p>}
          {state.status === 'ready' && (
            <>
              <div className="flex gap-2">
                <input readOnly value={state.url} onFocus={e => e.target.select()} className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700" aria-label="分享連結" />
                <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 text-sm hover:bg-slate-50 cursor-pointer">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                不需登入即可查看的唯讀快照，{new Date(state.expiresAt).toLocaleDateString('zh-TW')} 後失效。知道連結的人都能看到報告內容。
              </p>
            </>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => downloadScoreCard(report)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            下載分數卡圖片 (PNG)
          </button>
        </div>
      </div>
    </div>
  )
}
