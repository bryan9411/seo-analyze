'use client'

import React, { useEffect, useState } from 'react'
import { LayoutDashboard, ListChecks, Eye, FileSearch, Files, Swords, History, X } from 'lucide-react'
import type { HistoryEntry } from '@/lib/history'
import { REPORT_SECTIONS, scrollToSection } from '@/components/report/ReportView'

export type AppView = 'report' | 'pk'

interface SidebarProps {
  view: AppView
  onViewChange: (view: AppView) => void
  hasReport: boolean
  history: HistoryEntry[]
  onPickHistory: (entry: HistoryEntry) => void
  onRemoveHistory: (url: string) => void
  onClearHistory: () => void
}

const ICONS: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  issues: ListChecks,
  tools: Eye,
  analysis: FileSearch,
  pages: Files
}

/** 桌機為左側固定導覽，手機改為頂部可橫向捲動的列 */
export const Sidebar: React.FC<SidebarProps> = ({ view, onViewChange, hasReport, history, onPickHistory, onRemoveHistory, onClearHistory }) => {
  const [active, setActive] = useState<string>('overview')

  // 依捲動位置標示目前所在區塊
  useEffect(() => {
    if (view !== 'report' || !hasReport) return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -60% 0px' }
    )
    REPORT_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [view, hasReport])

  const item = (isActive: boolean) =>
    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer whitespace-nowrap ${
      isActive ? 'bg-white text-slate-900 font-medium shadow-xs ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-200/60'
    }`

  return (
    <nav aria-label="報告導覽" className="no-print">
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {hasReport && REPORT_SECTIONS.map(s => {
          const Icon = ICONS[s.id]
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onViewChange('report')
                setActive(s.id)
                requestAnimationFrame(() => scrollToSection(s.id))
              }}
              className={item(view === 'report' && active === s.id)}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          )
        })}
        {hasReport && <div className="mx-1 hidden h-px bg-slate-200 lg:my-2 lg:block" />}
        <button type="button" onClick={() => onViewChange('pk')} className={item(view === 'pk')}>
          <Swords className="h-4 w-4" />
          競品 PK
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-6 hidden lg:block">
          <div className="mb-1.5 flex items-center justify-between px-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <History className="h-3.5 w-3.5" />
              最近檢測
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm('確定要清除所有最近檢測紀錄？')) onClearHistory()
              }}
              className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
            >
              全部清除
            </button>
          </div>
          <ul className="space-y-0.5">
            {history.slice(0, 8).map(entry => {
              let label = entry.url
              try {
                const u = new URL(entry.url)
                label = `${u.hostname.replace(/^www\./, '')}${u.pathname === '/' ? '' : decodeURI(u.pathname)}`
              } catch {
                // 保留原網址
              }
              return (
                <li key={entry.url} className="group relative">
                  <button
                    type="button"
                    onClick={() => onPickHistory(entry)}
                    className="flex w-full items-center justify-between gap-2 rounded-md py-1.5 pl-3 pr-8 text-left text-xs text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                    title={`${entry.url}\n${new Date(entry.timestamp).toLocaleString('zh-TW')}`}
                  >
                    <span className="truncate">{label}</span>
                    <span className="shrink-0 tabular-nums font-medium text-slate-900">{entry.scores.overall}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveHistory(entry.url)}
                    aria-label={`刪除 ${label} 的紀錄`}
                    title="刪除這筆紀錄"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 opacity-0 hover:bg-slate-300/60 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
          {history.length > 8 && <p className="mt-1 px-3 text-xs text-slate-400">只顯示最近 8 筆，共 {history.length} 筆</p>}
        </div>
      )}
    </nav>
  )
}
