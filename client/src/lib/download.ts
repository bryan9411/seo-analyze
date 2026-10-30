/** 觸發瀏覽器下載 */
export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 以網域作為檔名前綴 */
export const fileStem = (targetUrl: string) => {
  let host = 'report'
  try {
    host = new URL(targetUrl).hostname.replace(/^www\./, '')
  } catch {
    // 保留預設
  }
  return `SEO_${host}_${new Date().toISOString().slice(0, 10)}`
}
