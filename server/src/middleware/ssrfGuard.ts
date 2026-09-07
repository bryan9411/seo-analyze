import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * 判斷 IPv4 地址是否落於內網或保留網段
 */
const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) return true

  const [b0, b1] = parts

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true

  // 10.0.0.0/8 (Private)
  if (b0 === 10) return true

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true

  // 192.168.0.0/16 (Private)
  if (b0 === 192 && b1 === 168) return true

  // 169.254.0.0/16 (Link-local & AWS/GCP Metadata 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true

  // 100.64.0.0/10 (Carrier-grade NAT: 100.64.0.0 - 100.127.255.255)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true

  return false
}

/**
 * 判斷 IPv6 地址是否為保留或私有地址
 */
const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase()
  // Loopback (::1)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true
  // Unspecified (::)
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true
  // Unique local address (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  // Link-local address (fe80::/10)
  if (normalized.startsWith('fe80:')) return true
  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.includes('::ffff:')) {
    const ipv4Part = normalized.split('::ffff:')[1]
    if (ipv4Part && net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part)
    }
  }

  return false
}

/**
 * 核心 SSRF 網址校驗函式 (包含 DNS 解析與 IP 黑名單過濾)
 */
export const validateTargetUrl = async (
  rawUrl: string
): Promise<{ ok: boolean, normalizedUrl?: string, error?: string }> => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { ok: false, error: '請輸入有效的網址' }
  }

  let trimmed = rawUrl.trim()
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: '無效的 URL 格式' }
  }

  // 協議限制
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: '僅支援 HTTP 或 HTTPS 協議網址' }
  }

  const hostname = parsed.hostname.toLowerCase()

  // 顯式主機名稱檢查
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname === '0.0.0.0') {
    return { ok: false, error: '安全性阻擋：嚴禁存取內部 localhost 服務' }
  }

  // 檢查是否直接為 IP
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { ok: false, error: '安全性阻擋：嚴禁存取私有網段或雲端元數據 IP' }
    }
  } else if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return { ok: false, error: '安全性阻擋：嚴禁存取私有 IPv6 網段' }
    }
  } else {
    // 透過 DNS 解析主機名稱，防止 DNS Rebinding 攻擊
    try {
      const records = await dns.lookup(hostname, { all: true })
      if (!records || records.length === 0) {
        return { ok: false, error: `無法解析該主機名稱 (${hostname}) 之 DNS 紀錄` }
      }

      for (const record of records) {
        if (record.family === 4 && isPrivateIPv4(record.address)) {
          return { ok: false, error: `安全性阻擋：主機名稱解析至私有 IP (${record.address})，拒絕連線` }
        }
        if (record.family === 6 && isPrivateIPv6(record.address)) {
          return { ok: false, error: `安全性阻擋：主機名稱解析至私有 IPv6 (${record.address})，拒絕連線` }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'DNS 查詢失敗'
      return { ok: false, error: `網址 DNS 解析失敗：${msg}` }
    }
  }

  return { ok: true, normalizedUrl: parsed.toString() }
}
