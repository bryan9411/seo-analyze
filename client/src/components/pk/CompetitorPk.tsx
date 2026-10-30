'use client'

import React, { useState } from 'react'
import { Loader2, Swords, Trophy, AlertTriangle } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { runDiagnose } from '@/lib/diagnoseClient'
import { compareReports, DIMENSION_LABEL } from '@/lib/reportInsights'
import { SeverityBadge } from '@/components/report/SeverityBadge'

interface CompetitorPkProps {
  defaultOwnUrl?: string
}

const DIMS = [
  { key: 'overall', label: '綜合' },
  { key: 'seo', label: 'SEO' },
  { key: 'geo', label: 'GEO' },
  { key: 'aio', label: 'AEO' }
] as const

/**
 * 競品 PK：兩個網址各做一次單頁診斷後並排比較
 * (全站抽樣兩站同時跑會超過反向代理逾時，因此固定為單頁)
 */
export const CompetitorPk: React.FC<CompetitorPkProps> = ({ defaultOwnUrl = '' }) => {
  const [ownUrl, setOwnUrl] = useState(defaultOwnUrl)
  const [rivalUrl, setRivalUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ own: DiagnosticReport, rival: DiagnosticReport } | null>(null)

  const start = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownUrl.trim() || !rivalUrl.trim()) {
      setError('請輸入兩個網址')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [own, rival] = await Promise.all([
        runDiagnose({ url: ownUrl.trim(), isSiteWide: false }),
        runDiagnose({ url: rivalUrl.trim(), isSiteWide: false })
      ])
      setResult({ own, rival })
    } catch (err) {
      setError(err instanceof Error ? err.message : '比較失敗')
    } finally {
      setLoading(false)
    }
  }

  const compare = result ? compareReports(result.own, result.rival) : null
  const hostOf = (r: DiagnosticReport) => {
    try {
      return new URL(r.targetUrl).hostname.replace(/^www\./, '')
    } catch {
      return r.targetUrl
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Swords className="h-5 w-5 text-blue-600" />
          競品 PK
        </h2>
        <p className="mt-1 text-sm text-slate-500">輸入自家與競爭對手的同類型頁面 (例如兩篇主題相同的文章)，以單頁診斷並排比較。</p>
      </div>

      <form onSubmit={start} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_1fr_auto]">
        <input
          type="text"
          value={ownUrl}
          onChange={e => setOwnUrl(e.target.value)}
          placeholder="自家網址 https://mysite.tw/article"
          aria-label="自家網址"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="text-center text-sm font-medium text-slate-400">vs</span>
        <input
          type="text"
          value={rivalUrl}
          onChange={e => setRivalUrl(e.target.value)}
          placeholder="競品網址 https://rival.tw/article"
          aria-label="競品網址"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? '比較中' : '開始比較'}
        </button>
      </form>
      {error && <p className="text-sm text-rose-700">{error}</p>}

      {result && compare && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[{ r: result.own, label: '自家' }, { r: result.rival, label: '競品' }].map(({ r, label }) => {
              const win = r.scores.overall >= (label === '自家' ? result.rival : result.own).scores.overall
              return (
                <div key={label} className={`rounded-xl border bg-white p-4 ${label === '自家' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={label === '自家' ? 'font-medium text-blue-700' : 'text-slate-500'}>{label}</span>
                    {win && <Trophy className="h-4 w-4 text-amber-500" aria-label="分數較高" />}
                  </div>
                  <div className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">{r.scores.overall}</div>
                  <div className="mt-1 truncate text-xs text-slate-500" title={r.targetUrl}>{hostOf(r)}</div>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">分數對照</h3>
            <div className="space-y-3">
              {DIMS.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3 text-sm">
                  <span className="text-slate-600">{label}</span>
                  <div className="space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${result.own.scores[key]}%` }} /></div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-400" style={{ width: `${result.rival.scores[key]}%` }} /></div>
                  </div>
                  <span className="text-right tabular-nums text-slate-700">{result.own.scores[key]} / {result.rival.scores[key]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-blue-500" />自家</span>
              <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-slate-400" />競品</span>
            </div>
          </div>

          {(compare.gaps.length > 0 || compare.missingSchemas.length > 0) ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                差距摘要
                {compare.estimatedCatchUp > 0 && <span className="font-normal text-amber-800">：補上以下項目預估可追上 {compare.estimatedCatchUp} 分</span>}
              </h3>
              {compare.missingSchemas.length > 0 && (
                <p className="mt-2 text-sm text-amber-900">競品多了這些結構化資料：{compare.missingSchemas.join('、')}</p>
              )}
              <ul className="mt-2 space-y-1.5">
                {compare.gaps.map(f => (
                  <li key={f.checkId} className="flex items-start gap-2 text-sm text-amber-950">
                    <SeverityBadge severity={f.severity} />
                    <span className="text-xs font-medium text-amber-700">{DIMENSION_LABEL[f.dimension]}</span>
                    <span className="flex-1">{f.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">競品做到的項目，自家都已經做到了。</p>
          )}

          {compare.advantages.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">自家領先的地方</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {compare.advantages.map(f => <li key={f.checkId}>競品：{f.message}</li>)}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">項目</th>
                  <th className="px-4 py-2.5 font-medium text-blue-700">自家</th>
                  <th className="px-4 py-2.5 font-medium">競品</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compare.rows.map(row => (
                  <tr key={row.label}>
                    <td className="px-4 py-2.5 text-slate-600">{row.label}</td>
                    <td className="px-4 py-2.5 text-slate-900">{row.own}</td>
                    <td className={`px-4 py-2.5 ${row.rivalBetter ? 'font-medium text-amber-700' : 'text-slate-900'}`}>{row.rival}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
