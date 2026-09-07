'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, ExternalLink, Globe } from 'lucide-react'
import type { AuditSampleItem } from '@/types/seo'

interface SampleArticlesTableProps {
  allPages: AuditSampleItem[]
  isSiteWide: boolean
}

export const SampleArticlesTable: React.FC<SampleArticlesTableProps> = ({
  allPages,
  isSiteWide
}) => {
  if (!allPages || allPages.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              抽查檢驗之頁面清單 (Audit Sample List)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSiteWide
                ? '系統已自動抽查並深入分析主頁與 5 篇代表性文章頁面架構'
                : '本次為單頁專項深度診斷模式'}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-600 border border-slate-200">
          共檢驗 {allPages.length} 篇頁面
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-medium border-y border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">序號</th>
              <th className="py-2.5 px-3 w-36">頁面類別</th>
              <th className="py-2.5 px-3">網頁標題 (Title)</th>
              <th className="py-2.5 px-3 w-1/3">完整檢驗網址 (URL)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allPages.map(page => {
              const isPrimary = page.no === 0
              let decodedUrl = page.url
              try {
                decodedUrl = decodeURI(page.url)
              } catch {}

              return (
                <tr
                  key={`${page.no}-${page.url}`}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    isPrimary ? 'bg-blue-50/20 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {page.no}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        isPrimary
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isPrimary && <Globe className="h-3 w-3" />}
                      {page.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-800 line-clamp-1">
                    {page.title || '（未明確定義標題）'}
                  </td>
                  <td className="py-3 px-3">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline max-w-xs truncate"
                      title={decodedUrl}
                    >
                      <span className="truncate font-mono">{decodedUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
