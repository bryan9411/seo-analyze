'use client'

import React, { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, SearchCheck, History, RefreshCw, TrendingUp } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { StepperBar } from '@/components/StepperBar'
import { ScoreOverview } from '@/components/ScoreOverview'
import type { DiagnosticReport } from '@/types/seo'
import { findPrevious, loadHistory, pushHistory, clearHistory, subscribeHistory, getServerHistory, type HistoryEntry } from '@/lib/history'
import { suggestSiteWide } from '@/lib/urlType'

// 報告區塊在有結果後才需要，拆成獨立 bundle 延後載入 (recharts 體積較大)
const SectionSkeleton = () => <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
const ChartsSection = dynamic(() => import('@/components/ChartsSection').then(m => m.ChartsSection), { ssr: false, loading: SectionSkeleton })
const SampleArticlesTable = dynamic(() => import('@/components/SampleArticlesTable').then(m => m.SampleArticlesTable), { loading: SectionSkeleton })
const PriorityCodeSnippet = dynamic(() => import('@/components/PriorityCodeSnippet').then(m => m.PriorityCodeSnippet), { loading: SectionSkeleton })
const DiagnosticTabs = dynamic(() => import('@/components/DiagnosticTabs').then(m => m.DiagnosticTabs), { loading: SectionSkeleton })
const InsightsPanel = dynamic(() => import('@/components/insights/InsightsPanel').then(m => m.InsightsPanel), { ssr: false, loading: SectionSkeleton })

type StreamEvent =
  | { type: 'progress', message: string }
  | { type: 'result', report: DiagnosticReport }
  | { type: 'error', error: string, message?: string }

const stepFromMessage = (message: string) => (message.includes('計算') ? 3 : message.includes('抽樣') ? 2 : 1)

/** 讀取 NDJSON 串流，逐行回呼；伺服器若回傳一般 JSON 也能處理 */
const readDiagnoseStream = async (res: Response, onEvent: (e: StreamEvent) => void) => {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('ndjson') || !res.body) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || data.error || `診斷失敗 (HTTP ${res.status})`)
    onEvent({ type: 'result', report: data })
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line))
    }
    if (done) break
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer))
}

const DashboardPage = () => {
  const [url, setUrl] = useState('')
  const [isSiteWide, setIsSiteWide] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExportingWord, setIsExportingWord] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const history = useSyncExternalStore(subscribeHistory, loadHistory, getServerHistory)
  const [previous, setPrevious] = useState<HistoryEntry | undefined>()
  // 使用者手動切換過範疇後，不再依網址自動切換
  const [scopeTouched, setScopeTouched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value)
    if (!value.trim()) {
      setScopeTouched(false)
      return
    }
    if (!scopeTouched) {
      const suggestion = suggestSiteWide(value)
      if (suggestion !== null) setIsSiteWide(suggestion)
    }
  }, [scopeTouched])

  const handleToggleScope = useCallback((value: boolean) => {
    setScopeTouched(true)
    setIsSiteWide(value)
  }, [])

  // 執行健檢診斷 (串流接收後端真實進度)
  const handleStartDiagnose = async (overrideUrl?: string, overrideSiteWide?: boolean, force = false) => {
    const activeUrl = (overrideUrl !== undefined ? overrideUrl : url).trim()
    const activeSiteWide = overrideSiteWide !== undefined ? overrideSiteWide : isSiteWide

    if (!activeUrl) return

    if (overrideUrl !== undefined) setUrl(overrideUrl)
    if (overrideSiteWide !== undefined) setIsSiteWide(overrideSiteWide)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)
    setCurrentStep(1)
    setProgressMessage('正在驗證網址安全性')

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-ndjson'
        },
        body: JSON.stringify({ url: activeUrl, isSiteWide: activeSiteWide, mode: 'ALL', force })
      })

      let result: DiagnosticReport | null = null
      await readDiagnoseStream(res, (event) => {
        if (event.type === 'progress') {
          setProgressMessage(event.message)
          setCurrentStep(stepFromMessage(event.message))
        } else if (event.type === 'result') {
          result = event.report
        } else {
          throw new Error(event.message || event.error)
        }
      })

      if (!result) throw new Error('伺服器未回傳診斷結果')
      const data: DiagnosticReport = result
      setCurrentStep(4)
      setPrevious(findPrevious(loadHistory(), data))
      pushHistory(data)
      setReport(data)
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      const msg = err instanceof Error ? err.message : '連線異常，請確認後端服務是否已正常啟動'
      setError(msg)
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false)
        setProgressMessage('')
      }
    }
  }

  // 快速體驗：點選後立即將網址帶入並直接執行全站抽樣分析
  const handleQuickAnalyze = (sampleUrl: string, siteWide = true) => {
    setUrl(sampleUrl)
    setIsSiteWide(siteWide)
    handleStartDiagnose(sampleUrl, siteWide)
  }

  // 匯出 Word 報告
  const handleExportWord = async () => {
    if (!report || isExportingWord) return

    setIsExportingWord(true)
    try {
      const res = await fetch('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report, mode: 'ALL' })
      })

      if (!res.ok) {
        throw new Error('匯出 Word 失敗')
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `SEO_Report_${new Date().toISOString().slice(0, 10)}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '匯出 Word 時發生錯誤')
    } finally {
      setIsExportingWord(false)
    }
  }

  // 匯出 Markdown 報告
  const handleExportMarkdown = () => {
    if (!report) return

    try {
      const { scores, sections, targetUrl, pageTitle, isSiteWide: siteWide, analyzedPageCount, allPages } = report
      let md = `# SEO · GEO · AEO 網頁健檢診斷報告\n\n`
      md += `> **評估時間**：${new Date(report.timestamp).toLocaleString('zh-TW')}  \n`
      md += `> **受測網址**：${targetUrl}  \n`
      md += `> **網頁標題**：${pageTitle}  \n`
      md += `> **分析範疇**：${siteWide ? `全站抽樣深度健檢（主頁與 ${analyzedPageCount - 1} 篇抽樣頁面）` : '單頁專項深度診斷'}  \n\n`

      md += `## 綜合健康度評分矩陣\n\n`
      md += `| 評估維度 | 評估分數 | 狀態等級 |\n`
      md += `| :--- | :---: | :--- |\n`
      md += `| **傳統 SEO** | **${scores.seo}** / 100 | ${scores.seo >= 70 ? '良好' : '需深度優化'} |\n`
      md += `| **生成式 GEO** | **${scores.geo}** / 100 | ${scores.geo >= 70 ? '良好' : '缺乏引述優化'} |\n`
      md += `| **解答引擎 AEO** | **${scores.aio}** / 100 | ${scores.aio >= 70 ? '良好' : '容易被忽略'} |\n`
      md += `| **全站綜合搜尋能見度** | **${scores.overall}** / 100 | **綜合評級** |\n\n`
      md += `---\n\n`

      if (allPages && allPages.length > 0) {
        md += `## 抽查檢驗之頁面清單\n\n`
        md += `| 序號 | 頁面類別 | 網頁標題 | 完整檢驗網址 |\n`
        md += `| :---: | :--- | :--- | :--- |\n`
        allPages.forEach((p) => {
          md += `| ${p.no} | ${p.type} | ${(p.title || '').replace(/\|/g, '-')} | [${p.url}](${p.url}) |\n`
        })
        md += `\n---\n\n`
      }

      md += `## 1. 傳統 SEO 診斷\n\n${sections.seoSection.titleMetaAnalysis}\n\n${sections.seoSection.eeatAnalysis}\n\n`
      md += `## 2. 生成式 GEO 診斷\n\n${sections.geoSection.schemaAnalysis}\n\n${sections.geoSection.geoEntityAnalysis}\n\n`
      md += `## 3. 解答引擎 AEO 診斷\n\n${sections.aioSection.infoDensityAnalysis}\n\n${sections.aioSection.qaRelevanceAnalysis}\n\n`

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `SEO_Report_${new Date().toISOString().slice(0, 10)}.md`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      alert('匯出 Markdown 發生錯誤')
    }
  }

  // 推薦 Schema 代碼
  const recommendedCodeSnippet = report?.sections.improvementSection.items.find(
    (item) => item.codeSnippet
  )?.codeSnippet

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* 頂部導航 */}
      <Navbar
        url={url}
        setUrl={handleUrlChange}
        isSiteWide={isSiteWide}
        setIsSiteWide={handleToggleScope}
        onStartDiagnose={() => handleStartDiagnose()}
        isLoading={isLoading}
        hasReport={Boolean(report)}
        onExportWord={handleExportWord}
        onExportMarkdown={handleExportMarkdown}
        isExportingWord={isExportingWord}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* 步驟進度條 */}
        <StepperBar currentStep={currentStep} isLoading={isLoading} progressMessage={progressMessage} />

        {/* 錯誤提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold">診斷中斷提示</p>
                  <p className="mt-0.5 text-rose-700 text-xs">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartDiagnose()}
                disabled={isLoading}
                className="shrink-0 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                重新嘗試
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 診斷報告 */}
        {report ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* 報告資訊列：快取狀態、規則版本、重新檢測 */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {new Date(report.timestamp).toLocaleString('zh-TW')} · 分析 {report.analyzedPageCount} 頁 · 耗時 {(report.durationMs / 1000).toFixed(1)} 秒 · 規則 v{report.rulesVersion}
                {report.cached && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">快取結果</span>}
              </span>
              <button
                type="button"
                onClick={() => handleStartDiagnose(report.targetUrl, report.isSiteWide, true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                重新檢測 (修改網頁後)
              </button>
            </div>

            {/* 改善前後對比 */}
            {previous && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900">
                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold">
                    與 {new Date(previous.timestamp).toLocaleString('zh-TW')} 的檢測相比：綜合評分 {previous.scores.overall} → {report.scores.overall}
                    （{report.scores.overall - previous.scores.overall >= 0 ? '+' : ''}{report.scores.overall - previous.scores.overall}）
                  </p>
                  <p className="mt-0.5 text-blue-800">
                    SEO {report.scores.seo - previous.scores.seo >= 0 ? '+' : ''}{report.scores.seo - previous.scores.seo}、
                    GEO {report.scores.geo - previous.scores.geo >= 0 ? '+' : ''}{report.scores.geo - previous.scores.geo}、
                    AEO {report.scores.aio - previous.scores.aio >= 0 ? '+' : ''}{report.scores.aio - previous.scores.aio}
                    {(() => {
                      const now = new Set(report.findings.filter(f => f.kind === 'issue').map(f => f.checkId))
                      const fixed = previous.issueKeys.filter(k => !now.has(k)).length
                      const added = [...now].filter(k => !previous.issueKeys.includes(k)).length
                      return `；已修正 ${fixed} 項、新出現 ${added} 項`
                    })()}
                    {previous.rulesVersion !== report.rulesVersion && '（期間規則已更新，分數可能不完全可比）'}
                  </p>
                </div>
              </div>
            )}

            {/* KPI 卡片 */}
            <ScoreOverview scores={report.scores} previous={previous?.scores} />

            {/* 圖表區 */}
            <ChartsSection
              complianceMetrics={report.complianceMetrics}
              factDensity={report.factDensity}
            />

            {/* 抽樣頁面清單與代碼範本 */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6">
                <SampleArticlesTable
                  allPages={report.allPages}
                  isSiteWide={report.isSiteWide}
                />
              </div>
              <div className="lg:col-span-6">
                <PriorityCodeSnippet codeSnippet={recommendedCodeSnippet} />
              </div>
            </div>

            {/* 頁面明細與工具 */}
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-500">頁面明細與工具</h3>
              </div>
              <InsightsPanel report={report} />
            </div>

            {/* 詳細診斷頁籤 */}
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-500">深度分析與維度診斷細項</h3>
              </div>
              <DiagnosticTabs sections={report.sections} robotsTxt={report.robotsTxt} />
            </div>
          </motion.div>
        ) : (
          /* 初始空狀態 */
          !isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 mb-3">
                <SearchCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">輸入網址，檢查網站在 Google 與 AI 搜尋中的表現</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 leading-relaxed">
                免 API Key、純規則運算：檢查 Title / Meta、結構化資料、AI 爬蟲權限與內容結構，並直接產生 FAQ、LocalBusiness JSON-LD 與 llms.txt。
                首頁會自動抽樣全站，文章網址會自動切換為單頁診斷。
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { name: '維基百科首頁', url: 'https://zh.wikipedia.org' },
                  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
                  { name: 'GitHub 官方首頁', url: 'https://github.com' }
                ].map((sample) => (
                  <button
                    key={sample.url}
                    type="button"
                    onClick={() => handleQuickAnalyze(sample.url)}
                    className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-700 transition-all active:scale-95 shadow-2xs cursor-pointer hover:shadow-xs"
                    title={`點擊立即以全站抽樣分析「${sample.name}」`}
                  >
                    <span className="whitespace-nowrap font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                      {sample.name}
                    </span>
                    <span className="hidden text-[11px] font-mono text-slate-400 group-hover:text-blue-500 sm:inline">{sample.url}</span>
                    <span className="whitespace-nowrap text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                      立即全站抽樣分析
                    </span>
                  </button>
                ))}
              </div>

              {history.length > 0 && (
                <div className="mx-auto mt-8 max-w-2xl text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                      <History className="h-4 w-4 text-slate-400" />
                      最近檢測 (僅保存在此瀏覽器)
                    </h4>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      清除紀錄
                    </button>
                  </div>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {history.slice(0, 8).map(entry => (
                      <li key={`${entry.url}-${entry.timestamp}`}>
                        <button
                          type="button"
                          onClick={() => handleQuickAnalyze(entry.url, entry.isSiteWide)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="min-w-0 truncate font-mono text-xs text-slate-700">{entry.url}</span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                            <span>{new Date(entry.timestamp).toLocaleDateString('zh-TW')}</span>
                            <span className="rounded bg-slate-900 px-1.5 py-0.5 font-semibold tabular-nums text-white">{entry.scores.overall}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* 頁尾 */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        SEO · GEO · AEO 網頁健檢診斷平台
      </footer>
    </div>
  )
}

export default DashboardPage
