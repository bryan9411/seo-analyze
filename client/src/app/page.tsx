'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, SearchCheck } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { StepperBar } from '@/components/StepperBar'
import { ScoreOverview } from '@/components/ScoreOverview'
import { ChartsSection } from '@/components/ChartsSection'
import { SampleArticlesTable } from '@/components/SampleArticlesTable'
import { PriorityCodeSnippet } from '@/components/PriorityCodeSnippet'
import { DiagnosticTabs } from '@/components/DiagnosticTabs'
import { SettingsModal } from '@/components/SettingsModal'
import type { DiagnosticReport } from '@/types/seo'

const DashboardPage = () => {
  const [url, setUrl] = useState('')
  const [isSiteWide, setIsSiteWide] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExportingWord, setIsExportingWord] = useState(false)

  // API Key 設定狀態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')

  // 執行健檢診斷
  const handleStartDiagnose = async (overrideUrl?: string, overrideSiteWide?: boolean) => {
    const activeUrl = (overrideUrl !== undefined ? overrideUrl : url).trim()
    const activeSiteWide = overrideSiteWide !== undefined ? overrideSiteWide : isSiteWide

    if (!activeUrl) return

    if (overrideUrl !== undefined) setUrl(overrideUrl)
    if (overrideSiteWide !== undefined) setIsSiteWide(overrideSiteWide)

    setIsLoading(true)
    setError(null)
    setCurrentStep(1)

    // 步驟進度模擬
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 600)
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 1600)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (geminiKey) headers['x-gemini-key'] = geminiKey
      if (openaiKey) headers['x-openai-key'] = openaiKey

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: activeUrl,
          isSiteWide: activeSiteWide,
          mode: 'ALL'
        })
      })

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setCurrentStep(4)

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData.error || `診斷失敗 (HTTP ${res.status})`)
      }

      const data: DiagnosticReport = await res.json()
      setReport(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '連線異常，請確認後端服務是否已正常啟動'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // 快速體驗：點選後立即將網址帶入並直接執行全站抽樣分析
  const handleQuickAnalyze = (sampleUrl: string) => {
    setUrl(sampleUrl)
    setIsSiteWide(true)
    handleStartDiagnose(sampleUrl, true)
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
      let md = `# SEO · GEO · AIO 網頁健檢診斷報告\n\n`
      md += `> **評估時間**：${new Date(report.timestamp).toLocaleString('zh-TW')}  \n`
      md += `> **受測網址**：${targetUrl}  \n`
      md += `> **網頁標題**：${pageTitle}  \n`
      md += `> **分析範疇**：${siteWide ? `全站抽樣深度健檢（主頁與 ${analyzedPageCount - 1} 篇抽樣頁面）` : '單頁專項深度診斷'}  \n\n`

      md += `## 綜合健康度評分矩陣\n\n`
      md += `| 評估維度 | 評估分數 | 狀態等級 |\n`
      md += `| :--- | :---: | :--- |\n`
      md += `| **傳統 SEO** | **${scores.seo}** / 100 | ${scores.seo >= 70 ? '良好' : '需深度優化'} |\n`
      md += `| **生成式 GEO** | **${scores.geo}** / 100 | ${scores.geo >= 70 ? '良好' : '缺乏引述優化'} |\n`
      md += `| **Google AIO** | **${scores.aio}** / 100 | ${scores.aio >= 70 ? '良好' : '容易被忽略'} |\n`
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
      md += `## 3. Google AIO 診斷\n\n${sections.aioSection.infoDensityAnalysis}\n\n${sections.aioSection.qaRelevanceAnalysis}\n\n`

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
        setUrl={setUrl}
        isSiteWide={isSiteWide}
        setIsSiteWide={setIsSiteWide}
        onStartDiagnose={() => handleStartDiagnose()}
        isLoading={isLoading}
        hasReport={Boolean(report)}
        onExportWord={handleExportWord}
        onExportMarkdown={handleExportMarkdown}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isExportingWord={isExportingWord}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* 步驟進度條 */}
        <StepperBar currentStep={currentStep} isLoading={isLoading} />

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
            {/* KPI 卡片 */}
            <ScoreOverview scores={report.scores} />

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

            {/* 詳細診斷頁籤 */}
            <div className="pt-2">
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  深度分析與維度診斷細項
                </h3>
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
              <h3 className="text-sm font-semibold text-slate-800">尚未開始網頁健檢診斷</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                請在上方導覽列輸入欲檢驗的公開網址，或點選下方範例網址快速體驗：
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
                    <span className="font-medium flex items-center gap-1.5">
                      <span className="text-blue-600 group-hover:scale-110 transition-transform">⚡</span>
                      {sample.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-500">{sample.url}</span>
                    <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
                      立即全站抽樣分析
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        )}
      </main>

      {/* API Key 設定彈窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        openaiKey={openaiKey}
        setOpenaiKey={setOpenaiKey}
      />

      {/* 頁尾 */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        SEO · GEO · AIO 網頁健檢診斷平台
      </footer>
    </div>
  )
}

export default DashboardPage
