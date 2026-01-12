'use client'

import { useState, useEffect } from 'react'

interface NewsArticle {
  id: string
  headline: string
  description: string
  published: string
  images: { url: string; caption?: string }[]
  links: { web: { href: string } }
  categories?: { description: string }[]
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news')
        if (!res.ok) throw new Error('Failed to fetch news')
        const data = await res.json()
        setArticles(data.articles || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-white mb-8">Soccer News</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-slate-800/50 rounded-2xl overflow-hidden">
                <div className="h-48 bg-slate-700" />
                <div className="p-5">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-700 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Soccer News</h1>
          <p className="text-slate-400">Latest updates from around the football world</p>
        </div>

        {/* Featured Article */}
        {articles.length > 0 && (
          <div className="mb-10">
            <a
              href={articles[0].links?.web?.href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto relative">
                  {articles[0].images?.[0]?.url ? (
                    <img
                      src={articles[0].images[0].url}
                      alt={articles[0].headline}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <span className="text-6xl">⚽</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">
                    {articles[0].headline}
                  </h2>
                  <p className="text-slate-300 mb-4 line-clamp-3">
                    {articles[0].description}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {formatDate(articles[0].published)}
                  </p>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(1).map((article) => (
            <a
              key={article.id}
              href={article.links?.web?.href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="aspect-video relative">
                {article.images?.[0]?.url ? (
                  <img
                    src={article.images[0].url}
                    alt={article.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <span className="text-4xl">⚽</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                  {article.headline}
                </h3>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {article.description}
                </p>
                <p className="text-slate-500 text-xs">
                  {formatDate(article.published)}
                </p>
              </div>
            </a>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📰</span>
            <p className="text-slate-400 text-lg">No news articles available</p>
            <p className="text-slate-500 text-sm mt-2">Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
