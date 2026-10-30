import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import type { CompiledRules, RulesConfig } from './types.js'
import { validateRules } from './validate.js'

/** 規則檔位置：可用 RULES_PATH 指向外部檔案 (例如掛載的 volume)，更新規則不必重新部署 */
const RULES_PATH = process.env.RULES_PATH
  ? path.resolve(process.env.RULES_PATH)
  : path.join(__dirname, '../../rules/rules.json')
const HISTORY_DIR = path.join(path.dirname(RULES_PATH), 'history')
const MAX_HISTORY = 30

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 依長度由長到短排序，避免較短的字詞先被比對走 */
const alternation = (words: string[]) =>
  [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length).map(escapeRegex).join('|')

const unitRegex = (units: string[]) =>
  new RegExp(`\\d+(?:[.,]\\d+)?\\s*(?:${alternation(units) || '(?!)'})`, 'gi')

export const compileRules = (config: RulesConfig): CompiledRules => {
  const loadedAt = new Date().toISOString()
  const { lexicons } = config
  const fluff = alternation(lexicons.fluffWords)
  const direct = alternation(lexicons.directAnswerPatterns)

  return {
    config,
    loadedAt,
    fingerprint: `${config.version}@${loadedAt}`,
    regex: {
      fluff: fluff ? new RegExp(fluff, 'g') : null,
      faqQuestion: lexicons.faqQuestionPatterns.map(src => new RegExp(src)),
      directAnswer: direct ? new RegExp(direct) : null,
      stats: unitRegex(lexicons.statsUnits),
      facts: unitRegex(lexicons.factUnits),
      authoritativeDomain: lexicons.authoritativeDomainPatterns.map(src => new RegExp(src, 'i'))
    }
  }
}

export class RulesValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`規則檔驗證失敗：\n${errors.join('\n')}`)
  }
}

/** 解析並驗證規則 JSON 文字，失敗時丟出 RulesValidationError */
export const parseRules = (text: string): RulesConfig => {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    throw new RulesValidationError([`JSON 格式錯誤：${(e as Error).message}`])
  }
  const errors = validateRules(raw)
  if (errors.length > 0) throw new RulesValidationError(errors)
  return raw as RulesConfig
}

let current: CompiledRules = compileRules(parseRules(fs.readFileSync(RULES_PATH, 'utf8')))
let lastError: string | null = null

/** 取得目前生效的規則 (每次診斷開始時呼叫一次，整次診斷使用同一份) */
export const getRules = (): CompiledRules => current

export const getRulesStatus = () => ({
  path: RULES_PATH,
  version: current.config.version,
  loadedAt: current.loadedAt,
  lastError
})

/** 從磁碟重新載入；格式錯誤時保留舊規則繼續運作 */
export const reloadRules = (): { ok: boolean, errors?: string[] } => {
  try {
    const config = parseRules(fs.readFileSync(RULES_PATH, 'utf8'))
    current = compileRules(config)
    lastError = null
    console.log(`📐 診斷規則已載入 v${config.version}`)
    return { ok: true }
  } catch (e) {
    const errors = e instanceof RulesValidationError ? e.errors : [(e as Error).message]
    lastError = errors.join('\n')
    console.error(`⚠️ 規則檔載入失敗，沿用 v${current.config.version}：\n${lastError}`)
    return { ok: false, errors }
  }
}

const backupCurrentFile = async () => {
  await fsp.mkdir(HISTORY_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  await fsp.copyFile(RULES_PATH, path.join(HISTORY_DIR, `rules-${stamp}.json`))

  const files = (await fsp.readdir(HISTORY_DIR)).filter(f => f.endsWith('.json')).sort()
  await Promise.all(files.slice(0, Math.max(0, files.length - MAX_HISTORY)).map(f => fsp.unlink(path.join(HISTORY_DIR, f))))
}

/** 驗證後寫入規則檔 (先備份舊版，再以 rename 原子替換) */
export const saveRules = async (config: RulesConfig): Promise<CompiledRules> => {
  const text = JSON.stringify(config, null, 2) + '\n'
  parseRules(text)
  await backupCurrentFile()
  const tmp = `${RULES_PATH}.${process.pid}.tmp`
  await fsp.writeFile(tmp, text, 'utf8')
  await fsp.rename(tmp, RULES_PATH)
  current = compileRules(config)
  lastError = null
  return current
}

export const listRulesHistory = async (): Promise<string[]> => {
  try {
    return (await fsp.readdir(HISTORY_DIR)).filter(f => /^rules-.*\.json$/.test(f)).sort().reverse()
  } catch {
    return []
  }
}

export const readRulesHistory = async (file: string): Promise<RulesConfig> => {
  if (!/^rules-[\w-]+\.json$/.test(file)) throw new RulesValidationError(['無效的歷史檔名'])
  return parseRules(await fsp.readFile(path.join(HISTORY_DIR, file), 'utf8'))
}

/** 監看規則檔：直接用編輯器修改 rules.json 存檔後即自動生效 */
export const watchRules = () => {
  let timer: NodeJS.Timeout | null = null
  const target = path.basename(RULES_PATH)
  try {
    fs.watch(path.dirname(RULES_PATH), (_event, filename) => {
      if (filename && filename.toString() !== target) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        if (fs.existsSync(RULES_PATH)) reloadRules()
      }, 300)
    }).unref()
  } catch (e) {
    console.error('⚠️ 無法監看規則檔變更：', (e as Error).message)
  }
}
