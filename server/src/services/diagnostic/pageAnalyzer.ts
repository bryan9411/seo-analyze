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
 * 萃取生成式 GEO (Generative Engine Optimization) 訊號
 * 涵蓋 Schema 實體關聯圖譜、權威佐證出處、防 AI 幻覺之客觀度與直球解答架構
 */
const extractGeoSignals = (
  $: CheerioAPI,
  bodyText: string,
  outboundLinksCount: number,
  authoritativeOutbound: boolean
) => {
  const detectedSchemaTypes: string[] = []
  let hasArticleSchema = false
  let hasOrganizationSchema = false
  let hasPersonSchema = false
  let hasFaqSchema = false
  let faqQuestionsCount = 0
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

        if (/Article|NewsArticle|BlogPosting|TechArticle|Report/i.test(type)) {
          hasArticleSchema = true
        }
        if (/Organization|Corporation|GovernmentOrganization/i.test(type)) {
          hasOrganizationSchema = true
        }
        if (/Person|Author/i.test(type)) {
          hasPersonSchema = true
        }
        if (/FAQPage/i.test(type)) {
          hasFaqSchema = true
          if (Array.isArray(obj.mainEntity)) {
            faqQuestionsCount += obj.mainEntity.length
          }
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

  // 權威出處引述訊號 (Citations & Blockquotes)
  const blockquoteCount = $('blockquote').length
  const citationCount = outboundLinksCount + blockquoteCount

  // 數據與客觀佐證訊號
  const statsMatches = bodyText.match(/\d+(?:[.,]\d+)?\s*(?:%|倍|項|篇|名|家|元|歲|天|小時|分鐘|公分|kg|km|坪|折)/g) || []
  const hasStatsOrData = statsMatches.length >= 3

  // 直球對決首段濃縮解答檢測 (Direct Answer Snippet)
  const firstParas = $('article p, main p, .content p, p')
    .slice(0, 3)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length >= 30 && t.length <= 250)

  const directAnswerSnippetFound = firstParas.some((t) =>
    /(?:是指|定義|代表|主要提供|包含以下|總結來說|解答如下|核心重點|快速結論|根據)/.test(t)
  )

  return {
    jsonLdScriptsCount,
    detectedSchemaTypes: Array.from(new Set(detectedSchemaTypes)),
    hasArticleSchema,
    hasOrganizationSchema,
    hasPersonSchema,
    hasFaqSchema,
    faqQuestionsCount,
    citationCount,
    hasStatsOrData,
    directAnswerSnippetFound
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

  // 3. GEO 生成式引擎優化特徵萃取
  const geoData = extractGeoSignals(
    $,
    bodyText,
    eeatData.outboundLinksCount,
    eeatData.authoritativeOutbound
  )

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
