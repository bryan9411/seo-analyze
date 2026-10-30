import type { DiagnosticReport, DiagnosticScores } from '@/types/seo'

/** 瀏覽器本機保存的檢測摘要 (不含完整報告，避免佔滿 localStorage) */
export interface HistoryEntry {
  url: string
  isSiteWide: boolean
  timestamp: string
  scores: DiagnosticScores
  issueCount: number
  issueKeys: string[]
  /** 問題文案，用於顯示「已修正」的項目 (舊紀錄可能沒有) */
  issues?: Array<{ key: string, message: string }>
  rulesVersion: string
}

const STORAGE_KEY = 'seo-diagnose-history-v1'
const MAX_ENTRIES = 20

/** 同一網址比對：解碼中文路徑、去掉結尾斜線與大小寫差異 */
export const normalizeUrlKey = (url: string) => {
  let value = url.trim()
  try {
    value = decodeURI(value)
  } catch {
    // 保留原字串
  }
  return value.replace(/\/+$/, '').toLowerCase()
}

const EMPTY: HistoryEntry[] = []
let cache: HistoryEntry[] | null = null
const listeners = new Set<() => void>()

/** 同一網址只保留最新一筆 (清單已依時間由新到舊排列) */
const dedupe = (list: HistoryEntry[]) => {
  const seen = new Set<string>()
  return list.filter(e => {
    const key = normalizeUrlKey(e.url)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const readStorage = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? dedupe(list) : []
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
    issues: issues.map(f => ({ key: f.checkId, message: f.message })),
    rulesVersion: report.rulesVersion
  }
}

/** 找出同網址的上一次紀錄 (排除同一份報告本身) */
export const findPrevious = (list: HistoryEntry[], report: DiagnosticReport): HistoryEntry | undefined => {
  const key = normalizeUrlKey(report.targetUrl)
  return list.find(e => normalizeUrlKey(e.url) === key && e.timestamp !== report.timestamp)
}

/**
 * 新增紀錄：同一網址會取代舊的那筆並移到最前面
 * (改善前後對比只需要上一次的結果，呼叫前先用 findPrevious 取得)
 */
export const pushHistory = (report: DiagnosticReport): HistoryEntry[] => {
  saveHistory(dedupe([toHistoryEntry(report), ...loadHistory()]))
  return loadHistory()
}

export const removeHistory = (url: string) => {
  const key = normalizeUrlKey(url)
  saveHistory(loadHistory().filter(e => normalizeUrlKey(e.url) !== key))
}

export const clearHistory = () => saveHistory([])
