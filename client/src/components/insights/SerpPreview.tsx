'use client'

import React, { useMemo, useState } from 'react'
import { AlertTriangle, ImageOff } from 'lucide-react'
import type { SerpLimits, SinglePageAnalysis } from '@/types/seo'

interface SerpPreviewProps {
  page: SinglePageAnalysis
  limits: SerpLimits
}

const FONT_STACK = 'arial, "Noto Sans TC", "PingFang TC", sans-serif'

let measureCtx: CanvasRenderingContext2D | null = null

/** 以 canvas 量測實際像素寬度 (Google 依像素而非字數截斷，中文字比英文寬) */
const measure = (text: string, font: string): number => {
  if (typeof document === 'undefined') return text.length * 10
  measureCtx ??= document.createElement('canvas').getContext('2d')
  if (!measureCtx) return text.length * 10
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

const truncateByPixels = (text: string, font: string, maxPx: number) => {
  const width = measure(text, font)
  if (width <= maxPx) return { shown: text, truncated: false, width, keptChars: text.length }
  const ellipsisWidth = measure(' ...', font)
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(text.slice(0, mid), font) + ellipsisWidth <= maxPx) lo = mid
    else hi = mid - 1
  }
  return { shown: `${text.slice(0, lo).trimEnd()} ...`, truncated: true, width, keptChars: lo }
}

const hostOf = (url: string) => {
  try {
    const u = new URL(url)
    return { host: u.hostname.replace(/^www\./, ''), path: decodeURI(u.pathname).split('/').filter(Boolean).join(' › ') }
  } catch {
    return { host: url, path: '' }
  }
}

const TruncationNote: React.FC<{ label: string, total: number, kept?: number }> = ({ label, total, kept }) => (
  <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    {label}共 {total} 字，約在第 {kept ?? '?'} 字被截斷，建議把核心關鍵字移到前面。
  </p>
)

export const SerpPreview: React.FC<SerpPreviewProps> = ({ page, limits }) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [imageFailed, setImageFailed] = useState(false)
  const { host, path } = hostOf(page.canonical || page.url)
  const title = page.title || '（缺少 title）'
  const desc = page.metaDescription || '（缺少 meta description，Google 會自行從內文擷取）'

  const serp = useMemo(() => {
    const isMobile = device === 'mobile'
    return {
      title: truncateByPixels(title, `${isMobile ? 18 : 20}px ${FONT_STACK}`, isMobile ? limits.titlePixels * 0.9 : limits.titlePixels),
      desc: truncateByPixels(desc, `14px ${FONT_STACK}`, isMobile ? limits.descPixelsMobile : limits.descPixelsDesktop)
    }
  }, [device, title, desc, limits])

  const socialTitle = page.ogTitle || page.title
  const socialDesc = page.ogDescription || page.metaDescription

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Google 搜尋結果 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Google 搜尋結果預覽</h4>
          <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs">
            {(['desktop', 'mobile'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`rounded px-2.5 py-1 cursor-pointer ${device === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {d === 'desktop' ? '桌機' : '手機'}
              </button>
            ))}
          </div>
        </div>
        <div className={`rounded-lg border border-slate-200 bg-white p-4 ${device === 'mobile' ? 'max-w-[400px]' : ''}`}>
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
              {host.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate text-slate-900">{host}</div>
              <div className="truncate text-slate-500">{host}{path ? ` › ${path}` : ''}</div>
            </div>
          </div>
          <div
            className={`mt-2 leading-snug text-[#1a0dab] ${device === 'mobile' ? 'text-lg' : 'text-xl'}`}
            style={{ fontFamily: FONT_STACK }}
          >
            {serp.title.shown}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#4d5156]" style={{ fontFamily: FONT_STACK }}>
            {serp.desc.shown}
          </p>
        </div>
        {serp.title.truncated && <TruncationNote label="標題" total={title.length} kept={serp.title.keptChars} />}
        {page.metaDescription && serp.desc.truncated && (
          <TruncationNote label="描述" total={desc.length} kept={serp.desc.keptChars} />
        )}
        <p className="mt-2 text-xs text-slate-400">
          依像素寬度模擬 (標題上限約 {limits.titlePixels}px)，實際顯示可能因 Google 改寫而不同。
        </p>
      </section>

      {/* 社群分享卡片 */}
      <section>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">LINE / Facebook 分享預覽</h4>
        <div className="max-w-[420px] overflow-hidden rounded-lg border border-slate-200 bg-white">
          {page.ogImage && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.ogImage}
              alt="og:image 預覽"
              className="aspect-[1.91/1] w-full bg-slate-100 object-cover"
              onError={() => setImageFailed(true)}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[1.91/1] w-full flex-col items-center justify-center gap-1 bg-slate-100 text-rose-600">
              <ImageOff className="h-6 w-6" />
              <span className="text-xs font-medium">{page.ogImage ? 'og:image 圖片無法載入' : '未設定 og:image，分享時沒有縮圖'}</span>
            </div>
          )}
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] uppercase text-slate-500">{host}</div>
            <div className="line-clamp-2 text-sm font-semibold text-slate-900">{socialTitle || '（缺少標題）'}</div>
            {socialDesc && <div className="mt-0.5 line-clamp-1 text-xs text-slate-600">{socialDesc}</div>}
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          <li>og:title：{page.ogTitle ? '✅ 已設定' : '⚠️ 未設定 (使用 title)'}</li>
          <li>og:description：{page.ogDescription ? '✅ 已設定' : '⚠️ 未設定 (使用 meta description)'}</li>
          <li>og:image：{page.ogImage ? '✅ 已設定' : '❌ 未設定'}</li>
          <li>twitter:card：{page.twitterCard || '未設定'}</li>
        </ul>
      </section>
    </div>
  )
}
