import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer
} from 'docx'
import type { DiagnosticReport, DiagnosticMode } from '../../types/seo.js'
import {
  createCalloutBox,
  createCodeBlock,
  createHeaderTable,
  createScorecardTable,
  createSamplePagesTable,
  createComparisonTable
} from './wordComponents.js'

/**
 * 產出符合現代排版之 Word (.docx) 二進位緩衝區報告
 */
export const generateDiagnosticWordReport = async (
  report: DiagnosticReport,
  mode: DiagnosticMode = 'ALL'
): Promise<{ buffer: Buffer, fileName: string }> => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const fileName = `SEO_${mode}_${dateStr}_${timeStr}.docx`

  const docChildren: any[] = []

  // 1. 報告標題與副標題
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '🔍 SEO · GEO · AIO 網頁健檢診斷報告',
          bold: true,
          size: 36,
          color: '1F4E78'
        })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '2026 搜尋引擎演算法與 AI 答案引擎檢索缺陷評估報告',
          size: 22,
          color: '595959',
          italics: true
        })
      ],
      spacing: { after: 240 }
    })
  )

  // 2. 受測目標概要資訊表
  docChildren.push(
    createHeaderTable(report),
    new Paragraph({ spacing: { after: 240 } })
  )

  // 3. 綜合健康度評分矩陣
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: '📊 綜合健康度評分矩陣 (Health Scorecard)', bold: true, size: 28, color: '1F4E78' })
      ],
      spacing: { after: 140 }
    }),
    createScorecardTable(report.scores),
    new Paragraph({ spacing: { after: 280 } })
  )

  // 4. 抽查檢驗之頁面清單 (全站模式抽樣文章列表)
  if (report.allPages && report.allPages.length > 0) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '📑 抽查檢驗之頁面清單 (Audit Sample List)', bold: true, size: 28, color: '1F4E78' })
        ],
        spacing: { before: 180, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '以下為本次深入檢測之網頁清單，包含主頁與系統抽查之代表性文章完整網址：', size: 21, color: '595959' })
        ],
        spacing: { after: 120 }
      }),
      createSamplePagesTable(report.allPages),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  const { sections } = report

  // 5. 章節 1: 傳統 SEO 診斷
  if (mode === 'ALL' || mode === 'SEO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '📋 1. 傳統 SEO 診斷 (搜尋引擎優化)', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 標題與描述 (Title/Meta 分析)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.seoSection.titleMetaAnalysis, size: 22 })],
        spacing: { after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 內容品質與結構 (E-E-A-T 分析)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.seoSection.eeatAnalysis, size: 22 })],
        spacing: { after: 200 }
      }),
      // 紅色致命傷 Callout 警告框
      createCalloutBox(
        '⚠️ 痛點診斷：導致傳統 Google 排名低迷的致命傷',
        sections.seoSection.painPoints.join('\n\n'),
        'C00000',
        'FDF2F2'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // 6. 章節 2: GEO 診斷
  if (mode === 'ALL' || mode === 'GEO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '📍 2. GEO 診斷 (在地化與區域搜尋優化)', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 結構化資料 (Schema.org 檢核)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.geoSection.schemaAnalysis, size: 22 })],
        spacing: { after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 地理實體關聯 (地址、電話、服務區域)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.geoSection.geoEntityAnalysis, size: 22 })],
        spacing: { after: 200 }
      }),
      // 橙色在地隱形痛點 Callout 警告框
      createCalloutBox(
        '⚠️ 痛點診斷：為什麼在地搜尋時這家店形同隱形',
        sections.geoSection.painPoints.join('\n\n'),
        'E36209',
        'FFF8F2'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // 7. 章節 3: AIO 診斷
  if (mode === 'ALL' || mode === 'AIO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '🤖 3. AIO 診斷 (AI 答案引擎優化 / GEO)', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 資訊密度與結構 (清單、表格、廢話形容詞密度)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.aioSection.infoDensityAnalysis, size: 22 })],
        spacing: { after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 問答契合度 (FAQ 口語長尾問答)', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: sections.aioSection.qaRelevanceAnalysis, size: 22 })],
        spacing: { after: 200 }
      }),
      // 紫色 AI 忽略痛點 Callout 警告框
      createCalloutBox(
        '⚠️ 痛點診斷：Perplexity, ChatGPT, Gemini 忽略本站的核心原因',
        sections.aioSection.painPoints.join('\n\n'),
        '7030A0',
        'F8F2FC'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // 8. 章節 4: 優先改善建議方案
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🛠️ 4. 優先改善建議方案 (高 ROI 立即執行計畫)', bold: true, size: 32, color: '1F4E78' })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 160 }
    })
  )

  sections.improvementSection.items.forEach(item => {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `建議 ${item.order}: ${item.title}`, bold: true, size: 26, color: '1F4E78' })
        ],
        spacing: { before: 140, after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 預期 ROI：', bold: true }),
          new TextRun({ text: item.roi, color: '385723', bold: true })
        ],
        spacing: { after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 方案說明：', bold: true }),
          new TextRun({ text: item.description })
        ],
        spacing: { after: 140 }
      })
    )

    if (item.comparison) {
      docChildren.push(
        createComparisonTable(item.comparison),
        new Paragraph({ spacing: { after: 180 } })
      )
    }

    if (item.codeSnippet) {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: '💻 推薦植入程式碼範例：', bold: true, color: '595959' })],
          spacing: { after: 60 }
        }),
        createCodeBlock(item.codeSnippet),
        new Paragraph({ spacing: { after: 200 } })
      )
    }
  })

  // 組裝文件
  const doc = new Document({
    sections: [{
      properties: {},
      children: docChildren
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  return { buffer, fileName }
}
