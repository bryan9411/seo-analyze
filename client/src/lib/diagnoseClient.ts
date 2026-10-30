import type { DiagnosticReport } from '@/types/seo'

type StreamEvent =
  | { type: 'progress', message: string }
  | { type: 'result', report: DiagnosticReport }
  | { type: 'error', error: string, message?: string }

interface DiagnoseOptions {
  url: string
  isSiteWide: boolean
  force?: boolean
  signal?: AbortSignal
  onProgress?: (message: string) => void
}

/**
 * 呼叫 /api/diagnose 並以 NDJSON 串流接收進度；伺服器回傳一般 JSON (例如 4xx 錯誤) 也能處理
 */
export const runDiagnose = async ({ url, isSiteWide, force = false, signal, onProgress }: DiagnoseOptions): Promise<DiagnosticReport> => {
  const res = await fetch('/api/diagnose', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    body: JSON.stringify({ url, isSiteWide, mode: 'ALL', force })
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('ndjson') || !res.body) {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || data.error || `診斷失敗 (HTTP ${res.status})`)
    return data
  }

  let result: DiagnosticReport | null = null
  const handle = (line: string) => {
    if (!line.trim()) return
    const event: StreamEvent = JSON.parse(line)
    if (event.type === 'progress') onProgress?.(event.message)
    else if (event.type === 'result') result = event.report
    else throw new Error(event.message || event.error)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    lines.forEach(handle)
    if (done) break
  }
  handle(buffer)

  if (!result) throw new Error('伺服器未回傳診斷結果')
  return result
}
