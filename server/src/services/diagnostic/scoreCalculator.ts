import type {
  SinglePageAnalysis,
  DiagnosticScores,
  ComplianceMetric,
  FactDensityMetrics
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

  return {
    score: clampScore(score),
    issues,
    strengths
  }
}

/**
 * GEO 在地化搜尋規則評估
 */
const evaluateGeo = (allAnalyses: SinglePageAnalysis[]) => {
  let score = 60
  const issues: string[] = []
  const strengths: string[] = []

  const localBusinessFound = allAnalyses.some(a => a.hasLocalBusinessSchema)
  const organizationFound = allAnalyses.some(a => a.hasOrganizationSchema)
  const totalPhones = Array.from(new Set(allAnalyses.flatMap(a => a.matchedPhones)))
  const totalAddresses = Array.from(new Set(allAnalyses.flatMap(a => a.matchedAddresses)))
  const mapFound = allAnalyses.some(a => a.hasMapEmbed)

  if (!localBusinessFound && !organizationFound) {
    score -= 30
    issues.push('完全缺乏 Schema.org LocalBusiness 或 Organization 結構化資料，Google Maps 與在地實體完全脫節')
  } else if (!localBusinessFound && organizationFound) {
    score -= 15
    issues.push('僅配置通用 Organization，缺少精確的 LocalBusiness 實體 (如地址、電話、坐標、營業時間)')
  } else {
    score += 15
    strengths.push('已配置 LocalBusiness 結構化資料，利於在地搜尋實體識別')
  }

  if (totalAddresses.length === 0) {
    score -= 20
    issues.push('內文未檢測到標準台灣實體地址 (如 縣市+區+路段+號)，區域搜尋演算法無法識別在地營業點')
  } else {
    strengths.push(`檢測到實體地址：${totalAddresses[0]}，具備在地地理特徵`)
  }

  if (totalPhones.length === 0) {
    score -= 10
    issues.push('內文缺乏清晰聯絡電話，NAP (Name, Address, Phone) 完整度不足')
  } else {
    strengths.push(`檢測到電話實體：${totalPhones[0]}`)
  }

  if (!mapFound) {
    issues.push('頁面無 Google 地圖嵌入或 Maps 導向連結，在地使用者缺乏直觀路徑導引')
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

  // Schema 達標率
  let schemaRate = 0
  if (allAnalyses.some(a => a.hasLocalBusinessSchema)) schemaRate += 60
  if (allAnalyses.some(a => a.hasFaqSchema)) schemaRate += 40
  else if (allAnalyses.some(a => a.hasOrganizationSchema)) schemaRate += 20

  // NAP 在地達標率
  let napRate = 0
  if (allAnalyses.some(a => a.matchedPhones.length > 0)) napRate += 40
  if (allAnalyses.some(a => a.matchedAddresses.length > 0)) napRate += 40
  if (allAnalyses.some(a => a.hasMapEmbed)) napRate += 20

  // FAQ 長尾達標率
  let faqRate = 0
  const questionCount = allAnalyses.reduce((acc, a) => acc + a.matchedQuestionHeadings.length, 0)
  if (allAnalyses.some(a => a.hasFaqSchema)) faqRate += 50
  faqRate += Math.min(50, questionCount * 15)

  return [
    { name: 'Title 標題佈局', rate: titleRate, benchmark: 90, status: getStatus(titleRate) },
    { name: 'Meta 摘要描述', rate: metaRate, benchmark: 85, status: getStatus(metaRate) },
    { name: 'H1 唯一層級', rate: h1Rate, benchmark: 90, status: getStatus(h1Rate) },
    { name: 'Schema 結構化', rate: schemaRate, benchmark: 80, status: getStatus(schemaRate) },
    { name: 'NAP 在地實體', rate: napRate, benchmark: 85, status: getStatus(napRate) },
    { name: 'FAQ 問答結構', rate: faqRate, benchmark: 75, status: getStatus(faqRate) }
  ]
}

/**
 * 計算內容事實密度 (客觀數據 vs 宣傳詞)
 */
const calculateFactDensity = (allAnalyses: SinglePageAnalysis[]): FactDensityMetrics => {
  const factualCount = allAnalyses.reduce((acc, a) => acc + a.factualNumberCount, 0)
  const fluffCount = allAnalyses.reduce((acc, a) => acc + a.fluffCount, 0)

  const total = factualCount + fluffCount
  if (total === 0) {
    return {
      factualCount: 0,
      fluffCount: 0,
      factualPercent: 50,
      fluffPercent: 50
    }
  }

  const factualPercent = Math.round((factualCount / total) * 100)
  const fluffPercent = 100 - factualPercent

  return {
    factualCount,
    fluffCount,
    factualPercent,
    fluffPercent
  }
}

/**
 * 健檢分數與達標率量化評估器
 */
export const evaluateDiagnostics = (
  primary: SinglePageAnalysis,
  allAnalyses: SinglePageAnalysis[]
): EvaluationResult => {
  // 1. 傳統 SEO 評估
  const seoEval = evaluateSeo(primary)

  // 2. GEO 在地化搜尋評估
  const geoEval = evaluateGeo(allAnalyses)

  // 3. AIO 答案引擎評估
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
