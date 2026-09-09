# SEO · GEO · AEO 網頁健檢診斷平台

專門針對**傳統搜尋引擎 SEO**、**生成式 AI 引擎 GEO** 與 **解答引擎 AEO** 的自動化網頁健檢診斷平台。提供單頁深入分析與全站抽樣探索，並能自動產出客觀評分矩陣、問題診斷、Before/After 標題對照表、Schema 範本以及匯出 Word / Markdown 健檢報告。

---

## 目錄

- [系統架構](#系統架構)
- [核心技術棧與使用套件](#核心技術棧與使用套件)
- [三大診斷維度](#三大診斷維度)
- [環境需求](#環境需求)
- [快速開始](#快速開始)
- [可用腳本](#可用腳本)
- [API 端點說明](#api-端點說明)
- [資安防護與防禦機制](#資安防護與防禦機制)

---

## 系統架構

專案採用 **pnpm workspace monorepo** 管理，分為前端展示層與後端分析服務：

```text
seo-analyze/
├── client/                     # 前端 Web 應用 (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/                # App Router 頁面與全域樣式
│   │   ├── components/         # 儀表板、圖表、頁籤與各診斷元件
│   │   └── types/              # 前端 TypeScript 介面定義
│   └── next.config.ts          # API 反向代理設定 (/api/* -> :3001)
├── server/                     # 後端分析 API 服務 (Express + TypeScript)
│   ├── src/
│   │   ├── middleware/         # SSRF 網址防禦、滑動窗口頻率限制
│   │   ├── routes/             # 健檢路由 (/diagnose)、Word 匯出路由 (/export-word)
│   │   ├── services/
│   │   │   ├── crawler/        # 網頁爬取、同網域連結探索、robots.txt 解析
│   │   │   ├── diagnostic/     # SEO/GEO/AEO 規則運算、評分模型、建議生成
│   │   │   └── reports/        # Word (.docx) 與 Markdown (.md) 報告生成器
│   │   └── types/              # 診斷報告資料結構定義
│   └── tsconfig.json
├── package.json                # Monorepo 根目錄腳本
└── pnpm-workspace.yaml         # Workspace 定義
```

---

## 核心技術棧與使用套件

### 前端

| 套件 | 用途說明 |
| :--- | :--- |
| **Next.js 16 (App Router)** | 前端 React 框架，提供現代化路由與 SSR/CSR 支援 |
| **React 19** | 使用者介面渲染庫 |
| **Tailwind CSS v4** | CSS 樣式庫 |
| **Recharts** | 繪製客觀事實密度圓環圖（Donut Chart）與關鍵指標達成率長條圖（Bar Chart） |
| **Framer Motion** | 頁籤切換、進度指示與卡片展開之平滑微動效 |
| **Lucide React** | 系統 UI 向量圖標庫 |
| **clsx** / **tailwind-merge** | 動態條件 class 合併與樣式衝突處理工具 |

### 後端

| 套件 | 用途說明 |
| :--- | :--- |
| **Express 4** | 輕量化 Node.js Web API 服務框架 |
| **Cheerio** | 伺服器端高效 HTML DOM 解析器，用於擷取 Title、Meta、H1~H3、圖片 Alt、JSON-LD 與文字內容 |
| **docx** | 純程式碼組裝符合 Microsoft Word 規範的 `.docx` 二進位報告，支援樣式表、Callout 提示框與對照表格 |
| **cors** | 處理跨來源資源共享中介軟體 |
| **dotenv** | 載入 `.env` 環境變數配置 |
| **tsx** | 支援 TypeScript 開發環境免編譯即時熱重載執行 |

---

## 三大診斷標準

1. **傳統 SEO (Search Engine Optimization)**
   - 檢驗 `<title>` 長度（15-65 字）與 `<h1>` 主題對齊度。
   - 檢驗 `Meta Description` 完整度與吸引力（50-160 字）。
   - 驗證全頁 `<h1>` 唯一性、圖片 `alt` 屬性缺失數。
   - 檢測基礎 E-E-A-T 信號（作者署名、發布日期、官方外鏈）。

2. **生成式 GEO 診斷**
   - 檢驗 Schema.org 實體圖譜（Article、Organization、Person）。
   - 檢測主流 AI 爬蟲存取權限（針對 GPTBot、PerplexityBot、ClaudeBot、Google-Extended 的 `robots.txt` 規則）。
   - 檢核權威文獻出處引用（Cite Sources 原則）。
   - 檢核量化客觀數據指標（Statistics Addition 原則，降低 AI 生成幻覺）。
   - 檢測開頭 1~3 段是否具備結論先行的「直球首段解答」。

3. **解答引擎 AEO 診斷 (Answer Engine Optimization)**
   - 檢核表格結構（`<table>`）與清單階層（`<ul>`、`<ol>`），利於解答引擎抽取為精選摘要與比較圖卡。
   - 檢測問答契合度：是否部署 `Schema.org/FAQPage`，以及標題是否命中口語長尾問答詞彙（如「如何」、「費用」、「差別」）。
   - 內容事實密度檢測：比對客觀數值比例 vs 商業誇飾形容詞出現頻率。

---

## 環境需求

- **Node.js**：`>= 20.9.0`（Next.js 16 最低版本限制）
- **包管理器**：`pnpm` (`>= 9.0.0`)

---

## 快速開始

### 1. 安裝依賴

於專案根目錄執行：

```bash
pnpm install
```

### 2. 本地開發模式

使用 `concurrently` 同時啟動前後端開發伺服器：

```bash
pnpm dev
```

啟動後服務端點：
- **前端儀表板**：`http://localhost:3000`
- **後端 API 伺服器**：`http://localhost:3001`
- 前端會自動透過 Next.js rewrite 將 `/api/*` 轉發至 `http://localhost:3001/api/*`。

### 3. 生產環境建置與啟動

```bash
# 建置前後端產物
pnpm build

# 啟動生產伺服器
pnpm start
```

---

## 可用腳本

根目錄可用常用命令：

| 命令 | 動作說明 |
| :--- | :--- |
| `pnpm dev` | 平行啟動前後端開發熱重載模式 |
| `pnpm build` | 執行後端 `tsc` 編譯與前端 `next build` |
| `pnpm start` | 平行啟動生產模式的前後端服務 |
| `pnpm --filter server dev` | 僅啟動後端開發伺服器 (Port 3001) |
| `pnpm --filter client dev` | 僅啟動前端開發伺服器 (Port 3000) |
| `pnpm --filter client lint` | 執行前端 ESLint 檢查 |

---

## API 端點說明

### 1. 執行網頁健檢診斷
- **路徑**：`POST /api/diagnose`
- **Headers**：
  - `Content-Type: application/json`
  - `x-gemini-key` *(選填)*：使用者自訂 Gemini API Key
  - `x-openai-key` *(選填)*：使用者自訂 OpenAI API Key
- **Request Body**：
  ```json
  {
    "url": "https://example.com",
    "isSiteWide": false,
    "mode": "ALL"
  }
  ```
  - `isSiteWide`：`false` 為單頁分析；`true` 為全站模式（自動抽樣探索最多 10 篇內部文章）。
  - `mode`：診斷範圍，可為 `"ALL"`、`"SEO"`、`"GEO"`、`"AEO"`（亦相容 `"AIO"`）。
- **Response**：回傳完整診斷資料結構，包含綜合評分、各維度問題與優勢清單、圖表指標數值與改善建議區塊。

### 2. 匯出 Word 診斷報告
- **路徑**：`POST /api/export-word`
- **Request Body**：
  ```json
  {
    "report": { /* DiagnosticReport 物件 */ },
    "mode": "ALL"
  }
  ```
- **Response**：二進位串流，標頭為 `application/vnd.openxmlformats-officedocument.wordprocessingml.document`，直接下載 `.docx` 檔案。

### 3. 系統健康檢查
- **路徑**：`GET /api/health`
- **Response**：`{ "status": "ok", "service": "seo-diagnostic-server" }`

---

## 資安防護與防禦機制

1. **嚴格 SSRF 伺服器端請求偽造防護**：
   - 爬蟲執行前進行嚴格網址驗證。
   - 解析主機真實 IP，防範 DNS Rebinding 攻擊。
   - 阻擋私有網段（RFC 1918、`127.0.0.0/8`、`10.0.0.0/8`、`192.168.0.0/16`、`172.16.0.0/12`）、雲端 Metadata 端點（`169.254.169.254`）與本機 Loopback IPv6。
2. **滑動窗口頻率限制**：
   - 依 IP 進行請求頻率管控（預設限制每分鐘最多 5 次分析），定期自動清理過期紀錄以避免記憶體洩漏。
3. **金鑰零日誌隔離**：
   - 使用者在前端設定的 API 金鑰僅保存在瀏覽器記憶體中，透過 HTTPS Header 傳送，後端僅在分析運算過程於記憶體即時使用，嚴格禁止寫入資料庫或伺服器日誌。
