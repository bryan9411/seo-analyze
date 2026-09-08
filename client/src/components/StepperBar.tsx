'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface StepperBarProps {
  currentStep: number
  isLoading: boolean
}

const STEPS = [
  { id: 1, label: '開始健檢' },
  { id: 2, label: '網頁爬取' },
  { id: 3, label: '指標健檢' },
  { id: 4, label: '完成健檢' }
]

export const StepperBar: React.FC<StepperBarProps> = ({ currentStep, isLoading }) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-8 right-8 top-4 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute left-8 top-4 -translate-y-1/2 h-0.5 bg-blue-600 z-0 transition-all duration-500 ease-out"
          style={{
            width: `calc(${((Math.min(currentStep, 4) - 1) / (STEPS.length - 1)) * 100}% - 3rem)`
          }}
        />

        {STEPS.map((step) => {
          const isDone = currentStep > step.id
          const isCurrent = currentStep === step.id

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className="text-[11px] font-medium text-slate-400 mb-1.5 font-mono">
                Step {step.id}
              </div>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCurrent
                    ? 'border-2 border-blue-600 bg-white text-blue-600 ring-4 ring-blue-50'
                    : 'border-2 border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium transition-colors ${
                  isCurrent || isDone ? 'text-slate-900 font-semibold' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
