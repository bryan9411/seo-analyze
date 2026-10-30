import type { DiagnosticReport, DiagnosticScores } from '@/types/seo'

/** 瀏覽器本機保存的檢測摘要 (不含完整報告，避免佔滿 localStorage) */
export interface HistoryEntry {
  url: string
  isSiteWide: boolean
  timestamp: string
  scores: DiagnosticScores
  issueCount: number
  issueKeys: string[]
  rulesVersion: string
}

const STORAGE_KEY = 'seo-diagnose-history-v1'
const MAX_ENTRIES = 20

/** 同一網址以「去掉結尾斜線」比對 */
export const normalizeUrlKey = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase()

const EMPTY: HistoryEntry[] = []
let cache: HistoryEntry[] | null = null
const listeners = new Set<() => void>()

const readStorage = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** 供 useSyncExternalStore 使用：同一份陣列在變更前保持相同參照 */
export const loadHistory = (): HistoryEntry[] => {
  cache ??= readStorage()
  return cache
}

export const getServerHistory = () => EMPTY

export const subscribeHistory = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const saveHistory = (list: HistoryEntry[]) => {
  cache = list.slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // 私密瀏覽或空間不足時略過
  }
  listeners.forEach(l => l())
}

export const toHistoryEntry = (report: DiagnosticReport): HistoryEntry => {
  const issues = report.findings.filter(f => f.kind === 'issue')
  return {
    url: report.targetUrl,
    isSiteWide: report.isSiteWide,
    timestamp: report.timestamp,
    scores: report.scores,
    issueCount: issues.length,
    issueKeys: issues.map(f => f.checkId),
    rulesVersion: report.rulesVersion
  }
}

/** 找出同網址的上一次紀錄 (排除同一份報告本身) */
export const findPrevious = (list: HistoryEntry[], report: DiagnosticReport): HistoryEntry | undefined => {
  const key = normalizeUrlKey(report.targetUrl)
  return list.find(e => normalizeUrlKey(e.url) === key && e.timestamp !== report.timestamp)
}

/** 新增紀錄並回傳更新後清單；快取命中的同一份報告不重複寫入 */
export const pushHistory = (report: DiagnosticReport): HistoryEntry[] => {
  const list = loadHistory()
  if (list.some(e => e.timestamp === report.timestamp && normalizeUrlKey(e.url) === normalizeUrlKey(report.targetUrl))) {
    return list
  }
  saveHistory([toHistoryEntry(report), ...list])
  return loadHistory()
}

export const clearHistory = () => saveHistory([])
