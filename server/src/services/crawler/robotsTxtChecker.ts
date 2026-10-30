import type { AiCrawlerPermission, RobotsTxtReport } from '../../types/seo.js'
import { getRules } from '../../rules/rulesStore.js'
import { fetchHtml } from './httpFetcher.js'

interface UserAgentRules {
  disallows: string[]
  allows: string[]
}

/**
 * 解析 robots.txt 文本並按 User-agent 分組
 */
const parseRobotsTxt = (content: string) => {
  const rulesMap = new Map<string, UserAgentRules>()
  const sitemaps: string[] = []
  const lines = content.split(/\r?\n/)

  let currentAgents: string[] = []
  let previousWasAgent = false

  for (const line of lines) {
    const trimmed = line.split('#')[0].trim()
    if (!trimmed) continue

    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const directive = trimmed.slice(0, colonIndex).trim().toLowerCase()
    const value = trimmed.slice(colonIndex + 1).trim()

    if (directive === 'sitemap') {
      if (/^https?:\/\//i.test(value)) sitemaps.push(value)
      continue
    }

    if (directive === 'user-agent') {
      const agent = value.toLowerCase()
      if (!previousWasAgent) {
        currentAgents = []
      }
      currentAgents.push(agent)
      if (!rulesMap.has(agent)) {
        rulesMap.set(agent, { disallows: [], allows: [] })
      }
      previousWasAgent = true
    } else if (directive === 'disallow' && currentAgents.length > 0) {
      previousWasAgent = false
      for (const agent of currentAgents) {
        const rules = rulesMap.get(agent)
        if (rules) rules.disallows.push(value)
      }
    } else if (directive === 'allow' && currentAgents.length > 0) {
      previousWasAgent = false
      for (const agent of currentAgents) {
        const rules = rulesMap.get(agent)
        if (rules) rules.allows.push(value)
      }
    } else {
      previousWasAgent = false
    }
  }

  return { rulesMap, sitemaps }
}

/**
 * 評估指定 Agent 是否被阻擋全站或核心內容
 */
const evaluateAgentStatus = (
  targetAgent: string,
  rulesMap: Map<string, UserAgentRules>
): 'allowed' | 'blocked' => {
  const agentKey = targetAgent.toLowerCase()
  const agentRules = rulesMap.get(agentKey)

  // 專屬規則優先
  if (agentRules && (agentRules.disallows.length > 0 || agentRules.allows.length > 0)) {
    const isRootDisallowed = agentRules.disallows.some(d => d === '/' || d === '/*')
    const isRootAllowed = agentRules.allows.some(a => a === '/' || a === '/*')

    if (isRootDisallowed && !isRootAllowed) {
      return 'blocked'
    }
    return 'allowed'
  }

  // 無專屬規則時，退回通用規則 User-agent: *
  const wildcardRules = rulesMap.get('*')
  if (wildcardRules) {
    const isRootDisallowed = wildcardRules.disallows.some(d => d === '/' || d === '/*')
    const isRootAllowed = wildcardRules.allows.some(a => a === '/' || a === '/*')

    if (isRootDisallowed && !isRootAllowed) {
      return 'blocked'
    }
  }

  // 預設允許
  return 'allowed'
}

/**
 * 檢核目標網域的 robots.txt 與 AI 爬蟲授權狀態
 */
export const checkRobotsTxt = async (targetUrl: string): Promise<RobotsTxtReport> => {
  const TARGET_BOTS = getRules().config.aiCrawlers
  try {
    const parsed = new URL(targetUrl)
    const robotsUrl = `${parsed.origin}/robots.txt`

    const res = await fetchHtml(robotsUrl, 8000, { maxBytes: 512 * 1024 })

    // 若 404 或未設定 robots.txt，依 RFC 9309 規範視為完全公開允許
    if (!res.ok || res.status === 404 || !res.html) {
      const crawlers: AiCrawlerPermission[] = TARGET_BOTS.map(bot => ({
        crawlerId: bot.crawlerId,
        name: bot.name,
        engine: bot.engine,
        userAgent: bot.userAgent,
        status: 'allowed',
        description: `${bot.descriptionIfAllowed}（網站未設置 robots.txt，預設全網公開允許）`,
        isCritical: bot.isCritical
      }))

      return {
        fetched: false,
        url: robotsUrl,
        contentSnippet: '（未設置 robots.txt，依搜尋引擎標準協議預設全面開放）',
        crawlers,
        allAiAllowed: true,
        blockedBotsCount: 0,
        hasCustomRules: false,
        sitemaps: []
      }
    }

    const content = res.html
    const { rulesMap, sitemaps } = parseRobotsTxt(content)
    const hasCustomRules = rulesMap.size > 0

    let blockedBotsCount = 0
    const crawlers: AiCrawlerPermission[] = TARGET_BOTS.map(bot => {
      const status = evaluateAgentStatus(bot.userAgent, rulesMap)
      if (status === 'blocked') {
        blockedBotsCount++
      }

      return {
        crawlerId: bot.crawlerId,
        name: bot.name,
        engine: bot.engine,
        userAgent: bot.userAgent,
        status,
        description: status === 'blocked' ? bot.descriptionIfBlocked : bot.descriptionIfAllowed,
        isCritical: bot.isCritical
      }
    })

    const allAiAllowed = blockedBotsCount === 0

    return {
      fetched: true,
      url: robotsUrl,
      contentSnippet: content.slice(0, 300),
      crawlers,
      allAiAllowed,
      blockedBotsCount,
      hasCustomRules,
      sitemaps
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '檢測失敗'
    // 降級容錯回傳預設允許
    const crawlers: AiCrawlerPermission[] = TARGET_BOTS.map(bot => ({
      crawlerId: bot.crawlerId,
      name: bot.name,
      engine: bot.engine,
      userAgent: bot.userAgent,
      status: 'allowed',
      description: `${bot.descriptionIfAllowed}（無法連線 robots.txt: ${message}）`,
      isCritical: bot.isCritical
    }))

    return {
      fetched: false,
      url: `${targetUrl}/robots.txt`,
      contentSnippet: '（連線逾時或受限，暫以預設開放模式評估）',
      crawlers,
      allAiAllowed: true,
      blockedBotsCount: 0,
      hasCustomRules: false,
      sitemaps: []
    }
  }
}
