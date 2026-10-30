'use client'

import React from 'react'
import {
  Search, Globe, FileSpreadsheet, Loader2, Sparkles, Bot, ListChecks,
  FileCode2, MapPin, Share2, Swords, ArrowRight, X
} from 'lucide-react'
import type { HistoryEntry } from '@/lib/history'

interface EmptyStateProps {
  url: string
  onUrlChange: (value: string) => void
  isSiteWide: boolean
  onToggleScope: (value: boolean) => void
  isLoading: boolean
  onSubmit: () => void
  onSample: (url: string) => void
  onOpenPk: () => void
  history: HistoryEntry[]
  onPickHistory: (entry: HistoryEntry) => void
  onRemoveHistory: (url: string) => void
}

const SAMPLES = [
  { name: '維基百科', url: 'https://zh.wikipedia.org' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  { name: 'GitHub', url: 'https://github.com' }
]

const DIMENSIONS = [
  {
    icon: ListChecks,
    title: '傳統 SEO',
    tone: 'bg-emerald-50 text-emerald-700',
    items: ['Title / Meta 長度與搜尋結果截斷', 'H1 與標題階層、圖片 alt', 'canonical、noindex、viewport', 'sitemap、HTML 體積與回應時間']
  },
  {
    icon: Bot,
    title: '生成式 GEO',
    tone: 'bg-amber-50 text-amber-700',
    items: ['ChatGPT、Perplexity、Claude 爬蟲權限', 'Article / Organization 結構化資料', '權威引用與量化數據', 'JavaScript 渲染導致 AI 看不到內容']
  },
  {
    icon: Sparkles,
    title: '解答引擎 AEO',
    tone: 'bg-violet-50 text-violet-700',
    items: ['首段是否直接給出答案', 'FAQ 問答標題與 FAQPage', '表格、清單等可擷取結構', '宣傳詞與事實數據比例']
  }
]

const OUTPUTS = [
  { icon: FileCode2, title: 'FAQ JSON-LD', desc: '從內文問句標題自動擷取' },
  { icon: MapPin, title: 'LocalBusiness', desc: '依偵測到的電話與地址產生' },
  { icon: Globe, title: 'llms.txt', desc: '一鍵產生並下載' },
  { icon: Share2, title: '分享與匯出', desc: '分享連結、Word、PDF、分數卡' }
]

/** 尚未檢測時的首頁：大型輸入框、檢查項目說明、可產出的檔案與最近紀錄 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  url, onUrlChange, isSiteWide, onToggleScope, isLoading, onSubmit, onSample, onOpenPk,
  history, onPickHistory, onRemoveHistory
}) => (
  <div className="space-y-6">
    {/* 主要輸入區 */}
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-8 sm:px-10 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">檢查網站在 Google 與 AI 搜尋中的表現</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
        免 API Key、純規則運算。輸入網址，約 5 秒取得 SEO、GEO、AEO 評分、優先修正清單，以及可直接貼上的結構化資料。
      </p>

      <form
        onSubmit={e => {
          e.preventDefault()
          if (url.trim() && !isLoading) onSubmit()
        }}
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={url}
            onChange={e => onUrlChange(e.target.value)}
            disabled={isLoading}
            placeholder="https://example.com"
            aria-label="欲檢測的網址"
            className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          開始健檢
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="radiogroup" aria-label="分析範疇">
          {[
            { value: true, label: '全站抽樣', icon: Globe },
            { value: false, label: '單頁診斷', icon: FileSpreadsheet }
          ].map(opt => (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={isSiteWide === opt.value}
              onClick={() => onToggleScope(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 cursor-pointer ${isSiteWide === opt.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-slate-400">首頁建議全站抽樣，文章網址會自動切換為單頁</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">試試看：</span>
        {SAMPLES.map(s => (
          <button
            key={s.url}
            type="button"
            onClick={() => onSample(s.url)}
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-blue-400 hover:text-blue-700 cursor-pointer"
          >
            {s.name}
          </button>
        ))}
      </div>
    </section>

    {/* 檢查項目 */}
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-500">會檢查什麼</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {DIMENSIONS.map(d => (
          <div key={d.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${d.tone}`}>
                <d.icon className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold text-slate-900">{d.title}</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {d.items.map(item => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    {/* 產出與競品 */}
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-semibold text-slate-500">檢測後可直接取得</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OUTPUTS.map(o => (
            <div key={o.title} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <o.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-900">{o.title}</div>
                <div className="text-sm text-slate-500">{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenPk}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-400 cursor-pointer"
      >
        <div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Swords className="h-4 w-4" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-slate-900">競品 PK</h2>
          <p className="mt-1 text-sm text-slate-500">輸入自家與對手的同類頁面，看對方贏在哪裡、補上後可追上幾分。</p>
        </div>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
          開始比較
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </section>

    {/* 手機版沒有側欄，最近檢測放在這裡 */}
    {history.length > 0 && (
      <section className="lg:hidden">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">最近檢測</h2>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {history.slice(0, 8).map(entry => (
            <li key={entry.url} className="flex items-center gap-2 pr-2">
              <button
                type="button"
                onClick={() => onPickHistory(entry)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer"
              >
                <span className="min-w-0 truncate text-sm text-slate-700">{entry.url}</span>
                <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">{entry.scores.overall}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveHistory(entry.url)}
                aria-label="刪除這筆紀錄"
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
)
