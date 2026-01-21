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
  currentY: number  // For smooth visual animation
}

// Simulation count options (like in Predict tab)
const SIMULATION_OPTIONS = [1000, 5000, 10000, 25000, 50000]

// MLS Conference configuration
const MLS_CONFERENCES = {
  eastern: ['Inter Miami', 'Cincinnati', 'Columbus', 'Orlando City', 'Charlotte', 'New York Red Bulls', 'New York City FC', 'Philadelphia', 'Atlanta United', 'D.C. United', 'Chicago', 'CF Montréal', 'New England', 'Nashville', 'Toronto FC'],
  western: ['LAFC', 'LA Galaxy', 'Seattle', 'Houston', 'Real Salt Lake', 'Minnesota', 'Colorado', 'Portland', 'Vancouver', 'St. Louis', 'Austin', 'Sporting KC', 'FC Dallas', 'San Jose'],
}

// Pre-compute lowercased conference team names for efficient matching
const MLS_EASTERN_LOWER = MLS_CONFERENCES.eastern.map(t => t.toLowerCase())
const MLS_WESTERN_LOWER = MLS_CONFERENCES.western.map(t => t.toLowerCase())

export default function LeagueHomePage({ leagueId, leagueName, country }: LeagueHomePageProps) {
  const [data, setData] = useState<LeagueHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'fixtures' | 'news'>('standings')
  const [selectedSeason, setSelectedSeason] = useState('2025')
  const [runningSimulation, setRunningSimulation] = useState(false)
  const [showSimulationAnimation, setShowSimulationAnimation] = useState(false)
  const [animatedStandings, setAnimatedStandings] = useState<AnimatedStanding[]>([])
  const [numSimulations, setNumSimulations] = useState(10000)
  const [animationStep, setAnimationStep] = useState(0)
  const [simulationResults, setSimulationResults] = useState<{
    mostLikelyChampion: string
    championProbability: number
    topFourTeams: string[]
    relegationCandidates: string[]
    predictedStandings: { team: string; points: number; position: number }[]
  } | null>(null)

  // Check if this is MLS to show conferences
  const isMLS = leagueId === 'usa.1' || leagueId === 'mls'

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
    setAnimationStep(0)
    try {
      // Map leagueId to numeric ID for simulation endpoint
      const leagueIdMap: Record<string, number> = {
        'eng.1': 47, 'premier_league': 47,
        'esp.1': 87, 'la_liga': 87,
        'ger.1': 54, 'bundesliga': 54,
        'ita.1': 55, 'serie_a': 55,
        'fra.1': 53, 'ligue_1': 53,
        'usa.1': 29, 'mls': 29,
      }
      const numericLeagueId = leagueIdMap[leagueId] || 47
      
      const res = await fetch(`/api/simulation/${numericLeagueId}?n_simulations=${numSimulations}`)
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
        
        // Start live animation if we have current standings
        if (data?.standings && predictedStandings.length > 0) {
          startLiveSimulationAnimation(predictedStandings)
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

  // Row height for animation calculation
  const ROW_HEIGHT_PX = 44

  // Live animation: Teams visually swap positions in real-time
  const startLiveSimulationAnimation = (predictedStandings: { team: string; points: number; position: number }[]) => {
    if (!data?.standings) return
    
    // Create initial animated standings from current data with Y position
    const initial: AnimatedStanding[] = data.standings.map((s, idx) => {
      const predicted = predictedStandings.find(p => teamsMatch(p.team, s.teamName))
      return {
        position: idx + 1,
        teamName: s.teamName,
        finalPosition: predicted?.position || idx + 1,
        points: s.points,
        finalPoints: predicted?.points || s.points,
        isAnimating: true,
        currentY: 0,
      }
    })
    
    setAnimatedStandings(initial)
    setShowSimulationAnimation(true)
    
    // Animate over 4 seconds with smooth transitions
    const totalSteps = 60
    let step = 0
    
    // Easing function for smooth animation (ease-in-out cubic)
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }
    
    const animateInterval = setInterval(() => {
      step++
      setAnimationStep(step)
      const progress = step / totalSteps
      const easeProgress = easeInOutCubic(progress)
      
      setAnimatedStandings(prev => {
        const updated = prev.map(s => {
          // Calculate target Y position based on where the team needs to move
          const currentIdx = prev.findIndex(p => p.teamName === s.teamName)
          const targetIdx = s.finalPosition - 1
          const targetY = (targetIdx - currentIdx) * ROW_HEIGHT_PX * easeProgress
          
          return {
            ...s,
            points: Math.round(s.points + (s.finalPoints - s.points) * easeProgress),
            currentY: targetY,
            isAnimating: step < totalSteps,
          }
        })
        
        // Sort by final position at the end
        if (step >= totalSteps) {
          return updated.sort((a, b) => a.finalPosition - b.finalPosition)
        }
        return updated
      })
      
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
              
              {/* Simulation Count Selector */}
              <select
                value={numSimulations}
                onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors text-sm"
              >
                {SIMULATION_OPTIONS.map(num => (
                  <option key={num} value={num} className="text-gray-900">
                    {num.toLocaleString()} sims
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
                    🎲 Run Simulation
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
                    <p className="text-amber-300 text-sm font-medium">🏆 AI Season Prediction ({numSimulations.toLocaleString()} simulations)</p>
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
            {/* Live Animated Simulation Results */}
            {showSimulationAnimation && animatedStandings.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎲</span>
                    <h3 className="text-lg font-semibold text-amber-400">Season Simulation - Live Preview</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      animatedStandings.some(s => s.isAnimating) 
                        ? 'bg-amber-500/40 text-amber-200 animate-pulse' 
                        : 'bg-green-500/40 text-green-200'
                    }`}>
                      {animatedStandings.some(s => s.isAnimating) 
                        ? `Simulating... ${Math.round((animationStep / 60) * 100)}%` 
                        : '✓ Complete'}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--text-tertiary)]">
                    {numSimulations.toLocaleString()} simulations
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-amber-500/30">
                  <table className="w-full">
                    <thead className="bg-[var(--muted-bg)]">
                      <tr className="text-xs text-[var(--text-tertiary)]">
                        <th className="text-left py-2 px-3 font-medium w-12">#</th>
                        <th className="text-left py-2 px-3 font-medium">Team</th>
                        <th className="text-center py-2 px-3 font-medium">Final Pts</th>
                        <th className="text-center py-2 px-3 font-medium">Change</th>
                        <th className="text-center py-2 px-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="relative">
                      {animatedStandings.map((team, idx) => {
                        const originalIdx = data.standings.findIndex(s => s.teamName === team.teamName)
                        const posChange = (originalIdx + 1) - team.finalPosition
                        const finalIdx = team.finalPosition - 1
                        
                        // Zone colors with better visibility
                        let zoneClass = ''
                        let zoneBorder = ''
                        if (finalIdx < 4) {
                          zoneClass = 'bg-green-500/25'
                          zoneBorder = 'border-l-4 border-l-green-400'
                        } else if (finalIdx >= animatedStandings.length - 3) {
                          zoneClass = 'bg-red-500/25'
                          zoneBorder = 'border-l-4 border-l-red-400'
                        } else if (finalIdx < 6) {
                          zoneClass = 'bg-blue-500/25'
                          zoneBorder = 'border-l-4 border-l-blue-400'
                        }

                        return (
                          <tr
                            key={team.teamName}
                            className={`border-b transition-transform duration-100 ease-out ${zoneClass} ${zoneBorder}`}
                            style={{ 
                              borderColor: 'var(--border-color)',
                              transform: `translateY(${team.currentY}px)`,
                            }}
                          >
                            <td className="py-2.5 px-3 text-[var(--text-secondary)] font-medium">
                              {team.isAnimating ? originalIdx + 1 : team.finalPosition}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                              <div className="flex items-center gap-2">
                                <span className={team.isAnimating ? 'animate-pulse' : ''}>{team.teamName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-400">{team.points}</td>
                            <td className="py-2.5 px-3 text-center">
                              {!team.isAnimating && posChange !== 0 && (
                                <span className={`text-sm font-semibold ${posChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {posChange > 0 ? `▲ ${posChange}` : `▼ ${Math.abs(posChange)}`}
                                </span>
                              )}
                              {!team.isAnimating && posChange === 0 && (
                                <span className="text-sm text-[var(--text-tertiary)]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center text-xs">
                              {finalIdx === 0 && <span className="bg-amber-500 text-black px-2 py-0.5 rounded font-semibold">🏆 Champion</span>}
                              {finalIdx > 0 && finalIdx < 4 && <span className="bg-green-600 text-white px-2 py-0.5 rounded font-medium">UCL</span>}
                              {finalIdx >= 4 && finalIdx < 6 && <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-medium">UEL</span>}
                              {finalIdx >= animatedStandings.length - 3 && <span className="bg-red-600 text-white px-2 py-0.5 rounded font-medium">Relegated</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={() => setShowSimulationAnimation(false)}
                  className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                >
                  ← Back to Current Standings
                </button>
              </div>
            )}

            {/* Current Standings - with MLS Conference Support */}
            {isMLS ? (
              // MLS: Show Eastern and Western Conferences
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['Eastern Conference', 'Western Conference'].map((conference) => {
                  const isEastern = conference.includes('Eastern')
                  const conferenceTeams = data.standings.filter(team => {
                    const teamNameLower = team.teamName.toLowerCase()
                    return isEastern 
                      ? MLS_EASTERN_LOWER.some(et => teamNameLower.includes(et) || et.includes(teamNameLower))
                      : MLS_WESTERN_LOWER.some(wt => teamNameLower.includes(wt) || wt.includes(teamNameLower))
                  })
                  
                  return (
                    <div key={conference} className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                      <div className={`p-4 border-b bg-gradient-to-r ${isEastern ? 'from-blue-600/20 to-indigo-600/20' : 'from-orange-600/20 to-red-600/20'}`} style={{ borderColor: 'var(--border-color)' }}>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{conference}</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[var(--muted-bg)]">
                            <tr className="text-xs text-[var(--text-tertiary)]">
                              <th className="text-left py-3 px-3 font-medium">#</th>
                              <th className="text-left py-3 px-3 font-medium">Team</th>
                              <th className="text-center py-3 px-2 font-medium">P</th>
                              <th className="text-center py-3 px-2 font-medium">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {conferenceTeams.length > 0 ? conferenceTeams.map((team, idx) => {
                              let zoneClass = ''
                              if (idx < 7) zoneClass = 'border-l-4 border-l-green-400 bg-green-500/20'  // Playoff spots
                              else if (idx < 9) zoneClass = 'border-l-4 border-l-amber-400 bg-amber-500/20'  // Wild card

                              return (
                                <tr key={team.teamName} className={`border-b hover:bg-[var(--muted-bg)] ${zoneClass}`} style={{ borderColor: 'var(--border-color)' }}>
                                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{team.teamName}</td>
                                  <td className="py-2.5 px-2 text-center text-[var(--text-secondary)]">{team.played}</td>
                                  <td className="py-2.5 px-2 text-center font-bold text-[var(--text-primary)]">{team.points}</td>
                                </tr>
                              )
                            }) : (
                              <tr><td colSpan={4} className="py-4 text-center text-[var(--text-tertiary)]">No teams found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-3 border-t text-xs text-[var(--text-tertiary)] flex gap-3" style={{ borderColor: 'var(--border-color)' }}>
                        <span><span className="inline-block w-2 h-2 rounded-sm bg-green-400 mr-1"></span> Playoff</span>
                        <span><span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1"></span> Wild Card</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Regular league standings
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
                        // Determine zone coloring with improved visibility
                        let zoneClass = ''
                        if (idx < 4) zoneClass = 'border-l-4 border-l-green-400 bg-green-500/20'
                        else if (idx >= data.standings.length - 3) zoneClass = 'border-l-4 border-l-red-400 bg-red-500/20'
                        else if (idx < 6) zoneClass = 'border-l-4 border-l-blue-400 bg-blue-500/20'

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
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    <span className="text-[var(--text-tertiary)]">Champions League</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded" />
                    <span className="text-[var(--text-tertiary)]">Europa League</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span className="text-[var(--text-tertiary)]">Relegation</span>
                  </div>
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.news && data.news.length > 0 ? (
              data.news.map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden hover:bg-[var(--muted-bg)] transition-colors group" 
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {/* Cover Photo */}
                  {item.image && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.headline} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                      {item.headline}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{item.description}</p>
                    {item.published && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-2">{item.published}</p>
                    )}
                  </div>
                </a>
              ))
            ) : (
              <div className="bg-[var(--card-bg)] border rounded-2xl p-8 text-center col-span-2" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-[var(--text-tertiary)]">No news available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
