'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface MatchEvent {
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution'
  minute: number
  player: string
  team: 'home' | 'away'
  relatedPlayer?: string
}

interface MatchDetails {
  id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string
  minute?: number
  venue?: string
  date: string
  league: string
  events: MatchEvent[]
  lineups: {
    home: string[]
    away: string[]
  }
  stats: {
    possession: [number, number]
    shots: [number, number]
    shotsOnTarget: [number, number]
    corners: [number, number]
    fouls: [number, number]
  }
  h2h: {
    homeWins: number
    draws: number
    awayWins: number
    recentMatches: { home_score: number; away_score: number; date: string }[]
  }
}

// Map league IDs for ESPN API
const LEAGUE_ENDPOINTS = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'usa.1', 'uefa.champions', 'uefa.europa'
]

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = params.id as string
  const leagueId = searchParams.get('league') || ''
  
  const [match, setMatch] = useState<MatchDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'summary' | 'lineup' | 'stats' | 'h2h'>('summary')

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        // Try fetching from different league endpoints until we find the match
        let matchData = null
        
        // If league ID is provided, try that first
        if (leagueId) {
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/summary?event=${matchId}`)
          if (res.ok) {
            matchData = await res.json()
          }
        }
        
        // If no data yet, try each league endpoint
        if (!matchData || !matchData.header) {
          for (const league of LEAGUE_ENDPOINTS) {
            try {
              const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${matchId}`)
              if (res.ok) {
                const data = await res.json()
                if (data.header?.competitions?.[0]) {
                  matchData = data
                  break
                }
              }
            } catch {
              continue
            }
          }
        }
        
        if (matchData && matchData.header) {
          const data = matchData
          const competition = data.header?.competitions?.[0]
          const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home')
          const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away')
          
          // Extract events/scoring plays
          const events: MatchEvent[] = []
          const scoringPlays = data.scoringPlays || []
          for (const play of scoringPlays) {
            events.push({
              type: 'goal',
              minute: parseInt(play.clock?.displayValue) || 0,
              player: play.scoringPlay?.scorer?.athlete?.displayName || play.text || 'Unknown',
              team: play.homeAway === 'home' ? 'home' : 'away',
              relatedPlayer: play.scoringPlay?.assists?.[0]?.athlete?.displayName,
            })
          }
          
          // Extract stats
          const getStatValue = (name: string, teamIndex: number) => {
            const teamStats = data.boxscore?.teams?.[teamIndex]?.statistics || []
            const stat = teamStats.find((s: any) => s.name?.toLowerCase() === name.toLowerCase())
            return parseInt(stat?.displayValue) || 0
          }

          const matchDetails: MatchDetails = {
            id: matchId,
            home_team: homeTeam?.team?.displayName || 'Home Team',
            away_team: awayTeam?.team?.displayName || 'Away Team',
            home_score: parseInt(homeTeam?.score) || 0,
            away_score: parseInt(awayTeam?.score) || 0,
            status: competition?.status?.type?.name || 'scheduled',
            minute: parseInt(competition?.status?.displayClock) || undefined,
            venue: data.gameInfo?.venue?.fullName,
            date: data.header?.competitions?.[0]?.date || '',
            league: data.header?.league?.name || '',
            events,
            lineups: {
              home: data.rosters?.[0]?.roster?.map((p: any) => p.athlete?.displayName) || [],
              away: data.rosters?.[1]?.roster?.map((p: any) => p.athlete?.displayName) || [],
            },
            stats: {
              possession: [getStatValue('possessionPct', 0), getStatValue('possessionPct', 1)],
              shots: [getStatValue('totalShots', 0), getStatValue('totalShots', 1)],
              shotsOnTarget: [getStatValue('shotsOnTarget', 0), getStatValue('shotsOnTarget', 1)],
              corners: [getStatValue('wonCorners', 0), getStatValue('wonCorners', 1)],
              fouls: [getStatValue('foulsCommitted', 0), getStatValue('foulsCommitted', 1)],
            },
            h2h: {
              homeWins: 0,
              draws: 0,
              awayWins: 0,
              recentMatches: [],
            }
          }
          
          setMatch(matchDetails)
        }
      } catch (e) {
        console.error('Error fetching match details:', e)
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchMatchDetails()
    }
  }, [matchId, leagueId])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Match not found</p>
          <Link href="/matches" className="text-indigo-400 hover:text-indigo-300">
            ← Back to matches
          </Link>
        </div>
      </div>
    )
  }

  const isLive = match.status.includes('IN_PROGRESS') || match.status.includes('HALF')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:opacity-80 mb-4 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {/* Match Header */}
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{match.league}</p>
            
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{match.home_team}</p>
              </div>
              
              <div className="text-center px-6">
                {isLive && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-sm font-bold">{match.minute}&apos;</span>
                  </div>
                )}
                <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {match.home_score} - {match.away_score}
                </div>
                {!isLive && match.status.includes('FINAL') && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Full Time</p>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{match.away_team}</p>
              </div>
            </div>
            
            <p className="text-sm mt-4" style={{ color: 'var(--text-tertiary)' }}>{formatDate(match.date)}</p>
            {match.venue && (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{match.venue}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto">
            {['summary', 'lineup', 'stats', 'h2h'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-indigo-400 border-indigo-400'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                {tab === 'h2h' ? 'Head to Head' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Match Events</h3>
            {match.events.length > 0 ? (
              <div className="space-y-3">
                {match.events.map((event, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 ${
                      event.team === 'home' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    <div className={`flex-1 ${event.team === 'home' ? 'text-left' : 'text-right'}`}>
                      <p className="text-white font-medium">
                        {event.type === 'goal' && '⚽ '}
                        {event.player}
                      </p>
                      {event.relatedPlayer && (
                        <p className="text-slate-400 text-sm">Assist: {event.relatedPlayer}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                      {event.minute}&apos;
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No events recorded yet</p>
            )}
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">{match.home_team}</h3>
              {match.lineups.home.length > 0 ? (
                <div className="space-y-2">
                  {match.lineups.home.slice(0, 11).map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-white">{player}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Lineup not available</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">{match.away_team}</h3>
              {match.lineups.away.length > 0 ? (
                <div className="space-y-2">
                  {match.lineups.away.slice(0, 11).map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-white">{player}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">Lineup not available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Match Statistics</h3>
            
            {[
              { label: 'Possession', values: match.stats.possession, suffix: '%' },
              { label: 'Total Shots', values: match.stats.shots },
              { label: 'Shots on Target', values: match.stats.shotsOnTarget },
              { label: 'Corners', values: match.stats.corners },
              { label: 'Fouls', values: match.stats.fouls },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white">{stat.values[0]}{stat.suffix || ''}</span>
                  <span className="text-slate-400">{stat.label}</span>
                  <span className="text-white">{stat.values[1]}{stat.suffix || ''}</span>
                </div>
                <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500"
                    style={{ width: `${(stat.values[0] / (stat.values[0] + stat.values[1] || 1)) * 100}%` }}
                  />
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(stat.values[1] / (stat.values[0] + stat.values[1] || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📊</span>
            <p className="text-slate-400">Head-to-head data coming soon</p>
            <p className="text-slate-500 text-sm mt-2">Historical match data between these teams</p>
          </div>
        )}
      </div>
    </div>
  )
}
