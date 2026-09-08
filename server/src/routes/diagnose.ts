import { Router } from 'express'
import type { Request, Response } from 'express'
import { rateLimiter } from '../middleware/rateLimiter.js'
import { validateTargetUrl } from '../middleware/ssrfGuard.js'
import { crawlTarget } from '../services/crawler/index.js'
import { runDiagnostics } from '../services/diagnostic/index.js'
import type { DiagnosticMode } from '../types/seo.js'

export const diagnoseRouter = Router()

// 頻率限制 (每分最多 5 次)
diagnoseRouter.post('/', rateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, isSiteWide = false, mode = 'ALL' } = req.body || {}

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: '請提供欲健檢的網站網址 (url)' })
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

    // 讀取自訂 API 金鑰
    const geminiKey = (req.headers['x-gemini-key'] as string) || ''
    const openaiKey = (req.headers['x-openai-key'] as string) || ''

    // 網頁爬取與抽樣
    const crawlResult = await crawlTarget(targetUrl, {
      isSiteWide: Boolean(isSiteWide),
      sampleLimit: 10
    })

    // 執行健檢診斷
    const diagnosticReport = runDiagnostics(crawlResult, mode as DiagnosticMode)

    res.json(diagnosticReport)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '執行健檢診斷時發生未預期錯誤'
    res.status(500).json({
      error: '伺服器分析失敗',
      message
    })
  }
})
