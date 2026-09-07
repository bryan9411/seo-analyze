import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  timestamps: number[]
}

const windowMs = 60 * 1000 // 60 秒
const maxRequests = 5 // 每分鐘最多 5 次分析
const ipTracker = new Map<string, RateLimitEntry>()

// 定期每 5 分鐘清理過期 IP 紀錄，避免記憶體洩漏
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipTracker.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)
    if (entry.timestamps.length === 0) {
      ipTracker.delete(ip)
    }
  }
}, 5 * 60 * 1000).unref()

/**
 * 取得客戶端真實 IP (相容反向代理與 X-Forwarded-For)
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim()
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1'
}

/**
 * Express 記憶體滑動窗口頻率限制中介軟體
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = getClientIp(req)
  const now = Date.now()

  let entry = ipTracker.get(ip)
  if (!entry) {
    entry = { timestamps: [] }
    ipTracker.set(ip, entry)
  }

  // 移除非當前窗口內的舊戳記
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  const remaining = Math.max(0, maxRequests - entry.timestamps.length)
  res.setHeader('X-RateLimit-Limit', String(maxRequests))
  res.setHeader('X-RateLimit-Remaining', String(remaining))

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0]
    const resetTimeSec = Math.ceil((oldest + windowMs - now) / 1000)
    res.setHeader('Retry-After', String(resetTimeSec))

    res.status(429).json({
      error: '請求過於頻繁 (Rate Limit Exceeded)',
      message: `為保障伺服器運作效能，單一 IP 每分鐘最多執行 ${maxRequests} 次健檢分析，請於 ${resetTimeSec} 秒後再試。`,
      retryAfterSeconds: resetTimeSec
    })
    return
  }

  entry.timestamps.push(now)
  next()
}
