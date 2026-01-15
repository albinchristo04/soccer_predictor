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
              player: play.scoringPlay?.scorer?.athlete?.displayName || play.text?.trim() || 'Unknown',
              team: play.homeAway === 'home' ? 'home' : 'away',
              relatedPlayer: play.scoringPlay?.assists?.[0]?.athlete?.displayName,
            })
          }
          
          // Extract stats helper function
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
  const isScheduled = match.status.toLowerCase().includes('scheduled') || match.status.toLowerCase().includes('pre')

  // Navigate back to the league page
  const handleBack = () => {
    if (leagueId) {
      router.push(`/matches?league=${leagueId}`)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 hover:opacity-80 mb-4 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {match.league || 'matches'}
          </button>
          
          {/* Match Header - Centered */}
          <div className="text-center">
            <p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>{match.league}</p>
            
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <div className="flex-1 text-right">
                <p className="text-lg md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{match.home_team}</p>
              </div>
              
              <div className="text-center px-4 md:px-8">
                {isLive && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-sm font-bold">{match.minute}&apos;</span>
                  </div>
                )}
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isScheduled ? 'vs' : `${match.home_score} - ${match.away_score}`}
                </div>
                {!isLive && !isScheduled && match.status.includes('FINAL') && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Full Time</p>
                )}
                {isScheduled && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Upcoming</p>
                )}
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-lg md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{match.away_team}</p>
              </div>
            </div>
            
            <p className="text-sm mt-4 text-center" style={{ color: 'var(--text-tertiary)' }}>{formatDate(match.date)}</p>
            {match.venue && (
              <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>📍 {match.venue}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--background-secondary)] border-b sticky top-16 z-10" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto justify-center">
            {['summary', 'lineup', 'stats', 'h2h'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
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
          <div className="space-y-6">
            {/* Timeline Header */}
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Match Timeline</h3>
            
            {match.events.length > 0 ? (
              <div className="relative">
                {/* Center timeline line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--border-color)] transform -translate-x-1/2" />
                
                <div className="space-y-4">
                  {match.events.sort((a, b) => a.minute - b.minute).map((event, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center"
                    >
                      {/* Home team event (left side) */}
                      {event.team === 'home' && (
                        <div className="flex-1 flex justify-end pr-8">
                          <div className="bg-[var(--card-bg)] border rounded-xl p-3 max-w-xs" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-[var(--text-primary)] font-medium">
                              {event.type === 'goal' && '⚽ '}
                              {event.type === 'yellow_card' && '🟨 '}
                              {event.type === 'red_card' && '🟥 '}
                              {event.player}
                            </p>
                            {event.relatedPlayer && (
                              <p className="text-[var(--text-secondary)] text-xs mt-1">Assist: {event.relatedPlayer}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {event.team === 'away' && <div className="flex-1" />}
                      
                      {/* Center minute marker */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {event.minute}&apos;
                        </div>
                      </div>
                      
                      {/* Away team event (right side) */}
                      {event.team === 'home' && <div className="flex-1" />}
                      {event.team === 'away' && (
                        <div className="flex-1 flex justify-start pl-8">
                          <div className="bg-[var(--card-bg)] border rounded-xl p-3 max-w-xs" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-[var(--text-primary)] font-medium">
                              {event.type === 'goal' && '⚽ '}
                              {event.type === 'yellow_card' && '🟨 '}
                              {event.type === 'red_card' && '🟥 '}
                              {event.player}
                            </p>
                            {event.relatedPlayer && (
                              <p className="text-[var(--text-secondary)] text-xs mt-1">Assist: {event.relatedPlayer}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Full Time marker */}
                {match.status.includes('FINAL') && (
                  <div className="relative flex items-center justify-center mt-6">
                    <div className="px-4 py-2 bg-[var(--muted-bg)] rounded-full text-sm text-[var(--text-secondary)] font-medium">
                      Full Time
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">⚽</span>
                <p className="text-[var(--text-secondary)]">No events recorded yet</p>
                <p className="text-[var(--text-tertiary)] text-sm mt-2">
                  {match.status.includes('scheduled') 
                    ? 'Events will appear here once the match starts' 
                    : 'Check back for updates'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{match.home_team}</h3>
              {match.lineups.home.length > 0 ? (
                <div className="space-y-2">
                  {match.lineups.home.slice(0, 11).map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--card-bg)] border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="w-6 h-6 rounded-full bg-[var(--muted-bg)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                        {idx + 1}
                      </span>
                      <span className="text-[var(--text-primary)]">{player}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)]">Lineup not available</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{match.away_team}</h3>
              {match.lineups.away.length > 0 ? (
                <div className="space-y-2">
                  {match.lineups.away.slice(0, 11).map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[var(--card-bg)] border rounded-lg" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="w-6 h-6 rounded-full bg-[var(--muted-bg)] flex items-center justify-center text-xs text-[var(--text-secondary)]">
                        {idx + 1}
                      </span>
                      <span className="text-[var(--text-primary)]">{player}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)]">Lineup not available</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Match Statistics</h3>
            
            {[
              { label: 'Possession', values: match.stats.possession, suffix: '%', inverse: false },
              { label: 'Total Shots', values: match.stats.shots, inverse: false },
              { label: 'Shots on Target', values: match.stats.shotsOnTarget, inverse: false },
              { label: 'Corners', values: match.stats.corners, inverse: false },
              { label: 'Fouls', values: match.stats.fouls, inverse: true }, // Lower is better
            ].map((stat) => {
              const total = stat.values[0] + stat.values[1] || 1
              const homePercent = (stat.values[0] / total) * 100
              const awayPercent = (stat.values[1] / total) * 100
              // Determine which team is "winning" this stat (for fouls, less is better)
              const homeWinning = stat.inverse ? stat.values[0] < stat.values[1] : stat.values[0] > stat.values[1]
              const awayWinning = stat.inverse ? stat.values[1] < stat.values[0] : stat.values[1] > stat.values[0]
              const isTied = stat.values[0] === stat.values[1]
              
              return (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`font-medium ${homeWinning ? 'text-blue-500' : 'text-[var(--text-secondary)]'}`}>
                      {stat.values[0]}{stat.suffix || ''}
                    </span>
                    <span className="text-[var(--text-secondary)]">{stat.label}</span>
                    <span className={`font-medium ${awayWinning ? 'text-orange-500' : 'text-[var(--text-secondary)]'}`}>
                      {stat.values[1]}{stat.suffix || ''}
                    </span>
                  </div>
                  <div className="flex h-3 bg-[var(--muted-bg)] rounded-full overflow-hidden">
                    <div
                      className={`${isTied ? 'bg-gray-400' : homeWinning ? 'bg-blue-500' : 'bg-blue-500/30'} transition-all`}
                      style={{ width: `${homePercent}%` }}
                    />
                    <div
                      className={`${isTied ? 'bg-gray-400' : awayWinning ? 'bg-orange-500' : 'bg-orange-500/30'} transition-all`}
                      style={{ width: `${awayPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
            
            {/* League Standings Mini Section - Placeholder data when actual standings unavailable */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-[var(--text-primary)]">League Position</h4>
                <span className="text-xs text-[var(--text-tertiary)]">Sample data</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--card-bg)] border rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--text-primary)] font-medium">{match.home_team}</span>
                    <span className="text-2xl font-bold text-[var(--text-tertiary)]">–</span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] text-center">Standings data unavailable</p>
                </div>
                <div className="bg-[var(--card-bg)] border rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--text-primary)] font-medium">{match.away_team}</span>
                    <span className="text-2xl font-bold text-[var(--text-tertiary)]">–</span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] text-center">Standings data unavailable</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Head to Head</h3>
              {match.h2h.recentMatches.length === 0 && (
                <span className="text-xs text-[var(--text-tertiary)] bg-[var(--muted-bg)] px-2 py-1 rounded">Sample data</span>
              )}
            </div>
            
            {/* H2H Summary */}
            <div className="bg-[var(--card-bg)] border rounded-xl p-6" style={{ borderColor: 'var(--border-color)' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-[var(--accent-primary)]">{match.h2h.homeWins || '–'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{match.home_team}</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--text-tertiary)]">{match.h2h.draws || '–'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Draws</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-500">{match.h2h.awayWins || '–'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{match.away_team}</p>
                </div>
              </div>
              {match.h2h.homeWins === 0 && match.h2h.draws === 0 && match.h2h.awayWins === 0 && (
                <p className="text-center text-xs text-[var(--text-tertiary)] mt-4">Historical H2H data not available</p>
              )}
            </div>
            
            {/* Recent Meetings */}
            {match.h2h.recentMatches.length > 0 ? (
              <div>
                <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Recent Meetings</h4>
                <div className="space-y-2">
                  {match.h2h.recentMatches.map((recentMatch, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[var(--muted-bg)] rounded-lg"
                    >
                      <span className="text-sm text-[var(--text-tertiary)] w-24">
                        {new Date(recentMatch.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-3 flex-1 justify-center">
                        <span className="text-sm text-[var(--text-primary)] font-medium text-right flex-1">{match.home_team}</span>
                        <span className={`text-lg font-bold px-3 py-1 rounded ${
                          recentMatch.home_score > recentMatch.away_score 
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                            : recentMatch.home_score < recentMatch.away_score 
                              ? 'text-emerald-500 bg-emerald-500/10'
                              : 'text-[var(--text-tertiary)] bg-[var(--muted-bg)]'
                        }`}>
                          {recentMatch.home_score} - {recentMatch.away_score}
                        </span>
                        <span className="text-sm text-[var(--text-primary)] font-medium text-left flex-1">{match.away_team}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-[var(--muted-bg)] rounded-xl">
                <span className="text-3xl mb-3 block">📊</span>
                <p className="text-[var(--text-secondary)]">Recent meetings data not available</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Historical match data between these teams</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
