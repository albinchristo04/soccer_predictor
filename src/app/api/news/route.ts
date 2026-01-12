import { NextResponse } from 'next/server'

interface NewsArticle {
  id: string
  headline: string
  description: string
  published: string
  images: { url: string; caption?: string }[]
  links: { web: { href: string } }
  type: string
  categories?: { description: string }[]
}

// Sample news for when ESPN API is unavailable
function getSampleNews(): NewsArticle[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'sample-1',
      headline: 'Transfer Rumors: Manchester United eyeing summer signings',
      description: 'Manchester United are reportedly preparing a major bid for a top midfielder as they look to strengthen their squad ahead of next season.',
      published: now,
      images: [{ url: 'https://a.espncdn.com/photo/2024/0101/r1234567_1296x729_16-9.jpg', caption: 'Transfer news' }],
      links: { web: { href: 'https://www.espn.com/soccer/' } },
      type: 'Story',
      categories: [{ description: 'Transfers' }]
    },
    {
      id: 'sample-2',
      headline: 'Premier League Title Race: Liverpool vs Arsenal',
      description: 'The Premier League title race is heating up as Liverpool and Arsenal continue their battle at the top of the table.',
      published: now,
      images: [{ url: 'https://a.espncdn.com/photo/2024/0102/r1234568_1296x729_16-9.jpg', caption: 'Title race' }],
      links: { web: { href: 'https://www.espn.com/soccer/' } },
      type: 'Story',
      categories: [{ description: 'Premier League' }]
    },
    {
      id: 'sample-3',
      headline: 'Champions League Draw: Group Stage Matchups Revealed',
      description: 'The UEFA Champions League group stage draw has been completed, setting up some exciting matchups for the upcoming season.',
      published: now,
      images: [{ url: 'https://a.espncdn.com/photo/2024/0103/r1234569_1296x729_16-9.jpg', caption: 'Champions League' }],
      links: { web: { href: 'https://www.espn.com/soccer/' } },
      type: 'Story',
      categories: [{ description: 'Champions League' }]
    },
    {
      id: 'sample-4',
      headline: 'Injury Update: Key players set to return this weekend',
      description: 'Several top stars across Europe are expected to return from injury ahead of this weekend\'s crucial fixtures.',
      published: now,
      images: [{ url: 'https://a.espncdn.com/photo/2024/0104/r1234570_1296x729_16-9.jpg', caption: 'Injury news' }],
      links: { web: { href: 'https://www.espn.com/soccer/' } },
      type: 'Story',
      categories: [{ description: 'Injuries' }]
    },
    {
      id: 'sample-5',
      headline: 'La Liga: Real Madrid and Barcelona prepare for El Clasico',
      description: 'The biggest match in Spanish football approaches as both clubs look to gain an edge in the title race.',
      published: now,
      images: [{ url: 'https://a.espncdn.com/photo/2024/0105/r1234571_1296x729_16-9.jpg', caption: 'El Clasico' }],
      links: { web: { href: 'https://www.espn.com/soccer/' } },
      type: 'Story',
      categories: [{ description: 'La Liga' }]
    },
  ]
}

async function fetchESPNNews(): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/all/news',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )
    
    if (!response.ok) {
      throw new Error(`ESPN News API returned ${response.status}`)
    }
    
    const data = await response.json()
    return data.articles || []
  } catch (error) {
    console.error('Error fetching ESPN news:', error)
    return []
  }
}

export async function GET() {
  try {
    let articles = await fetchESPNNews()
    
    // Use sample news if ESPN API is unavailable
    if (articles.length === 0) {
      console.log('Using sample news data as ESPN API is unavailable')
      articles = getSampleNews()
    }
    
    // Transform to consistent format
    const news = articles.slice(0, 20).map((article: any) => ({
      id: article.id || article.headline?.replace(/\s+/g, '-').toLowerCase(),
      title: article.headline,
      description: article.description,
      published: article.published,
      image: article.images?.[0]?.url || null,
      imageCaption: article.images?.[0]?.caption || null,
      url: article.links?.web?.href || '#',
      type: article.type || 'Story',
      category: article.categories?.[0]?.description || 'Soccer',
    }))
    
    return NextResponse.json({
      articles: news,
      source: articles.length > 0 && articles[0].id?.toString().startsWith('sample') ? 'sample' : 'espn',
      count: news.length,
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    const sampleNews = getSampleNews()
    return NextResponse.json({
      articles: sampleNews.map(article => ({
        id: article.id,
        title: article.headline,
        description: article.description,
        published: article.published,
        image: article.images?.[0]?.url || null,
        url: article.links?.web?.href || '#',
        type: article.type,
        category: article.categories?.[0]?.description || 'Soccer',
      })),
      source: 'sample',
      count: sampleNews.length,
    })
  }
}
