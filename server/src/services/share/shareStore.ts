import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import type { DiagnosticReport } from '../../types/seo.js'

/**
 * 分享報告的唯讀快照，以 JSON 檔保存在磁碟 (不需資料庫)
 * 只接受伺服器自己產生、仍在記憶體中的報告，避免有人上傳偽造內容掛在本站網域下
 */
const SHARE_DIR = process.env.SHARE_DIR
  ? path.resolve(process.env.SHARE_DIR)
  : path.join(__dirname, '../../../data/shares')
const TTL_MS = (Number(process.env.SHARE_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000
const MAX_FILES = Number(process.env.SHARE_MAX_FILES) || 5000
const ID_REGEX = /^[A-Za-z0-9_-]{10,32}$/

export interface SharedReport {
  id: string
  createdAt: string
  expiresAt: string
  report: DiagnosticReport
}

const fileOf = (id: string) => path.join(SHARE_DIR, `${id}.json`)

export const createShare = async (report: DiagnosticReport): Promise<SharedReport> => {
  await fsp.mkdir(SHARE_DIR, { recursive: true })
  const id = randomBytes(9).toString('base64url')
  const now = Date.now()
  const entry: SharedReport = {
    id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
    report: { ...report, cached: false }
  }
  await fsp.writeFile(fileOf(id), JSON.stringify(entry), 'utf8')
  return entry
}

export const readShare = async (id: string): Promise<SharedReport | null> => {
  if (!ID_REGEX.test(id)) return null
  try {
    const entry: SharedReport = JSON.parse(await fsp.readFile(fileOf(id), 'utf8'))
    if (Date.parse(entry.expiresAt) < Date.now()) {
      await fsp.unlink(fileOf(id)).catch(() => {})
      return null
    }
    return entry
  } catch {
    return null
  }
}

/** 清除過期檔案，並在數量超過上限時刪除最舊的 */
export const pruneShares = async () => {
  let files: string[]
  try {
    files = (await fsp.readdir(SHARE_DIR)).filter(f => f.endsWith('.json'))
  } catch {
    return
  }
  const stats = await Promise.all(files.map(async f => {
    const full = path.join(SHARE_DIR, f)
    const stat = await fsp.stat(full).catch(() => null)
    return { full, mtime: stat?.mtimeMs ?? 0 }
  }))
  const now = Date.now()
  const alive = stats.filter(s => now - s.mtime <= TTL_MS).sort((a, b) => b.mtime - a.mtime)
  const remove = [...stats.filter(s => now - s.mtime > TTL_MS), ...alive.slice(MAX_FILES)]
  await Promise.all(remove.map(s => fsp.unlink(s.full).catch(() => {})))
}

export const scheduleSharePruning = () => {
  if (!fs.existsSync(SHARE_DIR)) fs.mkdirSync(SHARE_DIR, { recursive: true })
  pruneShares()
  setInterval(pruneShares, 60 * 60 * 1000).unref()
}
