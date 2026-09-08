import type {
  SinglePageAnalysis,
  DiagnosticScores,
  ComplianceMetric,
  FactDensityMetrics,
  RobotsTxtReport
} from '../../types/seo.js'

export interface EvaluationResult {
  scores: DiagnosticScores
  seoIssues: string[]
  seoStrengths: string[]
  geoIssues: string[]
  geoStrengths: string[]
  aioIssues: string[]
  aioStrengths: string[]
  complianceMetrics: ComplianceMetric[]
  factDensity: FactDensityMetrics
}

const clampScore = (val: number): number => {
  return Math.max(10, Math.min(100, val))
}

const getStatus = (rate: number): 'good' | 'warning' | 'danger' => {
  if (rate >= 70) return 'good'
  if (rate >= 40) return 'warning'
  return 'danger'
}

/**
 * 傳統 SEO 規則評估
 */
const evaluateSeo = (primary: SinglePageAnalysis) => {
  let score = 70
  const issues: string[] = []
  const strengths: string[] = []

  // Title 標題檢核
  if (!primary.title) {
    score -= 25
    issues.push('缺乏 `<title>` 標籤，嚴重損害搜尋引擎檢索與點擊率')
  } else if (primary.title.length < 15) {
    score -= 10
    issues.push(`標題長度過短 (${primary.title.length} 字)，未充分布局高價值核心關鍵字`)
  } else if (primary.title.length > 65) {
    score -= 8
    issues.push(`標題長度過長 (${primary.title.length} 字)，在 Google SERP 搜尋結果中將被截斷省略`)
  } else {
    strengths.push(`標題長度適中 (${primary.title.length} 字)，在 SERP 中展現良好`)
  }

  // Meta Description 檢核
  if (!primary.metaDescription) {
    score -= 18
    issues.push('缺少 Meta Description，搜尋引擎將隨機抓取內文，導致點閱率 (CTR) 低迷')
  } else if (primary.metaDescription.length < 50) {
    score -= 8
    issues.push(`Meta Description 過短 (${primary.metaDescription.length} 字)，缺乏足夠行動號召與關鍵字`)
  } else {
    strengths.push('已配置 Meta Description，有助於吸引搜尋結果點擊')
  }

  // H1 標籤檢核
  if (primary.h1List.length === 0) {
    score -= 15
    issues.push('頁面完全缺失 `<h1>` 主標題，Google 無法明確辨識本頁的核心主題')
  } else if (primary.h1List.length > 1) {
    score -= 8
    issues.push(`頁面存在多個 H1 標籤 (${primary.h1List.length} 個)，權重分散稀釋主題專注度`)
  } else {
    strengths.push('具有唯一且標準的 `<h1>` 標題，架構符合語意規範')
  }

  // E-E-A-T 訊號檢核
  if (!primary.authorTags) {
    score -= 12
    issues.push('缺乏明確的作者標記 (Author Byline) 與作者權威資格說明，E-E-A-T 信賴度低')
  } else {
    strengths.push(`具備作者資訊標註 (${primary.authorTags})，利於建立作者權威實體`)
  }

  if (!primary.publishDate) {
    score -= 8
    issues.push('缺乏發布時間與最後更新時間標記，無法讓搜尋引擎判定內容時效性')
  }

  if (!primary.authoritativeOutbound) {
    issues.push('缺乏引用官方/權威第三方文獻或研究外鏈，內容權威背書偏弱')
  }

  // 圖片 Alt 替代文字檢核
  if (primary.imageCount > 0) {
    if (primary.missingAltCount > 0) {
      score -= Math.min(10, primary.missingAltCount * 2)
      issues.push(`頁面共偵測到 ${primary.imageCount} 張圖片，其中 ${primary.missingAltCount} 張缺乏 \`alt\` 替代文字說明，損害圖片搜尋與無障礙體驗`)
    } else {
      strengths.push(`全頁 ${primary.imageCount} 張圖片皆配置了 \`alt\` 替代文字說明，符合圖片搜尋與無障礙標準`)
    }
  }

  return {
    score: clampScore(score),
    issues,
    strengths
  }
}

/**
 * GEO (Generative Engine Optimization 生成式引擎優化) 評估
 * 依據 Princeton GEO 基準 (Cite Sources, Statistics Addition, Schema Entity Graph, Direct Answer)
 * 與 AI 爬蟲存取權限 (ChatGPT / Perplexity / Claude / Gemini)
 */
const evaluateGeo = (allAnalyses: SinglePageAnalysis[], robotsTxt?: RobotsTxtReport) => {
  let score = 60
  const issues: string[] = []
  const strengths: string[] = []

  // 0. AI 爬蟲存取權限檢核 (robots.txt 關鍵門檻)
  if (robotsTxt) {
    const blockedCritical = robotsTxt.crawlers.filter(c => c.isCritical && c.status === 'blocked')
    if (blockedCritical.length > 0) {
      score -= Math.min(30, blockedCritical.length * 15)
      const botNames = blockedCritical.map(b => `${b.engine} (${b.name})`).join('、')
      issues.push(`🚨 致命阻擋：robots.txt 阻擋了 ${botNames} 爬蟲，導致該 AI 引擎 100% 無法造訪網頁，失去在生成式答案中被引用的資格！`)
    } else {
      score += 10
      strengths.push('✅ AI 爬蟲全面暢通：robots.txt 完整開放 ChatGPT、Perplexity、Claude 與 Google 抓取權限，具備生成式引用的最高通行資格')
    }
  }

  const articleFound = allAnalyses.some(a => a.hasArticleSchema)
  const orgFound = allAnalyses.some(a => a.hasOrganizationSchema)
  const personFound = allAnalyses.some(a => a.hasPersonSchema)
  const totalCitations = allAnalyses.reduce((acc, a) => acc + a.citationCount, 0)
  const statsFound = allAnalyses.some(a => a.hasStatsOrData)
  const directAnswerFound = allAnalyses.some(a => a.directAnswerSnippetFound)

  // 1. Schema 實體圖譜 (Entity Graph for LLMs)
  const detectedSchemas = Array.from(new Set(allAnalyses.flatMap(a => a.detectedSchemaTypes)))
  if (articleFound || orgFound) {
    score += 15
    strengths.push(`已配置語意實體結構 (${detectedSchemas.slice(0, 3).join('、') || 'Article/Organization'})，利於生成式引擎 (ChatGPT / Perplexity / Claude / Gemini) 建立知識圖譜關聯`)
  } else {
    score -= 20
    issues.push('完全缺乏 Article 或 Organization 實體結構化標記，AI 搜尋爬蟲無法將內容與發布者實體明確錨定')
  }

  if (personFound) {
    score += 8
    strengths.push('具備 Person / Author 實體標記，為生成式引擎提供明確的作者專家責任歸屬')
  } else {
    issues.push('未配置 Person / Author 專家實體結構，降低 LLM (ChatGPT / Perplexity / Claude) 在權威度 (E-E-A-T) 採納上的置信分數')
  }

  // 2. 權威佐證與出處引述 (Cite Sources - Princeton GEO 關鍵策略)
  if (totalCitations > 0) {
    score += 15
    strengths.push(`具備權威出處引述與文獻佐證 (共 ${totalCitations} 處引用)，符合 GEO 基準之「引述出處 (Cite Sources)」原則`)
  } else {
    score -= 15
    issues.push('內文缺乏外部權威佐證或專業出處引用 (Princeton GEO 核心優化點：Cite Sources)，生成式模型難以將本頁列為高可信度參考來源')
  }

  // 3. 客觀數據事實密度 (Statistics Addition - 抗 AI 幻覺)
  if (statsFound) {
    score += 12
    strengths.push('內文具備客觀統計數據與量化指標，顯著提升資訊增益 (Information Gain) 並降低 AI 生成幻覺')
  } else {
    score -= 12
    issues.push('缺乏具體量化數據與客觀統計指標 (Princeton GEO 核心優化點：Statistics Addition)，內容多屬定性敘述，容易被生成式引擎稀釋或忽略')
  }

  // 4. 直球首段濃縮解答 (Direct Answer Snippet)
  if (directAnswerFound) {
    score += 10
    strengths.push('首段具備直球核心定義或解答架構，極易被 AI 搜尋引擎 (SearchGPT / Perplexity / Claude) 直取為精選解答摘要')
  } else {
    issues.push('首段缺乏「直球解答」或核心摘要定義，前言鋪陳過長，不利於 AI 搜尋引擎在第一時間提取為精選答案')
  }

  return {
    score: clampScore(score),
    issues,
    strengths
  }
}

/**
 * AIO 答案引擎規則評估
 */
const evaluateAio = (primary: SinglePageAnalysis, allAnalyses: SinglePageAnalysis[]) => {
  let score = 65
  const issues: string[] = []
  const strengths: string[] = []

  const avgTables = allAnalyses.reduce((acc, a) => acc + a.tableCount, 0) / allAnalyses.length
  const avgLists = allAnalyses.reduce((acc, a) => acc + a.listCount, 0) / allAnalyses.length
  const totalFluff = allAnalyses.reduce((acc, a) => acc + a.fluffCount, 0)
  const totalQuestions = allAnalyses.flatMap(a => a.matchedQuestionHeadings)

  if (avgTables === 0) {
    score -= 15
    issues.push('全站內容無任何 `<table>` 結構，AI 搜尋引擎 (Perplexity/ChatGPT) 極度缺乏可直接抽取的規格比對數據')
  } else {
    strengths.push(`具備表格結構 (${Math.round(avgTables)} 組)，有助於 AI 快速引用結構化比較資訊`)
  }

  if (avgLists < 2) {
    score -= 10
    issues.push('清單結構 (`<ul>`, `<ol>`) 嚴重不足，內容多為長段落堆疊，不利於 LLM 答案擷取與摘要生成')
  } else {
    strengths.push('具有條列式清單結構，符合 AI 答案引擎擷取步驟與要點的偏好')
  }

  if (totalFluff > 5) {
    score -= 15
    const sampleFluff = primary.foundFluffWords.map(f => f.word).slice(0, 3).join('、')
    issues.push(`行銷浮誇形容詞出現頻率過高 (共發現 ${totalFluff} 次${sampleFluff ? `，如: ${sampleFluff}` : ''})，商業廢話稀釋事實密度`)
  } else {
    strengths.push('商業浮誇詞比例控制良好，資訊表達相對樸實客觀')
  }

  if (totalQuestions.length === 0 && !primary.hasFaqSchema) {
    score -= 20
    issues.push('完全缺乏長尾 FAQ 問答結構與問答型標題，無法與使用者在 AI 搜尋中的口語對話問題形成對齊')
  } else {
    strengths.push(`發現 ${totalQuestions.length} 個長尾問答或流程主題標題，契合 AI 提問語意搜尋`)
  }

  return {
    score: clampScore(score),
    issues,
    strengths
  }
}

/**
 * 計算 6 大關鍵指標達標率
 */
const calculateComplianceMetrics = (
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[]
): ComplianceMetric[] => {
  // Title 達標率
  let titleRate = 0
  if (primary.title) {
    titleRate += 50
    if (primary.title.length >= 15 && primary.title.length <= 65) titleRate += 35
  }

  // Meta 達標率
  let metaRate = 0
  if (primary.metaDescription) {
    metaRate += 40
    if (primary.metaDescription.length >= 50) metaRate += 20
  }

  // H1 達標率
  let h1Rate = 0
  if (primary.h1List.length === 1) h1Rate = 80
  else if (primary.h1List.length > 1) h1Rate = 40

  // Schema 實體圖譜達標率 (Article, Organization, Person, FAQPage)
  let schemaRate = 0
  if (allAnalyses.some(a => a.hasArticleSchema)) schemaRate += 35
  if (allAnalyses.some(a => a.hasOrganizationSchema)) schemaRate += 25
  if (allAnalyses.some(a => a.hasPersonSchema)) schemaRate += 15
  if (allAnalyses.some(a => a.hasFaqSchema)) schemaRate += 25

  // 權威佐證與數據達標率 (Princeton GEO: Citations, Stats, Outbound)
  let evidenceRate = 0
  const totalCitations = allAnalyses.reduce((acc, a) => acc + a.citationCount, 0)
  if (totalCitations > 0) evidenceRate += 35
  if (allAnalyses.some(a => a.hasStatsOrData)) evidenceRate += 35
  if (allAnalyses.some(a => a.authoritativeOutbound)) evidenceRate += 20
  if (primary.factualNumberCount >= 5) evidenceRate += 10

  // AIO 問答解答達標率 (FAQ Schema, Question Headings, Direct Answer)
  let aioRate = 0
  const questionCount = allAnalyses.reduce((acc, a) => acc + a.matchedQuestionHeadings.length, 0)
  if (allAnalyses.some(a => a.hasFaqSchema)) aioRate += 40
  if (allAnalyses.some(a => a.directAnswerSnippetFound)) aioRate += 30
  aioRate += Math.min(30, questionCount * 10)

  return [
    { name: 'Title 標題佈局', rate: titleRate, benchmark: 90, status: getStatus(titleRate) },
    { name: 'Meta 摘要描述', rate: metaRate, benchmark: 85, status: getStatus(metaRate) },
    { name: 'H1 唯一層級', rate: h1Rate, benchmark: 90, status: getStatus(h1Rate) },
    { name: 'Schema 實體圖譜', rate: schemaRate, benchmark: 85, status: getStatus(schemaRate) },
    { name: '權威佐證與數據', rate: evidenceRate, benchmark: 80, status: getStatus(evidenceRate) },
    { name: 'AIO 問答解答', rate: aioRate, benchmark: 75, status: getStatus(aioRate) }
  ]
}

/**
 * 計算內容事實密度 (客觀數據 vs 宣傳詞)
 */
const calculateFactDensity = (allAnalyses: SinglePageAnalysis[]): FactDensityMetrics => {
  const factualCount = allAnalyses.reduce((acc, a) => acc + a.factualNumberCount, 0)
  const fluffCount = allAnalyses.reduce((acc, a) => acc + a.fluffCount, 0)

  // 聚合客觀事實樣本
  const allFacts = allAnalyses.flatMap(a => a.sampleFacts || [])
  const sampleFacts = Array.from(new Set(allFacts)).slice(0, 15)

  // 聚合商業宣傳詞樣本
  const fluffMap = new Map<string, number>()
  for (const a of allAnalyses) {
    for (const item of a.foundFluffWords || []) {
      fluffMap.set(item.word, (fluffMap.get(item.word) || 0) + item.count)
    }
  }
  const sampleFluff = Array.from(fluffMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)

  const total = factualCount + fluffCount
  if (total === 0) {
    return {
      factualCount: 0,
      fluffCount: 0,
      factualPercent: 50,
      fluffPercent: 50,
      sampleFacts,
      sampleFluff
    }
  }

  const factualPercent = Math.round((factualCount / total) * 100)
  const fluffPercent = 100 - factualPercent

  return {
    factualCount,
    fluffCount,
    factualPercent,
    fluffPercent,
    sampleFacts,
    sampleFluff
  }
}

/**
 * 健檢分數與達標率量化評估器
 */
export const evaluateDiagnostics = (
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[],
  robotsTxt?: RobotsTxtReport
): EvaluationResult => {
  // 1. 傳統 SEO 評估
  const seoEval = evaluateSeo(primary)

  // 2. 生成式 GEO 評估 (Generative Engine Optimization)
  const geoEval = evaluateGeo(allAnalyses, robotsTxt)

  // 3. Google AIO 答案引擎評估
  const aioEval = evaluateAio(primary, allAnalyses)

  // 4. 綜合整體健康度
  const overall = Math.round((seoEval.score + geoEval.score + aioEval.score) / 3)

  // 5. 圖表指標：關鍵指標達標率
  const complianceMetrics = calculateComplianceMetrics(primary, allAnalyses)

  // 6. 圖表指標：客觀數據 vs 行銷宣傳詞事實密度
  const factDensity = calculateFactDensity(allAnalyses)

  return {
    scores: {
      overall,
      seo: seoEval.score,
      geo: geoEval.score,
      aio: aioEval.score
    },
    seoIssues: seoEval.issues,
    seoStrengths: seoEval.strengths,
    geoIssues: geoEval.issues,
    geoStrengths: geoEval.strengths,
    aioIssues: aioEval.issues,
    aioStrengths: aioEval.strengths,
    complianceMetrics,
    factDensity
  }
}
