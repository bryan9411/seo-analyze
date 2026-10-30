// dotenv 需最先載入，規則模組會讀取 RULES_PATH
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import { diagnoseRouter } from './routes/diagnose.js'
import { exportWordRouter } from './routes/exportWord.js'
import { rulesRouter } from './routes/rules.js'
import { getRulesStatus, watchRules } from './rules/rulesStore.js'

const app = express()
const PORT = process.env.PORT || 3001

app.disable('x-powered-by')
app.use(cors())
// 串流進度回應 (NDJSON) 不壓縮，避免被緩衝到結束才送出
app.use(compression({
  filter: (req, res) => !String(res.getHeader('Content-Type') || '').includes('ndjson') && compression.filter(req, res)
}))
app.use(express.json({ limit: '10mb' }))

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'seo-diagnostic-server',
    rulesVersion: getRulesStatus().version,
    timestamp: new Date().toISOString()
  })
})

// 註冊健檢診斷路由
app.use('/api/diagnose', diagnoseRouter)

// 註冊 Word 報告匯出路由
app.use('/api/export-word', exportWordRouter)

// 註冊診斷規則管理路由
app.use('/api/rules', rulesRouter)

watchRules()

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
  console.log(`📐 診斷規則 v${getRulesStatus().version}：${getRulesStatus().path}`)
})
