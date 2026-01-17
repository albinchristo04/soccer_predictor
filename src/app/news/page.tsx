'use client'

import { useState, useEffect } from 'react'

interface NewsArticle {
  id: string
  title: string
  description: string
  published: string
  image: string | null
  imageCaption?: string | null
  url: string
  type: string
  category?: string
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Soccer News</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl overflow-hidden fm-card">
                <div className="h-48" style={{ backgroundColor: 'var(--border-color)' }} />
                <div className="p-5">
                  <div className="h-4 rounded w-3/4 mb-3" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="h-3 rounded w-full mb-2" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--border-color)' }} />
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--danger)' }}>{error}</p>
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Soccer News</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Latest updates from around the football world</p>
        </div>

        {/* Featured Article */}
        {articles.length > 0 && (
          <div className="mb-10">
            <a
              href={articles[0].url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-3xl overflow-hidden border transition-all hover:border-indigo-500/50 fm-card"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto relative">
                  {articles[0].image ? (
                    <img
                      src={articles[0].image}
                      alt={articles[0].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
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
                  <h2 className="text-2xl font-bold mb-4 group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {articles[0].title}
                  </h2>
                  <p className="mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                    {articles[0].description}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(articles[0].published)}
                    </p>
                    <span className="text-indigo-400 text-sm">→ Read full article</span>
                  </div>
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
              href={article.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:shadow-indigo-500/10 fm-card"
            >
              <div className="aspect-video relative">
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--border-color)' }}>
                    <span className="text-4xl">⚽</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {article.title}
                </h3>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {article.description}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {formatDate(article.published)}
                  </p>
                  <span className="text-indigo-400 text-xs">Read more →</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">📰</span>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>No news articles available</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Check back later for updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
