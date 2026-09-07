import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType
} from 'docx'
import type {
  DiagnosticReport,
  DiagnosticScores,
  AuditSampleItem,
  BeforeAfterComparison
} from '../../types/seo.js'

/**
 * 建立美觀的 Callout 警告框 (支援紅、橙、紫痛點主題)
 */
export const createCalloutBox = (
  titleText: string,
  bodyText: string,
  borderColorHex = 'C00000',
  bgColorHex = 'FDF2F2'
): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: titleText,
                    bold: true,
                    color: borderColorHex,
                    size: 24
                  })
                ],
                spacing: { after: 120 }
              }),
              ...bodyText.split('\n').map(line => new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    color: '333333',
                    size: 21
                  })
                ],
                spacing: { after: 80 }
              }))
            ],
            shading: { fill: bgColorHex },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              left: { style: BorderStyle.SINGLE, size: 36, color: borderColorHex }
            }
          })
        ]
      })
    ]
  })
}

/**
 * 建立程式碼範本區塊
 */
export const createCodeBlock = (codeString: string): Table => {
  const lines = codeString.split('\n')
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: lines.map(line => new Paragraph({
              children: [
                new TextRun({
                  text: line || ' ',
                  font: 'Courier New',
                  size: 19,
                  color: '222222'
                })
              ],
              spacing: { after: 40 }
            })),
            shading: { fill: 'F4F5F7' },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'D0D5DD' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D0D5DD' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'D0D5DD' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'D0D5DD' }
            }
          })
        ]
      })
    ]
  })
}

/**
 * 建立基本摘要資訊表格
 */
export const createHeaderTable = (report: DiagnosticReport): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '受測網址', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1F4E78' },
            width: { size: 25, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph(report.targetUrl)],
            width: { size: 75, type: WidthType.PERCENTAGE }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '網頁標題', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1F4E78' }
          }),
          new TableCell({
            children: [new Paragraph(report.pageTitle || '（未明確定義）')]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '分析範疇', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1F4E78' }
          }),
          new TableCell({
            children: [new Paragraph(report.isSiteWide ? `全站抽樣深度健檢 (主頁 + ${report.analyzedPageCount - 1} 篇抽樣文章)` : '單頁專項深度診斷')]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '報告產出時間', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1F4E78' }
          }),
          new TableCell({
            children: [new Paragraph(new Date().toLocaleString('zh-TW'))]
          })
        ]
      })
    ]
  })
}

/**
 * 建立評分矩陣卡片表格
 */
export const createScorecardTable = (scores: DiagnosticScores): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '傳統 SEO 評分', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
            shading: { fill: '2F5597' }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'GEO 在地化評分', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
            shading: { fill: '2F5597' }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'AIO 答案引擎評分', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
            shading: { fill: '2F5597' }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '全站綜合能見度', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
            shading: { fill: '1F4E78' }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${scores.seo} / 100`, bold: true, size: 30, color: scores.seo >= 70 ? '385723' : 'C00000' })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${scores.geo} / 100`, bold: true, size: 30, color: scores.geo >= 70 ? '385723' : 'C00000' })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${scores.aio} / 100`, bold: true, size: 30, color: scores.aio >= 70 ? '385723' : 'C00000' })], alignment: AlignmentType.CENTER })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${scores.overall} / 100`, bold: true, size: 32, color: scores.overall >= 70 ? '1F4E78' : 'C00000' })], alignment: AlignmentType.CENTER })],
            shading: { fill: 'F2F2F2' }
          })
        ]
      })
    ]
  })
}

/**
 * 建立抽查檢驗之頁面清單表格
 */
export const createSamplePagesTable = (allPages: AuditSampleItem[]): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '序號', bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
            shading: { fill: '2F5597' },
            width: { size: 10, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '頁面類別', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '2F5597' },
            width: { size: 22, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '網頁標題 (Title)', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '2F5597' },
            width: { size: 30, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '完整檢驗網址 (URL)', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1F4E78' },
            width: { size: 38, type: WidthType.PERCENTAGE }
          })
        ]
      }),
      ...allPages.map(page => {
        let decodedUrl = page.url
        try { decodedUrl = decodeURI(page.url) } catch {}
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(page.no) })], alignment: AlignmentType.CENTER })]
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: page.type, bold: page.no === 0 })] })]
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: page.title || '（未明確定義）', size: 18 })] })]
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: decodedUrl, size: 17, color: '0563C1', underline: {} })] })]
            })
          ]
        })
      })
    ]
  })
}

/**
 * 建立 Before/After 對照表格
 */
export const createComparisonTable = (comp: BeforeAfterComparison): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '維度', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '2F5597' },
            width: { size: 20, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '改善前 (現狀)', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: 'C00000' },
            width: { size: 40, type: WidthType.PERCENTAGE }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: '建議改善後 (優化方案)', bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '385723' },
            width: { size: 40, type: WidthType.PERCENTAGE }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Title 標題', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(comp.beforeTitle)] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: comp.afterTitle, bold: true, color: '2E4053' })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Meta 描述', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(comp.beforeMeta)] }),
          new TableCell({ children: [new Paragraph(comp.afterMeta)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'H1 主標題', bold: true })] })] }),
          new TableCell({ children: [new Paragraph(comp.beforeH1)] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: comp.afterH1, bold: true, color: '2E4053' })] })] })
        ]
      })
    ]
  })
}
