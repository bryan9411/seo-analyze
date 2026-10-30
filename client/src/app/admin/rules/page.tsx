'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Save, RotateCcw, ShieldCheck, History } from 'lucide-react'

interface RulesStatus {
  path: string
  version: string
  loadedAt: string
  lastError: string | null
  editable: boolean
}

interface CheckSummary {
  id: string
  dimension: string
  enabled?: boolean
  description?: string
}

interface RulesShape {
  version: string
  thresholds: Record<string, number>
  checks: CheckSummary[]
  [key: string]: unknown
}

const TOKEN_KEY = 'seo-rules-admin-token'
const DIMENSION_LABEL: Record<string, string> = { seo: 'SEO', geo: 'GEO', aio: 'AEO' }

const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

const RulesAdminPage = () => {
  const [status, setStatus] = useState<RulesStatus | null>(null)
  const [draft, setDraft] = useState('')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState<{ ok: boolean, text: string, errors?: string[] } | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const parsed = useMemo((): RulesShape | null => {
    try {
      return JSON.parse(draft)
    } catch {
      return null
    }
  }, [draft])

  const applyRules = useCallback((data: { status: RulesStatus, rules: unknown }) => {
    setStatus(data.status)
    setDraft(JSON.stringify(data.rules, null, 2))
  }, [])

  const load = useCallback(async () => {
    const res = await fetch('/api/rules')
    applyRules(await res.json())
  }, [applyRules])

  useEffect(() => {
    let cancelled = false
    fetch('/api/rules')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        applyRules(data)
        setToken(prev => prev || readToken())
      })
      .catch(() => setMessage({ ok: false, text: '無法連線後端服務' }))
    return () => {
      cancelled = true
    }
  }, [applyRules])

  const authHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  })

  const updateDraft = (mutate: (rules: RulesShape) => void) => {
    if (!parsed) return
    const next = structuredClone(parsed)
    mutate(next)
    setDraft(JSON.stringify(next, null, 2))
  }

  const handleValidate = async () => {
    if (!parsed) return setMessage({ ok: false, text: 'JSON 格式錯誤，請檢查逗號與括號' })
    const res = await fetch('/api/rules/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: draft })
    const data = await res.json()
    setMessage(data.ok ? { ok: true, text: '驗證通過，可以儲存' } : { ok: false, text: '驗證未通過', errors: data.errors })
  }

  const handleSave = async () => {
    if (!parsed) return setMessage({ ok: false, text: 'JSON 格式錯誤，請檢查逗號與括號' })
    setBusy(true)
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      // 略過
    }
    try {
      const res = await fetch('/api/rules', { method: 'PUT', headers: authHeaders(), body: draft })
      const data = await res.json()
      if (res.ok) {
        setMessage({ ok: true, text: `已儲存並立即生效 (v${data.version})，舊版已自動備份` })
        await load()
      } else {
        setMessage({ ok: false, text: data.message || data.error, errors: data.errors })
      }
    } finally {
      setBusy(false)
    }
  }

  const loadHistory = async () => {
    const res = await fetch('/api/rules/history', { headers: authHeaders() })
    const data = await res.json()
    if (res.ok) setHistory(data.files)
    else setMessage({ ok: false, text: data.message || data.error })
  }

  const restore = async (file: string) => {
    if (!confirm(`確定要還原到 ${file}？目前版本會先備份。`)) return
    const res = await fetch(`/api/rules/history/${encodeURIComponent(file)}/restore`, { method: 'POST', headers: authHeaders() })
    const data = await res.json()
    if (res.ok) {
      setMessage({ ok: true, text: `已還原為 v${data.version}` })
      await load()
      await loadHistory()
    } else {
      setMessage({ ok: false, text: data.message || data.error, errors: data.errors })
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <h1 className="text-lg font-bold">診斷規則設定</h1>
          {status && <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">v{status.version}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600">
          <p>
            所有評分門檻、配分、問題文案、字詞庫與 AI 爬蟲清單都在規則檔中。Google 或 AI 搜尋規則改變時，有兩種更新方式，都不需要重新啟動或部署：
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>直接編輯伺服器上的 <code className="rounded bg-slate-100 px-1 font-mono text-xs">{status?.path || 'server/rules/rules.json'}</code>，存檔後自動重新載入。</li>
            <li>在本頁修改後按「儲存」(需伺服器設定 <code className="rounded bg-slate-100 px-1 font-mono text-xs">RULES_ADMIN_TOKEN</code>)。</li>
          </ol>
          {status?.lastError && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
              最近一次從檔案載入失敗，伺服器仍使用 v{status.version}：<br />
              <span className="whitespace-pre-wrap font-mono text-xs">{status.lastError}</span>
            </p>
          )}
        </section>

        {parsed && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold">門檻值</h2>
              <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                {Object.entries(parsed.thresholds).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs text-slate-600">{key}</span>
                    <input
                      type="number"
                      value={value}
                      onChange={e => updateDraft(r => { r.thresholds[key] = Number(e.target.value) })}
                      className="w-28 rounded-md border border-slate-200 px-2 py-1 text-right tabular-nums focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold">檢核項目 ({parsed.checks.length})</h2>
              <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                {parsed.checks.map((check, i) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={check.enabled !== false}
                      onChange={e => updateDraft(r => { r.checks[i].enabled = e.target.checked })}
                      className="mt-1"
                      aria-label={`啟用 ${check.id}`}
                    />
                    <span className="w-10 shrink-0 rounded bg-slate-100 px-1 text-center text-[11px] font-semibold text-slate-600">
                      {DIMENSION_LABEL[check.dimension] || check.dimension}
                    </span>
                    <span className="min-w-0">
                      <span className="font-mono text-xs text-slate-800">{check.id}</span>
                      {check.description && <span className="block text-xs text-slate-500">{check.description}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">完整規則 JSON</h2>
            {!parsed && <span className="text-xs font-medium text-rose-600">JSON 格式錯誤</span>}
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck={false}
            className="h-[480px] w-full rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 focus:border-blue-500 focus:outline-none"
          />

          {message && (
            <div className={`mt-3 rounded-lg border p-3 text-sm ${message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              <p className="flex items-center gap-1.5 font-medium">
                {message.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {message.text}
              </p>
              {message.errors && (
                <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5 font-mono text-xs">
                  {message.errors.map(e => <li key={e}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleValidate} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 cursor-pointer">
              <ShieldCheck className="h-4 w-4" />
              驗證
            </button>
            <button type="button" onClick={() => load()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 cursor-pointer">
              <RotateCcw className="h-4 w-4" />
              放棄修改
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="管理密鑰 (RULES_ADMIN_TOKEN)"
                autoComplete="off"
                className="w-64 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={busy || !parsed || !token}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                儲存並生效
              </button>
            </div>
          </div>
          {status && !status.editable && (
            <p className="mt-2 text-xs text-amber-700">伺服器未設定 RULES_ADMIN_TOKEN，線上儲存已停用，請直接編輯規則檔。</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <History className="h-4 w-4 text-slate-400" />
              歷史版本
            </h2>
            <button type="button" onClick={loadHistory} disabled={!token} className="text-sm text-blue-600 hover:underline disabled:opacity-50 cursor-pointer">
              載入清單
            </button>
          </div>
          {history.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {history.map(file => (
                <li key={file} className="flex items-center justify-between py-2">
                  <span className="font-mono text-xs text-slate-600">{file}</span>
                  <button type="button" onClick={() => restore(file)} className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">還原此版本</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">每次線上儲存或還原前，會自動備份當下版本 (保留最近 30 份)。</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default RulesAdminPage
