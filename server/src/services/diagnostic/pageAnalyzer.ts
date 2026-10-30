import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type {
  FaqCandidate,
  HeadingNode,
  PageFetchMeta,
  SinglePageAnalysis
} from '../../types/seo.js'
import type { CompiledRules } from '../../rules/types.js'
import {
  TAIWAN_PHONE_REGEX,
  TAIWAN_ADDRESS_REGEX,
  LOCAL_BUSINESS_TYPE_REGEX,
  APP_ROOT_SELECTOR
} from './constants.js'

const MAX_HEADINGS = 200
const MAX_LISTED_IMAGES = 30
const MAX_FAQ_CANDIDATES = 10

type Selection = ReturnType<CheerioAPI>

const tagNameOf = (node: unknown): string =>
  ((node as { tagName?: string } | undefined)?.tagName || '').toLowerCase()

const normalizeText = (s: string) => s.replace(/\s+/g, ' ').trim()

const toAbsoluteUrl = (href: string, base: string): string => {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

/**
 * 依規則檔選擇器取值；選擇器結尾 "@attr" 代表取屬性，否則取文字
 */
const pickBySelectors = ($: CheerioAPI, selectors: string[]): string => {
  for (const raw of selectors) {
    const at = raw.lastIndexOf('@')
    const hasAttr = at > 0 && !raw.slice(at).includes(']')
    const selector = hasAttr ? raw.slice(0, at) : raw
    try {
      const el = $(selector).first()
      if (el.length === 0) continue
      const value = hasAttr ? el.attr(raw.slice(at + 1)) : el.text()
      const clean = normalizeText(value || '')
      if (clean) return clean.slice(0, 120)
    } catch {
      // 規則檔中的選擇器語法錯誤時略過
    }
  }
  return ''
}

/**
 * 萃取 SEO 基礎特徵 (Title, Meta, 標題階層, 社群標籤)
 */
const extractSeoMetadata = ($: CheerioAPI, url: string, meta?: PageFetchMeta) => {
  const metaContent = (selector: string) => $(selector).attr('content')?.trim() || ''
  // Open Graph 標準為 property=，但不少網站寫成 name=，社群平台兩者都接受
  const ogContent = (key: string) => metaContent(`meta[property="og:${key}" i], meta[name="og:${key}" i]`)

  const title = normalizeText($('title').first().text())
  const ogDescription = ogContent('description')
  const metaDescription = metaContent('meta[name="description" i]') || ogDescription
  const robots = metaContent('meta[name="robots" i]')
  const xRobotsTag = meta?.xRobotsTag || ''
  const ogImageRaw = ogContent('image')

  // 單次走訪 H1 ~ H6，保留出現順序
  const headings: HeadingNode[] = []
  const h1List: string[] = []
  const h2List: string[] = []
  const h3List: string[] = []
  let headingSkipCount = 0
  let emptyHeadingCount = 0
  let prevLevel = 0

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = Number(tagNameOf(el).slice(1))
    const text = normalizeText($(el).text())
    if (!text) {
      emptyHeadingCount++
      return
    }
    if (prevLevel > 0 && level > prevLevel + 1) headingSkipCount++
    prevLevel = level
    if (level === 1) h1List.push(text)
    else if (level === 2) h2List.push(text)
    else if (level === 3) h3List.push(text)
    if (headings.length < MAX_HEADINGS) headings.push({ level, text: text.slice(0, 150) })
  })

  const imageElements = $('img')
  const missingAltImages: string[] = []
  let missingAltCount = 0
  imageElements.each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt === undefined || alt.trim() === '') {
      missingAltCount++
      if (missingAltImages.length < MAX_LISTED_IMAGES) {
        const src = $(el).attr('src') || $(el).attr('data-src') || ''
        if (src) missingAltImages.push(src.startsWith('data:') ? '(內嵌 data URI 圖片)' : toAbsoluteUrl(src, url))
      }
    }
  })

  return {
    title,
    metaDescription,
    metaKeywords: metaContent('meta[name="keywords" i]'),
    canonical: $('link[rel="canonical" i]').attr('href')?.trim() || '',
    robots: [robots, xRobotsTag].filter(Boolean).join(' / '),
    isNoindex: /noindex|none/i.test(robots) || /noindex|none/i.test(xRobotsTag),
    lang: $('html').attr('lang')?.trim() || '',
    hasViewport: $('meta[name="viewport" i]').length > 0,
    h1List,
    h2List,
    h3List,
    headings,
    headingSkipCount,
    emptyHeadingCount,
    ogTitle: ogContent('title'),
    ogDescription,
    ogImage: ogImageRaw ? toAbsoluteUrl(ogImageRaw, url) : '',
    twitterCard: metaContent('meta[name="twitter:card" i]'),
    imageCount: imageElements.length,
    missingAltCount,
    missingAltImages
  }
}

/**
 * 萃取 E-E-A-T 信任訊號
 */
const extractEeatSignals = ($: CheerioAPI, currentUrl: string, rules: CompiledRules) => {
  const { selectors } = rules.config
  let currentHost = ''
  try {
    currentHost = new URL(currentUrl).hostname
  } catch {
    // 忽略
  }

  let outboundLinksCount = 0
  let authoritativeOutbound = false

  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    try {
      const host = new URL(href).hostname
      if (host !== currentHost) {
        outboundLinksCount++
        if (!authoritativeOutbound && rules.regex.authoritativeDomain.some(re => re.test(host))) {
          authoritativeOutbound = true
        }
      }
    } catch {
      // 忽略無效 URL
    }
  })

  return {
    authorTags: pickBySelectors($, selectors.author),
    publishDate: pickBySelectors($, selectors.publishDate),
    outboundLinksCount,
    authoritativeOutbound
  }
}

/**
 * 解析 JSON-LD 結構化資料 (支援陣列、@graph 與巢狀物件)
 */
const extractSchemaSignals = ($: CheerioAPI) => {
  const types = new Set<string>()
  let faqQuestionsCount = 0
  let jsonLdScriptsCount = 0

  const visit = (node: unknown, depth: number): void => {
    if (!node || typeof node !== 'object' || depth > 6) return
    if (Array.isArray(node)) {
      node.forEach(n => visit(n, depth + 1))
      return
    }
    const obj = node as Record<string, unknown>
    const rawType = obj['@type']
    const typeList = Array.isArray(rawType) ? rawType : rawType ? [rawType] : []
    for (const t of typeList) {
      if (typeof t !== 'string') continue
      types.add(t)
      if (/FAQPage/i.test(t) && Array.isArray(obj.mainEntity)) {
        faqQuestionsCount += obj.mainEntity.length
      }
    }
    if (Array.isArray(obj['@graph'])) visit(obj['@graph'], depth + 1)
  }

  $('script[type="application/ld+json" i]').each((_, el) => {
    const raw = $(el).html()
    if (!raw) return
    try {
      visit(JSON.parse(raw), 0)
      jsonLdScriptsCount++
    } catch {
      // 忽略 JSON 解析異常
    }
  })

  const typeArr = Array.from(types)
  const has = (re: RegExp) => typeArr.some(t => re.test(t))

  return {
    jsonLdScriptsCount,
    detectedSchemaTypes: typeArr,
    hasArticleSchema: has(/Article|NewsArticle|BlogPosting|TechArticle|Report/i),
    hasOrganizationSchema: has(/Organization|Corporation|GovernmentOrganization/i),
    hasPersonSchema: has(/Person|Author/i),
    hasFaqSchema: has(/FAQPage/i),
    hasLocalBusinessSchema: has(LOCAL_BUSINESS_TYPE_REGEX),
    faqQuestionsCount
  }
}

/** 單次掃描統計各宣傳詞出現次數 */
const countFluff = (text: string, re: RegExp | null) => {
  if (!re) return { fluffCount: 0, foundFluffWords: [] as Array<{ word: string, count: number }> }
  const tally = new Map<string, number>()
  for (const m of text.matchAll(re)) {
    tally.set(m[0], (tally.get(m[0]) || 0) + 1)
  }
  const foundFluffWords = Array.from(tally, ([word, count]) => ({ word, count }))
  return { fluffCount: foundFluffWords.reduce((acc, f) => acc + f.count, 0), foundFluffWords }
}

const uniqueMatches = (text: string, re: RegExp, limit: number) => {
  const out = new Set<string>()
  for (const m of text.matchAll(re)) {
    out.add(m[0].trim())
    if (out.size >= limit) break
  }
  return Array.from(out)
}

/**
 * 找出主內容區塊：先移除導覽列、頁尾等雜訊，再依規則檔選擇器挑出文字量足夠的區塊
 */
const findMainContent = ($: CheerioAPI, rules: CompiledRules): { root: Selection, source: string } => {
  for (const sel of rules.config.selectors.boilerplate) {
    try {
      $(sel).remove()
    } catch {
      // 忽略無效選擇器
    }
  }
  for (const sel of rules.config.selectors.mainContent) {
    try {
      const el = $(sel).first()
      if (el.length && normalizeText(el.text()).length >= 200) return { root: el, source: sel }
    } catch {
      // 忽略無效選擇器
    }
  }
  return { root: $('body'), source: 'body' }
}

/**
 * 擷取 FAQ 候選：問句型標題 + 標題下方第一段文字或清單
 */
const extractFaqCandidates = ($: CheerioAPI, root: Selection, rules: CompiledRules): FaqCandidate[] => {
  const result: FaqCandidate[] = []
  root.find('h2, h3, h4').each((_, el) => {
    if (result.length >= MAX_FAQ_CANDIDATES) return false
    const question = normalizeText($(el).text())
    if (question.length < 4 || question.length > 80) return
    if (!rules.regex.faqQuestion.some(re => re.test(question))) return

    let answer = ''
    let next = $(el).next()
    for (let i = 0; i < 6 && next.length && !answer; i++) {
      const tag = tagNameOf(next.get(0))
      if (/^h[1-6]$/.test(tag)) break
      const text = tag === 'ul' || tag === 'ol'
        ? next.find('li').map((_, li) => normalizeText($(li).text())).get().filter(Boolean).join('；')
        : normalizeText(next.text())
      if (text.length >= 10) answer = text
      next = next.next()
    }
    if (answer) result.push({ question, answer: answer.length > 300 ? `${answer.slice(0, 297)}...` : answer })
  })
  return result
}

/**
 * 解析單一 HTML 頁面的 SEO、GEO、AIO 特徵 (整頁只解析一次 DOM)
 */
export const analyzeSinglePage = (
  html: string,
  url: string,
  rules: CompiledRules,
  meta?: PageFetchMeta
): SinglePageAnalysis => {
  const { thresholds, lexicons } = rules.config
  const $ = cheerio.load(html)

  // 移除前先記錄：外部腳本數量 (判斷 CSR)、地圖嵌入
  const externalScriptCount = $('script[src]').length
  const hasMapEmbed = $('iframe[src*="google.com/maps" i], iframe[src*="maps.google" i]').length > 0
  const hasAppRoot = $(APP_ROOT_SELECTOR).length > 0

  // 先讀取 JSON-LD，再移除所有腳本與非可見標籤，之後的文字統計不會被污染
  const schemaData = extractSchemaSignals($)
  $('script, style, noscript, svg, iframe, template').remove()

  const seoData = extractSeoMetadata($, url, meta)
  const eeatData = extractEeatSignals($, url, rules)

  const bodyText = normalizeText($('body').text())

  // AIO 結構特徵
  const tableCount = $('table').length
  const blockquoteCount = $('blockquote').length
  const listCount = $('ul, ol').length
  const listItemCount = $('li').length
  const { fluffCount, foundFluffWords } = countFluff(bodyText, rules.regex.fluff)
  const matchedQuestionHeadings = [...seoData.h2List, ...seoData.h3List].filter(h =>
    lexicons.questionKeywords.some(kw => h.includes(kw))
  )
  const factualNumberCount = (bodyText.match(rules.regex.facts) || []).length
  const sampleFacts = uniqueMatches(bodyText, rules.regex.facts, 15)
  const hasStatsOrData = (bodyText.match(rules.regex.stats) || []).length >= (thresholds['stats.minMatches'] ?? 3)

  // 在地商家 NAP (電話也從 tel: 連結補抓)
  const telLinks = $('a[href^="tel:" i]').map((_, el) => ($(el).attr('href') || '').slice(4).trim()).get()
  const matchedPhones = Array.from(new Set([...telLinks, ...uniqueMatches(bodyText, TAIWAN_PHONE_REGEX, 10)])).slice(0, 10)
  const matchedAddresses = uniqueMatches(bodyText, TAIWAN_ADDRESS_REGEX, 5)

  // 以下會移除導覽列等雜訊，需放在最後
  const { root, source } = findMainContent($, rules)
  const mainText = normalizeText(root.text())

  // 首段直接解答：主內容前幾個段落
  const minLen = thresholds['directAnswer.minLength'] ?? 30
  const maxLen = thresholds['directAnswer.maxLength'] ?? 250
  const directAnswerText = root
    .find('p')
    .slice(0, thresholds['directAnswer.paragraphs'] ?? 3)
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .find(t => t.length >= minLen && t.length <= maxLen && Boolean(rules.regex.directAnswer?.test(t))) || ''

  const faqCandidates = extractFaqCandidates($, root, rules)

  const isLikelyCsr =
    bodyText.length < (thresholds['csr.maxTextLength'] ?? 200) && (hasAppRoot || externalScriptCount >= 3)

  return {
    url,
    ...seoData,
    ...eeatData,
    ...schemaData,
    htmlBytes: meta?.htmlBytes ?? Buffer.byteLength(html),
    ttfbMs: meta?.ttfbMs ?? 0,
    base64ImageCount: meta?.base64ImageCount ?? 0,
    base64Bytes: meta?.base64Bytes ?? 0,
    citationCount: eeatData.outboundLinksCount + blockquoteCount,
    hasStatsOrData,
    directAnswerSnippetFound: Boolean(directAnswerText),
    directAnswerText,
    matchedPhones,
    matchedAddresses,
    hasMapEmbed,
    tableCount,
    listCount,
    listItemCount,
    fluffCount,
    foundFluffWords,
    matchedQuestionHeadings,
    faqCandidates,
    factualNumberCount,
    sampleFacts,
    aiViewText: mainText.slice(0, thresholds['aiView.chars'] ?? 300),
    mainTextLength: mainText.length,
    contentSource: source,
    isLikelyCsr,
    wordCount: bodyText.length,
    bodyTextSnippet: bodyText.slice(0, 300)
  }
}
