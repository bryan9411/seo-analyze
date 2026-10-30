'use client'

import React, { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { StepperBar } from '@/components/StepperBar'
import { Sidebar, type AppView } from '@/components/Sidebar'
import { ReportView } from '@/components/report/ReportView'
import { CompetitorPk } from '@/components/pk/CompetitorPk'
import { EmptyState } from '@/components/EmptyState'
import type { DiagnosticReport } from '@/types/seo'
import { findPrevious, loadHistory, pushHistory, clearHistory, removeHistory, subscribeHistory, getServerHistory, type HistoryEntry } from '@/lib/history'
import { suggestSiteWide } from '@/lib/urlType'
import { runDiagnose } from '@/lib/diagnoseClient'

const stepFromMessage = (message: string) => (message.includes('計算') ? 3 : message.includes('抽樣') ? 2 : 1)

const DashboardPage = () => {
  const [url, setUrl] = useState('')
  const [isSiteWide, setIsSiteWide] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [previous, setPrevious] = useState<HistoryEntry | undefined>()
  const [view, setView] = useState<AppView>('report')
  // 使用者手動切換過範疇後，不再依網址自動切換
  const [scopeTouched, setScopeTouched] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const history = useSyncExternalStore(subscribeHistory, loadHistory, getServerHistory)

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
    const activeUrl = (overrideUrl ?? url).trim()
    const activeSiteWide = overrideSiteWide ?? isSiteWide
    if (!activeUrl) return

    if (overrideUrl !== undefined) setUrl(overrideUrl)
    if (overrideSiteWide !== undefined) setIsSiteWide(overrideSiteWide)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setView('report')
    setIsLoading(true)
    setError(null)
    setCurrentStep(1)
    setProgressMessage('正在驗證網址安全性')

    try {
      const data = await runDiagnose({
        url: activeUrl,
        isSiteWide: activeSiteWide,
        force,
        signal: controller.signal,
        onProgress: (message) => {
          setProgressMessage(message)
          setCurrentStep(stepFromMessage(message))
        }
      })
      setCurrentStep(4)
      setPrevious(findPrevious(loadHistory(), data))
      pushHistory(data)
      setReport(data)
      window.scrollTo({ top: 0 })
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : '連線異常，請確認後端服務是否已正常啟動')
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false)
        setProgressMessage('')
      }
    }
  }

  const handleQuickAnalyze = (sampleUrl: string, siteWide = true) => handleStartDiagnose(sampleUrl, siteWide)

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans text-slate-900">
      <Navbar
        url={url}
        setUrl={handleUrlChange}
        isSiteWide={isSiteWide}
        setIsSiteWide={handleToggleScope}
        onStartDiagnose={() => handleStartDiagnose()}
        isLoading={isLoading}
        showSearch={Boolean(report) || isLoading || view === 'pk'}
      />

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Sidebar
            view={view}
            onViewChange={setView}
            hasReport={Boolean(report)}
            history={history}
            onPickHistory={(entry) => handleQuickAnalyze(entry.url, entry.isSiteWide)}
            onRemoveHistory={removeHistory}
            onClearHistory={clearHistory}
          />
        </aside>

        <main className="min-w-0 space-y-6">
          {view === 'pk' ? (
            <CompetitorPk defaultOwnUrl={report?.targetUrl} />
          ) : (
            <>
              {isLoading && <StepperBar currentStep={currentStep} isLoading={isLoading} progressMessage={progressMessage} />}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      <div>
                        <p className="font-semibold">檢測失敗</p>
                        <p className="mt-0.5 text-rose-700">{error}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartDiagnose()}
                      disabled={isLoading}
                      className="shrink-0 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      重新嘗試
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {report ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: isLoading ? 0.5 : 1 }} transition={{ duration: 0.3 }}>
                  <ReportView
                    report={report}
                    previous={previous}
                    isLoading={isLoading}
                    onRerun={() => handleStartDiagnose(report.targetUrl, report.isSiteWide, true)}
                  />
                </motion.div>
              ) : (
                !isLoading && (
                  <EmptyState
                    url={url}
                    onUrlChange={handleUrlChange}
                    isSiteWide={isSiteWide}
                    onToggleScope={handleToggleScope}
                    isLoading={isLoading}
                    onSubmit={() => handleStartDiagnose()}
                    onSample={(sampleUrl) => handleQuickAnalyze(sampleUrl)}
                    onOpenPk={() => setView('pk')}
                    history={history}
                    onPickHistory={(entry) => handleQuickAnalyze(entry.url, entry.isSiteWide)}
                    onRemoveHistory={removeHistory}
                  />
                )
              )}
            </>
          )}
        </main>
      </div>

      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        SEO · GEO · AEO 網頁健檢診斷平台
      </footer>
    </div>
  )
}

export default DashboardPage
