import type { DiagnosticReport } from '@/types/seo'
import { downloadBlob, fileStem } from './download'
import { DIMENSION_LABEL, SEVERITY_LABEL, issuesOf } from './reportInsights'

export const exportWord = async (report: DiagnosticReport) => {
  const res = await fetch('/api/export-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, mode: 'ALL' })
  })
  if (!res.ok) throw new Error('匯出 Word 失敗')
  downloadBlob(await res.blob(), `${fileStem(report.targetUrl)}.docx`)
}

export const exportMarkdown = (report: DiagnosticReport) => {
  const { scores, sections, targetUrl, pageTitle, isSiteWide, analyzedPageCount, allPages } = report
  const issues = issuesOf(report)
  let md = `# SEO · GEO · AEO 網頁健檢診斷報告\n\n`
  md += `> **評估時間**：${new Date(report.timestamp).toLocaleString('zh-TW')}  \n`
  md += `> **受測網址**：${targetUrl}  \n`
  md += `> **網頁標題**：${pageTitle}  \n`
  md += `> **分析範疇**：${isSiteWide ? `全站抽樣（主頁與 ${analyzedPageCount - 1} 篇抽樣頁面）` : '單頁診斷'}  \n`
  md += `> **規則版本**：v${report.rulesVersion}\n\n`

  md += `## 綜合評分\n\n| 維度 | 分數 |\n| :--- | :---: |\n`
  md += `| 傳統 SEO | ${scores.seo} |\n| 生成式 GEO | ${scores.geo} |\n| 解答引擎 AEO | ${scores.aio} |\n| **綜合** | **${scores.overall}** |\n\n`

  if (issues.length > 0) {
    md += `## 待改善問題 (依優先順序)\n\n| 優先 | 維度 | 問題 | 影響分數 |\n| :---: | :---: | :--- | :---: |\n`
    issues.forEach(f => {
      md += `| ${SEVERITY_LABEL[f.severity ?? 'medium']} | ${DIMENSION_LABEL[f.dimension]} | ${f.message.replace(/\|/g, '-')} | ${f.delta || '-'} |\n`
    })
    md += '\n'
  }

  if (allPages.length > 1) {
    md += `## 抽查頁面\n\n| # | 單頁分數 | 標題 | 網址 |\n| :---: | :---: | :--- | :--- |\n`
    allPages.forEach(p => {
      md += `| ${p.no} | ${p.score} | ${(p.title || '').replace(/\|/g, '-')} | ${p.url} |\n`
    })
    md += '\n'
  }

  md += `## 1. 傳統 SEO 診斷\n\n${sections.seoSection.titleMetaAnalysis}\n\n${sections.seoSection.eeatAnalysis}\n\n`
  md += `## 2. 生成式 GEO 診斷\n\n${sections.geoSection.schemaAnalysis}\n\n${sections.geoSection.geoEntityAnalysis}\n\n`
  md += `## 3. 解答引擎 AEO 診斷\n\n${sections.aioSection.infoDensityAnalysis}\n\n${sections.aioSection.qaRelevanceAnalysis}\n\n`

  if (report.generated.faqJsonLd || report.generated.localBusinessJsonLd) {
    md += `## 自動產生的結構化資料\n\n`
    if (report.generated.faqJsonLd) md += `### FAQPage\n\n\`\`\`html\n${report.generated.faqJsonLd}\n\`\`\`\n\n`
    if (report.generated.localBusinessJsonLd) md += `### LocalBusiness\n\n\`\`\`html\n${report.generated.localBusinessJsonLd}\n\`\`\`\n\n`
  }
  md += `## llms.txt 建議內容\n\n\`\`\`text\n${report.generated.llmsTxt}\`\`\`\n`

  downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${fileStem(targetUrl)}.md`)
}
