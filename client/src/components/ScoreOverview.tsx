'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Search, MapPin, Bot } from 'lucide-react'
import type { DiagnosticScores } from '@/types/seo'

interface ScoreOverviewProps {
  scores: DiagnosticScores
}

/**
 * 數值滾動遞增動畫 (Count-Up Hook)
 */
const useCountUp = (target: number, durationMs = 1200): number => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1)
      // Ease-out cubic formula
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [target, durationMs])

  return current
}

interface CircularProgressProps {
  score: number
  size?: number
  strokeWidth?: number
  colorClass: string
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  score,
  size = 64,
  strokeWidth = 6,
  colorClass
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
        {/* 背景灰底環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* 動態填補進度環 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
    </div>
  )
}

const getScoreGrade = (score: number) => {
  if (score >= 70) {
    return {
      badge: '🟢 良好',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ringColor: 'text-emerald-500'
    }
  }
  if (score >= 40) {
    return {
      badge: '🟡 需優化',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      ringColor: 'text-amber-500'
    }
  }
  return {
    badge: '🔴 嚴重警訊',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    ringColor: 'text-rose-500'
  }
}

export const ScoreOverview: React.FC<ScoreOverviewProps> = ({ scores }) => {
  const animatedOverall = useCountUp(scores.overall)
  const animatedSeo = useCountUp(scores.seo)
  const animatedGeo = useCountUp(scores.geo)
  const animatedAio = useCountUp(scores.aio)

  const cards = [
    {
      title: '全站綜合健康度',
      desc: '搜尋與 AI 檢索加權能見度',
      score: animatedOverall,
      targetScore: scores.overall,
      icon: ShieldCheck,
      iconColor: 'text-blue-600 bg-blue-50',
      ...getScoreGrade(scores.overall)
    },
    {
      title: '傳統 SEO 評分',
      desc: 'Google SERP、Title/Meta、E-E-A-T',
      score: animatedSeo,
      targetScore: scores.seo,
      icon: Search,
      iconColor: 'text-indigo-600 bg-indigo-50',
      ...getScoreGrade(scores.seo)
    },
    {
      title: 'GEO 在地化評分',
      desc: 'Schema.org、Google Maps 與 NAP 實體',
      score: animatedGeo,
      targetScore: scores.geo,
      icon: MapPin,
      iconColor: 'text-orange-600 bg-orange-50',
      ...getScoreGrade(scores.geo)
    },
    {
      title: 'AIO 答案引擎評分',
      desc: 'AI Facts 資訊密度、表格與 FAQ 問答',
      score: animatedAio,
      targetScore: scores.aio,
      icon: Bot,
      iconColor: 'text-purple-600 bg-purple-50',
      ...getScoreGrade(scores.aio)
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${item.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
                  {item.score}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 100</span>
              </div>

              <CircularProgress
                score={item.targetScore}
                size={44}
                strokeWidth={5}
                colorClass={item.ringColor}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
