import * as cheerio from 'cheerio'
import type { CheerioAPI } from 'cheerio'
import type { SinglePageAnalysis } from '../../types/seo.js'
import {
  TAIWAN_PHONE_REGEX,
  TAIWAN_ADDRESS_REGEX,
  FLUFF_WORDS,
  QUESTION_KEYWORDS
} from './constants.js'

/**
 * 萃取 Title、Meta、標題層次等 SEO 基礎特徵
 */
const extractSeoMetadata = ($: CheerioAPI) => {
  const title = $('title').text().trim() || ''
  const metaDescription =
    $('meta[name="description" i]').attr('content')?.trim() ||
    $('meta[property="og:description" i]').attr('content')?.trim() ||
    ''
  const metaKeywords = $('meta[name="keywords" i]').attr('content')?.trim() || ''
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || ''
  const robots = $('meta[name="robots" i]').attr('content')?.trim() || ''

  const h1List: string[] = []
  $('h1').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h1List.push(text)
  })

  const h2List: string[] = []
  $('h2').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h2List.push(text)
  })

  const h3List: string[] = []
  $('h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text) h3List.push(text)
  })

  const ogTitle = $('meta[property="og:title" i]').attr('content')?.trim() || ''
  const ogImage = $('meta[property="og:image" i]').attr('content')?.trim() || ''

  return {
    title,
    metaDescription,
    metaKeywords,
    canonical,
    robots,
    h1List,
    h2List,
    h3List,
    ogTitle,
    ogImage
  }
}

/**
 * 萃取 E-E-A-T 信任與作者權威特徵
 */
const extractEeatSignals = ($: CheerioAPI, currentUrl: string) => {
  const authorTags =
    $('meta[name="author" i]').attr('content')?.trim() ||
    $('[rel="author"]').text().trim() ||
    $('.author, .post-author, .article-author, .author-name').first().text().trim() ||
    ''

  const publishDate =
    $('meta[property="article:published_time" i]').attr('content')?.trim() ||
    $('time').first().text().trim() ||
    $('.publish-date, .post-date, .date, .time').first().text().trim() ||
    ''

  let outboundLinksCount = 0
  let authoritativeOutbound = false

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/^https?:\/\//i.test(href)) {
      try {
        const u = new URL(href)
        const curU = new URL(currentUrl)
        if (u.hostname !== curU.hostname) {
          outboundLinksCount++
          if (/\.(gov|edu|org)(\.tw)?$/i.test(u.hostname) || /wikipedia\.org|cdc\.gov/i.test(u.hostname)) {
            authoritativeOutbound = true
          }
        }
      } catch {
        // 忽略無效 URL
      }
    }
  })

  return {
    authorTags,
    publishDate,
    outboundLinksCount,
    authoritativeOutbound
  }
}

/**
 * 萃取 Schema.org、NAP 與地理資訊特徵
 */
const extractGeoSignals = ($: CheerioAPI, bodyText: string) => {
  const detectedSchemaTypes: string[] = []
  let hasLocalBusinessSchema = false
  let hasOrganizationSchema = false
  let hasFaqSchema = false
  let jsonLdScriptsCount = 0

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html()
      if (!raw) return
      const parsed = JSON.parse(raw)
      jsonLdScriptsCount++

      const checkType = (obj: any) => {
        if (!obj || typeof obj !== 'object') return
        const type = obj['@type'] || ''
        if (Array.isArray(type)) {
          detectedSchemaTypes.push(...type)
        } else if (type) {
          detectedSchemaTypes.push(type)
        }

        if (/LocalBusiness|Store|Restaurant|ProfessionalService|AutoRepair|HealthAndBeautyBusiness|HomeAndConstructionBusiness/i.test(type)) {
          hasLocalBusinessSchema = true
        }
        if (/Organization|Corporation/i.test(type)) {
          hasOrganizationSchema = true
        }
        if (/FAQPage/i.test(type)) {
          hasFaqSchema = true
        }
        if (obj['@graph'] && Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(checkType)
        }
      }

      checkType(parsed)
    } catch {
      // 忽略 JSON 解析異常
    }
  })

  // 電話與地址搜尋
  const matchedPhones = Array.from(new Set(bodyText.match(TAIWAN_PHONE_REGEX) || []))
  const matchedAddresses = Array.from(new Set(bodyText.match(TAIWAN_ADDRESS_REGEX) || []))
  const hasMapEmbed = $('iframe[src*="google.com/maps"]').length > 0 || $('a[href*="google.com/maps"]').length > 0
  const hasServiceAreaDesc = /服務範圍|全台配送|到府服務|雙北|全省|區域|門市地址|營業時間/i.test(bodyText)

  return {
    jsonLdScriptsCount,
    detectedSchemaTypes: Array.from(new Set(detectedSchemaTypes)),
    hasLocalBusinessSchema,
    hasOrganizationSchema,
    hasFaqSchema,
    matchedPhones,
    matchedAddresses,
    hasMapEmbed,
    hasServiceAreaDesc
  }
}

/**
 * 萃取 AIO 生成式回答引擎特徵（表格、清單、形容詞、客觀數字）
 */
const extractAioSignals = ($: CheerioAPI, bodyText: string, headings: string[]) => {
  const tableCount = $('table').length
  const listCount = $('ul, ol').length
  const listItemCount = $('li').length

  // 商業浮誇形容詞計數
  let fluffCount = 0
  const foundFluffWords: Array<{ word: string, count: number }> = []

  for (const word of FLUFF_WORDS) {
    const matches = (bodyText.match(new RegExp(word, 'g')) || []).length
    if (matches > 0) {
      fluffCount += matches
      foundFluffWords.push({ word, count: matches })
    }
  }

  // 長尾問答標題匹配
  const matchedQuestionHeadings = headings.filter(h =>
    QUESTION_KEYWORDS.some(kw => h.includes(kw))
  )

  // 客觀事實數據出現頻率（數字、百分比、幣值、度量衡）
  const factualNumberMatches = bodyText.match(/\d+(?:[.,]\d+)?\s*(?:%|元|歲|天|小時|分鐘|公分|kg|km|坪|折|月|日|年|次)/g) || []
  const factualNumberCount = factualNumberMatches.length
  const sampleFacts = Array.from(new Set(factualNumberMatches.map(s => s.trim()))).slice(0, 15)

  return {
    tableCount,
    listCount,
    listItemCount,
    fluffCount,
    foundFluffWords,
    matchedQuestionHeadings,
    factualNumberCount,
    sampleFacts
  }
}

/**
 * 深入解析單一 HTML 頁面的 SEO, GEO, AIO 結構
 */
export const analyzeSinglePage = (html: string, url: string): SinglePageAnalysis => {
  const $ = cheerio.load(html)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  // 1. 傳統 SEO 元數據萃取
  const seoData = extractSeoMetadata($)

  // 2. E-E-A-T 權威訊號萃取
  const eeatData = extractEeatSignals($, url)

  // 3. GEO 在地化搜尋特徵萃取
  const geoData = extractGeoSignals($, bodyText)

  // 4. AIO 答案引擎特徵萃取
  const allHeadings = [...seoData.h2List, ...seoData.h3List]
  const aioData = extractAioSignals($, bodyText, allHeadings)

  return {
    url,
    ...seoData,
    ...eeatData,
    ...geoData,
    ...aioData,
    wordCount: bodyText.length,
    bodyTextSnippet: bodyText.slice(0, 300)
  }
}
