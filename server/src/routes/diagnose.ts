import { Router } from 'express'
import type { Request, Response } from 'express'
import { consumeRateLimit } from '../middleware/rateLimiter.js'
import { validateTargetUrl } from '../middleware/ssrfGuard.js'
import { crawlTarget } from '../services/crawler/index.js'
import { runDiagnostics } from '../services/diagnostic/index.js'
import { ReportCache } from '../services/cache/reportCache.js'
import { getRules } from '../rules/rulesStore.js'
import type { DiagnosticMode, DiagnosticReport } from '../types/seo.js'

export const diagnoseRouter = Router()

type CachedReport = Omit<DiagnosticReport, 'cached'>
const reportCache = new ReportCache<CachedReport>()

/** 串流回應：每行一個 JSON 物件 { type: 'progress' | 'result' | 'error', ... } */
const NDJSON = 'application/x-ndjson'

diagnoseRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { url, isSiteWide = false, mode = 'ALL', force = false } = req.body || {}
  const wantsStream = (req.headers.accept || '').includes(NDJSON)

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: '請提供欲健檢的網站網址' })
    return
  }

  // SSRF 網址驗證
  const ssrfCheck = await validateTargetUrl(url)
  if (!ssrfCheck.ok || !ssrfCheck.normalizedUrl) {
    res.status(400).json({
      error: '網址安全性檢驗未通過',
      message: ssrfCheck.error || '無效或受限制的連線位址'
    })
    return
  }

  const targetUrl = ssrfCheck.normalizedUrl
  const rules = getRules()
  const cacheKey = `${targetUrl}|${Boolean(isSiteWide)}|${rules.fingerprint}`

  // 快取命中與合併中的請求不佔頻率額度
  const cached = force ? undefined : reportCache.get(cacheKey)
  const inflight = reportCache.getInflight(cacheKey)
  if (!cached && !inflight && !consumeRateLimit(req, res)) return

  const sendProgress = (message: string) => {
    if (wantsStream && !res.writableEnded) res.write(`${JSON.stringify({ type: 'progress', message })}\n`)
  }

  if (wantsStream) {
    res.status(200)
    res.setHeader('Content-Type', `${NDJSON}; charset=utf-8`)
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()
  }

  try {
    let report: DiagnosticReport
    if (cached) {
      report = { ...cached, cached: true }
    } else {
      const startedAt = Date.now()
      const sampleLimit = rules.config.thresholds['sample.limit'] ?? 10
      const task = inflight ?? reportCache.run(cacheKey, async () => {
        const crawlResult = await crawlTarget(targetUrl, {
          isSiteWide: Boolean(isSiteWide),
          sampleLimit,
          articlePathKeywords: rules.config.lexicons.articlePathKeywords,
          onProgress: sendProgress
        })
        sendProgress('正在計算 SEO / GEO / AEO 評分')
        return {
          ...runDiagnostics(crawlResult, rules, mode as DiagnosticMode),
          durationMs: Date.now() - startedAt
        }
      })
      if (inflight) sendProgress('相同網址正在檢測中，等待結果')
      report = { ...(await task), cached: false }
    }

    if (wantsStream) {
      res.end(`${JSON.stringify({ type: 'result', report })}\n`)
    } else {
      res.json(report)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '執行健檢診斷時發生未預期錯誤'
    if (wantsStream) {
      res.end(`${JSON.stringify({ type: 'error', error: '伺服器分析失敗', message })}\n`)
    } else {
      res.status(500).json({ error: '伺服器分析失敗', message })
    }
  }
})
