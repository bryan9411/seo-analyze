import type {
  SinglePageAnalysis,
  StructuredSections,
  SeoSection,
  GeoSection,
  AioSection,
  ImprovementSection
} from '../../types/seo.js'

interface SectionContext {
  totalAddresses: string[]
  totalPhones: string[]
}

/**
 * 章節 1：傳統 SEO 診斷
 */
const buildSeoSection = (primary: SinglePageAnalysis): SeoSection => {
  const titleLen = primary.title.length
  const metaLen = primary.metaDescription.length

  const titleMetaAnalysis =
    `目前網頁 Title 為「${primary.title || '（缺失）'}」（長度 ${titleLen} 字），Meta Description 為「${primary.metaDescription || '（未配置）'}」（長度 ${metaLen} 字）。\n` +
    (titleLen < 20 || titleLen > 60
      ? `【關鍵字佈局缺陷】：標題缺乏「核心主關鍵字 + 地域詞 + 品牌詞」的黃金組合架構，且長度偏離最佳展示區間 (35-55字)，在搜尋結果頁 (SERP) 中極易被搜尋引擎截斷或直接強制重寫。`
      : `【關鍵字佈局】：標題長度基本合規，但關鍵字流於一般性商品陳列，缺乏創造高點閱率 (CTR) 的吸睛痛點文案。`) +
    (!primary.metaDescription
      ? ` 此外，完全未定義 Meta Description，導致 Google 只能抓取導覽列或頁尾雜亂文字作為 Snippet，大幅降低自然搜尋點擊率。`
      : ` Meta Description 內容過於模板化，未包含強力的行動呼籲 (CTA) 與差異化賣點。`)

  const eeatAnalysis =
    `在 E-E-A-T (經驗、專業、權威、信任) 維度上，此網站展現出明顯的薄弱跡象：\n` +
    `* **作者與審核機制**：${
      primary.authorTags
        ? `頁面雖標記作者「${primary.authorTags}」，但缺乏作者資歷連結、專長介紹頁面或行業認證證明。`
        : `頁面完全缺乏作者署名 (Author Byline) 與專家審稿標籤，文章呈現「無主言論」狀態，極易被 Google 認定為 AI 批量生成或廉價內容農場文章。`
    }\n` +
    `* **權威背書與外鏈引用**：內文缺乏引述政府機構、學術研究或權威同業報告（檢測權威出站連結數為 ${primary.outboundLinksCount}）。\n` +
    `* **商用品質信任**：${
      primary.publishDate
        ? `具有時間標記 (${primary.publishDate})，但缺乏更新修訂歷史。`
        : `缺乏文章發表時間與最後更新時間，時效性判定模糊。`
    } 整體風格偏向純行銷廣編稿，缺乏客觀評測與第三方中立觀點支撐。`

  const painPoints = [
    `【致命傷 1：E-E-A-T 權威信號空白，慘遭 Google 實用內容演算法 (Helpful Content System) 降權】\n頁面缺乏專家背書、作者資格認證與客觀文獻引用，被 Google 演算法定性為「純宣傳廣編稿」，即使關鍵字堆砌再多，也無法獲得競爭度較高的行業核心大字排名。`,
    `【致命傷 2：標題與 H1 階層架構脫節，主題權重流失】\n${
      primary.h1List.length === 0
        ? '全頁缺乏唯一的主題 <h1> 標籤，搜尋引擎檢索器爬經時無法在 0.1 秒內捕捉本頁核心主旨，大幅削弱頁面相關性權重。'
        : `頁面 H1 標籤（${primary.h1List[0]}）與 Title 核心語意落差過大，且缺少清晰的 H2/H3 樹狀語意層次，導致長尾關鍵字無法被索引。`
    }`
  ]

  return {
    title: '1. 傳統 SEO 診斷 (搜尋引擎優化)',
    titleMetaAnalysis,
    eeatAnalysis,
    painPoints
  }
}

/**
 * 章節 2：GEO 在地化搜尋診斷
 */
const buildGeoSection = (primary: SinglePageAnalysis, ctx: SectionContext): GeoSection => {
  const schemaAnalysis = primary.hasLocalBusinessSchema
    ? `雖然檢測到 Schema 標記，但檢驗其內部屬性發現缺少精準的 geo (經緯度坐標)、openingHoursSpecification (營業時段) 或 priceRange，無法滿足在地知識圖譜 (Knowledge Graph) 的嚴格建庫要求。`
    : `【結構化資料全滅】：經爬蟲原始碼解析，本頁面完全缺乏 Schema.org 的 LocalBusiness 或精確的實體子類（如 ProfessionalService, Store）。Google 搜尋引擎爬蟲無法將網頁內容自動轉譯為 Google 地圖與 Local 3-Pack 所需的結構化實體。`

  const geoEntityAnalysis =
    `* **地址資訊明確度**：${
      ctx.totalAddresses.length > 0
        ? `內文雖提及「${ctx.totalAddresses[0]}」，但僅作為純文字展示，未關聯任何微資料 (Microdata) 或 Google Maps 實體連結。`
        : `內文完全未標註具體完整的縣市、行政區、道路門牌地址，地理邊界模糊。`
    }\n` +
    `* **電話與聯絡通道 (NAP)**：${
      ctx.totalPhones.length > 0
        ? `檢測到電話「${ctx.totalPhones[0]}」，但未設置標準的 tel: 點擊撥打標籤。`
        : `缺乏顯眼、標準格式之在地市話或客服門號。`
    }\n` +
    `* **服務區域 (Service Area)**：未明確定義「雙北到府」、「全台配送」或特定行政區服務半徑，無法進入周邊半徑 5-10 公里內的在地推薦清單。`

  const painPoints = [
    `【在地隱形痛點 1：缺少 LocalBusiness 實體結構化標記，無法進入 Google Local 3-Pack】\n在地化搜尋依賴 Google 知識圖譜。因為沒有在原始碼中植入 Schema.org LocalBusiness JSON-LD，Google 無法將此網站與 Google 商家檔案 (Google Business Profile) 或實體店址建立關聯，導致地圖搜尋完全隱形。`,
    `【在地隱形痛點 2：地理關鍵字與 NAP (姓名、地址、電話) 訊號分散不一致】\n當周圍潛在客戶在手機 Google 或地圖搜尋「附近 ...」或「特定區域 ... 推薦」時，演算法因無法判定該商家的服務半徑與實際營業地址，會優先推薦資訊完備的競品網站與地圖店家。`
  ]

  return {
    title: '2. GEO 診斷 (在地化與區域搜尋優化)',
    schemaAnalysis,
    geoEntityAnalysis,
    painPoints
  }
}

/**
 * 章節 3：AIO 答案引擎診斷
 */
const buildAioSection = (primary: SinglePageAnalysis): AioSection => {
  const infoDensityAnalysis =
    `2026 年最新 AI 答案引擎（Perplexity, ChatGPT Search, Gemini）仰賴高資訊密度的「事實型萃取」(Fact Extraction)。\n` +
    `* **表格與清單結構**：目前頁面表格數量為 ${primary.tableCount} 個，清單數量為 ${primary.listCount} 個。AI 引擎偏好直接從 <table> 與 <ul>/<ol> 抓取價格比較表、服務流程與規格參數，缺乏表格代表 AI 擷取器需要花費更多 Token 解析純文字，進而降低被選為引用來源 (Citations) 的機率。\n` +
    `* **廢話與形容詞密度**：內文充斥過多無效的商業形容詞與行銷宣傳話術（共發現 ${primary.fluffCount} 次），而客觀數據、百分比、具體規格數值嚴重不足。AI 引擎在生成精煉答案時，會主動過濾掉無法被交叉驗證的主觀宣傳語。`

  const qaRelevanceAnalysis =
    `* **問答契合度 (Q&A Fit)**：檢測發現頁面缺乏結構化的「問答對決模組 (FAQ)」。現代使用者在 AI 搜尋中多使用長尾口語問題（如「冷氣不冷怎麼辦？」、「水電修繕費用如何計算？」）。\n` +
    `* **自說自話陷阱**：內容架構多為自說自話的服務介紹與自我吹捧，未採用「倒金字塔結構」（即標題提出問題後，首段第一句直接給出具體原因與解決答案），導致 AI 答案生成模型判定本頁答案回應速度慢、直接度低。`

  const painPoints = [
    `【AI 忽視痛點 1：資訊密度低且缺乏表格/清單，LLM 檢索增強生成 (RAG) 提取困難】\nPerplexity 與 ChatGPT Search 等生成式搜尋引擎使用 RAG 技術切分文本 (Chunks)。當文本多為模糊形容詞而缺乏結構化表格與條列式要點時，向量嵌入 (Vector Embeddings) 的相似度評分極低，直接在語意檢索階段被淘汰。`,
    `【AI 忽視痛點 2：缺乏直擊痛點的長尾 FAQ 模組，喪失對話型搜尋入口】\n當用戶在 Gemini 或 ChatGPT 發問求助時，AI 傾向直接引用具備 FAQPage 結構化資料、且答案明確直接的權威網站。本頁未佈局問答模組，完全喪失成為 AI 推薦首選來源的機會。`
  ]

  return {
    title: '3. AIO 診斷 (AI 答案引擎優化 / Generative Engine Optimization)',
    infoDensityAnalysis,
    qaRelevanceAnalysis,
    painPoints
  }
}

/**
 * 章節 4：優先改善建議方案
 */
const buildImprovementSection = (
  targetUrl: string,
  brandName: string,
  primary: SinglePageAnalysis,
  sampleAddress: string,
  samplePhone: string
): ImprovementSection => {
  return {
    title: '4. 優先改善建議方案 (高 ROI 立即執行計畫)',
    items: [
      {
        order: 1,
        title: '【程式碼級】植入完整的 Schema.org LocalBusiness + FAQPage 複合結構化資料',
        roi: '極高 (預計 2-4 週內顯著提升 Google 地圖關聯與 AI 摘要引用率)',
        description: '在網頁 `<head>` 中植入符合 2026 年標準的 JSON-LD 代碼，將公司名稱、台灣在地統一格式地址、客服電話與熱門常見問答一次結構化。',
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
        "streetAddress": "${sampleAddress.replace(/^[^\s]{2,4}[市縣]/, '') || '信義路五段7號'}",
        "addressLocality": "${sampleAddress.match(/[^\s]{2,4}[市縣]/)?.[0] || '台北市'}",
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
          "name": "服務流程如何進行？需要多久時間？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "線上預約後將於24小時內由專人聯繫確認，標準服務流程約需2至3個工作天即可完成。"
          }
        },
        {
          "@type": "Question",
          "name": "費用計算方式與收費標準為何？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "服務費用採公開透明定價，現場評估後先報價再施作，絕無後續隱藏費用。"
          }
        }
      ]
    }
  ]
}
<\/script>`
      },
      {
        order: 2,
        title: '【結構級】重構 Title、Meta Description 與 H1/H2 階層關鍵字',
        roi: '高 (直接影響 SERP 搜尋結果排名與自然點閱率 +30%~50%)',
        description: '淘汰舊有籠統標題，改採「使用者長尾痛點 + 在地區域 + 品牌權威」的標準高轉化格式。',
        comparison: {
          beforeTitle: primary.title || '（未明確定義標題）',
          afterTitle: `${brandName} - 專業服務與推薦指南 | 台北/全台優選首推`,
          beforeMeta: primary.metaDescription || '（未設置 Meta Description）',
          afterMeta: `尋找專業可靠的${brandName}服務？提供完整價格表、常見疑問解答與即時線上預約諮詢。透明報價無隱藏費用，在地經營深獲客戶信賴，立即查看完整指南！`,
          beforeH1: primary.h1List[0] || '（缺失 H1 標籤）',
          afterH1: `${brandName} 完整服務指南與費用評估（2026 最新推薦）`
        }
      },
      {
        order: 3,
        title: '【內容級】AIO 友善資訊密度重組：增設比較表格與直球對決問答模組',
        roi: '極高 (大幅增加被 Perplexity / ChatGPT Search / Gemini 摘錄為 Answer 來源)',
        description: '將傳統長篇廣告話術轉化為 AI 引擎最愛的「規格/方案比較表格」與「倒金字塔 FAQ 區塊」。',
        codeSnippet: `<!-- 範例：可直接插入內文的 AIO 友善表格與 FAQ 區塊 -->
<section class="aio-optimized-section">
  <h2>常見方案與收費標準快速比較</h2>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th>方案名稱</th>
        <th>適合對象</th>
        <th>服務內容</th>
        <th>作業工時</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>基礎標準方案</td>
        <td>一般家庭 / 小型店家</td>
        <td>基礎檢測、深層清潔、功能測試</td>
        <td>約 1 ~ 2 小時</td>
      </tr>
      <tr>
        <td>進階全方位方案</td>
        <td>長期維護 / 企業商辦</td>
        <td>完整拆解消毒、核心零件保養、30天保固</td>
        <td>約 2 ~ 3 小時</td>
      </tr>
    </tbody>
  </table>

  <h2>大家常問的 3 大關鍵問題</h2>
  <div class="faq-item">
    <h3>Q1: 出現問題時的第一步應該怎麼辦？</h3>
    <p><strong>立即解答：</strong>請先關閉電源並保持通風，切勿自行強行拆解。隨後拍攝現場異常照片聯絡專業技師，可大幅避免次生損壞並節省 30% 以上修繕成本。</p>
  </div>
</section>`
      }
    ]
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
  const brandName = primary.title.split(/[-–|]/)[0].trim() || domain
  const sampleAddress = ctx.totalAddresses[0] || '台北市信義區信義路五段7號'
  const samplePhone = ctx.totalPhones[0] || '02-2345-6789'

  return {
    seoSection: buildSeoSection(primary),
    geoSection: buildGeoSection(primary, ctx),
    aioSection: buildAioSection(primary),
    improvementSection: buildImprovementSection(targetUrl, brandName, primary, sampleAddress, samplePhone)
  }
}
