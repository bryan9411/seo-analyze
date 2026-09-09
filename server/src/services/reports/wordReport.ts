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
 * 產出 Word (.docx) 格式報告
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

  // 標題與副標題
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

  // 目標基本資訊
  docChildren.push(
    createHeaderTable(report),
    new Paragraph({ spacing: { after: 240 } })
  )

  // 評分矩陣
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: '📊 綜合健康度評分矩陣', bold: true, size: 28, color: '1F4E78' })
      ],
      spacing: { after: 140 }
    }),
    createScorecardTable(report.scores),
    new Paragraph({ spacing: { after: 280 } })
  )

  // 抽查頁面清單
  if (report.allPages && report.allPages.length > 0) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '📑 抽查檢驗之頁面清單', bold: true, size: 28, color: '1F4E78' })
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

  const createTextParagraphs = (rawText: string, defaultAfter = 160): Paragraph[] => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    return lines.map((line, idx) => {
      const isBullet = line.startsWith('•')
      const isLast = idx === lines.length - 1
      return new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
        spacing: { after: isLast ? defaultAfter : isBullet ? 60 : 100 },
        indent: isBullet ? { left: 240 } : undefined
      })
    })
  }

  // 傳統 SEO 診斷
  if (mode === 'ALL' || mode === 'SEO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '📋 1. 傳統 SEO 診斷', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 標題與描述分析', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.seoSection.titleMetaAnalysis, 160),
      new Paragraph({
        children: [
          new TextRun({ text: '• 內容品質與 E-E-A-T 架構', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.seoSection.eeatAnalysis, 200),
      // 痛點 / 優勢提示框
      createCalloutBox(
        sections.seoSection.painPoints.length > 0
          ? '⚠️ 痛點診斷：導致傳統 Google 排名低迷的致命傷'
          : '✅ 優勢診斷：傳統 SEO 基礎架構良好',
        sections.seoSection.painPoints.length > 0
          ? sections.seoSection.painPoints.join('\n\n')
          : '經檢測，網頁 Title、Meta 與標題階層架構健全，未發現重大排名致命傷。',
        sections.seoSection.painPoints.length > 0 ? 'C00000' : '385723',
        sections.seoSection.painPoints.length > 0 ? 'FDF2F2' : 'F4FBF4'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // 生成式 GEO 診斷
  if (mode === 'ALL' || mode === 'GEO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '🚀 2. 生成式 GEO 診斷', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 結構化資料與實體圖譜檢核', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.geoSection.schemaAnalysis, 160),
      new Paragraph({
        children: [
          new TextRun({ text: '• 生成式優化指標：權威佐證、數據事實、直球解答', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.geoSection.geoEntityAnalysis, 200),
      // 痛點 / 優勢提示框
      createCalloutBox(
        sections.geoSection.painPoints.length > 0
          ? '⚠️ 痛點診斷：為什麼生成式 AI 難以主動引述本站'
          : '✅ 優勢診斷：生成式 GEO 訊號完備',
        sections.geoSection.painPoints.length > 0
          ? sections.geoSection.painPoints.join('\n\n')
          : 'Schema 實體圖譜與權威數據訊號完備，未檢測到生成式引擎引用痛點。',
        sections.geoSection.painPoints.length > 0 ? 'E36209' : '385723',
        sections.geoSection.painPoints.length > 0 ? 'FFF8F2' : 'F4FBF4'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // Google AIO 診斷
  if (mode === 'ALL' || mode === 'AIO') {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: '🤖 3. Google AIO 診斷', bold: true, size: 32, color: '1F4E78' })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 160 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• 資訊密度與結構分析', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.aioSection.infoDensityAnalysis, 160),
      new Paragraph({
        children: [
          new TextRun({ text: '• 問答契合度與口語長尾問答', bold: true, size: 24, color: '2E4053' })
        ],
        spacing: { after: 80 }
      }),
      ...createTextParagraphs(sections.aioSection.qaRelevanceAnalysis, 200),
      // 痛點 / 優勢提示框
      createCalloutBox(
        sections.aioSection.painPoints.length > 0
          ? '⚠️ 痛點診斷：Google AI Overviews 難以提取為頂部答案的核心原因'
          : '✅ 優勢診斷：Google AIO 結構體質良好',
        sections.aioSection.painPoints.length > 0
          ? sections.aioSection.painPoints.join('\n\n')
          : '本頁在表格與清單結構、問答契合度上表現優良，未檢測到阻礙 AI 引用之重大結構痛點。',
        sections.aioSection.painPoints.length > 0 ? '7030A0' : '385723',
        sections.aioSection.painPoints.length > 0 ? 'F8F2FC' : 'F4FBF4'
      ),
      new Paragraph({ spacing: { after: 320 } })
    )
  }

  // 改善建議方案
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: '🛠️ 4. 優先改善建議方案', bold: true, size: 32, color: '1F4E78' })
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
