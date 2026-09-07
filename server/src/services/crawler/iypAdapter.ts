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
 * 針對 life.iyp.com.tw 查詢最新代表性文章 (GraphQL Adapter)
 */
export const fetchIypSampleArticles = async (limit = 6): Promise<string[]> => {
  try {
    const res = await fetch('https://www.iyp.com.tw/graphql', {
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

    return articles
      .filter((a: { articleLink?: string }) => Boolean(a.articleLink))
      .map((a: { articleLink: string }) => `https://life.iyp.com.tw/article/${a.articleLink}`)
  } catch {
    return []
  }
}
