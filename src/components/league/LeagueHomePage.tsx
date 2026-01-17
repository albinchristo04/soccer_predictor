'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Standing {
  position: number
  teamName: string
  teamId?: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form?: string[]
}

interface TopScorer {
  rank: number
  name: string
  team: string
  goals: number
  assists: number
  matches: number
}

interface UpcomingMatch {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  venue?: string
}

interface RecentMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
}

interface NewsItem {
  headline: string
  description: string
  link?: string
  image?: string
  published: string
}

interface LeagueHomeData {
  leagueId: number
  leagueName: string
  country: string
  season: string
  standings: Standing[]
  topScorers: TopScorer[]
  upcomingMatches: UpcomingMatch[]
  recentResults: RecentMatch[]
  news: NewsItem[]
  simulation?: {
    mostLikelyChampion: string
    championProbability: number
    topFourTeams: string[]
  }
}

interface LeagueHomePageProps {
  leagueId: string
  leagueName: string
  country: string
}

const LEAGUE_CONFIGS: Record<string, { color: string; gradient: string; flag: string }> = {
  'premier_league': { color: '#3D195B', gradient: 'from-purple-900 to-purple-700', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'la_liga': { color: '#EE8707', gradient: 'from-orange-600 to-red-600', flag: '🇪🇸' },
  'bundesliga': { color: '#D20515', gradient: 'from-red-700 to-red-500', flag: '🇩🇪' },
  'serie_a': { color: '#008FD7', gradient: 'from-blue-700 to-blue-500', flag: '🇮🇹' },
  'ligue_1': { color: '#091C3E', gradient: 'from-blue-900 to-blue-700', flag: '🇫🇷' },
  'champions_league': { color: '#1A428A', gradient: 'from-blue-800 to-indigo-600', flag: '🇪🇺' },
  'europa_league': { color: '#F26F21', gradient: 'from-orange-500 to-amber-500', flag: '🇪🇺' },
  'mls': { color: '#00245D', gradient: 'from-blue-900 to-red-600', flag: '🇺🇸' },
  'world_cup': { color: '#56042C', gradient: 'from-purple-900 to-red-800', flag: '🌍' },
}

export default function LeagueHomePage({ leagueId, leagueName, country }: LeagueHomePageProps) {
  const [data, setData] = useState<LeagueHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'fixtures' | 'news'>('standings')

  const config = LEAGUE_CONFIGS[leagueId] || LEAGUE_CONFIGS['premier_league']

  useEffect(() => {
    const fetchLeagueData = async () => {
      setLoading(true)
      try {
        // Fetch data from multiple endpoints in parallel
        const [standingsRes, scorersRes, matchesRes, newsRes, simulationRes] = await Promise.allSettled([
          fetch(`/api/v1/leagues/${leagueId}/standings`),
          fetch(`/api/v1/leagues/${leagueId}/top-scorers`),
          fetch(`/api/v1/leagues/${leagueId}/matches`),
          fetch(`/api/v1/leagues/${leagueId}/news`),
          fetch(`/api/v1/leagues/${leagueId}/simulation?n_simulations=1000`),
        ])

        const leagueData: LeagueHomeData = {
          leagueId: parseInt(leagueId),
          leagueName,
          country,
          season: '2025-26',
          standings: [],
          topScorers: [],
          upcomingMatches: [],
          recentResults: [],
          news: [],
        }

        // Process standings
        if (standingsRes.status === 'fulfilled' && standingsRes.value.ok) {
          const standingsJson = await standingsRes.value.json()
          leagueData.standings = (standingsJson.standings || []).map((s: any, idx: number) => ({
            position: s.idx || idx + 1,
            teamName: s.name || s.team_name || 'Unknown',
            teamId: s.id,
            played: s.played || 0,
            won: s.wins || 0,
            drawn: s.draws || 0,
            lost: s.losses || 0,
            goalsFor: s.scoresStr?.split('-')[0] || 0,
            goalsAgainst: s.scoresStr?.split('-')[1] || 0,
            goalDiff: s.goalConDiff || 0,
            points: s.pts || 0,
          }))
        }

        // Process top scorers
        if (scorersRes.status === 'fulfilled' && scorersRes.value.ok) {
          const scorersJson = await scorersRes.value.json()
          leagueData.topScorers = (scorersJson.top_scorers || []).slice(0, 10).map((s: any, idx: number) => ({
            rank: idx + 1,
            name: s.name || 'Unknown',
            team: s.team || 'Unknown',
            goals: s.goals || 0,
            assists: s.assists || 0,
            matches: s.matches || 0,
          }))
        }

        // Process news
        if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
          const newsJson = await newsRes.value.json()
          leagueData.news = (newsJson.news || []).slice(0, 5).map((n: any) => ({
            headline: n.headline || n.title || '',
            description: n.description || n.summary || '',
            link: n.links?.web?.href || n.url || '',
            image: n.images?.[0]?.url || '',
            published: n.published || '',
          }))
        }

        // Process simulation
        if (simulationRes.status === 'fulfilled' && simulationRes.value.ok) {
          const simJson = await simulationRes.value.json()
          leagueData.simulation = {
            mostLikelyChampion: simJson.most_likely_champion || 'Unknown',
            championProbability: simJson.champion_probability || 0,
            topFourTeams: simJson.likely_top_4 || [],
          }
        }

        setData(leagueData)
      } catch (error) {
        console.error('Error fetching league data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeagueData()
  }, [leagueId, leagueName, country])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${config.gradient} py-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{config.flag}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
              <p className="text-white/80">{data?.season} Season</p>
            </div>
          </div>

          {/* Quick Stats */}
          {data?.simulation && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-sm">Title Favorite</p>
                <p className="text-white font-bold text-lg">{data.simulation.mostLikelyChampion}</p>
                <p className="text-white/80 text-sm">{(data.simulation.championProbability * 100).toFixed(1)}% chance</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-sm">Current Leader</p>
                <p className="text-white font-bold text-lg">{data?.standings[0]?.teamName || 'TBD'}</p>
                <p className="text-white/80 text-sm">{data?.standings[0]?.points || 0} points</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-sm">Top Scorer</p>
                <p className="text-white font-bold text-lg">{data?.topScorers[0]?.name || 'TBD'}</p>
                <p className="text-white/80 text-sm">{data?.topScorers[0]?.goals || 0} goals</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/70 text-sm">Matches Played</p>
                <p className="text-white font-bold text-lg">{data?.standings[0]?.played || 0}</p>
                <p className="text-white/80 text-sm">matchweeks</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b sticky top-16 z-10 bg-[var(--card-bg)]" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto">
            {(['standings', 'scorers', 'fixtures', 'news'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                {tab === 'scorers' ? 'Top Scorers' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'standings' && data?.standings && (
          <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">League Standings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--muted-bg)]">
                  <tr className="text-xs text-[var(--text-tertiary)]">
                    <th className="text-left py-3 px-4 font-medium">#</th>
                    <th className="text-left py-3 px-4 font-medium">Team</th>
                    <th className="text-center py-3 px-2 font-medium">P</th>
                    <th className="text-center py-3 px-2 font-medium">W</th>
                    <th className="text-center py-3 px-2 font-medium">D</th>
                    <th className="text-center py-3 px-2 font-medium">L</th>
                    <th className="text-center py-3 px-2 font-medium">GD</th>
                    <th className="text-center py-3 px-4 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.standings.map((team, idx) => {
                    // Determine zone coloring
                    let zoneClass = ''
                    if (idx < 4) zoneClass = 'border-l-4 border-l-green-500 bg-green-500/5'
                    else if (idx >= data.standings.length - 3) zoneClass = 'border-l-4 border-l-red-500 bg-red-500/5'
                    else if (idx < 6) zoneClass = 'border-l-4 border-l-blue-500 bg-blue-500/5'

                    return (
                      <tr
                        key={team.teamName}
                        className={`border-b hover:bg-[var(--muted-bg)] transition-colors ${zoneClass}`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{team.position}</td>
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{team.teamName}</td>
                        <td className="py-3 px-2 text-center text-[var(--text-secondary)]">{team.played}</td>
                        <td className="py-3 px-2 text-center text-green-500">{team.won}</td>
                        <td className="py-3 px-2 text-center text-[var(--text-tertiary)]">{team.drawn}</td>
                        <td className="py-3 px-2 text-center text-red-400">{team.lost}</td>
                        <td className="py-3 px-2 text-center text-[var(--text-secondary)]">
                          {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[var(--text-primary)]">{team.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="p-4 border-t flex flex-wrap gap-4 text-xs" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-[var(--text-tertiary)]">Champions League</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-[var(--text-tertiary)]">Europa League</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-[var(--text-tertiary)]">Relegation</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scorers' && data?.topScorers && (
          <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Scorers</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {data.topScorers.map((scorer) => (
                <div key={scorer.name} className="flex items-center justify-between p-4 hover:bg-[var(--muted-bg)]">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      scorer.rank <= 3 ? 'bg-amber-500 text-white' : 'bg-[var(--muted-bg)] text-[var(--text-secondary)]'
                    }`}>
                      {scorer.rank}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{scorer.name}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">{scorer.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--accent-primary)]">{scorer.goals}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{scorer.assists} assists</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Upcoming Matches */}
            <div className="bg-[var(--card-bg)] border rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming Fixtures</h2>
              </div>
              <div className="p-4">
                <p className="text-[var(--text-tertiary)] text-center py-8">
                  Upcoming matches will appear here
                </p>
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-[var(--card-bg)] border rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Results</h2>
              </div>
              <div className="p-4">
                <p className="text-[var(--text-tertiary)] text-center py-8">
                  Recent results will appear here
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-4">
            {data?.news && data.news.length > 0 ? (
              data.news.map((item, idx) => (
                <div key={idx} className="bg-[var(--card-bg)] border rounded-2xl p-4 hover:bg-[var(--muted-bg)] transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">{item.headline}</h3>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{item.description}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-primary)] mt-2 inline-block">
                      Read more →
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-[var(--card-bg)] border rounded-2xl p-8 text-center" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[var(--text-tertiary)]">No news available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
