'use client'

import React, { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'

interface CodeBlockProps {
  code: string
  title?: string
  /** 提供時顯示下載按鈕 */
  downloadName?: string
  maxHeightClass?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, title, downloadName, maxHeightClass = 'max-h-80' }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 不支援剪貼簿時忽略
    }
  }

  const handleDownload = () => {
    if (!downloadName) return
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {title && <span className="text-sm font-semibold text-slate-800">{title}</span>}
        <div className="ml-auto flex items-center gap-2">
          {downloadName && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              下載 {downloadName}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '已複製' : '複製'}
          </button>
        </div>
      </div>
      <pre className={`${maxHeightClass} overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-slate-200`}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
