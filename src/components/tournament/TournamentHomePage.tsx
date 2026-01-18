'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { KnockoutSimulator, KnockoutBracket, type BracketRound, type KnockoutMatch as BracketMatch } from '@/components/knockout'

interface TournamentHomePageProps {
  tournamentId: 'champions_league' | 'europa_league' | 'world_cup'
  tournamentName: string
}

interface GroupStanding {
  position: number
  team: string
  teamId?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface Group {
  name: string
  standings: GroupStanding[]
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  date: string
  time?: string
  round?: string
  venue?: string
  status?: 'upcoming' | 'live' | 'finished'
}

interface NewsItem {
  headline: string
  description: string
  link: string
  image?: string
  published: string
}

interface TournamentData {
  groups: Group[]
  knockoutMatches: Match[]
  upcomingMatches: Match[]
  recentResults: Match[]
  news: NewsItem[]
}

const TOURNAMENT_CONFIG = {
  champions_league: {
    name: 'UEFA Champions League',
    emoji: '🏆',
    gradient: 'from-blue-800 to-indigo-600',
    color: 'blue',
    knockoutType: 'champions_league' as const,
    groupCount: 8,
    leagueId: 'uefa.champions',
  },
  europa_league: {
    name: 'UEFA Europa League',
    emoji: '🏆',
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
    knockoutType: 'europa_league' as const,
    groupCount: 8,
    leagueId: 'uefa.europa',
  },
  world_cup: {
    name: 'FIFA World Cup',
    emoji: '🌍',
    gradient: 'from-purple-900 to-red-800',
    color: 'purple',
    knockoutType: 'world_cup' as const,
    groupCount: 8,
    leagueId: 'fifa.world',
  },
}

const TABS = ['Overview', 'Groups', 'Knockout', 'Fixtures', 'Simulator', 'News'] as const
type TabType = typeof TABS[number]

export default function TournamentHomePage({ tournamentId, tournamentName }: TournamentHomePageProps) {
  const config = TOURNAMENT_CONFIG[tournamentId]
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('Overview')
  const [loading, setLoading] = useState(true)
  const [bracketRounds, setBracketRounds] = useState<BracketRound[]>([])
  const [simulationProbabilities, setSimulationProbabilities] = useState<{
    champion: { team: string; probability: number }[]
    final: { team: string; probability: number }[]
    semi_finals: { team: string; probability: number }[]
    quarter_finals: { team: string; probability: number }[]
  } | null>(null)
  const [data, setData] = useState<TournamentData>({
    groups: [],
    knockoutMatches: [],
    upcomingMatches: [],
    recentResults: [],
    news: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch standings (groups), matches, and news in parallel
        const [standingsRes, matchesRes, newsRes] = await Promise.allSettled([
          fetch(`/api/v1/leagues/${config.leagueId}/standings`),
          fetch(`/api/v1/leagues/${config.leagueId}/matches`),
          fetch(`/api/v1/leagues/${config.leagueId}/news`),
        ])

        const newData: TournamentData = {
          groups: [],
          knockoutMatches: [],
          upcomingMatches: [],
          recentResults: [],
          news: [],
        }

        // Process groups from standings
        if (standingsRes.status === 'fulfilled' && standingsRes.value.ok) {
          const standingsJson = await standingsRes.value.json()
          const groups = standingsJson.groups || standingsJson.standings || []
          
          newData.groups = groups.map((g: any) => ({
            name: g.group || g.name || 'Group',
            standings: (g.standings || g.teams || []).map((t: any, idx: number) => ({
              position: idx + 1,
              team: t.team || t.name || 'Unknown',
              teamId: t.team_id || t.id,
              played: t.played || t.matches || 0,
              won: t.won || t.wins || 0,
              drawn: t.drawn || t.draws || 0,
              lost: t.lost || t.losses || 0,
              goalsFor: t.goals_for || t.goalsFor || 0,
              goalsAgainst: t.goals_against || t.goalsAgainst || 0,
              goalDifference: t.goal_difference || t.goalDifference || 0,
              points: t.points || 0,
            }))
          }))
        }

        // Process matches
        if (matchesRes.status === 'fulfilled' && matchesRes.value.ok) {
          const matchesJson = await matchesRes.value.json()
          const allMatches = matchesJson.matches || []
          const now = new Date()

          for (const match of allMatches) {
            const matchDate = new Date(match.utcTime || match.date || '')
            const isPlayed = match.status === 'played' || match.status === 'finished'
            const isKnockout = match.round?.toLowerCase().includes('final') || 
                              match.round?.toLowerCase().includes('round of')

            const matchObj: Match = {
              id: String(match.id || ''),
              homeTeam: match.home?.name || match.home_team || 'Home',
              awayTeam: match.away?.name || match.away_team || 'Away',
              homeScore: isPlayed ? (match.home?.score ?? match.home_goals) : undefined,
              awayScore: isPlayed ? (match.away?.score ?? match.away_goals) : undefined,
              date: matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              time: matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              round: match.round || match.stage,
              venue: match.venue?.name,
              status: isPlayed ? 'finished' : match.status === 'live' ? 'live' : 'upcoming',
            }

            if (isKnockout && isPlayed) {
              newData.knockoutMatches.push(matchObj)
            } else if (isPlayed) {
              newData.recentResults.push(matchObj)
            } else {
              newData.upcomingMatches.push(matchObj)
            }
          }

          newData.recentResults = newData.recentResults.slice(0, 10)
          newData.upcomingMatches = newData.upcomingMatches.slice(0, 10)
          
          // Build bracket rounds from knockout matches
          const roundsMap: Record<string, BracketMatch[]> = {}
          for (const match of newData.knockoutMatches) {
            const round = match.round || 'Unknown'
            if (!roundsMap[round]) {
              roundsMap[round] = []
            }
            roundsMap[round].push({
              id: match.id,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              homeScore: match.homeScore,
              awayScore: match.awayScore,
              date: match.date,
              time: match.time,
              status: match.status as 'scheduled' | 'live' | 'finished',
              round: round,
              winner: match.homeScore !== undefined && match.awayScore !== undefined
                ? match.homeScore > match.awayScore ? 'home' 
                : match.awayScore > match.homeScore ? 'away' 
                : null
                : null,
            })
          }
          
          // Convert to bracket rounds array
          const bracketData: BracketRound[] = Object.entries(roundsMap).map(([name, matches]) => ({
            name,
            matches,
          }))
          setBracketRounds(bracketData)
        }

        // Process news
        if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
          const newsJson = await newsRes.value.json()
          newData.news = (newsJson.news || []).slice(0, 8).map((n: any) => ({
            headline: n.headline || n.title || '',
            description: n.description || n.summary || '',
            link: n.links?.web?.href || n.url || '',
            image: n.images?.[0]?.url || '',
            published: n.published || '',
          }))
        }

        setData(newData)
      } catch (error) {
        console.error('Error fetching tournament data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [config.leagueId])
  
  // Fetch simulation probabilities for the tournament
  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const endpoint = tournamentId === 'champions_league' 
          ? '/api/v1/knockout/champions-league/simulate'
          : tournamentId === 'europa_league'
          ? '/api/v1/knockout/europa-league/simulate'
          : '/api/v1/knockout/world-cup/simulate'
        
        const res = await fetch(`${endpoint}?n_simulations=5000`)
        if (res.ok) {
          const simData = await res.json()
          setSimulationProbabilities({
            champion: simData.winnerProbabilities || [],
            final: simData.finalProbabilities || [],
            semi_finals: simData.semiFinalProbabilities || [],
            quarter_finals: simData.quarterFinalProbabilities || [],
          })
        }
      } catch (error) {
        console.error('Error fetching simulation:', error)
      }
    }
    
    fetchSimulation()
  }, [tournamentId])

  const renderGroupsTable = (group: Group) => (
    <div key={group.name} className="bg-[var(--card-bg)] rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      <div className={`bg-gradient-to-r ${config.gradient} px-4 py-2`}>
        <h3 className="text-white font-semibold">{group.name}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[var(--text-tertiary)]" style={{ borderColor: 'var(--border-color)' }}>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Team</th>
              <th className="px-3 py-2 text-center">P</th>
              <th className="px-3 py-2 text-center">W</th>
              <th className="px-3 py-2 text-center">D</th>
              <th className="px-3 py-2 text-center">L</th>
              <th className="px-3 py-2 text-center">GD</th>
              <th className="px-3 py-2 text-center font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((team) => (
              <tr 
                key={team.team}
                className={`border-b hover:bg-[var(--muted-bg)] transition-colors ${
                  team.position <= 2 ? 'bg-green-500/10' : team.position === 3 ? 'bg-orange-500/10' : ''
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                <td className="px-3 py-2 text-[var(--text-tertiary)]">{team.position}</td>
                <td className="px-3 py-2 text-[var(--text-primary)] font-medium">
                  {team.teamId ? (
                    <Link href={`/teams/${team.teamId}`} className="hover:text-[var(--accent-primary)]">
                      {team.team}
                    </Link>
                  ) : team.team}
                </td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{team.played}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{team.won}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{team.drawn}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">{team.lost}</td>
                <td className="px-3 py-2 text-center text-[var(--text-secondary)]">
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
                <td className="px-3 py-2 text-center font-semibold text-[var(--text-primary)]">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-[var(--text-tertiary)] border-t" style={{ borderColor: 'var(--border-color)' }}>
        <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30 mr-1"></span> Qualifies for knockout stage
        <span className="inline-block w-3 h-3 rounded-sm bg-orange-500/30 mx-2"></span> Europa League
      </div>
    </div>
  )

  const renderMatchCard = (match: Match, showResult = false) => (
    <Link
      key={match.id}
      href={`/matches/${match.id}`}
      className="block p-4 rounded-xl bg-[var(--muted-bg)] hover:bg-[var(--muted-bg-hover)] transition-colors animate-fadeIn"
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="font-medium text-[var(--text-primary)]">{match.homeTeam}</p>
          <p className="font-medium text-[var(--text-primary)]">{match.awayTeam}</p>
        </div>
        {showResult && match.homeScore !== undefined ? (
          <div className="text-right">
            <p className={`font-bold ${match.homeScore > (match.awayScore || 0) ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
              {match.homeScore}
            </p>
            <p className={`font-bold ${(match.awayScore || 0) > match.homeScore ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
              {match.awayScore}
            </p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-sm text-[var(--text-tertiary)]">{match.date}</p>
            <p className="text-sm text-[var(--text-secondary)]">{match.time}</p>
          </div>
        )}
      </div>
      {match.round && (
        <p className="text-xs text-[var(--text-tertiary)] mt-2">{match.round}</p>
      )}
      {match.status === 'live' && (
        <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          LIVE
        </span>
      )}
    </Link>
  )

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Upcoming Matches */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upcoming Matches */}
        <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Upcoming Matches</h2>
          {data.upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingMatches.slice(0, 5).map(match => renderMatchCard(match))}
            </div>
          ) : (
            <p className="text-[var(--text-tertiary)]">No upcoming matches</p>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Results</h2>
          {data.recentResults.length > 0 ? (
            <div className="space-y-3">
              {data.recentResults.slice(0, 5).map(match => renderMatchCard(match, true))}
            </div>
          ) : (
            <p className="text-[var(--text-tertiary)]">No recent results</p>
          )}
        </div>
      </div>

      {/* Right Column - Groups Preview & News */}
      <div className="space-y-6">
        {/* Groups Preview */}
        {data.groups.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Group Standings</h2>
              <button
                onClick={() => setActiveTab('Groups')}
                className="text-sm text-[var(--accent-primary)] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {data.groups.slice(0, 4).map(group => (
                <div key={group.name} className="p-3 rounded-lg bg-[var(--muted-bg)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{group.name}</p>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {group.standings.slice(0, 2).map((t, i) => (
                      <span key={t.team}>
                        {i > 0 && ' • '}{t.team} ({t.points}pts)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest News */}
        {data.news.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Latest News</h2>
            <div className="space-y-4">
              {data.news.slice(0, 3).map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.headline}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] line-clamp-2">
                    {item.headline}
                  </p>
                  {item.published && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {formatDistanceToNow(new Date(item.published), { addSuffix: true })}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quick Simulator Link */}
        <div
          className={`bg-gradient-to-r ${config.gradient} rounded-xl p-6 text-white cursor-pointer hover:opacity-90 transition-opacity`}
          onClick={() => setActiveTab('Simulator')}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎲</span>
            <div>
              <h3 className="font-semibold">Run Simulation</h3>
              <p className="text-sm text-white/80">Predict the tournament winner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderKnockoutBracket = () => (
    <div className="space-y-6">
      {/* Main Bracket Visualization - Always show */}
      <KnockoutBracket
        tournament={config.knockoutType}
        rounds={bracketRounds}
        simulationData={simulationProbabilities || undefined}
        showProbabilities={!!simulationProbabilities}
        onMatchClick={(match) => {
          // Navigate to match page using Next.js router for client-side navigation
          router.push(`/matches/${match.id}`)
        }}
      />
      
      {/* Detailed Match List */}
      {data.knockoutMatches.length > 0 && (
        <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Knockout Matches</h2>
          
          <div className="space-y-8">
            {/* Group knockout matches by round */}
            {['Final', 'Semi-Final', 'Quarter-Final', 'Round of 16'].map(round => {
              const roundMatches = data.knockoutMatches.filter(m => 
                m.round?.toLowerCase().includes(round.toLowerCase())
              )
              if (roundMatches.length === 0) return null

              return (
                <div key={round}>
                  <h3 className={`text-lg font-semibold text-[var(--text-primary)] mb-4 pb-2 border-b`} style={{ borderColor: 'var(--border-color)' }}>
                    {round}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roundMatches.map(match => (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="p-4 rounded-xl bg-[var(--muted-bg)] hover:bg-[var(--muted-bg-hover)] transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className={`flex items-center gap-2 ${match.homeScore !== undefined && match.homeScore > (match.awayScore || 0) ? 'font-bold' : ''}`}>
                              <span className="text-[var(--text-primary)]">{match.homeTeam}</span>
                              {match.homeScore !== undefined && (
                                <span className="font-bold text-[var(--text-primary)]">{match.homeScore}</span>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 ${match.awayScore !== undefined && match.awayScore > (match.homeScore || 0) ? 'font-bold' : ''}`}>
                              <span className="text-[var(--text-primary)]">{match.awayTeam}</span>
                              {match.awayScore !== undefined && (
                                <span className="font-bold text-[var(--text-primary)]">{match.awayScore}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-[var(--text-tertiary)]">
                            {match.date}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Leagues
      </Link>
      
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-8 mb-6`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{config.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{tournamentName}</h1>
            <p className="text-white/80">
              {tournamentId === 'world_cup' ? 'International Tournament' : 'European Club Competition'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? `bg-gradient-to-r ${config.gradient} text-white`
                : 'bg-[var(--muted-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && activeTab !== 'Simulator' ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[var(--accent-primary)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Tab Content */}
          {activeTab === 'Overview' && renderOverview()}
          
          {activeTab === 'Groups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.groups.length > 0 ? (
                data.groups.map(group => renderGroupsTable(group))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-[var(--text-tertiary)]">Group stage data not available</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'Knockout' && renderKnockoutBracket()}
          
          {activeTab === 'Fixtures' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Upcoming Fixtures</h2>
                {data.upcomingMatches.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcomingMatches.map(match => renderMatchCard(match))}
                  </div>
                ) : (
                  <p className="text-[var(--text-tertiary)]">No upcoming fixtures</p>
                )}
              </div>
              <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Results</h2>
                {data.recentResults.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentResults.map(match => renderMatchCard(match, true))}
                  </div>
                ) : (
                  <p className="text-[var(--text-tertiary)]">No recent results</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'Simulator' && (
            <KnockoutSimulator tournament={config.knockoutType} />
          )}
          
          {activeTab === 'News' && (
            <div className="bg-[var(--card-bg)] rounded-xl border p-6" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Latest News</h2>
              {data.news.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.news.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group bg-[var(--muted-bg)] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.headline}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] line-clamp-2">
                          {item.headline}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)] mt-2 line-clamp-2">
                          {item.description}
                        </p>
                        {item.published && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            {formatDistanceToNow(new Date(item.published), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-tertiary)]">No news available</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
