'use client'

import { useState, useEffect } from 'react'

interface HeadToHeadMatch {
  id: string
  date: string
  competition: string
  venue?: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  winner: 'home' | 'away' | 'draw'
}

interface HeadToHeadStats {
  totalMatches: number
  team1: {
    name: string
    wins: number
    goals: number
    cleanSheets: number
    homeWins: number
    awayWins: number
  }
  team2: {
    name: string
    wins: number
    goals: number
    cleanSheets: number
    homeWins: number
    awayWins: number
  }
  draws: number
  avgGoalsPerMatch: number
  recentForm: ('home' | 'away' | 'draw')[]
  recentMatches: HeadToHeadMatch[]
  streaks: {
    currentWinStreak?: { team: string; count: number }
    currentUnbeatenStreak?: { team: string; count: number }
    longestWinStreak: { team: string; count: number }
  }
}

interface HeadToHeadDisplayProps {
  homeTeam: string
  awayTeam: string
  matchId?: string
  initialData?: HeadToHeadStats
}

export default function HeadToHeadDisplay({
  homeTeam,
  awayTeam,
  matchId,
  initialData
}: HeadToHeadDisplayProps) {
  const [stats, setStats] = useState<HeadToHeadStats | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [showAllMatches, setShowAllMatches] = useState(false)

  useEffect(() => {
    if (initialData) return

    const fetchH2H = async () => {
      setLoading(true)
      try {
        // Try FotMob first
        let response = await fetch(
          `/api/v1/matches/${matchId}/h2h?home_team=${encodeURIComponent(homeTeam)}&away_team=${encodeURIComponent(awayTeam)}`
        )
        
        if (!response.ok) {
          // Fallback to ESPN
          response = await fetch(
            `/api/v1/teams/h2h?team1=${encodeURIComponent(homeTeam)}&team2=${encodeURIComponent(awayTeam)}`
          )
        }

        if (response.ok) {
          const data = await response.json()
          setStats(parseH2HData(data, homeTeam, awayTeam))
        }
      } catch (error) {
        console.error('Error fetching H2H data:', error)
        // Set mock data as fallback
        setStats(generateMockH2H(homeTeam, awayTeam))
      } finally {
        setLoading(false)
      }
    }

    fetchH2H()
  }, [homeTeam, awayTeam, matchId, initialData])

  const parseH2HData = (data: any, team1: string, team2: string): HeadToHeadStats => {
    const matches = data.matches || data.recentMatches || data.h2h?.matches || []
    const history = data.history || data.h2h || {}

    let team1Wins = 0, team2Wins = 0, draws = 0
    let team1Goals = 0, team2Goals = 0
    let team1CleanSheets = 0, team2CleanSheets = 0
    let team1HomeWins = 0, team1AwayWins = 0
    let team2HomeWins = 0, team2AwayWins = 0
    const recentForm: ('home' | 'away' | 'draw')[] = []

    const parsedMatches: HeadToHeadMatch[] = matches.slice(0, 20).map((m: any) => {
      const homeTeamName = m.homeTeam || m.home?.name || m.teams?.home || team1
      const awayTeamName = m.awayTeam || m.away?.name || m.teams?.away || team2
      const homeScore = m.homeScore ?? m.home?.score ?? m.score?.home ?? 0
      const awayScore = m.awayScore ?? m.away?.score ?? m.score?.away ?? 0

      // Determine winner
      let winner: 'home' | 'away' | 'draw' = 'draw'
      if (homeScore > awayScore) {
        winner = 'home'
        if (homeTeamName.toLowerCase().includes(team1.toLowerCase())) {
          team1Wins++
          team1HomeWins++
        } else {
          team2Wins++
          team2HomeWins++
        }
      } else if (awayScore > homeScore) {
        winner = 'away'
        if (awayTeamName.toLowerCase().includes(team1.toLowerCase())) {
          team1Wins++
          team1AwayWins++
        } else {
          team2Wins++
          team2AwayWins++
        }
      } else {
        draws++
      }

      // Track goals
      if (homeTeamName.toLowerCase().includes(team1.toLowerCase())) {
        team1Goals += homeScore
        team2Goals += awayScore
        if (awayScore === 0) team1CleanSheets++
        if (homeScore === 0) team2CleanSheets++
      } else {
        team2Goals += homeScore
        team1Goals += awayScore
        if (awayScore === 0) team2CleanSheets++
        if (homeScore === 0) team1CleanSheets++
      }

      // Recent form (last 5)
      if (recentForm.length < 5) {
        recentForm.push(winner)
      }

      return {
        id: m.id || m.matchId || `h2h-${Math.random()}`,
        date: m.date || m.utcTime || '',
        competition: m.competition || m.league || m.tournamentName || '',
        venue: m.venue,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        homeScore,
        awayScore,
        winner,
      }
    })

    // Calculate streaks
    const calculateStreaks = () => {
      let currentTeam1Streak = 0
      let currentTeam2Streak = 0
      let longestTeam1Streak = 0
      let longestTeam2Streak = 0
      let currentUnbeaten1 = 0
      let currentUnbeaten2 = 0

      for (const match of parsedMatches) {
        const team1IsHome = match.homeTeam.toLowerCase().includes(team1.toLowerCase())
        const team1Won = (team1IsHome && match.winner === 'home') || (!team1IsHome && match.winner === 'away')
        const team2Won = (team1IsHome && match.winner === 'away') || (!team1IsHome && match.winner === 'home')

        if (team1Won) {
          currentTeam1Streak++
          currentUnbeaten1++
          currentTeam2Streak = 0
          currentUnbeaten2 = 0
          longestTeam1Streak = Math.max(longestTeam1Streak, currentTeam1Streak)
        } else if (team2Won) {
          currentTeam2Streak++
          currentUnbeaten2++
          currentTeam1Streak = 0
          currentUnbeaten1 = 0
          longestTeam2Streak = Math.max(longestTeam2Streak, currentTeam2Streak)
        } else {
          currentTeam1Streak = 0
          currentTeam2Streak = 0
          currentUnbeaten1++
          currentUnbeaten2++
        }
      }

      return {
        currentWinStreak: currentTeam1Streak > 0 
          ? { team: team1, count: currentTeam1Streak }
          : currentTeam2Streak > 0 
            ? { team: team2, count: currentTeam2Streak }
            : undefined,
        currentUnbeatenStreak: currentUnbeaten1 > currentUnbeaten2
          ? { team: team1, count: currentUnbeaten1 }
          : { team: team2, count: currentUnbeaten2 },
        longestWinStreak: longestTeam1Streak >= longestTeam2Streak
          ? { team: team1, count: longestTeam1Streak }
          : { team: team2, count: longestTeam2Streak },
      }
    }

    const totalMatches = parsedMatches.length || history.total || 0
    const totalGoals = team1Goals + team2Goals

    return {
      totalMatches,
      team1: {
        name: team1,
        wins: history.team1Wins ?? team1Wins,
        goals: team1Goals,
        cleanSheets: team1CleanSheets,
        homeWins: team1HomeWins,
        awayWins: team1AwayWins,
      },
      team2: {
        name: team2,
        wins: history.team2Wins ?? team2Wins,
        goals: team2Goals,
        cleanSheets: team2CleanSheets,
        homeWins: team2HomeWins,
        awayWins: team2AwayWins,
      },
      draws: history.draws ?? draws,
      avgGoalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
      recentForm,
      recentMatches: parsedMatches,
      streaks: calculateStreaks(),
    }
  }

  const generateMockH2H = (team1: string, team2: string): HeadToHeadStats => ({
    totalMatches: 0,
    team1: { name: team1, wins: 0, goals: 0, cleanSheets: 0, homeWins: 0, awayWins: 0 },
    team2: { name: team2, wins: 0, goals: 0, cleanSheets: 0, homeWins: 0, awayWins: 0 },
    draws: 0,
    avgGoalsPerMatch: 0,
    recentForm: [],
    recentMatches: [],
    streaks: {
      longestWinStreak: { team: team1, count: 0 },
    },
  })

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] border rounded-2xl p-6" style={{ borderColor: 'var(--border-color)' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--muted-bg)] rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-[var(--muted-bg)] rounded" />
            <div className="h-24 bg-[var(--muted-bg)] rounded" />
            <div className="h-24 bg-[var(--muted-bg)] rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!stats || stats.totalMatches === 0) {
    return (
      <div className="bg-[var(--card-bg)] border rounded-2xl p-6" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Head to Head</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📊</span>
          <p className="text-[var(--text-secondary)]">No previous meetings found</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-2">
            These teams haven&apos;t played each other in recent history
          </p>
        </div>
      </div>
    )
  }

  const totalDecisive = stats.team1.wins + stats.team2.wins
  const team1Percent = stats.totalMatches > 0 ? (stats.team1.wins / stats.totalMatches) * 100 : 0
  const team2Percent = stats.totalMatches > 0 ? (stats.team2.wins / stats.totalMatches) * 100 : 0
  const drawPercent = stats.totalMatches > 0 ? (stats.draws / stats.totalMatches) * 100 : 0

  return (
    <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">Head to Head</h3>
          <span className="text-sm text-[var(--text-tertiary)]">{stats.totalMatches} matches</span>
        </div>
      </div>

      <div className="p-6">
        {/* Main H2H Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-blue-500">{stats.team1.wins} wins</span>
            <span className="text-[var(--text-tertiary)]">{stats.draws} draws</span>
            <span className="font-medium text-orange-500">{stats.team2.wins} wins</span>
          </div>
          
          <div className="h-4 rounded-full overflow-hidden flex bg-[var(--muted-bg)]">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${team1Percent}%` }}
            />
            <div
              className="bg-gray-400 transition-all duration-500"
              style={{ width: `${drawPercent}%` }}
            />
            <div
              className="bg-orange-500 transition-all duration-500"
              style={{ width: `${team2Percent}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mt-2">
            <span>{team1Percent.toFixed(0)}%</span>
            <span>{drawPercent.toFixed(0)}%</span>
            <span>{team2Percent.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Team 1 Stats */}
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.team1.goals}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Goals</p>
          </div>
          
          <div className="text-center border-x" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgGoalsPerMatch.toFixed(1)}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Avg Goals/Match</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.team2.goals}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Goals</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--muted-bg)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Clean Sheets</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-blue-500">{stats.team1.cleanSheets}</span>
              <span className="text-xl font-bold text-orange-500">{stats.team2.cleanSheets}</span>
            </div>
          </div>
          
          <div className="bg-[var(--muted-bg)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Home/Away Wins</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>H:{stats.team1.homeWins} A:{stats.team1.awayWins}</span>
              <span>H:{stats.team2.homeWins} A:{stats.team2.awayWins}</span>
            </div>
          </div>
        </div>

        {/* Streaks */}
        {stats.streaks.currentWinStreak && stats.streaks.currentWinStreak.count > 0 && (
          <div className="mb-6 p-4 bg-[var(--accent-primary)]/10 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">{stats.streaks.currentWinStreak.team}</span> is on a{' '}
                <span className="font-bold text-[var(--accent-primary)]">{stats.streaks.currentWinStreak.count}-match</span> winning streak
              </p>
            </div>
          </div>
        )}

        {/* Recent Meetings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Recent Meetings</h4>
            {stats.recentMatches.length > 5 && (
              <button
                onClick={() => setShowAllMatches(!showAllMatches)}
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                {showAllMatches ? 'Show less' : `Show all (${stats.recentMatches.length})`}
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {stats.recentMatches
              .slice(0, showAllMatches ? undefined : 5)
              .map((match, idx) => {
                const team1IsHome = match.homeTeam.toLowerCase().includes(homeTeam.toLowerCase())
                const team1Score = team1IsHome ? match.homeScore : match.awayScore
                const team2Score = team1IsHome ? match.awayScore : match.homeScore
                
                return (
                  <div
                    key={match.id || idx}
                    className="flex items-center justify-between p-3 bg-[var(--muted-bg)] rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">
                        {match.date ? new Date(match.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Date unknown'}
                        {match.competition && ` • ${match.competition}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${team1IsHome ? '' : 'text-[var(--text-secondary)]'}`}>
                          {match.homeTeam}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold text-sm ${
                          match.winner === 'home' ? 'bg-green-500/20 text-green-500' :
                          match.winner === 'away' ? 'bg-red-500/20 text-red-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {match.homeScore} - {match.awayScore}
                        </span>
                        <span className={`text-sm font-medium ${!team1IsHome ? '' : 'text-[var(--text-secondary)]'}`}>
                          {match.awayTeam}
                        </span>
                      </div>
                    </div>
                    
                    {/* Result indicator for focused team */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      (team1IsHome && match.winner === 'home') || (!team1IsHome && match.winner === 'away')
                        ? 'bg-green-500/20 text-green-500'
                        : (team1IsHome && match.winner === 'away') || (!team1IsHome && match.winner === 'home')
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {(team1IsHome && match.winner === 'home') || (!team1IsHome && match.winner === 'away') ? 'W' :
                       (team1IsHome && match.winner === 'away') || (!team1IsHome && match.winner === 'home') ? 'L' : 'D'}
                    </div>
                  </div>
                )
              })}
          </div>
          
          {stats.recentMatches.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
              No recent match data available
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
