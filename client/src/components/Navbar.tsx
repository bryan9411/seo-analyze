'use client'

import React from 'react'
import { FileDown, FileText, Search, Loader2, Globe, FileSpreadsheet } from 'lucide-react'

interface NavbarProps {
  url: string
  setUrl: (url: string) => void
  isSiteWide: boolean
  setIsSiteWide: (val: boolean) => void
  onStartDiagnose: () => void
  isLoading: boolean
  hasReport: boolean
  onExportWord: () => void
  onExportMarkdown: () => void
  isExportingWord?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  url,
  setUrl,
  isSiteWide,
  setIsSiteWide,
  onStartDiagnose,
  isLoading,
  hasReport,
  onExportWord,
  onExportMarkdown,
  isExportingWord = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return
    onStartDiagnose()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:py-0 lg:px-8">
        {/* 系統名稱 */}
        <div className="flex items-center shrink-0">
          <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            SEO · GEO · AEO <span className="hidden sm:inline">網頁健檢診斷平台</span>
          </span>
        </div>

        {/* 搜尋與操作列 */}
        <form onSubmit={handleSubmit} className="order-3 flex w-full items-center gap-2 lg:order-none lg:w-auto lg:max-w-xl lg:flex-1">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="請輸入欲健檢的網站網址..."
              className="w-full rounded-md border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          {/* 模式切換 */}
          <button
            type="button"
            onClick={() => setIsSiteWide(!isSiteWide)}
            disabled={isLoading}
            title={isSiteWide ? '切換為單頁模式' : '切換為全站抽樣'}
            aria-label={isSiteWide ? '目前為全站抽樣，點擊切換為單頁診斷' : '目前為單頁診斷，點擊切換為全站抽樣'}
            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${isSiteWide
              ? 'border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/60'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            {isSiteWide ? (
              <>
                <Globe className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">全站抽樣</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">單頁診斷</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>分析中</span>
              </>
            ) : (
              <span>開始健檢</span>
            )}
          </button>
        </form>

        {/* 匯出與設定 */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportWord}
            disabled={!hasReport || isExportingWord}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${hasReport && !isExportingWord
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer'
              : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
          >
            <FileDown className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">匯出 </span><span>Word</span>
          </button>

          <button
            type="button"
            onClick={onExportMarkdown}
            disabled={!hasReport}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${hasReport
              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer'
              : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">匯出 </span><span>Markdown</span>
          </button>

          {/* 暫時隱藏規則設定入口 (避免一般使用者進入)；恢復時需重新 import Link 與 SlidersHorizontal */}
          {/*
          <Link
            href="/admin/rules"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="診斷規則設定"
            aria-label="診斷規則設定"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Link>
          */}
        </div>
      </div>
    </header>
  )
}
