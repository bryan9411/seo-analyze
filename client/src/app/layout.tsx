import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'SEO · GEO · AIO 現代化網頁健檢系統 | 2026 演算法診斷儀表板',
  description: '全方位檢核 Google SERP 排名、Schema.org LocalBusiness NAP 在地圖譜與生成式 AI 答案引擎 (Perplexity/ChatGPT/Gemini) 引用結構'
}

const RootLayout = ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-900">{children}</body>
    </html>
  )
}

export default RootLayout
