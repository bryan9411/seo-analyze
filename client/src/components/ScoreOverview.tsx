'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { DiagnosticScores } from '@/types/seo'

interface ScoreOverviewProps {
  scores: DiagnosticScores
}

/**
 * 數值滾動遞增動畫 Hook
 */
const useCountUp = (target: number, durationMs = 1200): number => {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1)
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

interface CircularGaugeProps {
  label: string
  score: number
  targetScore: number
  isHero?: boolean
  strokeColor: string
  bgTrackColor?: string
  labelColor?: string
  tagText?: string
  tagColor?: string
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  label,
  score,
  targetScore,
  isHero = false,
  strokeColor,
  bgTrackColor = 'text-slate-100',
  labelColor = 'text-slate-500',
  tagText,
  tagColor = 'text-amber-400'
}) => {
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (targetScore / 100) * circumference

  if (isHero) {
    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div
          className="relative flex items-center justify-center rounded-full bg-slate-900 shadow-sm"
          style={{ width: size, height: size }}
        >
          <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="text-slate-800"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={strokeColor}
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
          <div className="relative z-10 flex flex-col items-center justify-center text-center text-white">
            <span className="text-[11px] font-medium text-slate-300">{label}</span>
            <span className="text-2xl font-bold font-mono tracking-tight my-0.5">{score}分</span>
            {tagText && (
              <span className={`text-[10px] font-medium ${tagColor}`}>{tagText}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div
        className="relative flex items-center justify-center rounded-full bg-white shadow-2xs"
        style={{ width: size, height: size }}
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={bgTrackColor}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={strokeColor}
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
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className={`text-[11px] font-medium ${labelColor}`}>{label}</span>
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 my-0.5">
            {score}分
          </span>
          {tagText && (
            <span className={`text-[10px] font-medium ${tagColor}`}>{tagText}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export const ScoreOverview: React.FC<ScoreOverviewProps> = ({ scores }) => {
  const animatedOverall = useCountUp(scores.overall)
  const animatedSeo = useCountUp(scores.seo)
  const animatedGeo = useCountUp(scores.geo)
  const animatedAio = useCountUp(scores.aio)

  const getOverallTag = (score: number) => {
    if (score >= 70) return { text: '(良好)', color: 'text-emerald-400' }
    if (score >= 40) return { text: '(需優化)', color: 'text-amber-400' }
    return { text: '(警訊)', color: 'text-rose-400' }
  }

  const overallTag = getOverallTag(scores.overall)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">KPI</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 items-center justify-around">
        {/* 1. 綜合評分 - 經典深藍底搭配電光群青環 */}
        <CircularGauge
          label="綜合評分"
          score={animatedOverall}
          targetScore={scores.overall}
          isHero={true}
          strokeColor="text-blue-500"
          tagText={overallTag.text}
          tagColor={overallTag.color}
        />

        {/* 2. 傳統 SEO - 翡翠綠環 */}
        <CircularGauge
          label="傳統SEO"
          score={animatedSeo}
          targetScore={scores.seo}
          strokeColor="text-emerald-500"
          bgTrackColor="text-emerald-50"
          labelColor="text-emerald-800"
        />

        {/* 3. 在地 GEO - 暖琥珀橘環 */}
        <CircularGauge
          label="在地GEO"
          score={animatedGeo}
          targetScore={scores.geo}
          strokeColor="text-amber-500"
          bgTrackColor="text-amber-50"
          labelColor="text-amber-800"
        />

        {/* 4. AI 引擎 AIO - 紫羅蘭靛藍環 */}
        <CircularGauge
          label="AI引擎AIO"
          score={animatedAio}
          targetScore={scores.aio}
          strokeColor="text-violet-500"
          bgTrackColor="text-violet-50"
          labelColor="text-violet-800"
        />
      </div>
    </div>
  )
}
