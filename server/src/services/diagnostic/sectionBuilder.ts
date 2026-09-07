import type {
  SinglePageAnalysis,
  StructuredSections,
  SeoSection,
  GeoSection,
  AioSection,
  ImprovementSection,
  ImprovementItem
} from '../../types/seo.js'
import type { EvaluationResult } from './scoreCalculator.js'

export interface SectionContext {
  totalAddresses: string[]
  totalPhones: string[]
  evalResult?: EvaluationResult
  allAnalyses?: SinglePageAnalysis[]
}

/**
 * 章節 1：傳統 SEO 診斷（依據真實 Title、Meta、H1、E-E-A-T 數據動態生成）
 */
const buildSeoSection = (primary: SinglePageAnalysis): SeoSection => {
  const titleLen = primary.title.length
  const metaLen = primary.metaDescription.length

  // 1. Title 分析
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

  // 2. Meta Description 分析
  let metaAnalysis = ''
  if (!primary.metaDescription) {
    metaAnalysis = '【Meta Description 缺失】：完全未配置 Meta Description，Google 只能由內文隨機擷取不連貫文字作為摘要，大幅削弱搜尋點擊吸引力 (CTR)。'
  } else if (metaLen < 50) {
    metaAnalysis = `【Meta 描述過短】：目前長度僅 ${metaLen} 字（「${primary.metaDescription}」），資訊量偏少，缺乏足夠的痛點描述、差異化賣點與行動號召 (CTA)。`
  } else if (metaLen > 160) {
    metaAnalysis = `【Meta 描述過長】：目前長度達 ${metaLen} 字，超過 160 字建議上限，在行動端或桌面端搜尋結果可能遭到截斷。`
  } else {
    metaAnalysis = `【Meta 描述良好】：長度為 ${metaLen} 字（符合 80-160 字黃金區間），能完整傳遞頁面核心摘要與預期內容。`
  }

  const titleMetaAnalysis = `${titleAnalysis}\n${metaAnalysis}`

  // 3. E-E-A-T 分析
  const eeatParts: string[] = ['在 E-E-A-T (經驗、專業、權威、信任) 維度檢核結果如下：']

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
      '* **作者與審核機制**：頁面未檢測到明確作者署名 (Author Byline) 或專家審查標記，內容呈現無具名狀態，容易被 Google Helpful Content System 視為缺乏權威背書的非具名內容。'
    )
  }

  if (primary.authoritativeOutbound) {
    eeatParts.push(
      `* **權威文獻與外鏈引用**：內文成功引用了政府機構 (.gov)、教育學術 (.edu) 或同業公認權威資料源（外部連結共 ${primary.outboundLinksCount} 個），事實查核可信度高。`
    )
  } else if (primary.outboundLinksCount > 0) {
    eeatParts.push(
      `* **權威文獻與外鏈引用**：檢測到 ${primary.outboundLinksCount} 個外部出站連結，但未包含高權威官方或學術站點，建議適度引述權威標準或法規報告以增強權威度 (Authoritativeness)。`
    )
  } else {
    eeatParts.push(
      '* **權威文獻與外鏈引用**：頁面無任何外部權威文獻或官方報告引用（出站連結數為 0），內容論證偏向封閉式自述。'
    )
  }

  if (primary.publishDate) {
    eeatParts.push(`* **時效性與修訂追溯**：具備明確的發布/修訂時間標記 (${primary.publishDate})，內容具備時效可追溯性。`)
  } else {
    eeatParts.push('* **時效性與修訂追溯**：未檢測到發表時間或更新紀錄 (Published/Modified Date)，搜尋引擎與讀者難以評估內容的最新時效性。')
  }

  const eeatAnalysis = eeatParts.join('\n')

  // 4. 動態收集真實痛點
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
      '【搜尋展示致命傷：完全缺失 Meta Description 摘要】\nSERP 點閱率 (CTR) 將受到嚴重衝擊，搜尋引擎將隨機抓取頁首或頁尾文字，無法向搜尋者傳達核心吸引力。'
    )
  } else if (primary.metaDescription.length < 50) {
    painPoints.push(
      `【搜尋展示弱點：Meta Description 過短 (${primary.metaDescription.length} 字)】\n摘要文字過短，缺乏行動呼籲 (CTA) 與關鍵賣點，點擊轉化潛力未充分釋放。`
    )
  }

  if (!primary.authorTags && !primary.authoritativeOutbound) {
    painPoints.push(
      '【E-E-A-T 權威空白：缺乏作者資格背書與權威引用】\n頁面無具名專家責任署名，亦無第三方權威資料佐證，難以在競爭度較高的行業核心大字中通過 Google 實用內容系統檢驗。'
    )
  }

  if (!primary.publishDate) {
    painPoints.push(
      '【時效性訊號缺失：缺乏明確日期標記】\n搜尋引擎在抓取解答型內容時重視時效 (Freshness)，缺乏更新日期將降低最新搜尋排名加權。'
    )
  }

  return {
    title: '1. 傳統 SEO 診斷 (搜尋引擎優化)',
    titleMetaAnalysis,
    eeatAnalysis,
    painPoints
  }
}

/**
 * 章節 2：GEO 在地化搜尋診斷（依據真實 LocalBusiness、NAP 與地圖訊號動態生成）
 */
const buildGeoSection = (primary: SinglePageAnalysis, ctx: SectionContext): GeoSection => {
  let schemaAnalysis = ''
  if (primary.hasLocalBusinessSchema) {
    schemaAnalysis = `【已配置在地實體結構】檢測到 Schema.org LocalBusiness (或其特定行業子類) 標記，已向搜尋引擎正式宣告實體營業身份。建議持續檢驗內部是否已完整配置 geoCoordinates (經緯度坐標)、openingHoursSpecification (營業時段) 與 telephone 屬性，確保能完全對接 Google 知識圖譜。`
  } else if (primary.hasOrganizationSchema) {
    schemaAnalysis = `【僅配置組織標記】檢測到 Schema.org Organization 組織標記，但尚未具體化為 LocalBusiness。這代表搜尋引擎知道此網站屬於某法人機構，但無法直接於 Google Maps 或在地 3-Pack 中將其定位為可到訪或提供在地到府服務的實體據點。`
  } else if (primary.detectedSchemaTypes.length > 0) {
    schemaAnalysis = `【具備內容結構化，缺少在地實體】經原始碼解析，本頁檢測到結構化資料標記（${primary.detectedSchemaTypes.join('、')}），內容語意架構良好；但目前完全缺乏 Schema.org 的 LocalBusiness 在地實體標記，Google 無法直接將內容與 Google 地圖或在地商家檔案 (GBP) 自動關聯。`
  } else {
    schemaAnalysis = `【結構化資料全滅】經爬蟲原始碼解析，本頁面完全缺乏任何 Schema.org 結構化資料標記（無 LocalBusiness, Organization 或內容型 Schema）。Google 搜尋引擎爬蟲無法將網頁內容自動轉譯為 Google 地圖與在地搜尋所需的語意實體。`
  }

  const geoParts: string[] = []

  if (ctx.totalAddresses.length > 0) {
    geoParts.push(
      `* **地址資訊明確度**：檢測到在地實體地址「${ctx.totalAddresses[0]}」${
        ctx.totalAddresses.length > 1 ? `（全站共發現 ${ctx.totalAddresses.length} 處實體地址）` : ''
      }。${
        primary.hasLocalBusinessSchema
          ? '已與在地結構化資料形成對齊。'
          : '但目前多僅為純文字展示，尚未關聯 Schema.org PostalAddress 微資料。'
      }`
    )
  } else {
    geoParts.push(
      '* **地址資訊明確度**：內文未檢測到標準台灣實體地址（縣市/行政區/路段/門牌號），地理邊界模糊，演算法難以定位核心營業區域。'
    )
  }

  if (ctx.totalPhones.length > 0) {
    geoParts.push(
      `* **電話與聯絡通道 (NAP)**：檢測到聯絡電話「${ctx.totalPhones[0]}」${
        ctx.totalPhones.length > 1 ? `（共發現 ${ctx.totalPhones.length} 組門號）` : ''
      }，具備基本聯繫渠道。建議確認網頁原始碼中均包裹標準 <a href="tel:..."> 點擊撥打標籤。`
    )
  } else {
    geoParts.push(
      '* **電話與聯絡通道 (NAP)**：未檢測到顯眼、標準格式之在地電話或客服門號，NAP (Name, Address, Phone) 完整度不足。'
    )
  }

  if (primary.hasMapEmbed) {
    geoParts.push('* **Google 地圖導引**：已配置 Google 地圖嵌入或導航超連結，在地使用者可一鍵規劃路徑。')
  } else {
    geoParts.push('* **Google 地圖導引**：頁面無 Google 地圖嵌入或 Maps 導向連結，缺乏直觀的實體位置導向與路線指引。')
  }

  if (primary.hasServiceAreaDesc) {
    geoParts.push('* **服務區域覆蓋**：內文已標記到府服務範圍或在地縣市服務區域描述，利於覆蓋周邊行政區關鍵字。')
  } else {
    geoParts.push(
      '* **服務區域覆蓋**：未明確定義「雙北到府」、「全台配送」或特定行政區服務半徑，周邊半徑 5-10 公里內的在地搜尋推薦力道受限。'
    )
  }

  const geoEntityAnalysis = geoParts.join('\n')

  const painPoints: string[] = []

  if (!primary.hasLocalBusinessSchema) {
    painPoints.push(
      '【在地隱形痛點 1：缺少 LocalBusiness 實體結構化標記，影響進入 Google Local 3-Pack】\n在地化搜尋依賴 Google 知識圖譜。因為沒有在原始碼中植入 Schema.org LocalBusiness JSON-LD，Google 無法將此網站與 Google 商家檔案 (Google Business Profile) 或實體店址建立強連結，導致地圖搜尋曝光率低。'
    )
  }

  if (ctx.totalAddresses.length === 0) {
    painPoints.push(
      '【在地隱形痛點 2：地理關鍵字與 NAP (姓名、地址、電話) 訊號缺乏實體錨點】\n當周圍潛在客戶在手機 Google 或地圖搜尋「附近 ...」或「特定區域 ... 推薦」時，演算法因無法判定該商家的實際營業地址，會優先推薦資訊完備的競品網站與地圖店家。'
    )
  }

  if (!primary.hasMapEmbed) {
    painPoints.push(
      '【在地轉換痛點：缺乏即時地圖導航與空間指引】\n缺少 Google 地圖嵌入或一鍵導航，用戶需手動複製地址至地圖查詢，增加行動端訪客的流失率。'
    )
  }

  return {
    title: '2. GEO 診斷 (在地化與區域搜尋優化)',
    schemaAnalysis,
    geoEntityAnalysis,
    painPoints
  }
}

/**
 * 章節 3：AIO 答案引擎診斷（依據真實表格、清單、FAQ Schema 與客觀數據動態生成）
 */
const buildAioSection = (primary: SinglePageAnalysis): AioSection => {
  const aioParts: string[] = [
    '2026 年最新 AI 答案引擎（Perplexity, ChatGPT Search, Gemini）仰賴高資訊密度的「事實型萃取」(Fact Extraction)。'
  ]

  if (primary.tableCount > 0) {
    aioParts.push(
      `* **表格結構 (Table Extraction)**：頁面包含 ${primary.tableCount} 組 <table> 表格。Perplexity 與 ChatGPT Search 極度偏好直接自表格提取規格、價格與比較參數，本頁在此項目具備良好的結構化優勢。`
    )
  } else {
    aioParts.push(
      `* **表格結構 (Table Extraction)**：目前頁面缺乏 <table> 結構。AI 引擎偏好直接從表格抓取價格比較、服務流程與規格參數，缺乏表格代表 AI 擷取器需要花費更多 Token 解析純文字，進而降低被選為引用來源 (Citations) 的機率。`
    )
  }

  if (primary.listCount >= 2) {
    aioParts.push(
      `* **條列式清單 (List Extraction)**：頁面包含 ${primary.listCount} 組清單（共 ${primary.listItemCount} 個項目），結構清晰分明，符合 LLM 抓取步驟流程 (How-to) 與要點整理的偏好。`
    )
  } else {
    aioParts.push(
      `* **條列式清單 (List Extraction)**：清單結構僅有 ${primary.listCount} 組，文字多以密集長段落堆疊，不利於 LLM 快速完成語意切塊 (Chunking) 與摘要生成。`
    )
  }

  if (primary.fluffCount === 0) {
    aioParts.push('* **行銷形容詞與客觀度**：內文無無效商業浮誇形容詞，資訊表達客觀平實，契合 AI 答案引擎過濾主觀宣傳語的偏好。')
  } else if (primary.fluffCount <= 5) {
    aioParts.push(
      `* **行銷形容詞與客觀度**：商業形容詞比例控制良好（發現 ${primary.fluffCount} 次），整體文字維持在客觀傳遞事實的適當水準。`
    )
  } else {
    const sampleFluff = primary.foundFluffWords.slice(0, 3).map(f => f.word).join('、')
    aioParts.push(
      `* **行銷形容詞與客觀度**：內文充斥較多主觀宣傳話術（共發現 ${primary.fluffCount} 次${
        sampleFluff ? `，如：${sampleFluff}` : ''
      }），而客觀數據比例偏低。AI 引擎在生成精煉答案時，會主動過濾掉無法被交叉驗證的主觀宣傳語。`
    )
  }

  if (primary.factualNumberCount > 0) {
    aioParts.push(
      `* **事實數據密度**：檢測到 ${primary.factualNumberCount} 個具體客觀數值（如價格、規格、時程），為 AI 答案生成提供高可信度依據。`
    )
  } else {
    aioParts.push('* **事實數據密度**：客觀數字與度量衡數值較為稀缺，缺乏硬性數據支撐。')
  }

  const infoDensityAnalysis = aioParts.join('\n')

  let qaRelevanceAnalysis = ''
  if (primary.hasFaqSchema) {
    const qCountDesc = primary.faqQuestionsCount ? `（共檢測到 ${primary.faqQuestionsCount} 組結構化問答）` : ''
    qaRelevanceAnalysis =
      `* **問答契合度 (Q&A Fit)**：頁面**已成功部署 Schema.org FAQPage 結構化資料**${qCountDesc}！這能讓 Gemini、ChatGPT 與 Perplexity 直接擷取標準問答對決模組，精準命中用戶在對話式搜尋中的口語發問意圖。\n` +
      `* **倒金字塔結構優勢**：${
        primary.matchedQuestionHeadings.length > 0
          ? `同時在內文標題中佈局了 ${primary.matchedQuestionHeadings.length} 個問答型標題（如：「${primary.matchedQuestionHeadings.slice(0, 2).join('」、「')}」），有效將用戶長尾疑慮前置。`
          : '已具備問答結構，建議確保每個問答的首段第一句均能直擊核心答案，進一步提升 AI 生成摘要的直接引用率。'
      }`
  } else if (primary.matchedQuestionHeadings.length > 0) {
    qaRelevanceAnalysis =
      `* **問答契合度 (Q&A Fit)**：內文標題中發現 ${primary.matchedQuestionHeadings.length} 個長尾問答句（如：「${primary.matchedQuestionHeadings.slice(0, 2).join('」、「')}」），具備良好口語提問基礎。**但尚未標記 Schema.org FAQPage 結構化資料**，目前仍停留於純文本，AI 搜尋引擎無法以最高置信度快速解析。\n` +
      `* **建議行動**：立即為這 ${primary.matchedQuestionHeadings.length} 個現成問答補上 FAQPage JSON-LD 標記，直接將內文優勢轉化為 AI 引用首選。`
  } else {
    qaRelevanceAnalysis =
      `* **問答契合度 (Q&A Fit)**：檢測發現頁面缺乏結構化的「問答對決模組 (FAQ)」，亦未佈局問答型標題。現代使用者在 AI 搜尋中多使用長尾口語問題（如「...怎麼辦？」、「...費用如何計算？」）。\n` +
      `* **自說自話陷阱**：內容架構多為自說自話的服務介紹與行銷陳述，未採用「倒金字塔結構」（即標題提出問題後，首段第一句直接給出具體原因與解決答案），導致 AI 答案生成模型判定本頁答案回應速度慢、直接度低。`
  }

  const painPoints: string[] = []

  if (primary.tableCount === 0) {
    painPoints.push(
      '【AI 忽視痛點 1：缺乏結構化表格，LLM 檢索增強生成 (RAG) 提取困難】\nPerplexity 與 ChatGPT Search 等生成式搜尋引擎使用 RAG 技術切分文本 (Chunks)。缺乏結構化 <table> 比較表時，向量嵌入的相似度評分偏低，容易在語意檢索階段錯失被引用的機會。'
    )
  }

  if (!primary.hasFaqSchema) {
    painPoints.push(
      '【AI 忽視痛點 2：缺乏長尾 FAQPage 模組，喪失對話型搜尋入口】\n當用戶在 Gemini 或 ChatGPT 發問求助時，AI 傾向直接引用具備 FAQPage 結構化資料、且答案明確直接的權威網站。本頁未佈局 FAQ 結構化資料，錯失了成為 AI 推薦首選來源的機會。'
    )
  }

  if (primary.fluffCount > 5) {
    painPoints.push(
      `【AI 忽視痛點 3：浮誇形容詞過多 (${primary.fluffCount} 次)，事實資訊密度被稀釋】\n當文本多為模糊形容詞而缺乏客觀數據、百分比與規格時，AI 生成模型在合成答案時會主動過濾主觀宣傳，導致本頁關鍵內容無法被採納為客觀事實。`
    )
  }

  if (primary.factualNumberCount < 5) {
    painPoints.push(
      `【事實密度痛點：客觀規格數據不足 (僅發現 ${primary.factualNumberCount} 處)】\n缺乏足夠的具體數字、工時、費用區間或規格參數，AI 引擎難以將內文作為硬事實依據進行引用。`
    )
  }

  if (!primary.authoritativeOutbound) {
    painPoints.push(
      '【AI 查核痛點：缺乏外部權威規範或文獻引用】\n內文未引用政府機關 (.gov)、教育學術 (.edu) 或公認行業官方標準出站連結，AI 答案引擎在進行事實交叉查核 (Fact-checking) 時缺乏第三方佐證信號。'
    )
  }

  if (!primary.publishDate) {
    painPoints.push(
      '【時效性痛點：缺乏內容發布與更新修訂時間戳】\n答案引擎在抓取解答與價格時高度重視時效 (Freshness)。未標記明確更新日期容易被判定為可能過時的資訊，降低即時對話推薦權重。'
    )
  }

  return {
    title: '3. AIO 診斷 (AI 答案引擎優化 / Generative Engine Optimization)',
    infoDensityAnalysis,
    qaRelevanceAnalysis,
    painPoints
  }
}

/**
 * 章節 4：優先改善建議方案（真實驗證狀態與實際缺漏項目動態決策）
 */
const buildImprovementSection = (
  targetUrl: string,
  brandName: string,
  mainTopic: string,
  primary: SinglePageAnalysis,
  sampleAddress: string,
  samplePhone: string
): ImprovementSection => {
  const items: ImprovementItem[] = []

  const locality = sampleAddress.match(/[^\s]{2,4}[市縣]/)?.[0] || '台北市'
  const streetAddress = sampleAddress.replace(/^[^\s]{2,4}[市縣]/, '').trim() || '信義路五段7號'

  // ==========================================
  // 建議 1: 結構化資料層（依據是否已有 FAQ / LocalBusiness 動態生成）
  // ==========================================
  if (!primary.hasLocalBusinessSchema && !primary.hasFaqSchema) {
    // 兩者皆無：複合植入
    items.push({
      order: 1,
      title: '【程式碼級】植入完整的 Schema.org LocalBusiness + FAQPage 複合結構化資料',
      roi: '極高 (預計 2-4 週內顯著提升 Google 地圖關聯與 AI 摘要引用率)',
      description: '在網頁 `<head>` 中植入標準 JSON-LD 代碼，將公司名稱、在地地址、電話與熱門常見問答一次結構化，同時補強 GEO 與 AIO 雙向權重。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "${targetUrl}#business",
      "name": "${brandName}",
      "url": "${targetUrl}",
      "telephone": "${samplePhone}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "${streetAddress}",
        "addressLocality": "${locality}",
        "addressCountry": "TW"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "25.033964",
        "longitude": "121.564468"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "09:00",
          "closes": "18:00"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "${targetUrl}#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "${mainTopic}服務流程如何進行？需要多久時間？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "線上預約後將於 24 小時內由專人聯繫確認，標準施作作業約需 1 至 2 小時即可完成。"
          }
        },
        {
          "@type": "Question",
          "name": "${mainTopic}費用計算方式與收費標準為何？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "服務費用採公開透明定價，現場評估後先報價再施作，絕無後續隱藏加價。"
          }
        }
      ]
    }
  ]
}
<\/script>`
    })
  } else if (!primary.hasLocalBusinessSchema && primary.hasFaqSchema) {
    // 已有 FAQ，缺少 LocalBusiness（例如 life.iyp.com.tw）
    items.push({
      order: 1,
      title: '【程式碼級】補足 Schema.org LocalBusiness 在地實體結構化資料',
      roi: '極高 (預計 2-4 週內顯著提升 Google 地圖關聯與在地 Local Pack 曝光率)',
      description: '檢測確認本頁已具備 FAQPage 結構化問答（表現優良！），但目前仍缺乏 LocalBusiness 在地商家標記。在網頁 `<head>` 中植入標準 LocalBusiness JSON-LD 代碼，將店家名稱、電話、在地地址與營業時間結構化，補足在地搜尋最後一塊拼圖。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "${targetUrl}#business",
  "name": "${brandName}",
  "url": "${targetUrl}",
  "telephone": "${samplePhone}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "${streetAddress}",
    "addressLocality": "${locality}",
    "addressCountry": "TW"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "25.033964",
    "longitude": "121.564468"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:30",
      "closes": "18:30"
    }
  ]
}
<\/script>`
    })
  } else if (primary.hasLocalBusinessSchema && !primary.hasFaqSchema) {
    // 已有 LocalBusiness，缺少 FAQPage
    items.push({
      order: 1,
      title: '【程式碼級】植入 Schema.org FAQPage 口語問答結構化資料',
      roi: '極高 (大幅增加被 Perplexity / ChatGPT Search / Gemini 摘錄為 Answer 來源)',
      description: '本頁已具備在地商家標記，但尚未配置 FAQPage 結構化問答。在網頁 `<head>` 中植入 FAQPage JSON-LD 代碼，將用戶常見痛點疑問與具體解答結構化，迎合對話型 AI 搜尋引擎。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "${targetUrl}#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "${mainTopic}需要多久施作一次？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "一般建議每 1 至 2 年定期維護保養一次；若位處馬路邊、高粉塵或商用環境，建議每年進行一次深層維護。"
      }
    },
    {
      "@type": "Question",
      "name": "${mainTopic}費用如何計算？有額外隱藏費用嗎？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "費用採公開透明單一價，施作前由技師現場檢視並出具報價單，確認同意後始進行作業，絕無隱藏費用。"
      }
    }
  ]
}
<\/script>`
    })
  } else {
    // 兩者皆具備：建議進階 E-E-A-T 評價或作者標記
    items.push({
      order: 1,
      title: '【程式碼級】擴充進階 E-E-A-T 顧客評價 (AggregateRating) 與作者實體標記',
      roi: '高 (在 SERP 搜尋結果直接展現金黃星級評價，自然點閱率提升 +20%~35%)',
      description: '本頁基礎 LocalBusiness 與 FAQPage 結構化資料均已就緒！建議進一步植入顧客評價 (AggregateRating) 與專家作者實體，最大化知識圖譜信任度。',
      codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "${targetUrl}#business",
  "name": "${brandName}",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "128",
    "bestRating": "5",
    "worstRating": "1"
  }
}
<\/script>`
    })
  }

  // ==========================================
  // 建議 2: 搜尋結構與 SERP 展示層
  // ==========================================
  const titleNeedsFix = primary.title.length < 15 || primary.title.length > 65
  const metaNeedsFix = !primary.metaDescription || primary.metaDescription.length < 50
  const h1NeedsFix = primary.h1List.length !== 1

  if (titleNeedsFix || metaNeedsFix || h1NeedsFix) {
    items.push({
      order: 2,
      title: '【結構級】重構 Title、Meta Description 與 H1/H2 階層關鍵字',
      roi: '高 (直接影響 SERP 搜尋結果排名與自然點閱率 +30%~50%)',
      description: '改採「核心主題痛點 + 服務/地域優勢 + 品牌權威」的高點擊轉化標準架構，確保搜尋引擎能精確萃取核心關鍵詞。',
      comparison: {
        beforeTitle: primary.title || '（未明確定義標題）',
        afterTitle: `${mainTopic}推薦指南：價格行情、流程與常見疑問解答｜${brandName}`,
        beforeMeta: primary.metaDescription || '（未設置 Meta Description）',
        afterMeta: `尋找專業可靠的${mainTopic}服務？提供完整費用標準、標準作業流程與常見疑問解答。透明報價無隱藏加價，在地經營深獲客戶信賴，立即查看完整指南！`,
        beforeH1: primary.h1List[0] || '（缺失 H1 標籤）',
        afterH1: `${mainTopic} 完整服務指南與費用評估（2026 最新推薦）`
      }
    })
  } else {
    // 標題與摘要都很完美時，建議強化 E-E-A-T 作者背書與修訂時效
    items.push({
      order: 2,
      title: '【權威級】深化 E-E-A-T 專業作者背書與時效性修訂機制',
      roi: '高 (提升 Google 實用內容演算法評分與關鍵字長期排名穩定性)',
      description: '本頁標題與 Meta 摘要結構優良！建議在內文頂部顯著位置植入專業作者/認證技師簡介、審核標記與最後修訂時間，強化使用者與搜尋引擎的信任信號。',
      codeSnippet: `<!-- 範例：可在文章或頁面頂部植入的 E-E-A-T 專家作者與更新時間標籤 -->
<div class="author-eeat-badge" style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:20px;">
  <div style="font-weight:bold; font-size:14px; color:#1e293b;">
    👨‍🔧 本文由 <strong>${brandName} 專業技術團隊</strong> 撰寫與審核
  </div>
  <div style="font-size:12px; color:#64748b;">
    最後審閱更新：${new Date().toISOString().split('T')[0]} ｜ 具備合格專業技術檢定認證
  </div>
</div>`
    })
  }

  // ==========================================
  // 建議 3: 內容與 AIO 答案引擎層
  // ==========================================
  if (primary.tableCount === 0) {
    items.push({
      order: 3,
      title: '【內容級】AIO 友善資訊密度重組：增設規格與費用快速比較表格',
      roi: '極高 (大幅增加被 Perplexity / ChatGPT Search / Gemini 摘錄為 Answer 來源)',
      description: 'Perplexity、Gemini 與 ChatGPT 極度偏好直接自 HTML 表格中提取價格與方案。在內文增設條理分明的比較表格 (<table>)，大幅提升被 AI 引用為 Answer 來源的機率。',
      codeSnippet: `<!-- 範例：可直接插入內文的 AIO 友善規格與方案比較表格 -->
<section class="aio-optimized-section">
  <h2>常見方案與收費標準快速比較</h2>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="background-color: #f1f5f9;">
        <th>方案名稱</th>
        <th>適合對象</th>
        <th>服務內容</th>
        <th>作業工時</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>基礎標準方案</td>
        <td>一般家庭 / 週期性保養</td>
        <td>外觀檢測、深層清潔、基本功能測試</td>
        <td>約 1 ~ 1.5 小時</td>
      </tr>
      <tr>
        <td>進階深層方案</td>
        <td>多年未保養 / 商辦門市</td>
        <td>核心部件深層拆解、高溫消毒、功能校正</td>
        <td>約 2 ~ 2.5 小時</td>
      </tr>
    </tbody>
  </table>
</section>`
    })
  } else if (!primary.hasFaqSchema) {
    items.push({
      order: 3,
      title: '【內容級】增設倒金字塔長尾口語問答模組 (FAQ)',
      roi: '極高 (精準命中 Gemini、ChatGPT 對話型搜尋口語提問)',
      description: '本頁已具備表格結構，但缺乏結構化問答。增設 3 大長尾痛點問答模組，採用「標題提出疑問、首句直接給出具體結論與數字」的倒金字塔結構，迎合現代 AI 答案引擎。',
      codeSnippet: `<!-- 範例：倒金字塔長尾 FAQ 問答模組 -->
<section class="faq-aio-module">
  <h2>大家常問的 3 大關鍵問題</h2>
  <div class="faq-item" style="margin-bottom: 16px;">
    <h3>Q1: 出現異常狀況時的第一步應該怎麼處理？</h3>
    <p><strong>立即解答：</strong>請先關閉總電源並保持通風，切勿自行強行拆解。隨後拍攝現場異常照片聯絡專業技師，可大幅避免次生損壞並節省 30% 以上維修成本。</p>
  </div>
  <div class="faq-item">
    <h3>Q2: 服務施作前需要先做什麼準備？</h3>
    <p><strong>立即解答：</strong>施作前僅需將周邊貴重物品或易受潮物件移開約 1 公尺範圍即可，專業技師會自備完整防水防護罩與專業工具施作。</p>
  </div>
</section>`
    })
  } else {
    // 同時有表格且有 FAQ（如 life.iyp.com.tw）
    items.push({
      order: 3,
      title: '【內容級】強化事實數據密度與倒金字塔解答 (擴充客觀規格與價格區間)',
      roi: '高 (提升 AI 答案生成引用置信度與回答覆蓋率)',
      description: '本頁已同時具備表格與 FAQ 結構化資料，表現優於多數同業！後續關鍵在於：確保問答首句採用「結論先行」直球回答，並在內文中增補具體客觀數據（如作業工時、費用區間、維護週期），進一步拉開與競品的差距。',
      codeSnippet: `<!-- 範例：AIO 友善的高資訊密度事實速查卡 (可置於重點段落前) -->
<div class="aio-fact-highlights" style="border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
  <h3 style="margin-top: 0; font-size: 16px; color: #1e293b;">⚡ ${mainTopic}：核心規格與服務重點速查</h3>
  <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: #334155;">
    <li><strong>標準作業工時</strong>：一般施作約 1 ~ 2 小時內完成</li>
    <li><strong>透明費用行情</strong>：單次基礎維護約 NT$ 800 ~ 1,500 元（現場評估先報價再施作）</li>
    <li><strong>建議保養頻率</strong>：市區緊鄰大馬路建議每年 1 次，一般住宅區約 1.5 ~ 2 年 1 次</li>
    <li><strong>服務品質保障</strong>：施作後提供核心功能測試與滿意保證</li>
  </ul>
</div>`
    })
  }

  return {
    title: '4. 優先改善建議方案 (高 ROI 立即執行計畫)',
    items
  }
}

/**
 * 產出符合四大結構之深度診斷分析章節與具體行動方案
 */
export const buildStructuredSections = (
  targetUrl: string,
  primary: SinglePageAnalysis,
  ctx: SectionContext
): StructuredSections => {
  const domain = new URL(targetUrl).hostname

  // 萃取主題關鍵字（例如：「⭐室外機清洗全攻略：可以直接沖水嗎？」 -> 「室外機清洗」）
  const cleanTitle = primary.title.replace(/^[⭐★\s\d\-]+/, '').trim()
  const titleParts = cleanTitle.split(/[:：|｜_–-]/).map(s => s.trim()).filter(Boolean)
  const mainTopic = titleParts[0] || primary.h1List[0] || '專業服務'
  const brandName = titleParts.length > 1 ? titleParts[titleParts.length - 1] : domain

  const sampleAddress = ctx.totalAddresses[0] || '台北市信義區信義路五段7號'
  const samplePhone = ctx.totalPhones[0] || '02-2345-6789'

  return {
    seoSection: buildSeoSection(primary),
    geoSection: buildGeoSection(primary, ctx),
    aioSection: buildAioSection(primary),
    improvementSection: buildImprovementSection(
      targetUrl,
      brandName,
      mainTopic,
      primary,
      sampleAddress,
      samplePhone
    )
  }
}
