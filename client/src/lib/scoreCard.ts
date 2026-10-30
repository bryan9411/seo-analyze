import type { DiagnosticReport } from '@/types/seo'
import { downloadBlob, fileStem } from './download'

const W = 1200
const H = 630
const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif'

const scoreColor = (score: number) => (score >= 70 ? '#0F6E56' : score >= 40 ? '#BA7517' : '#A32D2D')

/** 以 canvas 繪製 1200×630 分數卡 (社群分享圖尺寸) 並下載 PNG */
export const downloadScoreCard = async (report: DiagnosticReport) => {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#F1F5F9'
  ctx.fillRect(0, H - 72, W, 72)

  let host = report.targetUrl
  try {
    host = new URL(report.targetUrl).hostname
  } catch {
    // 保留原網址
  }

  ctx.fillStyle = '#64748B'
  ctx.font = `500 30px ${FONT}`
  ctx.fillText('SEO · GEO · AEO 網頁健檢', 72, 96)
  ctx.fillStyle = '#0F172A'
  ctx.font = `500 52px ${FONT}`
  ctx.fillText(host.length > 32 ? `${host.slice(0, 31)}…` : host, 72, 172)

  ctx.fillStyle = scoreColor(report.scores.overall)
  ctx.font = `500 180px ${FONT}`
  ctx.fillText(String(report.scores.overall), 64, 400)
  ctx.fillStyle = '#64748B'
  ctx.font = `400 32px ${FONT}`
  ctx.fillText('綜合評分 / 100', 72, 456)

  const dims = [
    ['傳統 SEO', report.scores.seo],
    ['生成式 GEO', report.scores.geo],
    ['解答引擎 AEO', report.scores.aio]
  ] as const
  dims.forEach(([label, score], i) => {
    const y = 270 + i * 80
    ctx.fillStyle = '#334155'
    ctx.font = `400 30px ${FONT}`
    ctx.fillText(label, 560, y)
    ctx.fillStyle = '#E2E8F0'
    ctx.fillRect(560, y + 14, 480, 14)
    ctx.fillStyle = scoreColor(score)
    ctx.fillRect(560, y + 14, (480 * score) / 100, 14)
    ctx.fillStyle = '#0F172A'
    ctx.font = `500 36px ${FONT}`
    ctx.fillText(String(score), 1064, y + 30)
  })

  ctx.fillStyle = '#64748B'
  ctx.font = `400 24px ${FONT}`
  ctx.fillText(`${new Date(report.timestamp).toLocaleDateString('zh-TW')} · 分析 ${report.analyzedPageCount} 頁 · 規則 v${report.rulesVersion}`, 72, H - 28)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (blob) downloadBlob(blob, `${fileStem(report.targetUrl)}_score.png`)
}
