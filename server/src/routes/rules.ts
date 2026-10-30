import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { timingSafeEqual } from 'node:crypto'
import {
  getRules,
  getRulesStatus,
  listRulesHistory,
  readRulesHistory,
  reloadRules,
  saveRules,
  RulesValidationError
} from '../rules/rulesStore.js'
import { validateRules } from '../rules/validate.js'
import type { RulesConfig } from '../rules/types.js'

export const rulesRouter = Router()

/**
 * 寫入類操作需帶 Authorization: Bearer <RULES_ADMIN_TOKEN>
 * 未設定環境變數時一律拒絕，只能直接編輯 rules.json 檔案
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const expected = process.env.RULES_ADMIN_TOKEN || ''
  if (!expected) {
    res.status(403).json({
      error: '未啟用線上編輯',
      message: '伺服器未設定 RULES_ADMIN_TOKEN，請直接編輯 server/rules/rules.json (存檔後自動生效)'
    })
    return
  }
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: '管理密鑰錯誤' })
    return
  }
  next()
}

const sendValidationError = (res: Response, err: unknown) => {
  if (err instanceof RulesValidationError) {
    res.status(422).json({ error: '規則檔驗證失敗', errors: err.errors })
    return
  }
  res.status(500).json({ error: '規則檔處理失敗', message: err instanceof Error ? err.message : String(err) })
}

// 取得目前生效的規則與狀態
rulesRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: { ...getRulesStatus(), editable: Boolean(process.env.RULES_ADMIN_TOKEN) },
    rules: getRules().config
  })
})

// 只驗證不儲存
rulesRouter.post('/validate', (req: Request, res: Response) => {
  const errors = validateRules(req.body)
  res.json({ ok: errors.length === 0, errors })
})

// 儲存並立即生效
rulesRouter.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const compiled = await saveRules(req.body as RulesConfig)
    res.json({ ok: true, version: compiled.config.version, loadedAt: compiled.loadedAt })
  } catch (err) {
    sendValidationError(res, err)
  }
})

// 從磁碟重新載入 (例如以其他方式更新了檔案)
rulesRouter.post('/reload', requireAdmin, (_req: Request, res: Response) => {
  const result = reloadRules()
  if (result.ok) res.json({ ok: true, status: getRulesStatus() })
  else res.status(422).json({ error: '規則檔驗證失敗', errors: result.errors })
})

// 歷史版本 (每次線上儲存前自動備份)
rulesRouter.get('/history', requireAdmin, async (_req: Request, res: Response) => {
  res.json({ files: await listRulesHistory() })
})

rulesRouter.get('/history/:file', requireAdmin, async (req: Request, res: Response) => {
  try {
    res.json({ rules: await readRulesHistory(String(req.params.file)) })
  } catch (err) {
    sendValidationError(res, err)
  }
})

rulesRouter.post('/history/:file/restore', requireAdmin, async (req: Request, res: Response) => {
  try {
    const compiled = await saveRules(await readRulesHistory(String(req.params.file)))
    res.json({ ok: true, version: compiled.config.version, loadedAt: compiled.loadedAt })
  } catch (err) {
    sendValidationError(res, err)
  }
})
