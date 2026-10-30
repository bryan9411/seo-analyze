'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import type { DiagnosticReport } from '@/types/seo'
import type { HistoryEntry } from '@/lib/history'
import { ReportHeader } from './ReportHeader'
import { ScoreCards } from './ScoreCards'
import { TopIssues } from './TopIssues'
import { IssueList } from './IssueList'
import { ShareDialog } from './ShareDialog'

// 報告下半部延後載入 (recharts 體積較大)
const SectionSkeleton = () => <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
const ChartsSection = dynamic(() => import('@/components/ChartsSection').then(m => m.ChartsSection), { ssr: false, loading: SectionSkeleton })
const SampleArticlesTable = dynamic(() => import('@/components/SampleArticlesTable').then(m => m.SampleArticlesTable), { loading: SectionSkeleton })
const PriorityCodeSnippet = dynamic(() => import('@/components/PriorityCodeSnippet').then(m => m.PriorityCodeSnippet), { loading: SectionSkeleton })
const DiagnosticTabs = dynamic(() => import('@/components/DiagnosticTabs').then(m => m.DiagnosticTabs), { loading: SectionSkeleton })
const InsightsPanel = dynamic(() => import('@/components/insights/InsightsPanel').then(m => m.InsightsPanel), { ssr: false, loading: SectionSkeleton })

/** 報告各區塊的錨點，側欄導覽使用 */
export const REPORT_SECTIONS = [
  { id: 'overview', label: '總覽' },
  { id: 'issues', label: '問題清單' },
  { id: 'tools', label: '預覽與產生器' },
  { id: 'analysis', label: '深度分析' },
  { id: 'pages', label: '抽樣明細' }
] as const

export const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

interface ReportViewProps {
  report: DiagnosticReport
  previous?: HistoryEntry
  readOnly?: boolean
  isLoading?: boolean
  onRerun?: () => void
}

const Section: React.FC<{ id: string, title: string, children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 space-y-3">
    <h2 className="text-sm font-semibold text-slate-500">{title}</h2>
    {children}
  </section>
)

export const ReportView: React.FC<ReportViewProps> = ({ report, previous, readOnly, isLoading, onRerun }) => {
  const [sharing, setSharing] = useState(false)
  const snippet = report.sections.improvementSection.items.find(item => item.codeSnippet)?.codeSnippet

  return (
    <div className="space-y-8">
      <section id="overview" className="scroll-mt-24 space-y-4">
        <ReportHeader
          report={report}
          readOnly={readOnly}
          isLoading={isLoading}
          onRerun={onRerun}
          onShare={() => setSharing(true)}
        />
        {previous && previous.rulesVersion !== report.rulesVersion && (
          <p className="text-xs text-amber-700">與上次檢測之間規則已更新，分數變化可能不完全可比。</p>
        )}
        <ScoreCards scores={report.scores} previous={previous?.scores} />
        <TopIssues report={report} previous={previous} onShowAll={() => scrollToSection('issues')} />
        <ChartsSection complianceMetrics={report.complianceMetrics} factDensity={report.factDensity} />
      </section>

      <Section id="issues" title="問題清單">
        <IssueList report={report} />
      </Section>

      <Section id="tools" title="預覽與產生器">
        <InsightsPanel report={report} />
      </Section>

      <Section id="analysis" title="深度分析">
        <DiagnosticTabs sections={report.sections} robotsTxt={report.robotsTxt} />
        <PriorityCodeSnippet codeSnippet={snippet} />
      </Section>

      <Section id="pages" title="抽樣明細">
        <SampleArticlesTable allPages={report.allPages} isSiteWide={report.isSiteWide} />
      </Section>

      {sharing && <ShareDialog report={report} onClose={() => setSharing(false)} />}
    </div>
  )
}
