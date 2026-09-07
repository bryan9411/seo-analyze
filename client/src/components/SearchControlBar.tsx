'use client'

import React from 'react'
import { Search, Globe, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

interface SearchControlBarProps {
  url: string
  setUrl: (url: string) => void
  isSiteWide: boolean
  setIsSiteWide: (val: boolean) => void
  onStartDiagnose: () => void
  isLoading: boolean
  currentStep: number // 1: 開始健檢, 2: 網頁探索, 3: 演算法診斷, 4: 完成管理
}

const STEPS = [
  { id: 1, label: '開始健檢', desc: '校驗網址與安全防禦' },
  { id: 2, label: '網頁探索', desc: '爬取首頁與代表文章' },
  { id: 3, label: '演算法診斷', desc: 'SEO/GEO/AIO 深度運算' },
  { id: 4, label: '完成管理', desc: '產出結構化健康報表' }
]

export const SearchControlBar: React.FC<SearchControlBarProps> = ({
  url,
  setUrl,
  isSiteWide,
  setIsSiteWide,
  onStartDiagnose,
  isLoading,
  currentStep
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return
    onStartDiagnose()
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 輸入列與按鈕 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="請輸入欲健檢的網站網址 (例如：https://example.com)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>分析運算中...</span>
              </>
            ) : (
              <>
                <span>🚀 開始健檢</span>
              </>
            )}
          </button>
        </div>

        {/* 分析範圍選項切換 */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
          <span className="font-medium text-slate-500">分析範疇：</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={!isSiteWide}
              onChange={() => setIsSiteWide(false)}
              disabled={isLoading}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
              單頁專項深度診斷
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="scope"
              checked={isSiteWide}
              onChange={() => setIsSiteWide(true)}
              disabled={isLoading}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1 font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              全站抽樣深度健檢 (自動抽樣 5 篇代表文章)
            </span>
          </label>
        </div>
      </form>

      {/* 4 步驟即時進度條與流光效果 */}
      {isLoading && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-blue-600 transition-all duration-500 relative"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            >
              {/* 動態流光脈衝 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map(step => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              return (
                <div
                  key={step.id}
                  className={`flex flex-col rounded-lg p-2.5 transition-colors ${
                    isCurrent
                      ? 'bg-blue-50/80 border border-blue-200/80'
                      : isCompleted
                      ? 'bg-slate-50/60 border border-slate-100'
                      : 'opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600 font-mono">
                        {step.id}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">{step.desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
