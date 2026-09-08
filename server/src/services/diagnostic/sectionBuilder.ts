import type {
  SinglePageAnalysis,
  StructuredSections,
  SeoSection,
  GeoSection,
  AioSection,
  ImprovementSection,
  ImprovementItem,
  RobotsTxtReport
} from '../../types/seo.js'
import type { EvaluationResult } from './scoreCalculator.js'

export interface SectionContext {
  totalAddresses: string[]
  totalPhones: string[]
  evalResult?: EvaluationResult
  allAnalyses?: SinglePageAnalysis[]
  robotsTxt?: RobotsTxtReport
}

/**
 * 傳統 SEO 診斷區塊
 */
const buildSeoSection = (primary: SinglePageAnalysis): SeoSection => {
  const titleLen = primary.title.length
  const metaLen = primary.metaDescription.length

  // Title 分析
  let titleAnalysis = ''
  if (!primary.title) {
    titleAnalysis = '【網頁標題缺失】：目前網頁完全未定義 `<title>` 標籤，搜尋引擎檢索器無法識別頁面核心主旨，在 SERP 中將無從展示。'
  } else if (titleLen < 15) {
    titleAnalysis = `目前網頁 Title 為「${primary.title}」（長度 ${titleLen} 字）。【標題長度偏短】：長度低於 15 字建議門檻，未充分布局高價值長尾關鍵字或痛點修飾詞，浪費了 SERP 的高曝光展示空間。`
  } else if (titleLen > 65) {
    titleAnalysis = `目前網頁 Title 為「${primary.title}」（長度 ${titleLen} 字）。【標題過長截斷風險】：長度超過 Google 最佳展示長度 (約 55-60 字)，在搜尋結果頁中尾段將被截斷省略 (...)，建議將核心關鍵詞前提。`
  } else {
    titleAnalysis = `目前網頁 Title 為「${primary.title}」（長度 ${titleLen} 字）。【標題長度良好】：長度落於最佳展示區間 (15-65 字)，在桌機與行動端 SERP 皆能完整呈現。`
  }

  // 結合 H1 關聯評估
  if (primary.h1List.length === 1) {
    titleAnalysis += ` 與主要 <h1> 標題（「${primary.h1List[0]}」）主題語意緊密契合，具備良好的樹狀層次聚焦。`
  } else if (primary.h1List.length === 0) {
    titleAnalysis += ` 但全頁完全缺失 <h1> 主標題，搜尋引擎爬蟲缺乏文章層級的錨定核心。`
  } else {
    titleAnalysis += ` 但全頁存在多個 <h1> 標籤 (${primary.h1List.length} 個)，多重主標題容易分散權重。`
  }

  // Meta Description 分析
  let metaAnalysis = ''
  if (!primary.metaDescription) {
    metaAnalysis = '【Meta Description 缺失】：完全未配置 Meta Description，Google 只能由內文隨機擷取不連貫文字作為摘要，大幅削弱搜尋點擊吸引力。'
  } else if (metaLen < 50) {
    metaAnalysis = `【Meta 描述過短】：目前長度僅 ${metaLen} 字（「${primary.metaDescription}」），資訊量偏少，缺乏足夠的痛點描述、差異化賣點與行動號召。`
  } else if (metaLen > 160) {
    metaAnalysis = `【Meta 描述過長】：目前長度達 ${metaLen} 字，超過 160 字建議上限，在行動端或桌面端搜尋結果可能遭到截斷。`
  } else {
    metaAnalysis = `【Meta 描述良好】：長度為 ${metaLen} 字（符合 80-160 字黃金區間），能完整傳遞頁面核心摘要與預期內容。`
  }

  const titleMetaAnalysis = `${titleAnalysis}\n${metaAnalysis}`

  // E-E-A-T 分析
  const eeatParts: string[] = ['在 E-E-A-T 經驗、專業、權威與信任維度檢核結果如下：']

  if (primary.authorTags) {
    eeatParts.push(
      `* **作者與專家署名**：檢測到作者署名「${primary.authorTags}」，具備基礎內容責任歸屬。${
        primary.authoritativeOutbound
          ? '且內文有引用權威出站連結，利於專業度佐證。'
          : '建議進一步提供作者專業資歷簡介或行業技術資歷的介紹連結。'
      }`
    )
  } else {
    eeatParts.push(
      '* **作者與審核機制**：頁面未檢測到明確作者署名或專家審查標記，內容呈現無具名狀態，容易被 Google Helpful Content System 視為缺乏權威背書的非具名內容。'
    )
  }

  if (primary.authoritativeOutbound) {
    eeatParts.push(
      `* **權威文獻與外鏈引用**：內文成功引用了政府機構 (.gov)、教育學術 (.edu) 或同業公認權威資料源（外部連結共 ${primary.outboundLinksCount} 個），事實查核可信度高。`
    )
  } else if (primary.outboundLinksCount > 0) {
    eeatParts.push(
      `* **權威文獻與外鏈引用**：檢測到 ${primary.outboundLinksCount} 個外部出站連結，但未包含高權威官方或學術站點，建議適度引述權威標準或法規報告以增強權威度。`
    )
  } else {
    eeatParts.push(
      '* **權威文獻與外鏈引用**：頁面無任何外部權威文獻或官方報告引用（出站連結數為 0），內容論證偏向封閉式自述。'
    )
  }

  if (primary.publishDate) {
    eeatParts.push(`* **時效性與修訂追溯**：具備明確的發布/修訂時間標記 (${primary.publishDate})，內容具備時效可追溯性。`)
  } else {
    eeatParts.push('* **時效性與修訂追溯**：未檢測到發表時間或更新紀錄，搜尋引擎與讀者難以評估內容的最新時效性。')
  }

  const eeatAnalysis = eeatParts.join('\n')

  // 痛點彙整
  const painPoints: string[] = []

  if (primary.h1List.length === 0) {
    painPoints.push(
      '【標題階層缺陷：缺失 <h1> 主題核心標籤】\n全頁無唯一 <h1> 標記，搜尋引擎檢索爬蟲無法第一時間鎖定本頁核心主旨，大幅削弱主題權重。'
    )
  } else if (primary.h1List.length > 1) {
    painPoints.push(
      `【標題階層衝突：存在多個 <h1> 標籤 (${primary.h1List.length} 個)】\n頁面同時有多個主標題，分散了首要關鍵字的權重集中度，建議保留單一最高層級 <h1>。`
    )
  }

  if (!primary.metaDescription) {
    painPoints.push(
      '【搜尋展示致命傷：完全缺失 Meta Description 摘要】\nSERP 點閱率將受到嚴重衝擊，搜尋引擎將隨機抓取頁首或頁尾文字，無法向搜尋者傳達核心吸引力。'
    )
  } else if (primary.metaDescription.length < 50) {
    painPoints.push(
      `【搜尋展示弱點：Meta Description 過短 (${primary.metaDescription.length} 字)】\n摘要文字過短，缺乏行動呼籲與關鍵賣點，點擊轉化潛力未充分釋放。`
    )
  }

  if (!primary.authorTags && !primary.authoritativeOutbound) {
    painPoints.push(
      '【E-E-A-T 權威空白：缺乏作者資格背書與權威引用】\n頁面無具名專家責任署名，亦無第三方權威資料佐證，難以在競爭度較高的行業核心大字中通過 Google 實用內容系統檢驗。'
    )
  }

  if (!primary.publishDate) {
    painPoints.push(
      '【時效性訊號缺失：缺乏明確日期標記】\n搜尋引擎在抓取解答型內容時重視時效性，缺乏更新日期將降低最新搜尋排名加權。'
    )
  }

  if (primary.imageCount > 0 && primary.missingAltCount > 0) {
    painPoints.push(
      `【圖片 SEO 缺失：${primary.missingAltCount} 張圖片缺少 alt 替代文字】\n全頁共有 ${primary.imageCount} 張圖片，其中 ${primary.missingAltCount} 張未設定 alt 屬性。這會直接損害在 Google 圖片搜尋的收錄曝光，且無法通過現代網頁無障礙標準檢驗。`
    )
  }

  return {
    title: '1. 傳統 SEO 診斷',
    titleMetaAnalysis,
    eeatAnalysis,
    painPoints
  }
}

/**
 * 生成式 GEO 診斷區塊
 */
const buildGeoSection = (primary: SinglePageAnalysis, ctx: SectionContext): GeoSection => {
  let schemaAnalysis = ''
  if (primary.hasArticleSchema && primary.hasOrganizationSchema) {
    schemaAnalysis = `【已建立核心實體圖譜】檢測到 Schema.org Article 與 Organization 結構化標記（${primary.detectedSchemaTypes.join('、')}），已向搜尋與生成式引擎宣告文章主體與發布機構身份。這能讓 ChatGPT、Perplexity、Claude 與 Gemini 明確辨識出版實體與內容層級關聯。建議進一步補充 author 的 Person 實體連結與 sameAs 官方社群標記，深化知識圖譜對齊。`
  } else if (primary.hasArticleSchema) {
    schemaAnalysis = `【已具備文章語意，缺乏機構/作者圖譜】檢測到 Schema.org Article 標記，內容語意屬性良好；但目前尚未關聯 Organization 發布機構或 Person 作者專家實體。AI 爬蟲在交叉檢驗品牌 E-E-A-T 權威度時缺乏機構與人物實體錨點。`
  } else if (primary.hasOrganizationSchema) {
    schemaAnalysis = `【僅配置機構標記，缺乏內容實體】檢測到 Schema.org Organization 組織標記，但頁面本身未宣告 Article 或 BlogPosting。生成式引擎知曉機構主體存在，但無法將該文章直接作為結構化知識實體納入 RAG 檢索增強生成切塊。`
  } else if (primary.detectedSchemaTypes.length > 0) {
    schemaAnalysis = `【具備部分結構化標記】經原始碼解析，本頁檢測到結構化資料（${primary.detectedSchemaTypes.join('、')}），具備初步語意標籤；但目前仍缺失完整的 Article + Organization + Person 實體圖譜關聯。建議透過 Schema.org @graph 統整。`
  } else {
    schemaAnalysis = `【結構化實體圖譜全滅】經原始碼解析，本頁完全缺乏任何 Schema.org 結構化資料標記。生成式 AI 爬蟲只能將網頁視為無結構純文本，大幅降低在知識圖譜中的實體識別度與主動推薦置信度。`
  }

  const geoParts: string[] = []

  // 出處引用
  if (primary.citationCount > 0) {
    geoParts.push(
      `* **權威出處與文獻引述**：內文檢測到 ${primary.citationCount} 處出站引用與引用區塊。Princeton 大學最新 GEO 研究指出，「引述權威來源」能提升生成式 AI 引用率達 +30%~40%，有效降低 LLM 生成風險，本頁具備良好的第三方背書基礎。`
    )
  } else {
    geoParts.push(
      '* **權威出處與文獻引述**：內文未檢測到任何外部權威研究、官方標準或權威文獻引述。依據 Princeton GEO 基準，缺乏可查證的外部引用來源，會導致生成式 AI 在合成解答時難以將本頁視為可信事實佐證。'
    )
  }

  // 數據與統計事實
  if (primary.hasStatsOrData) {
    geoParts.push(
      `* **數據事實與資訊增益**：內文具備客觀數字與度量衡指標（包含百分比、具體倍數或量化區間）。GEO 基準顯示，豐富的量化數據能顯著提升資訊增益，降低 AI 幻覺，提高被 SearchGPT、Perplexity、Claude 採納為事實數據來源的頻率。`
    )
  } else {
    geoParts.push(
      '* **數據事實與資訊增益**：內文多偏向主觀敘述或定性文字，缺乏足夠的統計數據、百分比或規格參數。生成式 AI 在合成具體答案時，無法提取量化數據支撐，容易被競品的數據型內容取代。'
    )
  }

  // 首段直球解答
  if (primary.directAnswerSnippetFound) {
    geoParts.push(
      '* **首段直球解答**：頁面在開頭 1-3 段即展現核心定義或直接解答，符合現代生成式引擎直接擷取 Executive Summary 的偏好。'
    )
  } else {
    geoParts.push(
      '* **首段直球解答**：首段未能在 60-150 字內快速給出「直球結論」或核心定義，前言鋪陳過長。AI 搜尋爬蟲在首段抓不到立即可用的結論摘要時，會轉向其他提供直球答案的頁面。'
    )
  }

  // 作者實體標記
  if (primary.authorTags) {
    geoParts.push(
      `* **作者專家實體**：具備作者署名「${primary.authorTags}」，具備基礎責任歸屬，利於 AI 建立「誰在提供此觀點」的實體信任。`
    )
  } else {
    geoParts.push(
      '* **作者專家實體**：缺乏明確的專業作者署名或專家資歷說明，內容匿名性偏高，在各主流 AI 引擎對 E-E-A-T 的嚴格審查下處於劣勢。'
    )
  }

  const geoEntityAnalysis = geoParts.join('\n')

  const painPoints: string[] = []

  // 檢查 robots.txt 是否阻擋 AI 爬蟲
  if (ctx.robotsTxt && !ctx.robotsTxt.allAiAllowed) {
    const blockedCritical = ctx.robotsTxt.crawlers.filter(c => c.isCritical && c.status === 'blocked')
    if (blockedCritical.length > 0) {
      const blockedNames = blockedCritical.map(b => `${b.engine}（${b.userAgent}）`).join('、')
      painPoints.push(
        `【生成式 GEO 致命痛點：robots.txt 封鎖 AI 爬蟲存取】\n檢測到目標網站的 robots.txt 阻擋了 ${blockedNames}。AI 引擎被防火牆或爬蟲規則拒於門外，此狀態下無論頁面內容或結構多優異，AI 皆 100% 無法讀取或引用本頁！請優先聯繫工程團隊或調整 CDN/Cloudflare 設定以開放存取。`
      )
    }
  }

  if (!primary.hasArticleSchema) {
    painPoints.push(
      '【生成式 GEO 痛點 1：缺失 Article 實體結構化標記，LLM 難以進行實體對齊】\n生成式引擎（ChatGPT Search、Perplexity、Claude、Gemini）依賴 Schema.org 進行語意實體解析。因為沒有在原始碼中植入標準 Article JSON-LD，AI 爬蟲無法將內容視為權威出版文章，降低被選入生成式答案引用卡片的機會。'
    )
  }

  if (primary.citationCount === 0) {
    painPoints.push(
      '【生成式 GEO 痛點 2：缺乏第三方權威文獻引述】\n根據 Princeton 大學 GEO 權威基準研究，「引述權威出處」可提升 30%~40% 的 AI 引用率。本頁未引用任何外部權威研究或行業標準，AI 模型在進行抗幻覺交叉查核時，難以將本頁列為優先推薦來源。'
    )
  }

  if (!primary.hasStatsOrData) {
    painPoints.push(
      '【生成式 GEO 痛點 3：客觀數據事實密度不足】\n內容多為定性敘述與推論，缺乏明確的數字、百分比或量化比對參數。AI 生成引擎在回答使用者「具體需要多少？」、「差異比例為何？」等精準問題時，無法由本頁獲取硬數據。'
    )
  }

  if (!primary.directAnswerSnippetFound) {
    painPoints.push(
      '【生成式 GEO 痛點 4：缺乏首段直球解答】\n頁面開頭缺乏「結論先行」的精煉定義或直接解答，AI 引擎在切分語意區塊時無法在首段提取到直接答案，大幅降低被選為首句 AI 摘要的置信度。'
    )
  }

  return {
    title: '2. 生成式 GEO 診斷',
    schemaAnalysis,
    geoEntityAnalysis,
    painPoints
  }
}

/**
 * Google AIO 診斷區塊
 */
const buildAioSection = (primary: SinglePageAnalysis): AioSection => {
  const aioParts: string[] = [
    'Google AI Overviews (AIO) 是由 Gemini 在 Google SERP 最上方直接生成的綜合解答區塊，旨在解決用戶零點擊搜尋需求。'
  ]

  if (primary.tableCount > 0) {
    aioParts.push(
      `* **表格結構**：頁面包含 ${primary.tableCount} 組 <table> 表格。Google AIO 極度偏好直接自表格提取規格、價格與比較參數產生圖卡，本頁在此項目具備良好的結構化優勢。`
    )
  } else {
    aioParts.push(
      `* **表格結構**：目前頁面缺乏 <table> 結構。Google AIO 偏好直接從表格抓取價格比較、服務流程與規格參數，缺乏表格代表 AI 摘要生成器需要花費更多 Token 解析純文字，進而降低被選為圖卡來源的機率。`
    )
  }

  if (primary.listCount >= 2) {
    aioParts.push(
      `* **條列式清單**：頁面包含 ${primary.listCount} 組清單（共 ${primary.listItemCount} 個項目），結構清晰分明，符合 AIO 抓取步驟流程與要點整理的偏好。`
    )
  } else {
    aioParts.push(
      `* **條列式清單**：清單結構僅有 ${primary.listCount} 組，文字多以密集長段落堆疊，不利於 AIO 快速完成語意切塊與摘要生成。`
    )
  }

  if (primary.fluffCount === 0) {
    aioParts.push('* **行銷形容詞與客觀度**：內文無無效商業浮誇形容詞，資訊表達客觀平實，契合 AIO 過濾主觀宣傳語的偏好。')
  } else if (primary.fluffCount <= 5) {
    aioParts.push(
      `* **行銷形容詞與客觀度**：商業形容詞比例控制良好（發現 ${primary.fluffCount} 次），整體文字維持在客觀傳遞事實的適當水準。`
    )
  } else {
    const sampleFluff = primary.foundFluffWords.slice(0, 3).map(f => f.word).join('、')
    aioParts.push(
      `* **行銷形容詞與客觀度**：內文充斥較多主觀宣傳話術（共發現 ${primary.fluffCount} 次${
        sampleFluff ? `，如：${sampleFluff}` : ''
      }），而客觀數據比例偏低。Google AIO 在生成精煉答案時，會主動過濾掉無法被交叉驗證的主觀宣傳語。`
    )
  }

  if (primary.factualNumberCount > 0) {
    aioParts.push(
      `* **事實數據密度**：檢測到 ${primary.factualNumberCount} 個具體客觀數值（如價格、規格、時程），為 AIO 答案生成提供高可信度依據。`
    )
  } else {
    aioParts.push('* **事實數據密度**：客觀數字與度量衡數值較為稀缺，缺乏硬性數據支撐。')
  }

  const infoDensityAnalysis = aioParts.join('\n')

  let qaRelevanceAnalysis = ''
  if (primary.hasFaqSchema) {
    const qCountDesc = primary.faqQuestionsCount ? `（共檢測到 ${primary.faqQuestionsCount} 組結構化問答）` : ''
    qaRelevanceAnalysis =
      `* **問答契合度**：頁面**已成功部署 Schema.org FAQPage 結構化資料**${qCountDesc}！這能讓 Google AIO 直接擷取標準問答對決模組，精準命中用戶在對話式搜尋中的口語發問意圖。\n` +
      `* **倒金字塔結構優勢**：${
        primary.matchedQuestionHeadings.length > 0
          ? `同時在內文標題中佈局了 ${primary.matchedQuestionHeadings.length} 個問答型標題（如：「${primary.matchedQuestionHeadings.slice(0, 2).join('」、「')}」），有效將用戶長尾疑慮前置。`
          : '已具備問答結構，建議確保每個問答的首段第一句均能直擊核心答案，進一步提升 AI 生成摘要的直接引用率。'
      }`
  } else if (primary.matchedQuestionHeadings.length > 0) {
    qaRelevanceAnalysis =
      `* **問答契合度**：內文標題中發現 ${primary.matchedQuestionHeadings.length} 個長尾問答句（如：「${primary.matchedQuestionHeadings.slice(0, 2).join('」、「')}」），具備良好口語提問基礎。**但尚未標記 Schema.org FAQPage 結構化資料**，目前仍停留於純文本，Google AIO 無法以最高置信度快速解析。\n` +
      `* **建議行動**：立即為這 ${primary.matchedQuestionHeadings.length} 個現成問答補上 FAQPage JSON-LD 標記，直接將內文優勢轉化為 AIO 引用首選。`
  } else {
    qaRelevanceAnalysis =
      `* **問答契合度**：檢測發現頁面缺乏結構化的「問答對決模組」，亦未佈局問答型標題。現代使用者在 Google AIO 搜尋中多使用長尾口語問題（如「...怎麼辦？」、「...費用如何計算？」）。\n` +
      `* **自說自話陷阱**：內容架構多為自說自話的介紹與行銷陳述，未採用「倒金字塔結構」（即標題提出問題後，首段第一句直接給出具體原因與解決答案），導致 AI 答案生成模型判定本頁答案回應速度慢、直接度低。`
  }

  const painPoints: string[] = []

  if (primary.tableCount === 0) {
    painPoints.push(
      '【AIO 攔截痛點 1：缺乏結構化表格，無法生成零點擊比對圖卡】\nGoogle AIO 會主動將表格提取為搜尋結果最頂端的比對圖卡。缺乏結構化 <table> 時，容易在精選摘要比對階段錯失曝光機會。'
    )
  }

  if (!primary.hasFaqSchema) {
    painPoints.push(
      '【AIO 攔截痛點 2：缺乏長尾 FAQPage 模組，喪失對話型搜尋入口】\n當用戶在 Google 發問求助時，Gemini AIO 傾向直接引用具備 FAQPage 結構化資料、且答案明確直接的權威網站。本頁未佈局 FAQ 結構化資料，錯失了成為 AIO 首選來源的機會。'
    )
  }

  if (primary.fluffCount > 5) {
    painPoints.push(
      `【AIO 攔截痛點 3：浮誇形容詞過多 (${primary.fluffCount} 次)，事實資訊密度被稀釋】\n當文本多為模糊形容詞而缺乏客觀數據、百分比與規格時，Google AIO 在合成答案時會主動過濾主觀宣傳，導致本頁關鍵內容無法被採納為客觀事實。`
    )
  }

  if (primary.factualNumberCount < 5) {
    painPoints.push(
      `【事實密度痛點：客觀規格數據不足 (僅發現 ${primary.factualNumberCount} 處)】\n缺乏足夠的具體數字、工時、費用區間或規格參數，AIO 引擎難以將內文作為硬事實依據進行引用。`
    )
  }

  if (!primary.authoritativeOutbound) {
    painPoints.push(
      '【AIO 查核痛點：缺乏外部權威規範或文獻引用】\n內文未引用政府機關 (.gov)、教育學術 (.edu) 或公認行業官方標準出站連結，AIO 在進行事實交叉查核時缺乏第三方佐證信號。'
    )
  }

  if (!primary.publishDate) {
    painPoints.push(
      '【時效性痛點：缺乏內容發布與更新修訂時間戳】\n答案引擎在抓取解答與價格時高度重視時效性。未標記明確更新日期容易被判定為可能過時的資訊，降低即時對話推薦權重。'
    )
  }

  return {
    title: '3. Google AIO 診斷',
    infoDensityAnalysis,
    qaRelevanceAnalysis,
    painPoints
  }
}

/**
 * 產出優先改善建議方案
 */
const buildImprovementSection = (
  targetUrl: string,
  brandName: string,
  mainTopic: string,
  cleanTitle: string,
  primary: SinglePageAnalysis
): ImprovementSection => {
  const items: ImprovementItem[] = []

  // 結構化資料 (Schema.org)
  if (!primary.hasArticleSchema || !primary.hasFaqSchema) {
    items.push({
      order: 1,
      title: '建置 Schema.org JSON-LD 實體圖譜',
      roi: '極高',
      description: '透過標準 JSON-LD @graph 結構化標籤，將文章主題、作者專業資格、發布機構及常見常見問答一次結構化，建立強固語意網，符合最新 GEO 實體錨定標準。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "${targetUrl}#article",
      "isPartOf": {
        "@type": "WebPage",
        "@id": "${targetUrl}"
      },
      "headline": "${cleanTitle}",
      "description": "${primary.metaDescription || `${mainTopic}深度完整解析指南`}",
      "inLanguage": "zh-TW",
      "mainEntityOfPage": "${targetUrl}",
      "author": {
        "@type": "Person",
        "name": "${primary.authorTags || `${brandName} 專家團隊`}",
        "jobTitle": "資深行業專家"
      },
      "publisher": {
        "@type": "Organization",
        "name": "${brandName}",
        "url": "${targetUrl}"
      },
      "datePublished": "${primary.publishDate || new Date().toISOString().split('T')[0]}"
    },
    {
      "@type": "FAQPage",
      "@id": "${targetUrl}#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "${mainTopic}的核心重點與主要優勢為何？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "核心在於提供標準化作業流程與客觀數據佐證，能有效降低決策門檻並提升整體執行成效。"
          }
        },
        {
          "@type": "Question",
          "name": "${mainTopic}常見的迷思與注意事項有哪些？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "常見迷思在於過度依賴主觀經驗；建議參照專業標準指引，並定期檢視最新數據指標。"
          }
        }
      ]
    }
  ]
}
<\/script>`
    })
  } else {
    items.push({
      order: 1,
      title: '【程式碼級】擴充進階 E-E-A-T 專家認證與權威引述實體標記',
      roi: '高',
      description: '本頁基礎 Article 與 FAQPage 結構化資料均已就緒！建議進一步在 JSON-LD 中補充 citation 出處引述連結與 author 的 knowsAbout 專業領域屬性。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "${targetUrl}#article",
  "headline": "${cleanTitle}",
  "author": {
    "@type": "Person",
    "name": "${primary.authorTags || `${brandName} 專家團隊`}",
    "knowsAbout": ["${mainTopic}", "專業技術檢定", "產業標準規範"]
  },
  "publisher": {
    "@type": "Organization",
    "name": "${brandName}"
  }
}
<\/script>`
    })
  }

  // 標題與搜尋結構
  const titleNeedsFix = primary.title.length < 15 || primary.title.length > 65
  const metaNeedsFix = !primary.metaDescription || primary.metaDescription.length < 50
  const h1NeedsFix = primary.h1List.length !== 1
  const missingAlt = primary.missingAltCount > 0

  if (titleNeedsFix || metaNeedsFix || h1NeedsFix || missingAlt) {
    items.push({
      order: 2,
      title: '【結構級】重構 Title、Meta、H1 與圖片 alt 關鍵字佈局',
      roi: '高',
      description: '改採「核心主題痛點 + 權威指引 + 品牌」的高點擊轉化標準架構，並補齊圖片 alt 文字，確保搜尋引擎與 AI 爬蟲能精確萃取核心關鍵詞。',
      comparison: {
        beforeTitle: primary.title || '（未明確定義標題）',
        afterTitle: `${mainTopic}推薦指南：關鍵解析、流程與常見疑問解答｜${brandName}`,
        beforeMeta: primary.metaDescription || '（未設置 Meta Description）',
        afterMeta: `尋找專業可靠的${mainTopic}資訊？提供完整重點整理、標準作業指引與常見疑問解答。客觀數據無多餘宣傳，值得信賴，立即查看完整指南！`,
        beforeH1: primary.h1List[0] || '（缺失 H1 標籤）',
        afterH1: `${mainTopic} 完整深度解析指南與核心評估（2026 最新推薦）`
      }
    })
  } else {
    items.push({
      order: 2,
      title: '【權威級】深化 E-E-A-T 專業作者背書與時效性修訂機制',
      roi: '高',
      description: '本頁標題與 Meta 摘要結構優良！建議在內文頂部顯著位置植入專業作者簡介、審核標記與最後修訂時間，強化使用者與搜尋引擎的信任信號。',
      codeSnippet: `<!-- 範例：可在文章或頁面頂部植入的 E-E-A-T 專家作者與更新時間標籤 -->
<div class="author-eeat-badge" style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:20px;">
  <div style="font-weight:bold; font-size:14px; color:#1e293b;">
    👨‍🏫 本文由 <strong>${brandName} 專業團隊</strong> 撰寫與客觀審核
  </div>
  <div style="font-size:12px; color:#64748b;">
    最後審閱更新：${new Date().toISOString().split('T')[0]} ｜ 符合最新行業實務規範
  </div>
</div>`
    })
  }

  // 內容與數據指標
  if (primary.tableCount === 0) {
    items.push({
      order: 4,
      title: '植入高資訊密度比對表格與規格清單',
      roi: '極高',
      description:
        'ChatGPT、Perplexity、Claude 與 Gemini 極度偏好直接自 HTML 表格中提取指標。在內文增設條理分明的比對表格，大幅提升被 AI 引用為圖卡與解答來源的機率。',
      codeSnippet: `<!-- 範例：AIO / GEO 友善規格與重點比對表格 -->
<section class="aio-optimized-section">
  <h2>常見模式與核心指標快速比對</h2>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="background-color: #f1f5f9;">
        <th>模式類型</th>
        <th>適合情境</th>
        <th>核心優勢</th>
        <th>建議週期</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>標準模式</td>
        <td>日常維護 / 週期性作業</td>
        <td>流程簡明、耗時少、維持穩定狀態</td>
        <td>定期 3 ~ 6 個月</td>
      </tr>
      <tr>
        <td>深層模式</td>
        <td>全面檢測 / 深度優化</td>
        <td>全方位覆蓋細節、消除潛在異常</td>
        <td>每年 1 次</td>
      </tr>
    </tbody>
  </table>
</section>`
    })
  } else if (primary.citationCount === 0) {
    items.push({
      order: 3,
      title: '【內容級】增設權威出處引述',
      roi: '極高',
      description: '生成式 AI 極為重視可驗證之事實。在內文中明確標註官方標準、行業權威研究出站連結與引用區塊，能為 AI 降低生成風險並大幅提高引用置信度。',
      codeSnippet: `<!-- 範例：Princeton GEO 權威文獻引述區塊 -->
<blockquote style="border-left: 4px solid #2563eb; background: #eff6ff; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 14px; color: #1e3a8a;">
    <strong>權威參考資料：</strong>依據相關技術學會與官方標準研究指出，落實標準作業規範能有效降低 35% 以上的異常損耗率。
    <a href="https://example.gov.tw/standards" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">
      [查看官方技術文獻]
    </a>
  </p>
</blockquote>`
    })
  } else {
    items.push({
      order: 3,
      title: '【內容級】強化事實數據密度與倒金字塔解答',
      roi: '高',
      description: '本頁已具備良好的表格與引用基礎！後續關鍵在於：確保問答首句採用「結論先行」直球回答，並在內文中增補具體客觀數據（如作業時程、量化成效、費用區間），進一步鞏固 AI 引用首選地位。',
      codeSnippet: `<!-- 範例：GEO / AIO 友善的高資訊密度事實速查卡 (可置於重點段落前) -->
<div class="aio-fact-highlights" style="border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0; font-size: 16px; color: #1e293b;">⚡ ${mainTopic}：核心數據與重點速查</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: #334155;">
    <li><strong>作業時程指標</strong>：標準作業通常於 1 ~ 2 小時內完成</li>
    <li><strong>量化成效提升</strong>：依標準流程執行預計可提升約 30%~45% 效率</li>
    <li><strong>客觀參考規範</strong>：定期每 6 至 12 個月檢核一次為業界公認最佳實務</li>
    <li><strong>品質與安全保障</strong>：施作後執行完整核心功能測試與驗收</li>
  </ul>
</div>`
    })
  }

  return {
    title: '4. 優先改善建議方案',
    items
  }
}

/**
 * 彙整各診斷區塊與改善建議方案
 */
export const buildStructuredSections = (
  targetUrl: string,
  primary: SinglePageAnalysis,
  ctx: SectionContext
): StructuredSections => {
  const domain = new URL(targetUrl).hostname

  // 萃取主題關鍵字與品牌名稱
  const cleanTitle = primary.title.replace(/^[⭐★\s\d\-]+/, '').trim()
  const brandParts = cleanTitle.split(/[|｜_–—]/).map(s => s.trim()).filter(Boolean)
  const brandName = brandParts.length > 1 ? brandParts[brandParts.length - 1] : domain
  const topicParts = cleanTitle.split(/[:：|｜_–—]/).map(s => s.trim()).filter(Boolean)
  const mainTopic = topicParts[0] || primary.h1List[0] || '專業主題'

  return {
    seoSection: buildSeoSection(primary),
    geoSection: buildGeoSection(primary, ctx),
    aioSection: buildAioSection(primary),
    improvementSection: buildImprovementSection(
      targetUrl,
      brandName,
      mainTopic,
      cleanTitle,
      primary
    )
  }
}
