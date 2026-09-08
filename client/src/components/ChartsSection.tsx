'use client'

import React, { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'
import type { ComplianceMetric, FactDensityMetrics } from '@/types/seo'

interface ChartsSectionProps {
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
}

const DONUT_COLORS = ['#2563EB', '#F59E0B'] // 事實數據, 宣傳詞

const METRIC_COLORS = [
  '#2563EB', // Title
  '#0D9488', // Meta
  '#6366F1', // H1
  '#D97706', // Schema
  '#E11D48', // 佐證與數據
  '#7C3AED'  // AIO 問答
]

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  complianceMetrics,
  factDensity
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false)

  const donutData = [
    { name: '客觀事實數據', value: factDensity.factualPercent, count: factDensity.factualCount },
    { name: '行銷宣傳詞', value: factDensity.fluffPercent, count: factDensity.fluffCount }
  ]

  const fluffList = factDensity.sampleFluff || []
  const topFluff = fluffList.slice(0, 6)

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* 內容事實密度 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            內容事實密度 (數據{factDensity.factualPercent}% vs 宣傳詞{factDensity.fluffPercent}%)
          </h3>
          {fluffList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetailModal(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              <span>查看宣傳詞明細</span>
            </button>
          )}
        </div>

        <div className="h-56 w-full relative flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {donutData.map((_, index) => (
                  <Cell key={`donut-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
                        <p className="font-semibold text-slate-900">{data.name}</p>
                        <p className="text-slate-600">佔比: <span className="font-mono font-bold text-slate-900">{data.value}%</span></p>
                        <p className="text-slate-400">計數: {data.count} 處</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 圓心文字 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {factDensity.factualPercent}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">事實密度</span>
          </div>
        </div>

        {/* 宣傳形容詞清單 */}
        <div className="border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700">
              宣傳形容詞檢測：
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              共 {factDensity.fluffCount} 處
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-h-7">
            {fluffList.length > 0 ? (
              <>
                {topFluff.map((item, idx) => (
                  <span
                    key={`fluff-pill-${idx}`}
                    className="inline-flex items-center rounded bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 border border-amber-200 shadow-2xs"
                  >
                    {item.word}
                    <span className="ml-1 font-mono font-bold text-amber-700">×{item.count}</span>
                  </span>
                ))}
                {fluffList.length > topFluff.length && (
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(true)}
                    className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    +{fluffList.length - topFluff.length} 項...
                  </button>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                未檢測出商業誇飾宣傳詞，內容客觀嚴謹
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 關鍵指標達成率 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            關鍵指標達成率
          </h3>
        </div>

        <div className="h-64 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={complianceMetrics}
              margin={{ top: 24, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ComplianceMetric
                    return (
                      <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow-md">
                        <p className="font-semibold text-slate-900">{data.name}</p>
                        <p className="text-slate-600">達成率: <span className="font-mono font-bold text-blue-600">{data.rate}%</span></p>
                        <p className="text-slate-400">標準基準: {data.benchmark}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="rate"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {complianceMetrics.map((_, idx) => (
                  <Cell
                    key={`bar-cell-${idx}`}
                    fill={METRIC_COLORS[idx % METRIC_COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="rate"
                  position="top"
                  formatter={(val: any) => `${val ?? 0}%`}
                  style={{ fill: '#334155', fontSize: '11px', fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 圖例標籤 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-600 text-center">
          {complianceMetrics.map((item, idx) => (
            <div key={`legend-${idx}`} className="flex items-center justify-center gap-1 truncate">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: METRIC_COLORS[idx % METRIC_COLORS.length] }}
              />
              <span className="truncate">{item.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 宣傳詞明細彈窗 */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  宣傳形容詞完整檢測清單（共 {factDensity.fluffCount} 處）
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
              <p className="text-slate-500 text-xs leading-relaxed">
                以下為受測頁面中所偵測到的主觀商業行銷誇飾與空泛形容詞。生成式 AI 答案引擎（ChatGPT Search / Perplexity / Claude / Gemini）在整理答案時傾向過濾此類詞彙：
              </p>

              <div className="rounded-lg bg-amber-50/60 p-3.5 border border-amber-200/80">
                {fluffList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {fluffList.map((item, idx) => (
                      <span
                        key={`modal-fluff-${idx}`}
                        className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-200 shadow-2xs"
                      >
                        <span>{item.word}</span>
                        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800">
                          {item.count} 次
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-emerald-700 font-medium">
                    本頁未偵測到任何商業誇飾詞彙。
                  </p>
                )}
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-slate-600 border border-slate-200/80 text-[11px] leading-relaxed">
                <span className="font-semibold text-slate-800">💡 優化建議：</span>
                建議將主觀宣傳詞（例如「第一首選」、「最頂級」）替換為客觀數據（如「獲得 2025 年認證」、「通過 SGS 檢驗」），以大幅提高被 AI 引用為權威答案的機率。
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                關閉清單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
