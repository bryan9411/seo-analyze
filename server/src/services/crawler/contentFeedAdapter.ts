import { USER_AGENT } from './httpFetcher.js'

const GET_RECENT_ARTICLES_QUERY = `
  query GetRecentArticles($offset: Int, $limit: Int) {
    articles(filters: { articleType: 2 }, offset: $offset, limit: $limit) {
      data {
        id
        title
        articleLink
      }
    }
  }
`

/**
 * 取得特定平台內容饋送 API 之文章列表
 */
export const fetchContentFeedArticles = async (
  endpointUrl: string,
  baseUrl: string,
  limit = 12
): Promise<string[]> => {
  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT
      },
      body: JSON.stringify({
        query: GET_RECENT_ARTICLES_QUERY,
        variables: { offset: 0, limit }
      })
    })

    if (!res.ok) return []
    const data = await res.json()
    const articles = data?.data?.articles?.data || []

    const cleanBase = baseUrl.replace(/\/$/, '')
    return articles
      .filter((a: { articleLink?: string }) => Boolean(a.articleLink))
      .map((a: { articleLink: string }) => `${cleanBase}/article/${a.articleLink}`)
  } catch {
    return []
  }
}
