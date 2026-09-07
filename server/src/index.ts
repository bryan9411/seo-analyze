import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { diagnoseRouter } from './routes/diagnose.js'
import { exportWordRouter } from './routes/exportWord.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 健康檢查端點
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'seo-diagnostic-server',
    timestamp: new Date().toISOString()
  })
})

// 註冊健檢診斷路由
app.use('/api/diagnose', diagnoseRouter)

// 註冊 Word 報告匯出路由
app.use('/api/export-word', exportWordRouter)

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
})
