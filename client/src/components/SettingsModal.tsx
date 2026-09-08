'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, ShieldCheck, Check, Trash2 } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  geminiKey: string
  setGeminiKey: (key: string) => void
  openaiKey: string
  setOpenaiKey: (key: string) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  geminiKey,
  setGeminiKey,
  openaiKey,
  setOpenaiKey
}) => {
  const [tempGemini, setTempGemini] = useState(geminiKey)
  const [tempOpenai, setTempOpenai] = useState(openaiKey)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTempGemini(geminiKey)
      setTempOpenai(openaiKey)
      setIsSaved(false)
    }
  }, [isOpen, geminiKey, openaiKey])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setGeminiKey(tempGemini.trim())
    setOpenaiKey(tempOpenai.trim())
    setIsSaved(true)
    setTimeout(() => {
      onClose()
    }, 800)
  }

  const handleClear = () => {
    setTempGemini('')
    setTempOpenai('')
    setGeminiKey('')
    setOpenaiKey('')
    setIsSaved(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />


          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>


            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">API 金鑰配置 (BYOK)</h3>
                <p className="text-xs text-slate-500">可選填以啟動進階 AI 語意檢驗</p>
              </div>
            </div>


            <div className="my-4 flex items-start gap-2 rounded-lg bg-emerald-50/80 p-3 text-xs text-emerald-900 border border-emerald-200/80">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <p className="leading-relaxed">
                <strong>零日誌原則</strong>：填寫的金鑰僅於當前瀏覽器會話中保存，透過 HTTPS Header 於伺服器記憶體中單次計算，嚴禁寫入日誌或資料庫。
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempGemini}
                  onChange={e => setTempGemini(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={tempOpenai}
                  onChange={e => setTempOpenai(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>清除所有金鑰</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    {isSaved ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>已儲存！</span>
                      </>
                    ) : (
                      <span>儲存設定</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
