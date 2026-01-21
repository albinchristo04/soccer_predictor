'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MatchCalendar from '@/components/match/MatchCalendar'

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

// Official league logo URLs (similar to FotMob style)
const LEAGUE_LOGOS: Record<string, string> = {
  'premier_league': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/23.png',
  'la_liga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/15.png',
  'bundesliga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/10.png',
  'serie_a': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/12.png',
  'ligue_1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/9.png',
  'mls': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/19.png',
  'eredivisie': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/11.png',
  'primeira_liga': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/14.png',
  // ESPN-style IDs
  'eng.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/23.png',
  'esp.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/15.png',
  'ger.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/10.png',
  'ita.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/12.png',
  'fra.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/9.png',
  'usa.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/19.png',
  'ned.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/11.png',
  'por.1': 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/14.png',
}

// Available seasons for dropdown
const AVAILABLE_SEASONS = [
  { value: '2025', label: '2025-26' },
  { value: '2024', label: '2024-25' },
  { value: '2023', label: '2023-24' },
  { value: '2022', label: '2022-23' },
  { value: '2021', label: '2021-22' },
]

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

// Animated standing interface for simulation
interface AnimatedStanding {
  position: number
  teamName: string
  finalPosition: number
  points: number
  finalPoints: number
  isAnimating: boolean
}

export default function LeagueHomePage({ leagueId, leagueName, country }: LeagueHomePageProps) {
  const [data, setData] = useState<LeagueHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'fixtures' | 'news'>('standings')
  const [selectedSeason, setSelectedSeason] = useState('2025')
  const [runningSimulation, setRunningSimulation] = useState(false)
  const [showSimulationAnimation, setShowSimulationAnimation] = useState(false)
  const [animatedStandings, setAnimatedStandings] = useState<AnimatedStanding[]>([])
  const [simulationResults, setSimulationResults] = useState<{
    mostLikelyChampion: string
    championProbability: number
    topFourTeams: string[]
    relegationCandidates: string[]
    predictedStandings: { team: string; points: number; position: number }[]
  } | null>(null)

  const config = LEAGUE_CONFIGS[leagueId] || LEAGUE_CONFIGS['premier_league']
  const leagueLogo = LEAGUE_LOGOS[leagueId]

  // Helper to get ESPN league ID
  // League ID mapping for cleaner code
  const LEAGUE_ID_MAPPING: Record<string, string> = {
    'eng': 'premier_league',
    'esp': 'la_liga',
    'ger': 'bundesliga',
    'ita': 'serie_a',
    'fra': 'ligue_1',
    'usa': 'mls',
  }
  
  const LEAGUE_TO_ESPN_ID: Record<string, string> = {
    'premier_league': 'eng.1',
    'la_liga': 'esp.1',
    'bundesliga': 'ger.1',
    'serie_a': 'ita.1',
    'ligue_1': 'fra.1',
    'mls': 'usa.1',
  }

  const getEspnLeagueId = () => {
    // If already an ESPN-style ID (e.g., 'eng.1'), return it
    if (leagueId.includes('.')) {
      return leagueId
    }
    
    // Convert from short form (e.g., 'eng') to internal name
    const prefix = leagueId.split('.')[0]
    const leagueParam = LEAGUE_ID_MAPPING[prefix] || leagueId
    
    // Return ESPN ID
    return LEAGUE_TO_ESPN_ID[leagueParam] || leagueId
  }

  // Run end of season simulation with animation
  const runSeasonSimulation = async () => {
    setRunningSimulation(true)
    setShowSimulationAnimation(false)
    try {
      // Map leagueId to numeric ID for simulation endpoint
      const leagueIdMap: Record<string, number> = {
        'eng.1': 47, 'premier_league': 47,
        'esp.1': 87, 'la_liga': 87,
        'ger.1': 54, 'bundesliga': 54,
        'ita.1': 55, 'serie_a': 55,
        'fra.1': 53, 'ligue_1': 53,
      }
      const numericLeagueId = leagueIdMap[leagueId] || 47
      
      const res = await fetch(`/api/simulation/${numericLeagueId}?n_simulations=10000`)
      if (res.ok) {
        const simData = await res.json()
        const predictedStandings = (simData.standings || []).map((s: any, idx: number) => ({
          team: s.team_name || s.team || 'Unknown',
          points: Math.round(s.predicted_points || s.points || 0),
          position: idx + 1,
        }))
        
        setSimulationResults({
          mostLikelyChampion: simData.most_likely_champion || simData.standings?.[0]?.team_name || 'Unknown',
          championProbability: simData.champion_probability || simData.standings?.[0]?.title_probability || 0,
          topFourTeams: simData.likely_top_4 || simData.standings?.slice(0, 4).map((s: any) => s.team_name) || [],
          relegationCandidates: simData.relegation_candidates || simData.standings?.slice(-3).map((s: any) => s.team_name) || [],
          predictedStandings,
        })
        
        // Start animation if we have current standings
        if (data?.standings && predictedStandings.length > 0) {
          startSimulationAnimation(predictedStandings)
        }
      }
    } catch (error) {
      console.error('Simulation error:', error)
    } finally {
      setRunningSimulation(false)
    }
  }

  // Normalize team name for comparison (handles variations like "Man City" vs "Manchester City")
  const normalizeTeamName = (name: string): string => {
    return name.toLowerCase()
      .replace(/fc$|cf$|sc$/i, '')
      .replace(/united/i, 'utd')
      .replace(/city/i, 'city')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Match team names with fuzzy matching
  const teamsMatch = (name1: string, name2: string): boolean => {
    const n1 = normalizeTeamName(name1)
    const n2 = normalizeTeamName(name2)
    // Exact match after normalization
    if (n1 === n2) return true
    // Check if one name is a significant substring of the other (at least 60% of the longer name)
    const shorter = n1.length < n2.length ? n1 : n2
    const longer = n1.length >= n2.length ? n1 : n2
    return longer.includes(shorter) && shorter.length >= longer.length * 0.6
  }

  // Animation offset for visual effect
  const ANIMATION_OFFSET_PX = 2

  // Animate teams moving to their predicted positions
  const startSimulationAnimation = (predictedStandings: { team: string; points: number; position: number }[]) => {
    if (!data?.standings) return
    
    // Create initial animated standings from current data
    const initial: AnimatedStanding[] = data.standings.map((s, idx) => {
      const predicted = predictedStandings.find(p => teamsMatch(p.team, s.teamName))
      return {
        position: idx + 1,
        teamName: s.teamName,
        finalPosition: predicted?.position || idx + 1,
        points: s.points,
        finalPoints: predicted?.points || s.points,
        isAnimating: true,
      }
    })
    
    setAnimatedStandings(initial)
    setShowSimulationAnimation(true)
    
    // Animate over 3 seconds
    const totalSteps = 30
    let step = 0
    
    const animateInterval = setInterval(() => {
      step++
      const progress = step / totalSteps
      const easeProgress = 1 - Math.pow(1 - progress, 3) // Ease-out cubic
      
      setAnimatedStandings(prev => 
        prev.map(s => ({
          ...s,
          position: s.position + (s.finalPosition - s.position) * easeProgress,
          points: Math.round(s.points + (s.finalPoints - s.points) * easeProgress),
        })).sort((a, b) => a.position - b.position)
      )
      
      if (step >= totalSteps) {
        clearInterval(animateInterval)
        setAnimatedStandings(prev => prev.map(s => ({ ...s, isAnimating: false })))
      }
    }, 100)
  }

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
        
        // Also fetch from ESPN for real-time data including top scorers
        const espnLeagueId = getEspnLeagueId()

        const espnResults = await Promise.allSettled([
          fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${espnLeagueId}/standings`),
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeagueId}/scoreboard`),
          fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeagueId}/leaders`),
        ])

        const leagueData: LeagueHomeData = {
          leagueId: parseInt(leagueId) || 0,
          leagueName,
          country,
          season: AVAILABLE_SEASONS.find(s => s.value === selectedSeason)?.label || '2025-26',
          standings: [],
          topScorers: [],
          upcomingMatches: [],
          recentResults: [],
          news: [],
        }

        // PRIORITIZE ESPN data for accurate real-time standings
        // ESPN provides the most up-to-date standings data
        let espnStandingsLoaded = false
        if (espnResults[0].status === 'fulfilled') {
          const espnStandings = espnResults[0] as PromiseFulfilledResult<Response>
          if (espnStandings.value.ok) {
            const espnData = await espnStandings.value.json()
            const entries = espnData.children?.[0]?.standings?.entries || []
            if (entries.length > 0) {
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
              espnStandingsLoaded = true
            }
          }
        }
        
        // Fallback to local standings if ESPN fails
        if (!espnStandingsLoaded && standingsRes.status === 'fulfilled' && standingsRes.value.ok) {
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

        // Process top scorers from ESPN with better parsing
        if (espnResults[2].status === 'fulfilled') {
          const espnLeaders = espnResults[2] as PromiseFulfilledResult<Response>
          if (espnLeaders.value.ok) {
            const leadersData = await espnLeaders.value.json()
            
            // Try different paths to find leaders data
            let scorers: any[] = []
            
            // Path 1: leaders array with categories
            if (leadersData.leaders && Array.isArray(leadersData.leaders)) {
              const goalsCategory = leadersData.leaders.find((cat: any) => 
                cat.name?.toLowerCase().includes('goal') || 
                cat.displayName?.toLowerCase().includes('goal') ||
                cat.abbreviation?.toLowerCase() === 'g'
              )
              if (goalsCategory?.leaders) {
                scorers = goalsCategory.leaders
              }
            }
            
            // Path 2: categories within leaders
            if (scorers.length === 0 && leadersData.categories) {
              const goalsCategory = leadersData.categories.find((cat: any) =>
                cat.name?.toLowerCase().includes('goal') ||
                cat.displayName?.toLowerCase().includes('goal')
              )
              if (goalsCategory?.leaders) {
                scorers = goalsCategory.leaders
              }
            }
            
            // Path 3: direct leaders array
            if (scorers.length === 0 && leadersData.athletes) {
              scorers = leadersData.athletes
            }
            
            if (scorers.length > 0) {
              leagueData.topScorers = scorers.slice(0, 10).map((leader: any, idx: number) => ({
                rank: idx + 1,
                name: leader.athlete?.displayName || leader.athlete?.fullName || leader.displayName || leader.name || 'Unknown',
                team: leader.athlete?.team?.displayName || leader.team?.displayName || leader.teamName || '',
                goals: parseInt(leader.value || leader.stat || leader.goals || '0'),
                assists: parseInt(leader.assists || '0'),
                matches: leader.athlete?.statistics?.gamesPlayed || leader.gamesPlayed || 0,
              }))
            }
          }
        }

        // Process league-specific news from ESPN
        try {
          const espnNewsRes = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeagueId}/news`,
            { next: { revalidate: 300 } }
          )
          if (espnNewsRes.ok) {
            const espnNewsData = await espnNewsRes.json()
            leagueData.news = (espnNewsData.articles || []).slice(0, 8).map((n: any) => ({
              headline: n.headline || '',
              description: n.description || '',
              link: n.links?.web?.href || '',
              image: n.images?.[0]?.url || '',
              published: n.published || '',
            }))
          }
        } catch (e) {
          // Fallback to general news
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
        }

        setData(leagueData)
      } catch (error) {
        console.error('Error fetching league data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeagueData()
  }, [leagueId, leagueName, country, selectedSeason])

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
          
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              {/* League Logo */}
              {leagueLogo ? (
                <img 
                  src={leagueLogo} 
                  alt={leagueName}
                  className="w-16 h-16 object-contain bg-white rounded-xl p-1"
                />
              ) : (
                <span className="text-4xl">{config.flag}</span>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{leagueName}</h1>
                <p className="text-white/80">{AVAILABLE_SEASONS.find(s => s.value === selectedSeason)?.label || '2025-26'} Season • {country}</p>
              </div>
            </div>
            
            {/* Season Dropdown & Simulation Button */}
            <div className="flex items-center gap-3">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
              >
                {AVAILABLE_SEASONS.map(season => (
                  <option key={season.value} value={season.value} className="text-gray-900">
                    {season.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={runSeasonSimulation}
                disabled={runningSimulation}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {runningSimulation ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simulating...
                  </>
                ) : (
                  <>
                    🎲 Run Season Simulation
                  </>
                )}
              </button>
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
            
            {/* Show simulation results if available */}
            {simulationResults && (
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 col-span-2 md:col-span-4 border border-amber-500/30">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-amber-300 text-sm font-medium">🏆 AI Season Prediction</p>
                    <p className="text-white font-bold text-lg">{simulationResults.mostLikelyChampion} predicted to win the title</p>
                    <p className="text-white/70 text-sm mt-1">
                      Top 4: {simulationResults.topFourTeams.join(', ')}
                    </p>
                    <p className="text-red-300 text-xs mt-1">
                      ⚠️ Relegation risk: {simulationResults.relegationCandidates.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">
                      {(simulationResults.championProbability * 100).toFixed(0)}%
                    </p>
                    <p className="text-white/60 text-xs">title probability</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show prediction from data if available */}
            {data?.simulation && !simulationResults && (
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
          <div className="space-y-4">
            {/* Animated Simulation Results */}
            {showSimulationAnimation && animatedStandings.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🎲</span>
                  <h3 className="text-lg font-semibold text-amber-400">Season Simulation - Predicted Final Standings</h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    {animatedStandings.some(s => s.isAnimating) ? 'Simulating...' : 'Complete'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--muted-bg)]">
                      <tr className="text-xs text-[var(--text-tertiary)]">
                        <th className="text-left py-2 px-3 font-medium">#</th>
                        <th className="text-left py-2 px-3 font-medium">Team</th>
                        <th className="text-center py-2 px-3 font-medium">Predicted Pts</th>
                        <th className="text-center py-2 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animatedStandings.map((team, idx) => {
                        const posChange = (data.standings.findIndex(s => s.teamName === team.teamName) + 1) - Math.round(team.position)
                        let zoneClass = ''
                        if (idx < 4) zoneClass = 'border-l-4 border-l-green-500 bg-green-500/10'
                        else if (idx >= animatedStandings.length - 3) zoneClass = 'border-l-4 border-l-red-500 bg-red-500/10'
                        else if (idx < 6) zoneClass = 'border-l-4 border-l-blue-500 bg-blue-500/10'

                        return (
                          <tr
                            key={team.teamName}
                            className={`border-b transition-all duration-300 ${zoneClass}`}
                            style={{ 
                              borderColor: 'var(--border-color)',
                              transform: team.isAnimating ? `translateY(${(team.position - idx - 1) * ANIMATION_OFFSET_PX}px)` : 'none',
                            }}
                          >
                            <td className="py-2 px-3 text-[var(--text-secondary)]">{Math.round(team.position)}</td>
                            <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                              <div className="flex items-center gap-2">
                                {team.teamName}
                                {!team.isAnimating && posChange !== 0 && (
                                  <span className={`text-xs ${posChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {posChange > 0 ? `↑${posChange}` : `↓${Math.abs(posChange)}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-amber-400">{team.points}</td>
                            <td className="py-2 px-3 text-center text-xs">
                              {idx === 0 && <span className="bg-amber-500 text-black px-2 py-0.5 rounded">🏆 Champion</span>}
                              {idx > 0 && idx < 4 && <span className="bg-green-500/30 text-green-400 px-2 py-0.5 rounded">UCL</span>}
                              {idx >= 4 && idx < 6 && <span className="bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded">UEL</span>}
                              {idx >= animatedStandings.length - 3 && <span className="bg-red-500/30 text-red-400 px-2 py-0.5 rounded">Relegated</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => setShowSimulationAnimation(false)}
                  className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  ← Back to Current Standings
                </button>
              </div>
            )}

            {/* Current Standings */}
            <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {showSimulationAnimation ? 'Current Standings (Before Simulation)' : 'League Standings'}
                </h2>
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
          </div>
        )}

        {activeTab === 'scorers' && (
          <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Scorers</h2>
            </div>
            {data?.topScorers && data.topScorers.length > 0 ? (
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
            ) : (
              <div className="p-8 text-center">
                <span className="text-3xl mb-2 block">⚽</span>
                <p className="text-[var(--text-tertiary)]">Top scorers data is being loaded...</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Check back later for the latest statistics</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Calendar View */}
            <MatchCalendar leagueId={getEspnLeagueId()} leagueName={leagueName} />
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
