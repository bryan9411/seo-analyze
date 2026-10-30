# SEO · GEO · AEO 網頁健檢診斷平台

專門針對**傳統搜尋引擎 SEO**、**生成式 AI 引擎 GEO** 與 **解答引擎 AEO** 的自動化網頁健檢診斷平台。提供單頁深入分析與全站抽樣探索，並能自動產出客觀評分矩陣、問題診斷、Before/After 標題對照表、Schema 範本以及匯出 Word / Markdown 健檢報告。

---

## 目錄

- [系統架構](#系統架構)
- [核心技術棧與使用套件](#核心技術棧與使用套件)
- [三大診斷維度](#三大診斷維度)
- [診斷規則設定 (可動態修改)](#診斷規則設定-可動態修改)
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
│   │   ├── app/admin/rules/    # 診斷規則線上編輯頁
│   │   ├── components/         # 儀表板、圖表、頁籤與各診斷元件 (insights/ 為頁面明細工具)
│   │   ├── lib/                # 本機歷史紀錄、網址類型判斷
│   │   └── types/              # 前端 TypeScript 介面定義 (server/src/types/seo.ts 的副本)
│   └── next.config.ts          # API 反向代理設定 (/api/* -> :3001)
├── server/                     # 後端分析 API 服務 (Express + TypeScript)
│   ├── rules/rules.json        # 診斷規則檔：門檻、配分、文案、字詞庫、AI 爬蟲清單
│   ├── test/                   # 規則引擎與分析器測試 (node:test)
│   ├── src/
│   │   ├── middleware/         # SSRF 網址防禦、滑動窗口頻率限制
│   │   ├── routes/             # 健檢 (/diagnose)、Word 匯出 (/export-word)、規則管理 (/rules)
│   │   ├── rules/              # 規則載入 / 驗證 / 熱重載、規則引擎、指標表
│   │   ├── services/
│   │   │   ├── cache/          # 診斷報告快取與同網址請求合併
│   │   │   ├── crawler/        # 網頁爬取、同網域連結探索、robots.txt / sitemap / llms.txt 探測
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

4. **頁面明細與產生器**
   - Google 搜尋結果 (桌機 / 手機，依像素寬度模擬截斷) 與 LINE / Facebook 分享卡片預覽。
   - AI 純文字視角：移除導覽列與頁尾後的主內容前 300 字，並偵測 JavaScript 渲染 (CSR) 空殼頁。
   - 標題大綱樹 (跳階、多重 H1、空白標題)、缺 alt 圖片清單、HTML 體積 / TTFB / 內嵌 Base64 圖片。
   - 自動產生 llms.txt、從內文問句標題擷取的 FAQPage JSON-LD、依台灣電話與地址產生的 LocalBusiness JSON-LD。

所有門檻與配分皆以 `server/rules/rules.json` 為準，上方數字為預設值。

---

## 診斷規則設定 (可動態修改)

評分不寫死在程式中。`server/rules/rules.json` 包含：

| 區塊 | 內容 |
| :--- | :--- |
| `thresholds` | 門檻值，例如 `title.maxLength`、`meta.minLength`、`ttfb.slowMs` |
| `dimensions` | 各維度起始分數與綜合分數權重 |
| `checks` | 逐條檢核規則：條件、加減分、嚴重度、問題 / 優勢 / 痛點文案 |
| `compliance` | 長條圖各指標的達標率配分 |
| `lexicons` / `selectors` | 宣傳詞、問答關鍵字、FAQ 問句判斷、權威網域、作者 / 日期 / 主內容選擇器 |
| `aiCrawlers` | robots.txt 檢核的 AI 爬蟲清單 |

一條檢核規則的範例 (由上而下比對，命中第一個 case 即停止)：

```json
{
  "id": "seo.title",
  "dimension": "seo",
  "cases": [
    { "when": { "metric": "primary.titleLength", "op": "eq", "value": 0 }, "delta": -25, "severity": "high", "issue": "缺乏 <title> 標籤" },
    { "when": { "metric": "primary.titleLength", "op": "gt", "value": "$thresholds.title.maxLength" }, "delta": -8, "issue": "標題過長 ({primary.titleLength} 字)" },
    { "strength": "標題長度適中 ({primary.titleLength} 字)" }
  ]
}
```

- 運算子：`eq`、`ne`、`lt`、`lte`、`gt`、`gte`、`between`、`truthy`、`falsy`、`in`、`contains`、`matches`，可用 `all` / `any` / `not` 組合。
- 指標：`primary.*` (主頁，分析結果的每個欄位都可直接使用)、`site.*` (主頁 + 抽樣頁彙總)、`robots.*`、`discovery.*`，完整清單見 `server/src/rules/metrics.ts`。
- `delta` 可寫成 `{ "per": -2, "metric": "primary.missingAltCount", "cap": -10 }` 依數量計分。

**更新方式 (都不需要重新啟動或部署)：**

1. 直接編輯 `rules.json` 存檔，伺服器會自動重新載入；格式錯誤時沿用舊規則並在 `GET /api/rules` 顯示錯誤。
2. 設定環境變數 `RULES_ADMIN_TOKEN` 後，可在前端 `/admin/rules` 頁面線上修改、驗證與還原歷史版本 (自動備份至 `server/rules/history/`)。
3. 以 `RULES_PATH` 指向外部檔案 (例如掛載的 volume)，部署環境更新規則不必重新建置映像檔。

規則版本 (`version`) 會記錄在每份報告中，快取也會隨規則更新自動失效。新增「全新的偵測方式」(例如要量測頁面上新的 HTML 特徵) 仍需修改 `pageAnalyzer.ts`。

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
| `pnpm --filter server test` | 執行規則引擎與分析器測試 |

---

## API 端點說明

### 1. 執行網頁健檢診斷
- **路徑**：`POST /api/diagnose`
- **Headers**：
  - `Content-Type: application/json`
  - `Accept: application/x-ndjson` *(選填)*：改以串流逐行回傳 `{"type":"progress"}` 進度與最後的 `{"type":"result"}`
- **Request Body**：
  ```json
  {
    "url": "https://example.com",
    "isSiteWide": false,
    "mode": "ALL",
    "force": false
  }
  ```
  - `force`：`true` 時略過 10 分鐘快取重新檢測 (快取命中不計入頻率限制)。
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
- **Response**：`{ "status": "ok", "service": "seo-diagnostic-server", "rulesVersion": "..." }`

### 4. 診斷規則管理
| 方法與路徑 | 說明 |
| :--- | :--- |
| `GET /api/rules` | 取得目前生效的規則與載入狀態 |
| `POST /api/rules/validate` | 驗證規則內容 (不儲存) |
| `PUT /api/rules` | 儲存並立即生效 *(需 `Authorization: Bearer <RULES_ADMIN_TOKEN>`)* |
| `POST /api/rules/reload` | 從磁碟重新載入 *(需密鑰)* |
| `GET /api/rules/history`、`POST /api/rules/history/:file/restore` | 列出 / 還原歷史版本 *(需密鑰)* |

---

## 資安防護與防禦機制

1. **嚴格 SSRF 伺服器端請求偽造防護**：
   - 爬蟲執行前進行嚴格網址驗證。
   - 解析主機真實 IP，防範 DNS Rebinding 攻擊。
   - 阻擋私有網段（RFC 1918、`127.0.0.0/8`、`10.0.0.0/8`、`192.168.0.0/16`、`172.16.0.0/12`）、雲端 Metadata 端點（`169.254.169.254`）與本機 Loopback IPv6。
2. **滑動窗口頻率限制**：
   - 依 IP 進行請求頻率管控（預設限制每分鐘最多 5 次分析），定期自動清理過期紀錄以避免記憶體洩漏。
3. **規則管理權限**：
   - 線上修改規則需設定 `RULES_ADMIN_TOKEN`，未設定時一律拒絕寫入；密鑰以常數時間比對。
4. **抓取體積上限**：
   - 單頁 HTML 最多讀取 5 MB，非 HTML 回應直接拒絕，避免大型檔案造成記憶體暴增。
