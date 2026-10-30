import { Router } from 'express'
import type { Request, Response } from 'express'
import { createShare, readShare } from '../services/share/shareStore.js'
import { getRecentReport } from './diagnose.js'

export const shareRouter = Router()

// 建立分享連結：只接受本伺服器近期產生的 reportId
shareRouter.post('/', async (req: Request, res: Response) => {
  const reportId = typeof req.body?.reportId === 'string' ? req.body.reportId : ''
  const report = reportId ? getRecentReport(reportId) : undefined
  if (!report) {
    res.status(404).json({ error: '報告已過期', message: '這份報告已超過 10 分鐘，請重新檢測後再分享' })
    return
  }
  try {
    const entry = await createShare(report)
    res.json({ id: entry.id, expiresAt: entry.expiresAt })
  } catch (err) {
    res.status(500).json({ error: '建立分享連結失敗', message: err instanceof Error ? err.message : String(err) })
  }
})

shareRouter.get('/:id', async (req: Request, res: Response) => {
  const entry = await readShare(String(req.params.id))
  if (!entry) {
    res.status(404).json({ error: '找不到報告', message: '分享連結不存在或已過期' })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.json(entry)
})
