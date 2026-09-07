'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Sparkles, SearchCheck } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { SearchControlBar } from '@/components/SearchControlBar'
import { ScoreOverview } from '@/components/ScoreOverview'
import { ChartsSection } from '@/components/ChartsSection'
import { SampleArticlesTable } from '@/components/SampleArticlesTable'
import type { DiagnosticReport } from '@/types/seo'

export default function DashboardPage() {
  // 網址輸入框預設為空
  const [url, setUrl] = useState('')
  const [isSiteWide, setIsSiteWide] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [report, setReport] = useState<DiagnosticReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExportingWord, setIsExportingWord] = useState(false)

  // 執行健檢診斷
  const handleStartDiagnose = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)
    setCurrentStep(1)

    // 模擬 4 步驟進度推移
    const stepTimer1 = setTimeout(() => setCurrentStep(2), 600)
    const stepTimer2 = setTimeout(() => setCurrentStep(3), 1600)

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url.trim(),
          isSiteWide,
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

  // 下載 Word 報告 (.docx)
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

  // 下載 Markdown 報告 (.md)
  const handleExportMarkdown = () => {
    if (!report) return

    try {
      const { scores, sections, targetUrl, pageTitle, isSiteWide: siteWide, analyzedPageCount, allPages } = report
      let md = `# 🔍 SEO · GEO · AIO 網頁健檢診斷報告\n\n`
      md += `> **評估時間**：${new Date(report.timestamp).toLocaleString('zh-TW')}  \n`
      md += `> **受測網址**：${targetUrl}  \n`
      md += `> **網頁標題**：${pageTitle}  \n`
      md += `> **分析範疇**：${siteWide ? `全站抽樣深度健檢 (主頁 + ${analyzedPageCount - 1} 篇抽樣頁面)` : '單頁專項深度診斷'}  \n\n`

      md += `## 📊 綜合健康度評分矩陣\n\n`
      md += `| 評估維度 | 評估分數 | 狀態等級 |\n`
      md += `| :--- | :---: | :--- |\n`
      md += `| **傳統 SEO (搜尋引擎優化)** | **${scores.seo}** / 100 | ${scores.seo >= 70 ? '🟢 良好' : '🔴 需深度優化'} |\n`
      md += `| **GEO (在地化地理搜尋)** | **${scores.geo}** / 100 | ${scores.geo >= 70 ? '🟢 良好' : '🔴 嚴重脫節'} |\n`
      md += `| **AIO (生成式 AI 答案引擎)** | **${scores.aio}** / 100 | ${scores.aio >= 70 ? '🟢 良好' : '🔴 容易被忽略'} |\n`
      md += `| **全站綜合搜尋能見度** | **${scores.overall}** / 100 | **綜合評級** |\n\n`
      md += `---\n\n`

      if (allPages && allPages.length > 0) {
        md += `## 📑 抽查檢驗之頁面清單\n\n`
        md += `| 序號 | 頁面類別 | 網頁標題 | 完整檢驗網址 |\n`
        md += `| :---: | :--- | :--- | :--- |\n`
        allPages.forEach(p => {
          md += `| ${p.no} | ${p.type} | ${(p.title || '').replace(/\|/g, '-')} | [${p.url}](${p.url}) |\n`
        })
        md += `\n---\n\n`
      }

      md += `## 📋 1. 傳統 SEO 診斷\n\n${sections.seoSection.titleMetaAnalysis}\n\n${sections.seoSection.eeatAnalysis}\n\n`
      md += `## 📍 2. GEO 診斷\n\n${sections.geoSection.schemaAnalysis}\n\n${sections.geoSection.geoEntityAnalysis}\n\n`
      md += `## 🤖 3. AIO 診斷\n\n${sections.aioSection.infoDensityAnalysis}\n\n${sections.aioSection.qaRelevanceAnalysis}\n\n`

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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      {/* 頂部導覽列 */}
      <Navbar
        hasReport={Boolean(report)}
        onExportWord={handleExportWord}
        onExportMarkdown={handleExportMarkdown}
        onOpenSettings={() => alert('設定彈窗功能將於階段 5 完整串接')}
        isExportingWord={isExportingWord}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* 頂部搜尋與範疇控制列 */}
        <SearchControlBar
          url={url}
          setUrl={setUrl}
          isSiteWide={isSiteWide}
          setIsSiteWide={setIsSiteWide}
          onStartDiagnose={handleStartDiagnose}
          isLoading={isLoading}
          currentStep={currentStep}
        />

        {/* 錯誤提示框 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 shadow-xs"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">診斷中斷提示</p>
                <p className="mt-0.5 text-rose-700 text-xs">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 診斷報表內容 */}
        {report ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* 1. 核心 KPI 分數總覽 (Count-up 動畫) */}
            <ScoreOverview scores={report.scores} />

            {/* 2. 動態圖表區塊 (長條圖 1000ms 緩動升起 + 圓環圖事實密度) */}
            <ChartsSection
              complianceMetrics={report.complianceMetrics}
              factDensity={report.factDensity}
            />

            {/* 3. 抽查 5 篇代表文章表格 */}
            <SampleArticlesTable
              allPages={report.allPages}
              isSiteWide={report.isSiteWide}
            />
          </motion.div>
        ) : (
          /* 未進行健檢時的 Notion 極簡空白提示 */
          !isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4 shadow-inner">
                <SearchCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">尚未開始網頁健檢診斷</h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
                請在上方輸入您欲檢驗的公開網址（例如 <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">https://example.com</span>），系統將自動啟動 2026 演算法深度檢核，即時呈現達標率與事實密度動態圖表。
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>支援單頁專項診斷與全站代表性文章自動抽樣</span>
              </div>
            </div>
          )
        )}
      </main>

      {/* 底部頁尾 */}
      <footer className="border-t border-slate-200/60 bg-white py-4 text-center text-xs text-slate-400">
        SEO · GEO · AIO 現代化智能健檢系統 · Powered by Next.js 15 & Express
      </footer>
    </div>
  )
}
