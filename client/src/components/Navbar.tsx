'use client'

import React from 'react'
import { FileDown, FileText, Settings, Sparkles } from 'lucide-react'

interface NavbarProps {
  hasReport: boolean
  onExportWord: () => void
  onExportMarkdown: () => void
  onOpenSettings: () => void
  isExportingWord?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  hasReport,
  onExportWord,
  onExportMarkdown,
  onOpenSettings,
  isExportingWord = false
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左側品牌標題 */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-slate-900">
                SEO · GEO · AIO
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                2026 演算法
              </span>
            </div>
            <p className="text-xs text-slate-500">現代化全端網頁搜尋與 AI 檢索診斷儀表板</p>
          </div>
        </div>

        {/* 右側操作功能區 */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExportWord}
            disabled={!hasReport || isExportingWord}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${
              hasReport && !isExportingWord
                ? 'border-blue-200 bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 hover:border-blue-300'
                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <FileDown className="h-4 w-4" />
            <span>{isExportingWord ? '生成中...' : '匯出 Word 報告 (.docx)'}</span>
          </button>

          <button
            type="button"
            onClick={onExportMarkdown}
            disabled={!hasReport}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${
              hasReport
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>匯出 Markdown 報告 (.md)</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="系統設定"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
