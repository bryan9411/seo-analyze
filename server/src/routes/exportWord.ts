import { Router } from 'express'
import type { Request, Response } from 'express'
import { generateDiagnosticWordReport } from '../services/reports/index.js'
import type { DiagnosticReport, DiagnosticMode } from '../types/seo.js'

export const exportWordRouter = Router()

exportWordRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body
    const report: DiagnosticReport = payload.report || payload
    const mode: DiagnosticMode = payload.mode || 'ALL'

    if (!report || !report.scores || !report.sections) {
      res.status(400).json({
        error: '無效的診斷報告資料',
        message: '請求本體中必須包含完整的診斷報告資料 (包含 scores 與 sections)'
      })
      return
    }

    const { buffer, fileName } = await generateDiagnosticWordReport(report, mode)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    res.setHeader('Content-Length', String(buffer.length))

    res.send(buffer)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '產出 Word 報告時發生未預期錯誤'
    res.status(500).json({
      error: 'Word 報告生成失敗',
      message
    })
  }
})
