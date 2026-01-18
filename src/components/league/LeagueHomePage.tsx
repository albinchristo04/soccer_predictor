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
  // Main leagues
  'premier_league': { color: '#3D195B', gradient: 'from-purple-900 to-purple-700', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'la_liga': { color: '#EE8707', gradient: 'from-orange-600 to-red-600', flag: '🇪🇸' },
  'bundesliga': { color: '#D20515', gradient: 'from-red-700 to-red-500', flag: '🇩🇪' },
  'serie_a': { color: '#008FD7', gradient: 'from-blue-700 to-blue-500', flag: '🇮🇹' },
  'ligue_1': { color: '#091C3E', gradient: 'from-blue-900 to-blue-700', flag: '🇫🇷' },
  'champions_league': { color: '#1A428A', gradient: 'from-blue-800 to-indigo-600', flag: '🇪🇺' },
  'europa_league': { color: '#F26F21', gradient: 'from-orange-500 to-amber-500', flag: '🇪🇺' },
  'conference_league': { color: '#19A974', gradient: 'from-green-600 to-teal-500', flag: '🇪🇺' },
  'mls': { color: '#00245D', gradient: 'from-blue-900 to-red-600', flag: '🇺🇸' },
  'world_cup': { color: '#56042C', gradient: 'from-purple-900 to-red-800', flag: '🌍' },
  // Additional leagues
  'eredivisie': { color: '#E70012', gradient: 'from-orange-500 to-red-600', flag: '🇳🇱' },
  'primeira_liga': { color: '#004D25', gradient: 'from-green-800 to-green-600', flag: '🇵🇹' },
  'scottish_premiership': { color: '#003087', gradient: 'from-blue-800 to-blue-600', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'belgian_pro_league': { color: '#000000', gradient: 'from-yellow-500 to-red-600', flag: '🇧🇪' },
  'super_lig': { color: '#E30A17', gradient: 'from-red-700 to-red-500', flag: '🇹🇷' },
  'brasileirao': { color: '#009739', gradient: 'from-green-600 to-yellow-500', flag: '🇧🇷' },
  'liga_mx': { color: '#006847', gradient: 'from-green-700 to-red-600', flag: '🇲🇽' },
  // ESPN-style IDs
  'eng.1': { color: '#3D195B', gradient: 'from-purple-900 to-purple-700', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'esp.1': { color: '#EE8707', gradient: 'from-orange-600 to-red-600', flag: '🇪🇸' },
  'ger.1': { color: '#D20515', gradient: 'from-red-700 to-red-500', flag: '🇩🇪' },
  'ita.1': { color: '#008FD7', gradient: 'from-blue-700 to-blue-500', flag: '🇮🇹' },
  'fra.1': { color: '#091C3E', gradient: 'from-blue-900 to-blue-700', flag: '🇫🇷' },
  'ned.1': { color: '#E70012', gradient: 'from-orange-500 to-red-600', flag: '🇳🇱' },
  'por.1': { color: '#004D25', gradient: 'from-green-800 to-green-600', flag: '🇵🇹' },
  'usa.1': { color: '#00245D', gradient: 'from-blue-900 to-red-600', flag: '🇺🇸' },
  // FotMob numeric IDs
  '47': { color: '#3D195B', gradient: 'from-purple-900 to-purple-700', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  '87': { color: '#EE8707', gradient: 'from-orange-600 to-red-600', flag: '🇪🇸' },
  '54': { color: '#D20515', gradient: 'from-red-700 to-red-500', flag: '🇩🇪' },
  '55': { color: '#008FD7', gradient: 'from-blue-700 to-blue-500', flag: '🇮🇹' },
  '53': { color: '#091C3E', gradient: 'from-blue-900 to-blue-700', flag: '🇫🇷' },
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
        // Convert ESPN-style league ID to internal format
        const leagueParam = leagueId.includes('.') 
          ? leagueId.split('.')[0] === 'eng' ? 'premier_league'
            : leagueId.split('.')[0] === 'esp' ? 'la_liga'
            : leagueId.split('.')[0] === 'ger' ? 'bundesliga'
            : leagueId.split('.')[0] === 'ita' ? 'serie_a'
            : leagueId.split('.')[0] === 'fra' ? 'ligue_1'
            : leagueId.split('.')[0] === 'usa' ? 'mls'
            : leagueId
          : leagueId
        
        // Fetch data from existing endpoints in parallel
        const [standingsRes, fixturesRes, newsRes] = await Promise.allSettled([
          fetch(`/api/standings?league=${leagueParam}`),
          fetch(`/api/upcoming_matches?league=${leagueParam}&limit=10`),
          fetch(`/api/news?league=${leagueParam}`),
        ])
        
        // Also fetch from ESPN for real-time data
        const espnLeagueId = leagueId.includes('.') ? leagueId : 
          leagueParam === 'premier_league' ? 'eng.1' :
          leagueParam === 'la_liga' ? 'esp.1' :
          leagueParam === 'bundesliga' ? 'ger.1' :
          leagueParam === 'serie_a' ? 'ita.1' :
          leagueParam === 'ligue_1' ? 'fra.1' :
          leagueParam === 'mls' ? 'usa.1' : leagueId

        const espnResults = await Promise.allSettled([
          fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${espnLeagueId}/standings`),
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeagueId}/scoreboard`),
        ])

        const leagueData: LeagueHomeData = {
          leagueId: parseInt(leagueId) || 0,
          leagueName,
          country,
          season: '2024-25',
          standings: [],
          topScorers: [],
          upcomingMatches: [],
          recentResults: [],
          news: [],
        }

        // Process local standings or ESPN standings
        if (standingsRes.status === 'fulfilled' && standingsRes.value.ok) {
          const standingsJson = await standingsRes.value.json()
          leagueData.standings = (standingsJson.standings || []).map((s: any, idx: number) => ({
            position: s.position || idx + 1,
            teamName: s.team || s.name || s.team_name || 'Unknown',
            teamId: s.id,
            played: s.played || 0,
            won: s.won || s.wins || 0,
            drawn: s.drawn || s.draws || 0,
            lost: s.lost || s.losses || 0,
            goalsFor: s.goalsFor || 0,
            goalsAgainst: s.goalsAgainst || 0,
            goalDiff: s.goalDifference || s.goalConDiff || 0,
            points: s.points || s.pts || 0,
            form: s.form || [],
          }))
        }
        
        // If no local standings, try ESPN
        if (leagueData.standings.length === 0 && espnResults[0].status === 'fulfilled') {
          const espnStandings = espnResults[0] as PromiseFulfilledResult<Response>
          if (espnStandings.value.ok) {
            const espnData = await espnStandings.value.json()
            const entries = espnData.children?.[0]?.standings?.entries || []
            leagueData.standings = entries.map((entry: any, idx: number) => {
              const getStatVal = (name: string) => {
                const stat = entry.stats?.find((s: any) => s.name === name)
                return parseInt(stat?.value || '0', 10)
              }
              return {
                position: idx + 1,
                teamName: entry.team?.displayName || 'Unknown',
                teamId: entry.team?.id,
                played: getStatVal('gamesPlayed'),
                won: getStatVal('wins'),
                drawn: getStatVal('ties'),
                lost: getStatVal('losses'),
                goalsFor: getStatVal('pointsFor'),
                goalsAgainst: getStatVal('pointsAgainst'),
                goalDiff: getStatVal('pointDifferential'),
                points: getStatVal('points'),
                form: [],
              }
            })
          }
        }

        // Process upcoming matches from ESPN
        if (espnResults[1].status === 'fulfilled') {
          const espnMatches = espnResults[1] as PromiseFulfilledResult<Response>
          if (espnMatches.value.ok) {
            const matchesData = await espnMatches.value.json()
            const events = matchesData.events || []
            const now = new Date()
            
            for (const event of events) {
              const competition = event.competitions?.[0]
              if (!competition) continue
              
              const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')
              const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')
              const matchDate = new Date(event.date)
              const statusType = competition.status?.type?.name || ''
              
              const isFinished = statusType.includes('FINAL') || statusType.includes('FULL_TIME')
              
              if (isFinished) {
                leagueData.recentResults.push({
                  id: String(event.id),
                  homeTeam: homeTeam?.team?.displayName || 'Home',
                  awayTeam: awayTeam?.team?.displayName || 'Away',
                  homeScore: parseInt(homeTeam?.score || '0'),
                  awayScore: parseInt(awayTeam?.score || '0'),
                  date: matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                })
              } else if (matchDate >= now) {
                leagueData.upcomingMatches.push({
                  id: String(event.id),
                  homeTeam: homeTeam?.team?.displayName || 'Home',
                  awayTeam: awayTeam?.team?.displayName || 'Away',
                  date: matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  time: matchDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                  venue: competition.venue?.fullName,
                })
              }
            }
          }
        }

        // Process news
        if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
          const newsJson = await newsRes.value.json()
          leagueData.news = (newsJson.articles || newsJson.news || []).slice(0, 5).map((n: any) => ({
            headline: n.headline || n.title || '',
            description: n.description || n.summary || '',
            link: n.links?.web?.href || n.url || '',
            image: n.images?.[0]?.url || n.image || '',
            published: n.published || '',
          }))
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
      {/* Hero Header - FotMob Style */}
      <div className={`bg-gradient-to-r ${config.gradient} py-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leagues
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{config.flag}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
              <p className="text-white/80">{data?.season} Season • {country}</p>
            </div>
          </div>

          {/* Quick Stats - Always show based on available data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {/* Current Leader */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Current Leader</p>
              <p className="text-white font-bold text-lg">{data?.standings[0]?.teamName || 'TBD'}</p>
              <p className="text-white/80 text-sm">{data?.standings[0]?.points || 0} points</p>
            </div>
            
            {/* Top Scorer or point diff leader */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">{data?.topScorers[0] ? 'Top Scorer' : 'Best GD'}</p>
              {data?.topScorers[0] ? (
                <>
                  <p className="text-white font-bold text-lg truncate">{data.topScorers[0].name}</p>
                  <p className="text-white/80 text-sm">{data.topScorers[0].goals} goals</p>
                </>
              ) : (
                <>
                  <p className="text-white font-bold text-lg">{data?.standings[0]?.teamName || 'TBD'}</p>
                  <p className="text-white/80 text-sm">
                    {data?.standings[0]?.goalDiff > 0 ? '+' : ''}{data?.standings[0]?.goalDiff || 0} GD
                  </p>
                </>
              )}
            </div>
            
            {/* Matches Played */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Matchweek</p>
              <p className="text-white font-bold text-lg">{data?.standings[0]?.played || 0}</p>
              <p className="text-white/80 text-sm">matches played</p>
            </div>
            
            {/* Upcoming Matches */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-white/70 text-sm">Coming Up</p>
              <p className="text-white font-bold text-lg">{data?.upcomingMatches?.length || 0}</p>
              <p className="text-white/80 text-sm">fixtures scheduled</p>
            </div>
            
            {/* Show prediction if available */}
            {data?.simulation && (
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 col-span-2 md:col-span-4 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-300 text-sm font-medium">🏆 AI Prediction</p>
                    <p className="text-white font-bold text-lg">{data.simulation.mostLikelyChampion} to win the title</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">
                      {(data.simulation.championProbability * 100).toFixed(0)}%
                    </p>
                    <p className="text-white/60 text-xs">probability</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {data?.upcomingMatches && data.upcomingMatches.length > 0 ? (
                  data.upcomingMatches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}?league=${leagueId}`}
                      className="flex items-center justify-between p-4 hover:bg-[var(--muted-bg)] transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">{match.date} • {match.time}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--text-primary)]">{match.homeTeam}</span>
                          <span className="text-[var(--text-tertiary)]">vs</span>
                          <span className="font-medium text-[var(--text-primary)]">{match.awayTeam}</span>
                        </div>
                        {match.venue && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">📍 {match.venue}</p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <span className="text-3xl mb-2 block">📅</span>
                    <p className="text-[var(--text-tertiary)]">No upcoming fixtures scheduled</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-[var(--card-bg)] border rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Results</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {data?.recentResults && data.recentResults.length > 0 ? (
                  data.recentResults.map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}?league=${leagueId}`}
                      className="flex items-center justify-between p-4 hover:bg-[var(--muted-bg)] transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-[var(--text-tertiary)] mb-1">{match.date}</p>
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${match.homeScore > match.awayScore ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {match.homeTeam}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-sm ${
                            match.homeScore > match.awayScore ? 'bg-green-500/20 text-green-500' :
                            match.awayScore > match.homeScore ? 'bg-red-500/20 text-red-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {match.homeScore} - {match.awayScore}
                          </span>
                          <span className={`font-medium ${match.awayScore > match.homeScore ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {match.awayTeam}
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <span className="text-3xl mb-2 block">⚽</span>
                    <p className="text-[var(--text-tertiary)]">No recent results available</p>
                  </div>
                )}
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
