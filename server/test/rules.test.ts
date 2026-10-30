import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { compileRules, parseRules } from '../src/rules/rulesStore.js'
import { validateRules } from '../src/rules/validate.js'
import { evaluateCondition, evaluateRules, renderTemplate } from '../src/rules/engine.js'
import { analyzeSinglePage } from '../src/services/diagnostic/pageAnalyzer.js'
import { evaluateDiagnostics } from '../src/services/diagnostic/scoreCalculator.js'

const rulesText = fs.readFileSync(path.join(__dirname, '../rules/rules.json'), 'utf8')
const rules = compileRules(parseRules(rulesText))

const GOOD_PAGE = `<!doctype html><html lang="zh-TW"><head>
<title>汽車電池更換費用與流程完整指南｜好車行</title>
<meta name="description" content="汽車電池多久要換？本文整理電池更換費用、更換流程與保固注意事項，並提供各車款電池規格比較表，協助你快速判斷是否需要更換電池。">
<meta name="viewport" content="width=device-width">
<meta name="author" content="王小明">
<meta property="article:published_time" content="2026-09-01">
<meta property="og:image" content="/og.png">
<link rel="canonical" href="https://example.com/battery">
<script type="application/ld+json">[{"@type":"Article"},{"@type":"Organization"}]</script>
</head><body>
<nav>首頁 | 服務 | 聯絡我們</nav>
<article>
<h1>汽車電池更換指南</h1>
<p>汽車電池是指提供引擎啟動電力的蓄電池，一般壽命約 2 到 3 年，更換費用約 2500 元至 6000 元，以下整理完整流程與注意事項。</p>
<h2>汽車電池多久要換？</h2>
<p>一般建議每 2 年或行駛 40000 km 檢查一次，電壓低於 12.4 V 時就應考慮更換。</p>
<h3>電池沒電時怎麼辦？</h3>
<ul><li>先確認車燈是否忘記關</li><li>使用救車線接電</li></ul>
<table><tr><td>規格</td><td>價格</td></tr></table>
<p>參考 <a href="https://www.moea.gov.tw/x">經濟部資料</a>，電池回收率達 95%。客服電話 02-2345-6789，地址台北市大安區忠孝東路四段100號。</p>
<img src="/a.jpg" alt="電池"><img src="/b.jpg">
</article>
<footer>© 好車行</footer>
</body></html>`

test('預設規則檔通過驗證', () => {
  assert.deepEqual(validateRules(JSON.parse(rulesText)), [])
})

test('驗證器會指出錯誤的運算子與不存在的門檻值', () => {
  const broken = JSON.parse(rulesText)
  broken.checks[0].cases[0].when = { metric: 'primary.x', op: 'bigger', value: '$thresholds.nope' }
  const errors = validateRules(broken)
  assert.ok(errors.some(e => e.includes('不支援的運算子')))
  assert.ok(errors.some(e => e.includes('不存在的門檻值 nope')))
})

test('條件運算支援 all / any / not 與門檻值引用', () => {
  const metrics = { 'a': 10, 'b': '', 'c': true }
  const t = { max: 5 }
  assert.equal(evaluateCondition({ metric: 'a', op: 'gt', value: '$thresholds.max' }, metrics, t), true)
  assert.equal(evaluateCondition({ all: [{ metric: 'c', op: 'truthy' }, { metric: 'b', op: 'falsy' }] }, metrics, t), true)
  assert.equal(evaluateCondition({ not: { any: [{ metric: 'a', op: 'lt', value: 3 }] } }, metrics, t), true)
  assert.equal(evaluateCondition({ metric: 'a', op: 'between', value: [1, 10] }, metrics, t), true)
})

test('文案佔位符替換', () => {
  assert.equal(renderTemplate('長度 {x} 字{missing}', { x: 12 }), '長度 12 字')
})

test('分析器萃取標題樹、NAP、FAQ 候選與主內容', () => {
  const page = analyzeSinglePage(GOOD_PAGE, 'https://example.com/battery', rules)
  assert.equal(page.h1List.length, 1)
  assert.deepEqual(page.headings.map(h => h.level), [1, 2, 3])
  assert.equal(page.headingSkipCount, 0)
  assert.equal(page.missingAltCount, 1)
  assert.deepEqual(page.missingAltImages, ['https://example.com/b.jpg'])
  assert.equal(page.ogImage, 'https://example.com/og.png')
  assert.ok(page.hasArticleSchema && page.hasOrganizationSchema, '頂層陣列 JSON-LD 也要能解析')
  assert.deepEqual(page.matchedPhones, ['02-2345-6789'])
  assert.equal(page.matchedAddresses.length, 1)
  assert.equal(page.faqCandidates.length, 2)
  assert.ok(page.directAnswerSnippetFound)
  assert.equal(page.contentSource, 'article')
  assert.ok(!page.aiViewText.includes('聯絡我們'), 'AI 視角應排除導覽列')
  assert.ok(page.authoritativeOutbound)
  assert.equal(page.isLikelyCsr, false)
})

test('偵測 JavaScript 渲染的空殼頁面', () => {
  const csr = '<html><body><div id="root"></div><script src="/a.js"></script></body></html>'
  const page = analyzeSinglePage(csr, 'https://example.com/', rules)
  assert.equal(page.isLikelyCsr, true)
})

test('整體評分：結構良好的頁面分數高於空白頁', () => {
  const good = analyzeSinglePage(GOOD_PAGE, 'https://example.com/battery', rules)
  const bad = analyzeSinglePage('<html><body><p>hi</p></body></html>', 'https://example.com/', rules)
  const g = evaluateDiagnostics(rules, good, [good])
  const b = evaluateDiagnostics(rules, bad, [bad])
  assert.ok(g.scores.overall > b.scores.overall)
  assert.ok(b.seoIssues.some(i => i.includes('title')))
  assert.ok(b.painPoints.seo.length > 0)
})

test('修改規則檔門檻即改變判定結果 (不需改程式)', () => {
  const page = analyzeSinglePage(GOOD_PAGE, 'https://example.com/battery', rules)
  const cfg = JSON.parse(rulesText)
  cfg.thresholds['title.maxLength'] = 10
  const strict = compileRules(cfg)
  const before = evaluateRules(rules.config, { 'primary.titleLength': page.title.length })
  const after = evaluateRules(strict.config, { 'primary.titleLength': page.title.length })
  const titleIssue = (r: typeof before) => r.findings.find(f => f.checkId === 'seo.title')?.kind
  assert.equal(titleIssue(before), 'strength')
  assert.equal(titleIssue(after), 'issue')
})
