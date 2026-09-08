'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  Bot,
  Wrench,
  AlertTriangle,
  Copy,
  Check,
  Code2,
  TableProperties,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import type { StructuredSections, RobotsTxtReport } from '@/types/seo'

interface DiagnosticTabsProps {
  sections: StructuredSections
  robotsTxt?: RobotsTxtReport
}

type TabType = 'seo' | 'geo' | 'aio' | 'improvements'

export const DiagnosticTabs: React.FC<DiagnosticTabsProps> = ({ sections, robotsTxt }) => {
  const [activeTab, setActiveTab] = useState<TabType>('seo')
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null)

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippetId(id)
    setTimeout(() => {
      setCopiedSnippetId(null)
    }, 2000)
  }

  const { seoSection, geoSection, aioSection, improvementSection } = sections

  const tabs = [
    {
      id: 'seo' as TabType,
      label: '📋 傳統 SEO 診斷',
      icon: Search,
      badge: `${seoSection.painPoints.length} 項致命傷`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      id: 'geo' as TabType,
      label: '🚀 生成式 GEO 診斷',
      icon: Sparkles,
      badge: `${geoSection.painPoints.length} 項優化弱點`,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'aio' as TabType,
      label: '🤖 Google AIO 診斷',
      icon: Bot,
      badge: `${aioSection.painPoints.length} 項忽視痛點`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'improvements' as TabType,
      label: '🛠️ 優先改善建議方案',
      icon: Wrench,
      badge: `${improvementSection.items.length} 大執行計畫`,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ]

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* 頁籤切換 */}
      <div className="flex border-b border-slate-200/80 bg-slate-50/50 p-2 overflow-x-auto gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${tab.badgeColor}`}>
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* 頁籤內容 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* 傳統 SEO */}
          {activeTab === 'seo' && (
            <motion.div
              key="seo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">標題與描述 (Title / Meta 分析)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {seoSection.titleMetaAnalysis}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">內容品質與結構 (E-E-A-T 權威度分析)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {seoSection.eeatAnalysis}
                </div>
              </div>

              {/* 痛點 / 優勢列表 */}
              {seoSection.painPoints.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    痛點診斷：導致傳統 Google 排名低迷的致命傷
                  </h3>
                  {seoSection.painPoints.map((point, index) => (
                    <div
                      key={`seo-pain-${index}`}
                      className="rounded-r-xl border border-rose-200/80 border-l-4 border-l-rose-500 bg-rose-50/60 p-4 text-xs text-rose-950 leading-relaxed shadow-xs whitespace-pre-line"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>優勢診斷：</strong>傳統 SEO 基礎架構健全，Title、Meta 與標題階層未檢測到重大致命傷。</span>
                </div>
              )}
            </motion.div>
          )}

          {/* 生成式 GEO */}
          {activeTab === 'geo' && (
            <motion.div
              key="geo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* AI 爬蟲檢核 (robots.txt) */}
              {robotsTxt && (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">主流 AI 搜尋引擎爬蟲授權矩陣 (robots.txt 檢核)</h4>
                        <p className="text-[11px] text-slate-500">
                          針對 ChatGPT、Perplexity、Claude 與 Google AI 即時爬蟲通行權限檢測
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {robotsTxt.allAiAllowed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          AI 爬蟲全面暢通 (All Allowed)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 shadow-2xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          {robotsTxt.blockedBotsCount} 組 AI 爬蟲受阻 (Blocked)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 爬蟲清單 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {robotsTxt.crawlers.map((crawler) => {
                      const isBlocked = crawler.status === 'blocked'
                      return (
                        <div
                          key={crawler.crawlerId}
                          className={`rounded-lg p-3 border text-xs transition-all ${
                            isBlocked
                              ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                              : 'bg-white border-slate-200/80 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-indigo-600">{crawler.engine}</span>
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isBlocked
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isBlocked ? '🚫 阻擋禁行' : '🟢 允許存取'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mb-1">
                            User-agent: <strong className="text-slate-700">{crawler.userAgent}</strong>
                          </div>
                          <div className="text-[11px] text-slate-600 leading-snug">
                            {crawler.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-2 border-t border-slate-200/50">
                    <span>檢測端點：<code className="text-slate-600 font-mono">{robotsTxt.url}</code></span>
                    <span>{robotsTxt.fetched ? '已成功抓取並依標準規則解析' : '未配置 robots.txt（預設全網公開允許）'}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Schema 實體圖譜 (Article / Organization 關聯)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {geoSection.schemaAnalysis}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">生成式引擎優化指標 (Princeton GEO: 權威佐證、數據事實、直球解答)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {geoSection.geoEntityAnalysis}
                </div>
              </div>

              {/* 痛點 / 優勢列表 */}
              {geoSection.painPoints.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    痛點診斷：ChatGPT、Perplexity、Claude、Gemini 難以主動引用推薦的核心弱點
                  </h3>
                  {geoSection.painPoints.map((point, index) => (
                    <div
                      key={`geo-pain-${index}`}
                      className="rounded-r-xl border border-amber-200/80 border-l-4 border-l-amber-500 bg-amber-50/60 p-4 text-xs text-amber-950 leading-relaxed shadow-xs whitespace-pre-line"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>優勢診斷：</strong>生成式 GEO 訊號完備，未檢測到阻礙 AI 引用之核心弱點。</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Google AIO */}
          {activeTab === 'aio' && (
            <motion.div
              key="aio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">資訊密度與結構 (清單、表格、廢話形容詞密度)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {aioSection.infoDensityAnalysis}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">問答契合度 (FAQ 口語長尾問答)</h3>
                <div className="rounded-lg bg-slate-50/80 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-line">
                  {aioSection.qaRelevanceAnalysis}
                </div>
              </div>

              {/* 痛點 / 優勢列表 */}
              {aioSection.painPoints.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-purple-600" />
                    痛點診斷：Google AI Overviews 難以提取為頂部答案的核心原因
                  </h3>
                  {aioSection.painPoints.map((point, index) => (
                    <div
                      key={`aio-pain-${index}`}
                      className="rounded-r-xl border border-purple-200/80 border-l-4 border-l-purple-500 bg-purple-50/60 p-4 text-xs text-purple-950 leading-relaxed shadow-xs whitespace-pre-line"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-950 leading-relaxed flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>優勢診斷：</strong>Google AIO 結構良好，具備高引用潛力，未檢測到阻礙 AI 擷取之重大結構痛點。</span>
                </div>
              )}
            </motion.div>
          )}

          {/* 改善建議方案 */}
          {activeTab === 'improvements' && (
            <motion.div
              key="improvements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {improvementSection.items.map(item => (
                <div
                  key={`imp-${item.order}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/30 p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      建議 {item.order}: {item.title}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                      預期 ROI: {item.roi}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* 標題與語意前後對照表 */}
                  {item.comparison && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <div className="bg-slate-100/80 px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200 flex items-center gap-1.5">
                        <TableProperties className="h-3.5 w-3.5 text-slate-500" />
                        Before / After 標題與語意標籤改造對照表
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                              <th className="py-2.5 px-3 w-24">維度</th>
                              <th className="py-2.5 px-3 w-1/2">改善前 (現狀)</th>
                              <th className="py-2.5 px-3 w-1/2">建議改善後 (優化方案)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="py-3 px-3 font-semibold text-slate-700">Title 標題</td>
                              <td className="py-3 px-3 text-rose-700 bg-rose-50/30">
                                {item.comparison.beforeTitle}
                              </td>
                              <td className="py-3 px-3 text-emerald-800 font-medium bg-emerald-50/30">
                                {item.comparison.afterTitle}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 font-semibold text-slate-700">Meta 描述</td>
                              <td className="py-3 px-3 text-rose-700 bg-rose-50/30">
                                {item.comparison.beforeMeta}
                              </td>
                              <td className="py-3 px-3 text-emerald-800 bg-emerald-50/30">
                                {item.comparison.afterMeta}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-3 font-semibold text-slate-700">H1 主標題</td>
                              <td className="py-3 px-3 text-rose-700 bg-rose-50/30">
                                {item.comparison.beforeH1}
                              </td>
                              <td className="py-3 px-3 text-emerald-800 font-medium bg-emerald-50/30">
                                {item.comparison.afterH1}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 程式碼範本 */}
                  {item.codeSnippet && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Code2 className="h-3.5 w-3.5 text-blue-600" />
                          推薦植入程式碼代碼塊：
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.codeSnippet!, `code-${item.order}`)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          {copiedSnippetId === `code-${item.order}` ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">已複製！</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>📋 複製代碼</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-[11px] font-mono leading-relaxed text-slate-200 border border-slate-800">
                        <code>{item.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
