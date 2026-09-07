import type { DiagnosticReport, DiagnosticMode } from '../../types/seo.js'

/**
 * 產出符合標準排版之 Markdown (.md) 格式健檢診斷文本
 */
export const generateMarkdownReport = (
  report: DiagnosticReport,
  mode: DiagnosticMode = 'ALL'
): string => {
  const { scores, sections, targetUrl, pageTitle, isSiteWide, analyzedPageCount, allPages } = report

  let md = `# 🔍 SEO · GEO · AIO 網頁健檢診斷報告\n\n`
  md += `> **評估時間**：${new Date(report.timestamp).toLocaleString('zh-TW')}  \n`
  md += `> **受測網址**：${targetUrl}  \n`
  md += `> **網頁標題**：${pageTitle}  \n`
  md += `> **分析範疇**：${isSiteWide ? `全站抽樣深度健檢 (主頁 + ${analyzedPageCount - 1} 篇抽樣頁面)` : '單頁專項深度診斷'}  \n\n`

  md += `## 📊 綜合健康度評分矩陣 (Health Scorecard)\n\n`
  md += `| 評估維度 | 評估分數 | 狀態等級 |\n`
  md += `| :--- | :---: | :--- |\n`
  md += `| **傳統 SEO (搜尋引擎優化)** | **${scores.seo}** / 100 | ${scores.seo >= 70 ? '🟢 良好' : '🔴 需深度優化'} |\n`
  md += `| **GEO (在地化地理搜尋)** | **${scores.geo}** / 100 | ${scores.geo >= 70 ? '🟢 良好' : '🔴 嚴重脫節'} |\n`
  md += `| **AIO (生成式 AI 答案引擎)** | **${scores.aio}** / 100 | ${scores.aio >= 70 ? '🟢 良好' : '🔴 容易被忽略'} |\n`
  md += `| **全站綜合搜尋能見度** | **${scores.overall}** / 100 | **${scores.overall >= 70 ? '綜合表現良好' : '急需全面改善'}** |\n\n`
  md += `---\n\n`

  // 抽查檢驗之頁面清單
  if (allPages && allPages.length > 0) {
    md += `## 📑 抽查檢驗之頁面清單 (Audit Sample List)\n\n`
    md += `以下為本次深入檢測之網頁清單，包含主頁與系統抽查之代表性文章完整網址：\n\n`
    md += `| 序號 | 頁面類別 | 網頁標題 | 完整檢驗網址 (URL) |\n`
    md += `| :---: | :--- | :--- | :--- |\n`
    allPages.forEach(page => {
      let decodedUrl = page.url
      try { decodedUrl = decodeURI(page.url) } catch {}
      const cleanTitle = (page.title || '（未明確定義）').replace(/\|/g, '-')
      md += `| ${page.no} | ${page.type} | ${cleanTitle} | [${decodedUrl}](${page.url}) |\n`
    })
    md += `\n---\n\n`
  }

  // 章節 1: 傳統 SEO 診斷
  if (mode === 'ALL' || mode === 'SEO') {
    md += `## 📋 1. 傳統 SEO 診斷 (搜尋引擎優化)\n\n`
    md += `### 標題與描述 (Title/Meta 分析)\n${sections.seoSection.titleMetaAnalysis}\n\n`
    md += `### 內容品質與結構 (E-E-A-T 分析)\n${sections.seoSection.eeatAnalysis}\n\n`
    if (sections.seoSection.painPoints.length > 0) {
      md += `> [!CAUTION]\n> ### ⚠️ 痛點診斷 (導致傳統 Google 排名低迷的致命傷)\n>\n`
      sections.seoSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷 (傳統 SEO 架構良好)\n>\n> * 經檢測，網頁 Title、Meta 與標題階層架構健全，未發現重大排名致命傷。\n>\n`
    }
    md += `\n---\n\n`
  }

  // 章節 2: GEO 診斷
  if (mode === 'ALL' || mode === 'GEO') {
    md += `## 📍 2. GEO 診斷 (在地化與區域搜尋優化)\n\n`
    md += `### 結構化資料 (Schema.org 檢核)\n${sections.geoSection.schemaAnalysis}\n\n`
    md += `### 地理實體關聯 (地址、電話、服務區域)\n${sections.geoSection.geoEntityAnalysis}\n\n`
    if (sections.geoSection.painPoints.length > 0) {
      md += `> [!WARNING]\n> ### ⚠️ 痛點診斷 (為什麼在地搜尋時這家店形同隱形)\n>\n`
      sections.geoSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷 (在地搜尋訊號完備)\n>\n> * 在地實體與 NAP 訊號完備，未發現在地搜尋隱形痛點。\n>\n`
    }
    md += `\n---\n\n`
  }

  // 章節 3: AIO 診斷
  if (mode === 'ALL' || mode === 'AIO') {
    md += `## 🤖 3. AIO 診斷 (AI 答案引擎優化 / Generative Engine Optimization)\n\n`
    md += `### 資訊密度與結構 (清單、表格、廢話形容詞密度)\n${sections.aioSection.infoDensityAnalysis}\n\n`
    md += `### 問答契合度 (FAQ 口語長尾問答)\n${sections.aioSection.qaRelevanceAnalysis}\n\n`
    if (sections.aioSection.painPoints.length > 0) {
      md += `> [!IMPORTANT]\n> ### ⚠️ 痛點診斷 (Perplexity, ChatGPT, Gemini 忽略本站的核心原因)\n>\n`
      sections.aioSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷 (AIO 結構體質良好)\n>\n> * 本頁在表格與清單結構、問答契合度上表現優良，未檢測到阻礙 AI 引用之重大結構痛點。\n>\n`
    }
    md += `\n---\n\n`
  }

  // 章節 4: 優先改善建議方案
  md += `## 🛠️ 4. 優先改善建議方案 (高 ROI 立即執行計畫)\n\n`
  sections.improvementSection.items.forEach(item => {
    md += `### 建議 ${item.order}: ${item.title}\n`
    md += `* **預期 ROI**：${item.roi}\n`
    md += `* **方案說明**：${item.description}\n\n`

    if (item.comparison) {
      md += `| 維度 | 改善前 (現況) | 建議改善後 (優化方案) |\n`
      md += `| :--- | :--- | :--- |\n`
      md += `| **Title 標題** | ${item.comparison.beforeTitle} | \`${item.comparison.afterTitle}\` |\n`
      md += `| **Meta 描述** | ${item.comparison.beforeMeta} | ${item.comparison.afterMeta} |\n`
      md += `| **H1 主標題** | ${item.comparison.beforeH1} | \`${item.comparison.afterH1}\` |\n\n`
    }

    if (item.codeSnippet) {
      md += `\`\`\`html\n${item.codeSnippet}\n\`\`\`\n\n`
    }
  })

  return md
}
