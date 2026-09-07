'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import type { ComplianceMetric, FactDensityMetrics } from '@/types/seo'

interface ChartsSectionProps {
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
}

const FACT_COLORS = ['#10B981', '#F43F5E']

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  complianceMetrics,
  factDensity
}) => {
  // 圓環圖資料組裝
  const donutData = [
    { name: `客觀數據 (${factDensity.factualPercent}%)`, value: factDensity.factualPercent, count: factDensity.factualCount },
    { name: `宣傳行銷詞 (${factDensity.fluffPercent}%)`, value: factDensity.fluffPercent, count: factDensity.fluffCount }
  ]

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* 1. 柱狀圖：關鍵指標達標率 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-7 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">關鍵指標達標率分析</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">基準值: 80%~90%</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            檢測 Title、Meta、H1、Schema、在地 NAP 與 FAQ 問答之架構合規比例
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={complianceMetrics}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickFormatter={val => `${val}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ComplianceMetric
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
                        <p className="text-slate-600">達標率: <span className="font-mono font-bold text-blue-600">{data.rate}%</span></p>
                        <p className="text-slate-400">行業基準: {data.benchmark}%</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="rate"
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {complianceMetrics.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.rate >= 70 ? '#2563EB' : entry.rate >= 40 ? '#F59E0B' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span>合規良好 (≥70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>需加強 (40%~69%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>缺失或嚴重不足 (&lt;40%)</span>
          </div>
        </div>
      </motion.div>

      {/* 2. 圓環圖：內容事實密度 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                <PieChartIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">內容事實密度 (Fact Density)</h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            AI 答案引擎極度偏好引用含客觀數值、規格之內容，主動過濾純行銷形容詞
          </p>
        </div>

        <div className="h-64 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {donutData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={FACT_COLORS[index % FACT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
                        <p className="text-slate-600">出現次數: <span className="font-mono font-bold text-slate-900">{data.count} 次</span></p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* 圓環中央文字 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center -translate-y-3">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {factDensity.factualPercent}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">客觀事實率</span>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 text-center">
          檢測到 <span className="font-semibold text-emerald-600">{factDensity.factualCount}</span> 處事實數據與 <span className="font-semibold text-rose-500">{factDensity.fluffCount}</span> 處商業誇飾宣傳詞
        </div>
      </motion.div>
    </div>
  )
}
