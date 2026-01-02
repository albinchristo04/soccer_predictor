'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { leagues, leagueFlagUrls } from '@/data/leagues'

type LiveMatch = {
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  minute: number
  status: string
  league: string
}

type TodayMatch = {
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  time?: string
  status: string
  league: string
}

function LiveScoresTicker() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/live_scores')
        if (res.ok) {
          const data = await res.json()
          setLiveMatches(data)
        }
      } catch (e) {
        console.error('Error fetching live scores:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLive()
    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 bg-slate-900/80 border-b border-slate-800">
        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-slate-400 text-sm">Checking for live matches...</span>
      </div>
    )
  }
  
  if (liveMatches.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="w-2 h-2 rounded-full bg-slate-500" />
        <span className="text-slate-400 text-sm">No live matches at the moment</span>
        <Link href="/upcoming" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
          View upcoming matches →
        </Link>
      </div>
    )
  }
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-red-900/30">
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-transparent to-red-600/5" />
      <div className="flex items-center gap-6 py-3 px-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Live</span>
        </div>
        
        <div className="flex gap-6">
          {liveMatches.map((match, idx) => (
            <div key={idx} className="flex items-center gap-3 flex-shrink-0 px-4 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <span className="text-white text-sm font-medium">{match.home_team}</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-white">{match.home_score}</span>
                <span className="text-slate-600">-</span>
                <span className="text-xl font-bold text-white">{match.away_score}</span>
              </div>
              <span className="text-white text-sm font-medium">{match.away_team}</span>
              <span className="text-red-400 text-xs font-bold animate-pulse">{match.minute}&apos;</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TodaysMatchesWidget() {
  const [matches, setMatches] = useState<{live: TodayMatch[], upcoming: TodayMatch[], completed: TodayMatch[]}>({
    live: [], upcoming: [], completed: []
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await fetch('/api/todays_matches')
        if (res.ok) {
          const data = await res.json()
          setMatches(data)
        }
      } catch (e) {
        console.error('Error fetching today matches:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchToday()
    const interval = setInterval(fetchToday, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])
  
  const totalMatches = matches.live.length + matches.upcoming.length + matches.completed.length
  
  if (loading) {
    return (
      <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800/50 p-6">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-6 bg-slate-800 rounded w-1/3" />
          <div className="h-20 bg-slate-800 rounded" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="text-xl">📆</span>
            Today&apos;s Matches
          </h3>
          <span className="text-sm text-slate-400">{totalMatches} total</span>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {matches.live.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live Now</span>
            </div>
            <div className="space-y-2">
              {matches.live.slice(0, 3).map((match, idx) => (
                <div key={idx} className="grid grid-cols-3 items-center p-3 rounded-xl bg-red-950/20 border border-red-900/30">
                  <span className="text-sm text-white text-left">{match.home_team}</span>
                  <span className="font-bold text-white text-center">{match.home_score} - {match.away_score}</span>
                  <span className="text-sm text-white text-right">{match.away_team}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {matches.upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Upcoming</span>
            </div>
            <div className="space-y-2">
              {matches.upcoming.slice(0, 3).map((match, idx) => (
                <div key={idx} className="grid grid-cols-3 items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm text-slate-300 text-left">{match.home_team}</span>
                  <span className="text-xs text-slate-500 text-center">{match.time || 'TBD'}</span>
                  <span className="text-sm text-slate-300 text-right">{match.away_team}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {totalMatches === 0 && (
          <div className="text-center py-6">
            <span className="text-3xl mb-2 block">⚽</span>
            <p className="text-slate-400 text-sm">No matches scheduled for today</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
        <Link href="/upcoming" className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors flex items-center justify-center gap-1">
          View all matches
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

function QuickStatsCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-xl`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm opacity-80 mt-1">{label}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const features = [
    {
      href: '/upcoming',
      icon: '📅',
      title: 'Match Calendar',
      description: 'Interactive calendar view with predictions and results comparison',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      href: '/predict?mode=head-to-head',
      icon: '🎯',
      title: 'Head-to-Head',
      description: 'Compare teams within the same league for detailed predictions',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      href: '/predict?mode=cross-league',
      icon: '🌍',
      title: 'Cross-League',
      description: 'Analyze hypothetical matchups between teams from different leagues',
      color: 'from-amber-500 to-orange-600'
    },
    {
      href: '/predict',
      icon: '🤖',
      title: 'AI Predictor',
      description: 'Unified ML model trained on all leagues for maximum accuracy',
      color: 'from-rose-500 to-pink-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Live Scores Ticker */}
      <LiveScoresTicker />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-slate-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-indigo-300">Real-Time AI Predictions</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                Soccer Stats
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Predictor
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 max-w-xl mb-8 leading-relaxed">
                Advanced machine learning predictions powered by a unified model trained on <span className="text-white font-semibold">100,000+ matches</span> across all major leagues.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/upcoming" 
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2 overflow-hidden"
                >
                  <span className="relative z-10">View Calendar</span>
                  <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link 
                  href="/predict" 
                  className="px-8 py-4 bg-slate-800/80 text-white font-semibold rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300 backdrop-blur-sm"
                >
                  Make Prediction
                </Link>
              </div>
            </div>
            
            {/* Today's Matches Widget */}
            <div className="lg:pl-8">
              <TodaysMatchesWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStatsCard icon="📊" value="100K+" label="Matches Analyzed" color="from-indigo-600 to-indigo-700" />
            <QuickStatsCard icon="🎯" value="72%" label="Prediction Accuracy" color="from-emerald-600 to-emerald-700" />
            <QuickStatsCard icon="⚽" value="9" label="Leagues Covered" color="from-amber-600 to-amber-700" />
            <QuickStatsCard icon="🔄" value="30s" label="Live Updates" color="from-rose-600 to-rose-700" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Explore our comprehensive suite of prediction tools and analytics
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Link 
              key={feature.href} 
              href={feature.href}
              className="group relative bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-500 overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {feature.description}
              </p>
              
              <div className="mt-4 flex items-center text-indigo-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Supported Leagues */}
      <section className="relative bg-slate-900/50 backdrop-blur-xl border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">Supported Leagues</h2>
            <p className="text-slate-400">Comprehensive coverage across the world&apos;s top competitions</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {leagues.map((league) => (
              <div 
                key={league.name}
                className="group flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer"
              >
                {leagueFlagUrls[league.country] ? (
                  <img 
                    src={leagueFlagUrls[league.country]} 
                    alt={league.country}
                    className="w-6 h-auto rounded-sm shadow-sm"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-400 bg-slate-700/50 px-2 py-1 rounded">{league.country}</span>
                )}
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{league.name}</p>
                  <p className="text-xs text-slate-500">{league.matches} matches/season</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Info Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
              <span>🧠</span>
              <span>Unified AI Model</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              One Model, All Leagues
            </h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Our unified prediction model is trained on historical data from all major leagues, enabling accurate cross-league comparisons and predictions that account for league-specific playing styles and competitive levels.
            </p>
            <ul className="space-y-3">
              {[
                'ELO-style rating system with 1500 baseline',
                'Dynamic form tracking over last 5 matches',
                'League coefficient adjustments for cross-league accuracy',
                'Real-time rating updates after each match'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800/50 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Rating Tiers</h3>
            <div className="space-y-4">
              {[
                { tier: 'Elite', range: '1700+', color: 'from-amber-400 to-amber-600', width: '100%' },
                { tier: 'Top Tier', range: '1600-1700', color: 'from-indigo-400 to-indigo-600', width: '85%' },
                { tier: 'Strong', range: '1500-1600', color: 'from-emerald-400 to-emerald-600', width: '70%' },
                { tier: 'Average', range: '1400-1500', color: 'from-slate-400 to-slate-600', width: '55%' },
                { tier: 'Below Average', range: '<1400', color: 'from-rose-400 to-rose-600', width: '40%' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white font-medium">{item.tier}</span>
                    <span className="text-slate-400">{item.range}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                      style={{ width: item.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-amber-500/10 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Disclaimer</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                This tool is for educational and entertainment purposes only. Predictions are based on historical data and machine learning models. Soccer outcomes are inherently unpredictable. Do not use for betting purposes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}