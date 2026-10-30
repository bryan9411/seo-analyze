'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import type { AuditSampleItem } from '@/types/seo'

interface SampleArticlesTableProps {
  allPages: AuditSampleItem[]
  isSiteWide: boolean
}

const scoreStyle = (score: number) =>
  score >= 70
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : score >= 40
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200'

export const SampleArticlesTable: React.FC<SampleArticlesTableProps> = ({
  allPages,
  isSiteWide
}) => {
  const pages = allPages && allPages.length > 0 ? allPages : []

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">抽查檢驗清單</h3>
        <span className="text-xs text-slate-400 font-medium">
          共 {pages.length} 篇抽查頁面
        </span>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[260px] rounded-lg border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">URL</th>
              <th className="py-2.5 px-3 w-28 text-center">單頁分數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((page) => {
              let decodedUrl = page.url
              try {
                decodedUrl = decodeURI(page.url)
              } catch {}

              return (
                <tr key={`${page.no}-${page.url}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-600 max-w-sm truncate font-mono text-xs"
                      title={decodedUrl}
                    >
                      <span className="truncate">{decodedUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
                    </a>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreStyle(page.score)}`}
                      title={`${page.issueCount} 個中高優先問題`}
                    >
                      {page.score}
                      <span className="font-normal opacity-70">· {page.issueCount} 項</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {isSiteWide ? '已自動抽檢主頁及站內具代表性之文章路徑' : '單頁專項深度診斷抽查'}
      </div>
    </div>
  )
}
