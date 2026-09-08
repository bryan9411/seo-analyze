import type { AiCrawlerPermission, RobotsTxtReport } from '../../types/seo.js'
import { fetchHtml } from './httpFetcher.js'

interface BotTargetDef {
  crawlerId: string
  name: string
  engine: 'ChatGPT (OpenAI)' | 'Perplexity AI' | 'Claude (Anthropic)' | 'Google (Gemini/AIO)'
  userAgent: string
  isCritical: boolean
  descriptionIfAllowed: string
  descriptionIfBlocked: string
}

const TARGET_BOTS: BotTargetDef[] = [
  {
    crawlerId: 'gptbot',
    name: 'GPTBot',
    engine: 'ChatGPT (OpenAI)',
    userAgent: 'GPTBot',
    isCritical: true,
    descriptionIfAllowed: '允許 ChatGPT 抓取頁面內容以納入模型理解與答案生成',
    descriptionIfBlocked: '致命阻擋：ChatGPT 無法讀取內容，100% 失去被 ChatGPT 引用的資格'
  },
  {
    crawlerId: 'oai-searchbot',
    name: 'OAI-SearchBot',
    engine: 'ChatGPT (OpenAI)',
    userAgent: 'OAI-SearchBot',
    isCritical: true,
    descriptionIfAllowed: '允許 SearchGPT 即時搜尋並引用頁面為搜尋結果圖卡',
    descriptionIfBlocked: '致命阻擋：SearchGPT 無法即時檢索本站，無法在搜尋對話中引述'
  },
  {
    crawlerId: 'perplexitybot',
    name: 'PerplexityBot',
    engine: 'Perplexity AI',
    userAgent: 'PerplexityBot',
    isCritical: true,
    descriptionIfAllowed: '允許 Perplexity 即時檢索、深度解答並標註為權威 Sources 來源',
    descriptionIfBlocked: '致命阻擋：Perplexity 爬蟲受阻，無法生成來源卡片與即時解答'
  },
  {
    crawlerId: 'claudebot',
    name: 'ClaudeBot',
    engine: 'Claude (Anthropic)',
    userAgent: 'ClaudeBot',
    isCritical: true,
    descriptionIfAllowed: '允許 Anthropic Claude 讀取頁面文本並提供即時精準引用',
    descriptionIfBlocked: '致命阻擋：Claude 爬蟲受阻，無法造訪本站進行知識檢索與引用'
  },
  {
    crawlerId: 'google-extended',
    name: 'Google-Extended',
    engine: 'Google (Gemini/AIO)',
    userAgent: 'Google-Extended',
    isCritical: false,
    descriptionIfAllowed: '允許 Google 將本站內容用於訓練未來的 Gemini 系列模型',
    descriptionIfBlocked: '僅限制 Gemini 模型離線訓練，不影響 Google 搜尋與 AIO 摘要顯示'
  },
  {
    crawlerId: 'googlebot',
    name: 'Googlebot',
    engine: 'Google (Gemini/AIO)',
    userAgent: 'Googlebot',
    isCritical: true,
    descriptionIfAllowed: 'Google 核心爬蟲正常通行，確保傳統排名與 AIO 即時摘要資格',
    descriptionIfBlocked: '嚴重警報：Googlebot 被阻擋，傳統自然搜尋排名與 AIO 將同時歸零'
  }
]

interface UserAgentRules {
  disallows: string[]
  allows: string[]
}

/**
 * 解析 robots.txt 文本並按 User-agent 分組
 */
const parseRobotsTxt = (content: string) => {
  const rulesMap = new Map<string, UserAgentRules>()
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

  return rulesMap
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
  try {
    const parsed = new URL(targetUrl)
    const robotsUrl = `${parsed.origin}/robots.txt`

    const res = await fetchHtml(robotsUrl, 8000)

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
        hasCustomRules: false
      }
    }

    const content = res.html
    const rulesMap = parseRobotsTxt(content)
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
      hasCustomRules
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
      hasCustomRules: false
    }
  }
}
