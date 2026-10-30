'use client'

import React from 'react'
import { CheckCircle2, XCircle, MapPin, Phone } from 'lucide-react'
import type { DiscoveryReport, GeneratedAssets, RobotsTxtReport, SinglePageAnalysis } from '@/types/seo'
import { CodeBlock } from '@/components/CodeBlock'

interface GeneratorsPanelProps {
  page: SinglePageAnalysis
  discovery: DiscoveryReport
  robotsTxt?: RobotsTxtReport
  generated: GeneratedAssets
  phones: string[]
  addresses: string[]
}

const StatusRow: React.FC<{ ok: boolean, label: string, url: string, note?: string }> = ({ ok, label, url, note }) => (
  <li className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
    {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
    <div className="min-w-0">
      <div className="font-medium text-slate-900">{label}：{ok ? '已提供' : '未提供'}</div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-slate-500 hover:text-blue-600">{url}</a>
      {note && <div className="mt-0.5 text-xs text-slate-500">{note}</div>}
    </div>
  </li>
)

export const GeneratorsPanel: React.FC<GeneratorsPanelProps> = ({ page, discovery, robotsTxt, generated, phones, addresses }) => (
  <div className="space-y-6">
    <section>
      <h4 className="mb-2 text-sm font-semibold text-slate-900">索引與爬蟲檔案</h4>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <StatusRow
          ok={Boolean(robotsTxt?.fetched)}
          label="robots.txt"
          url={robotsTxt?.url || ''}
          note={robotsTxt ? (robotsTxt.allAiAllowed ? 'AI 爬蟲皆可存取' : `${robotsTxt.blockedBotsCount} 組 AI 爬蟲被阻擋`) : undefined}
        />
        <StatusRow
          ok={discovery.sitemap.exists}
          label="sitemap.xml"
          url={discovery.sitemap.url}
          note={discovery.sitemap.source === 'robots' ? '由 robots.txt 宣告' : undefined}
        />
        <StatusRow ok={discovery.llmsTxt.exists} label="llms.txt" url={discovery.llmsTxt.url} note="新興提案格式，非強制" />
      </ul>
      {!discovery.checked && <p className="mt-2 text-xs text-amber-700">索引檔探測逾時，以上結果僅供參考。</p>}
    </section>

    <section className="space-y-2">
      <CodeBlock
        title={discovery.llmsTxt.exists ? 'llms.txt 參考版本 (網站已有 llms.txt，可比對補充)' : '一鍵產生 llms.txt'}
        code={generated.llmsTxt}
        downloadName="llms.txt"
      />
      <p className="text-xs text-slate-500">依主頁與抽樣頁的標題、摘要自動組成，請上傳至網站根目錄 (/llms.txt) 前確認內容。</p>
    </section>

    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-900">FAQPage 結構化資料</h4>
      {page.hasFaqSchema ? (
        <p className="text-sm text-emerald-700">本頁已配置 FAQPage ({page.faqQuestionsCount} 組問答)。</p>
      ) : generated.faqJsonLd ? (
        <>
          <p className="text-sm text-slate-600">從內文 {page.faqCandidates.length} 個問句標題與下方段落擷取，內容 100% 取自原文：</p>
          <CodeBlock code={generated.faqJsonLd} />
        </>
      ) : (
        <p className="text-sm text-slate-500">內文沒有找到問句型的 H2 / H3 標題，無法自動產生。可將段落標題改寫成「…如何？」「…多少錢？」等問句。</p>
      )}
    </section>

    <section className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-900">在地商家資訊 (NAP)</h4>
      {phones.length === 0 && addresses.length === 0 ? (
        <p className="text-sm text-slate-500">未偵測到台灣電話或地址。</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            {phones.map(p => (
              <span key={p} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <Phone className="h-3.5 w-3.5" />{p}
              </span>
            ))}
            {addresses.map(a => (
              <span key={a} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <MapPin className="h-3.5 w-3.5" />{a}
              </span>
            ))}
          </div>
          {page.hasLocalBusinessSchema ? (
            <p className="text-sm text-emerald-700">本頁已配置 LocalBusiness 結構化資料。</p>
          ) : generated.localBusinessJsonLd ? (
            <CodeBlock title="LocalBusiness JSON-LD 範本" code={generated.localBusinessJsonLd} />
          ) : null}
        </>
      )}
    </section>
  </div>
)
