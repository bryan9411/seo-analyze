'use client'

import React from 'react'
import { Search, Loader2, Globe, FileSpreadsheet } from 'lucide-react'

interface NavbarProps {
  url: string
  setUrl: (url: string) => void
  isSiteWide: boolean
  setIsSiteWide: (val: boolean) => void
  onStartDiagnose: () => void
  isLoading: boolean
  /** 首頁已有大型輸入框時隱藏頂部搜尋列 */
  showSearch?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  url,
  setUrl,
  isSiteWide,
  setIsSiteWide,
  onStartDiagnose,
  isLoading,
  showSearch = true
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return
    onStartDiagnose()
  }

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:py-0 lg:px-8">
        <span className="shrink-0 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          SEO · GEO · AEO <span className="hidden font-medium text-slate-500 sm:inline">網頁健檢</span>
        </span>

        {showSearch && <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 lg:max-w-2xl lg:flex-1">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="輸入網址，例如 https://example.com"
              aria-label="欲檢測的網址"
              className="w-full rounded-md border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsSiteWide(!isSiteWide)}
            disabled={isLoading}
            title={isSiteWide ? '切換為單頁診斷' : '切換為全站抽樣'}
            aria-label={isSiteWide ? '目前為全站抽樣，點擊切換為單頁診斷' : '目前為單頁診斷，點擊切換為全站抽樣'}
            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-2 text-sm font-medium cursor-pointer ${isSiteWide
              ? 'border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100/60'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
          >
            {isSiteWide ? <Globe className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSiteWide ? '全站抽樣' : '單頁診斷'}</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? '分析中' : '開始健檢'}
          </button>
        </form>}
      </div>
    </header>
  )
}
