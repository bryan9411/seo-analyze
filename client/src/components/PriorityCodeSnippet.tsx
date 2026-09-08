'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface PriorityCodeSnippetProps {
  codeSnippet?: string
}

const DEFAULT_SNIPPET = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "2026 SEO / GEO / AIO 現代化結構化實體標籤",
      "description": "提供完整實體圖譜、專家作者認證與常見問題解答以利 ChatGPT、Perplexity、Claude、Gemini 主動引述",
      "inLanguage": "zh-TW"
    }
  ]
}`

export const PriorityCodeSnippet: React.FC<PriorityCodeSnippetProps> = ({ codeSnippet }) => {
  const [copied, setCopied] = useState(false)
  const code = (codeSnippet || DEFAULT_SNIPPET).trim()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">優先改善建議</h3>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">已複製</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>複製代碼</span>
            </>
          )}
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-lg bg-[#0F172A] border border-slate-800 p-4">
        <pre className="h-64 overflow-y-auto overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-400">
          <code>{code}</code>
        </pre>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        建議將上述 Schema.org JSON-LD 代碼直接植入網頁 &lt;head&gt; 區段
      </div>
    </div>
  )
}
