/**
 * 診斷報告記憶體快取 (TTL + LRU) 與同網址併發請求合併
 * - 同一網址短時間內重複檢測直接回傳快取，不重新爬取
 * - 多人同時檢測同一網址時只爬取一次
 */
const TTL_MS = Number(process.env.REPORT_CACHE_TTL_MS) || 10 * 60 * 1000
const MAX_ENTRIES = Number(process.env.REPORT_CACHE_MAX) || 100

interface Entry<T> {
  value: T
  expiresAt: number
}

export class ReportCache<T> {
  private store = new Map<string, Entry<T>>()
  private inflight = new Map<string, Promise<T>>()

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    // 重新插入以維持 LRU 順序
    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  set(key: string, value: T) {
    this.store.delete(key)
    this.store.set(key, { value, expiresAt: Date.now() + TTL_MS })
    while (this.store.size > MAX_ENTRIES) {
      const oldest = this.store.keys().next().value
      if (oldest === undefined) break
      this.store.delete(oldest)
    }
  }

  getInflight(key: string): Promise<T> | undefined {
    return this.inflight.get(key)
  }

  /** 執行並登記進行中的工作，完成後寫入快取 */
  run(key: string, task: () => Promise<T>): Promise<T> {
    const promise = task()
      .then(value => {
        this.set(key, value)
        return value
      })
      .finally(() => {
        this.inflight.delete(key)
      })
    this.inflight.set(key, promise)
    return promise
  }

  clear() {
    this.store.clear()
  }
}
