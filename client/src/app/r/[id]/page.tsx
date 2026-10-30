'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { ReportView } from '@/components/report/ReportView'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready', report: DiagnosticReport, expiresAt: string }
  | { status: 'error', message: string }

/** 分享連結的唯讀報告頁 */
const SharedReportPage = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/share/${encodeURIComponent(id)}`)
      .then(async res => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) setState({ status: 'error', message: data.message || data.error })
        else setState({ status: 'ready', report: data.report, expiresAt: data.expiresAt })
      })
      .catch(() => !cancelled && setState({ status: 'error', message: '無法連線伺服器' }))
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight text-slate-900">SEO · GEO · AEO <span className="font-medium text-slate-500">網頁健檢</span></Link>
          <Link href="/" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">檢測我的網站</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {state.status === 'loading' && (
          <p className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />載入報告中…</p>
        )}
        {state.status === 'error' && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-slate-900">{state.message}</p>
            <Link href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">回首頁重新檢測</Link>
          </div>
        )}
        {state.status === 'ready' && (
          <>
            <p className="no-print mb-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
              這是分享的唯讀報告快照，{new Date(state.expiresAt).toLocaleDateString('zh-TW')} 後失效。
            </p>
            <ReportView report={state.report} readOnly />
          </>
        )}
      </main>
    </div>
  )
}

export default SharedReportPage
