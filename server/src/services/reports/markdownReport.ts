import type { DiagnosticReport, DiagnosticMode } from '../../types/seo.js'

/**
 * 產出 Markdown 格式健檢診斷報告
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

  md += `## 📊 綜合健康度評分矩陣\n\n`
  md += `| 評估維度 | 評估分數 | 狀態等級 |\n`
  md += `| :--- | :---: | :--- |\n`
  md += `| **傳統 SEO** | **${scores.seo}** / 100 | ${scores.seo >= 70 ? '🟢 良好' : '🔴 需深度優化'} |\n`
  md += `| **生成式 GEO** | **${scores.geo}** / 100 | ${scores.geo >= 70 ? '🟢 良好' : '🔴 缺乏引述優化'} |\n`
  md += `| **Google AIO** | **${scores.aio}** / 100 | ${scores.aio >= 70 ? '🟢 良好' : '🔴 容易被忽略'} |\n`
  md += `| **全站綜合搜尋能見度** | **${scores.overall}** / 100 | **${scores.overall >= 70 ? '綜合表現良好' : '急需全面改善'}** |\n\n`
  md += `---\n\n`

  // 抽查頁面清單
  if (allPages && allPages.length > 0) {
    md += `## 📑 抽查檢驗之頁面清單\n\n`
    md += `以下為本次深入檢測之網頁清單，包含主頁與系統抽查之代表性文章完整網址：\n\n`
    md += `| 序號 | 頁面類別 | 網頁標題 | 完整檢驗網址 |\n`
    md += `| :---: | :--- | :--- | :--- |\n`
    allPages.forEach(page => {
      let decodedUrl = page.url
      try { decodedUrl = decodeURI(page.url) } catch {}
      const cleanTitle = (page.title || '（未明確定義）').replace(/\|/g, '-')
      md += `| ${page.no} | ${page.type} | ${cleanTitle} | [${decodedUrl}](${page.url}) |\n`
    })
    md += `\n---\n\n`
  }

  // 傳統 SEO 診斷
  if (mode === 'ALL' || mode === 'SEO') {
    md += `## 📋 1. 傳統 SEO 診斷\n\n`
    md += `### 標題與描述分析\n${sections.seoSection.titleMetaAnalysis}\n\n`
    md += `### 內容品質與 E-E-A-T 架構\n${sections.seoSection.eeatAnalysis}\n\n`
    if (sections.seoSection.painPoints.length > 0) {
      md += `> [!CAUTION]\n> ### ⚠️ 痛點診斷：導致傳統 Google 排名低迷的致命傷\n>\n`
      sections.seoSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷：傳統 SEO 架構良好\n>\n> * 經檢測，網頁 Title、Meta 與標題階層架構健全，未發現重大排名致命傷。\n>\n`
    }
    md += `\n---\n\n`
  }

  // 生成式 GEO 診斷
  if (mode === 'ALL' || mode === 'GEO') {
    md += `## 🚀 2. 生成式 GEO 診斷\n\n`
    md += `### 結構化資料與實體圖譜檢核\n${sections.geoSection.schemaAnalysis}\n\n`
    md += `### 生成式優化指標：權威佐證、數據事實、直球解答\n${sections.geoSection.geoEntityAnalysis}\n\n`
    if (sections.geoSection.painPoints.length > 0) {
      md += `> [!WARNING]\n> ### ⚠️ 痛點診斷：為什麼生成式 AI 難以主動引述本站\n>\n`
      sections.geoSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷：生成式 GEO 訊號完備\n>\n> * Schema 實體圖譜與權威數據訊號完備，未檢測到生成式引擎引用痛點。\n>\n`
    }
    md += `\n---\n\n`
  }

  // Google AIO 診斷
  if (mode === 'ALL' || mode === 'AIO') {
    md += `## 🤖 3. Google AIO 診斷\n\n`
    md += `### 資訊密度與結構分析\n${sections.aioSection.infoDensityAnalysis}\n\n`
    md += `### 問答契合度與口語長尾問答\n${sections.aioSection.qaRelevanceAnalysis}\n\n`
    if (sections.aioSection.painPoints.length > 0) {
      md += `> [!IMPORTANT]\n> ### ⚠️ 痛點診斷：Google AI Overviews 難以提取為頂部答案的核心原因\n>\n`
      sections.aioSection.painPoints.forEach(p => {
        md += `> * ${p.replace(/\n/g, '\n>   ')}\n>\n`
      })
    } else {
      md += `> [!NOTE]\n> ### ✅ 優勢診斷：AIO 結構體質良好\n>\n> * 本頁在表格與清單結構、問答契合度上表現優良，未檢測到阻礙 AI 引用之重大結構痛點。\n>\n`
    }
    md += `\n---\n\n`
  }

  // 改善建議方案
  md += `## 🛠️ 4. 優先改善建議方案\n\n`
  sections.improvementSection.items.forEach(item => {
    md += `### 建議 ${item.order}: ${item.title}\n`
    md += `- **預期 ROI**：${item.roi}\n`
    md += `- **方案說明**：${item.description}\n\n`

    if (item.comparison) {
      md += `| 維度 | 改善前現狀 | 建議改善後 |\n`
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
