'use client'

import React, { useState } from 'react'
import { Eye, Bot, ListTree, Gauge, FileCode2 } from 'lucide-react'
import type { DiagnosticReport } from '@/types/seo'
import { SerpPreview } from './SerpPreview'
import { AiTextView } from './AiTextView'
import { HeadingTree } from './HeadingTree'
import { PayloadPanel } from './PayloadPanel'
import { GeneratorsPanel } from './GeneratorsPanel'

type TabId = 'serp' | 'ai' | 'headings' | 'payload' | 'generators'

interface InsightsPanelProps {
  report: DiagnosticReport
}

/**
 * 頁面明細與工具：SERP / 社群預覽、AI 純文字視角、標題大綱、體積效能、檔案產生器
 */
export const InsightsPanel: React.FC<InsightsPanelProps> = ({ report }) => {
  const [active, setActive] = useState<TabId>('serp')
  const page = report.primaryAnalysis

  const tabs: Array<{ id: TabId, label: string, icon: React.ElementType, alert?: boolean }> = [
    { id: 'serp', label: '搜尋與分享預覽', icon: Eye, alert: !page.ogImage },
    { id: 'ai', label: 'AI 純文字視角', icon: Bot, alert: page.isLikelyCsr || !page.directAnswerSnippetFound },
    { id: 'headings', label: '標題大綱', icon: ListTree, alert: page.h1List.length !== 1 || page.headingSkipCount > 0 },
    { id: 'payload', label: '圖片與效能', icon: Gauge, alert: page.missingAltCount > 0 || page.base64ImageCount > 0 },
    { id: 'generators', label: '索引檔與產生器', icon: FileCode2, alert: !report.discovery.llmsTxt.exists || Boolean(report.generated.faqJsonLd || report.generated.localBusinessJsonLd) }
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs" aria-label="頁面明細與工具">
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/60 p-2" role="tablist">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium cursor-pointer ${
                isActive ? 'border border-slate-200 bg-white text-slate-900 shadow-xs' : 'border border-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
              {tab.alert && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="有待改善項目" />}
            </button>
          )
        })}
      </div>
      <div className="p-5 sm:p-6" role="tabpanel">
        {active === 'serp' && <SerpPreview page={page} limits={report.serpLimits} />}
        {active === 'ai' && <AiTextView page={page} />}
        {active === 'headings' && <HeadingTree page={page} />}
        {active === 'payload' && <PayloadPanel page={page} />}
        {active === 'generators' && (
          <GeneratorsPanel
            page={page}
            discovery={report.discovery}
            robotsTxt={report.robotsTxt}
            generated={report.generated}
            phones={report.totalPhones}
            addresses={report.totalAddresses}
          />
        )}
      </div>
    </section>
  )
}
