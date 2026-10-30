import type { GeneratedAssets, SinglePageAnalysis } from '../../types/seo.js'
import { TAIWAN_COUNTIES } from './constants.js'

const MAX_LLMS_PAGES = 10

const oneLine = (s: string, max = 160) => {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** 從標題擷取品牌名稱 (分隔符號最後一段)，取不到時使用網域 */
export const extractBrandName = (title: string, url: string): string => {
  const parts = title.split(/[|｜_–—-]/).map(s => s.trim()).filter(Boolean)
  if (parts.length > 1) return parts[parts.length - 1]
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return title || '網站'
  }
}

/**
 * 依主頁與抽樣頁組出 llms.txt (格式參考 llmstxt.org 提案)
 */
const buildLlmsTxt = (primary: SinglePageAnalysis, pages: SinglePageAnalysis[]): string => {
  const brand = extractBrandName(primary.title, primary.url)
  const summary = primary.metaDescription || primary.ogDescription || primary.aiViewText
  const lines = [`# ${brand}`, '']
  if (summary) lines.push(`> ${oneLine(summary, 200)}`, '')

  const seen = new Set<string>([primary.url])
  const items = pages
    .filter(p => {
      if (seen.has(p.url)) return false
      seen.add(p.url)
      return Boolean(p.title)
    })
    .slice(0, MAX_LLMS_PAGES)

  lines.push('## 主要頁面', '')
  lines.push(`- [${oneLine(primary.h1List[0] || primary.title || brand, 80)}](${primary.url})${summary ? `: ${oneLine(summary, 120)}` : ''}`)
  for (const p of items) {
    const name = oneLine(p.h1List[0] || p.title, 80)
    const desc = p.metaDescription || p.aiViewText
    lines.push(`- [${name}](${p.url})${desc ? `: ${oneLine(desc, 120)}` : ''}`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * 以內文問句標題與其下方段落組出 FAQPage JSON-LD (不需 AI，完全取自頁面原文)
 */
const buildFaqJsonLd = (primary: SinglePageAnalysis): string | undefined => {
  if (primary.faqCandidates.length === 0) return undefined
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: primary.faqCandidates.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  }
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`
}

/**
 * 以偵測到的台灣電話與地址組出 LocalBusiness JSON-LD 範本
 */
const buildLocalBusinessJsonLd = (
  primary: SinglePageAnalysis,
  phones: string[],
  addresses: string[]
): string | undefined => {
  if (phones.length === 0 && addresses.length === 0) return undefined
  const address = addresses[0]
  const region = address ? TAIWAN_COUNTIES.find(c => address.startsWith(c)) : undefined
  let origin = primary.url
  try {
    origin = new URL(primary.url).origin
  } catch {
    // 保留原網址
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: extractBrandName(primary.title, primary.url),
    url: origin
  }
  if (primary.ogImage) data.image = primary.ogImage
  if (phones[0]) data.telephone = phones[0]
  if (address) {
    data.address = {
      '@type': 'PostalAddress',
      streetAddress: region ? address.slice(region.length) : address,
      ...(region ? { addressRegion: region } : {}),
      addressCountry: 'TW'
    }
  }
  data.openingHoursSpecification = [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00'
  }]

  return `<!-- 請依實際狀況修改 @type (例如 Restaurant、Dentist、AutoRepair) 與營業時間 -->\n<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`
}

export const generateAssets = (
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[],
  phones: string[],
  addresses: string[]
): GeneratedAssets => ({
  llmsTxt: buildLlmsTxt(primary, allAnalyses),
  faqJsonLd: primary.hasFaqSchema ? undefined : buildFaqJsonLd(primary),
  localBusinessJsonLd: primary.hasLocalBusinessSchema ? undefined : buildLocalBusinessJsonLd(primary, phones, addresses)
})
