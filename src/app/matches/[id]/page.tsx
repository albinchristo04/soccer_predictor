'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import FormationDisplay, { PitchBackground, SubstitutesBench } from '@/components/lineup/FormationDisplay'
import MatchWeather from '@/components/weather/MatchWeather'
import RefereeInfo from '@/components/referee/RefereeInfo'
import { HeadToHeadDisplay } from '@/components/match'

interface MatchEvent {
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'var' | 'penalty_missed' | 'own_goal'
  minute: number
  addedTime?: number
  player: string
  team: 'home' | 'away'
  relatedPlayer?: string
  description?: string
}

interface TeamStanding {
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  points: number
  teamName?: string
}

interface PlayerLineup {
  name: string
  position?: string
  jersey?: number
}

interface MatchDetails {
  id: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  status: string
  minute?: number
  addedTime?: number
  venue?: string
  date: string
  league: string
  leagueId?: string
  referee?: string
  events: MatchEvent[]
  lineups: {
    home: PlayerLineup[]
    away: PlayerLineup[]
    homeFormation?: string
    awayFormation?: string
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
    recentMatches: { home_score: number; away_score: number; date: string; homeTeam?: string; awayTeam?: string }[]
  }
  homeStanding?: TeamStanding
  awayStanding?: TeamStanding
  fullStandings?: TeamStanding[]
  nextResumeTime?: Date
}

// Map league IDs for ESPN API
const LEAGUE_ENDPOINTS = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'usa.1', 'uefa.champions', 'uefa.europa', 'fifa.world'
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
  const [halftimeCountdown, setHalftimeCountdown] = useState<string>('')

  // Derived state for live status - compute before hooks that depend on it
  const isLive = match?.status?.includes('IN_PROGRESS') || match?.status?.includes('HALF') || match?.status?.includes('LIVE') || false
  const isHalftime = match?.status?.toLowerCase().includes('half') && !match?.status?.toLowerCase().includes('first') && !match?.status?.toLowerCase().includes('second') || false

  // Halftime countdown effect - must be before early returns
  useEffect(() => {
    if (!isHalftime) {
      setHalftimeCountdown('')
      return
    }
    
    const estimatedResumeTime = new Date()
    estimatedResumeTime.setMinutes(estimatedResumeTime.getMinutes() + 10)
    
    const updateCountdown = () => {
      const now = new Date()
      const diff = estimatedResumeTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setHalftimeCountdown('Resuming soon...')
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setHalftimeCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isHalftime])

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        // Try fetching from different league endpoints until we find the match
        let matchData = null
        let dataSource: 'espn' | 'fotmob' = 'espn'
        
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
        
        // If still no data, try FotMob API (for matches sourced from FotMob)
        if (!matchData || !matchData.header) {
          try {
            const fotmobRes = await fetch(`https://www.fotmob.com/api/matchDetails?matchId=${matchId}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
              },
            })
            if (fotmobRes.ok) {
              const fotmobData = await fotmobRes.json()
              if (fotmobData.general) {
                matchData = fotmobData
                dataSource = 'fotmob'
              }
            }
          } catch (e) {
            console.error('FotMob fallback failed:', e)
          }
        }
        
        // Process ESPN data
        if (matchData && matchData.header && dataSource === 'espn') {
          const data = matchData
          const competition = data.header?.competitions?.[0]
          const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home')
          const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away')
          
          // Extract referee from multiple possible locations
          let refereeName: string | null = null
          
          // Try gameInfo.officials first (most common)
          const officials = data.gameInfo?.officials || data.officials || []
          if (officials.length > 0) {
            const mainReferee = officials.find((o: any) => 
              o.position?.name?.toLowerCase() === 'referee' || 
              o.position?.displayName?.toLowerCase() === 'referee' ||
              o.order === 1
            ) || officials[0]
            refereeName = mainReferee?.fullName || mainReferee?.displayName || mainReferee?.athlete?.displayName || null
          }
          
          // Try from competition status details
          if (!refereeName && competition?.status?.detail) {
            const detail = competition.status.detail
            const refMatch = detail.match(/Referee:\s*([^,\n]+)/i)
            if (refMatch) {
              refereeName = refMatch[1].trim()
            }
          }
          
          // Try from boxscore or content
          if (!refereeName) {
            const boxscoreOfficials = data.boxscore?.officials || data.content?.gameInfo?.officials || []
            if (boxscoreOfficials.length > 0) {
              const mainRef = boxscoreOfficials.find((o: any) => o.position?.toLowerCase().includes('referee')) || boxscoreOfficials[0]
              refereeName = mainRef?.displayName || mainRef?.name || null
            }
          }
          
          // Extract all events including cards, substitutions
          const events: MatchEvent[] = []
          
          // Scoring plays (goals)
          const scoringPlays = data.scoringPlays || []
          for (const play of scoringPlays) {
            const isOwnGoal = play.text?.toLowerCase().includes('own goal')
            events.push({
              type: isOwnGoal ? 'own_goal' : 'goal',
              minute: parseInt(play.clock?.displayValue) || 0,
              player: play.scoringPlay?.scorer?.athlete?.displayName || play.text?.trim() || 'Unknown',
              team: play.homeAway === 'home' ? 'home' : 'away',
              relatedPlayer: play.scoringPlay?.assists?.[0]?.athlete?.displayName,
            })
          }
          
          // Extract match facts events (cards, subs)
          const matchFactEvents = data.content?.matchFacts?.events?.events || data.keyEvents || []
          for (const evt of matchFactEvents) {
            const evtType = evt.type?.toLowerCase() || evt.eventType?.toLowerCase() || ''
            let type: MatchEvent['type'] = 'goal'
            
            if (evtType.includes('yellow')) type = 'yellow_card'
            else if (evtType.includes('red') || evtType.includes('second yellow')) type = 'red_card'
            else if (evtType.includes('sub')) type = 'substitution'
            else if (evtType.includes('var')) type = 'var'
            else continue  // Skip unknown types to avoid duplicating goals
            
            events.push({
              type,
              minute: evt.minute || evt.time?.minute || parseInt(evt.clock?.displayValue) || 0,
              addedTime: evt.addedTime || evt.time?.injuryTime,
              player: evt.player?.name || evt.athlete?.displayName || evt.text || 'Unknown',
              team: evt.isHome || evt.homeAway === 'home' ? 'home' : 'away',
              relatedPlayer: evt.relatedPlayer?.name || evt.playerOff?.name,
            })
          }
          
          // Extract stats helper function
          const getStatValue = (name: string, teamIndex: number) => {
            const teamStats = data.boxscore?.teams?.[teamIndex]?.statistics || []
            const stat = teamStats.find((s: any) => s.name?.toLowerCase() === name.toLowerCase())
            return parseInt(stat?.displayValue) || 0
          }
          
          // Extract lineup with position information
          const extractLineup = (roster: any[]): PlayerLineup[] => {
            if (!roster) return []
            return roster.map((p: any) => ({
              name: p.athlete?.displayName || 'Unknown',
              position: p.position?.abbreviation || p.athlete?.position?.abbreviation || undefined,
              jersey: p.jersey ? parseInt(p.jersey, 10) : undefined,
            }))
          }
          
          // Get formation from ESPN data
          const homeFormation = data.rosters?.[0]?.formation || data.boxscore?.teams?.[0]?.formation || undefined
          const awayFormation = data.rosters?.[1]?.formation || data.boxscore?.teams?.[1]?.formation || undefined

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
            referee: refereeName,
            events,
            lineups: {
              home: extractLineup(data.rosters?.[0]?.roster),
              away: extractLineup(data.rosters?.[1]?.roster),
              homeFormation,
              awayFormation,
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
          
          // Try to extract H2H data from ESPN response
          const headToHead = data.headToHeadHistory || data.previousMeetings || data.headToHead
          if (headToHead) {
            // Count wins/draws from recent meetings
            const recentGames = headToHead.events || headToHead.games || []
            let homeWins = 0, awayWins = 0, draws = 0
            const recentMatches: { home_score: number; away_score: number; date: string }[] = []
            
            for (const game of recentGames.slice(0, 10)) {
              const homeScore = parseInt(game.homeTeam?.score || game.score?.home || '0', 10)
              const awayScore = parseInt(game.awayTeam?.score || game.score?.away || '0', 10)
              
              if (homeScore > awayScore) homeWins++
              else if (awayScore > homeScore) awayWins++
              else draws++
              
              recentMatches.push({
                home_score: homeScore,
                away_score: awayScore,
                date: game.date || game.gameDate || '',
              })
            }
            
            matchDetails.h2h = { homeWins, draws, awayWins, recentMatches }
          }
          
          // Try to fetch league standings to get team positions
          const leagueSlug = leagueId || data.header?.league?.slug || ''
          if (leagueSlug) {
            try {
              const standingsRes = await fetch(
                `https://site.api.espn.com/apis/v2/sports/soccer/${leagueSlug}/standings`
              )
              if (standingsRes.ok) {
                const standingsData = await standingsRes.json()
                const entries = standingsData.children?.[0]?.standings?.entries || []
                
                const homeTeamName = matchDetails.home_team.toLowerCase()
                const awayTeamName = matchDetails.away_team.toLowerCase()
                
                // Build full standings array
                const fullStandings: TeamStanding[] = []
                
                for (let i = 0; i < entries.length; i++) {
                  const entry = entries[i]
                  const teamDisplayName = entry.team?.displayName || 'Unknown'
                  const teamName = teamDisplayName.toLowerCase()
                  
                  const getStatVal = (name: string) => {
                    const stat = entry.stats?.find((s: any) => s.name === name)
                    return parseInt(stat?.value || '0', 10)
                  }
                  
                  const standing: TeamStanding = {
                    position: i + 1,
                    played: getStatVal('gamesPlayed'),
                    won: getStatVal('wins'),
                    drawn: getStatVal('ties'),
                    lost: getStatVal('losses'),
                    points: getStatVal('points'),
                    teamName: teamDisplayName,
                  }
                  
                  fullStandings.push(standing)
                  
                  if (teamName.includes(homeTeamName) || homeTeamName.includes(teamName)) {
                    matchDetails.homeStanding = standing
                  }
                  if (teamName.includes(awayTeamName) || awayTeamName.includes(teamName)) {
                    matchDetails.awayStanding = standing
                  }
                }
                
                matchDetails.fullStandings = fullStandings
              }
            } catch {
              // Standings not available, continue without them
            }
          }
          
          matchDetails.leagueId = leagueSlug
          setMatch(matchDetails)
        }
        
        // Process FotMob data
        if (matchData && matchData.general && dataSource === 'fotmob') {
          const general = matchData.general
          const content = matchData.content
          const header = matchData.header
          
          // Extract status
          let status = 'scheduled'
          const started = general.started
          const finished = general.finished
          if (finished) {
            status = 'STATUS_FINAL'
          } else if (started) {
            status = general.matchTimeUTC ? 'STATUS_IN_PROGRESS' : 'STATUS_HALFTIME'
          }
          
          // Extract events from FotMob
          const events: MatchEvent[] = []
          const matchEvents = content?.matchFacts?.events?.events || []
          for (const evt of matchEvents) {
            const evtType = evt.type?.toLowerCase() || ''
            let type: MatchEvent['type'] = 'goal'
            
            if (evtType === 'goal' || evtType === 'scoring') {
              type = evt.ownGoal ? 'own_goal' : 'goal'
            } else if (evtType === 'yellowcard' || evtType.includes('yellow')) {
              type = 'yellow_card'
            } else if (evtType === 'redcard' || evtType.includes('red')) {
              type = 'red_card'
            } else if (evtType === 'substitution' || evtType.includes('sub')) {
              type = 'substitution'
            } else if (evtType.includes('var')) {
              type = 'var'
            } else {
              continue
            }
            
            events.push({
              type,
              minute: evt.time || evt.minute || 0,
              addedTime: evt.addedTime,
              player: evt.nameStr || evt.player?.name || 'Unknown',
              team: evt.isHome ? 'home' : 'away',
              relatedPlayer: evt.assistStr || evt.assist?.name,
            })
          }
          
          // Extract stats from FotMob
          const statsObj = content?.stats?.Ede?.stats?.[0]?.stats || []
          const getStatPair = (title: string): [number, number] => {
            const stat = statsObj.find((s: any) => s.title?.toLowerCase() === title.toLowerCase())
            if (!stat) return [0, 0]
            return [
              parseInt(stat.stats?.[0]) || 0,
              parseInt(stat.stats?.[1]) || 0,
            ]
          }
          
          // Extract lineups from FotMob
          const extractFotmobLineup = (lineup: any): PlayerLineup[] => {
            if (!lineup?.players) return []
            const players: PlayerLineup[] = []
            for (const row of lineup.players) {
              for (const p of row || []) {
                players.push({
                  name: p.name?.fullName || p.name?.shortName || 'Unknown',
                  position: p.positionStringShort || p.position,
                  jersey: p.shirt,
                })
              }
            }
            return players
          }
          
          const homeLineup = extractFotmobLineup(content?.lineup?.homeTeam)
          const awayLineup = extractFotmobLineup(content?.lineup?.awayTeam)
          
          // Extract referee from FotMob
          const refereeData = content?.matchFacts?.infoBox?.Referee
          const refereeName = refereeData?.text || null
          
          const matchDetails: MatchDetails = {
            id: matchId,
            home_team: general.homeTeam?.name || 'Home Team',
            away_team: general.awayTeam?.name || 'Away Team',
            home_score: general.homeTeam?.score ?? 0,
            away_score: general.awayTeam?.score ?? 0,
            status,
            minute: general.matchTimeUTCDate ? Math.floor((Date.now() - new Date(general.matchTimeUTCDate).getTime()) / 60000) : undefined,
            venue: content?.matchFacts?.infoBox?.Stadium?.text || general.venue?.name,
            date: general.matchTimeUTC || '',
            league: general.leagueName || general.parentLeagueName || '',
            referee: refereeName,
            events,
            lineups: {
              home: homeLineup,
              away: awayLineup,
              homeFormation: content?.lineup?.homeTeam?.formation,
              awayFormation: content?.lineup?.awayTeam?.formation,
            },
            stats: {
              possession: getStatPair('Ball possession'),
              shots: getStatPair('Total shots'),
              shotsOnTarget: getStatPair('Shots on target'),
              corners: getStatPair('Corners'),
              fouls: getStatPair('Fouls'),
            },
            h2h: {
              homeWins: 0,
              draws: 0,
              awayWins: 0,
              recentMatches: [],
            },
          }
          
          // Extract H2H from FotMob
          const h2hData = content?.h2h?.matches || []
          let homeWins = 0, awayWins = 0, draws = 0
          const recentMatches: { home_score: number; away_score: number; date: string }[] = []
          
          for (const game of h2hData.slice(0, 10)) {
            const homeScore = game.homeTeam?.score ?? 0
            const awayScore = game.awayTeam?.score ?? 0
            
            if (homeScore > awayScore) homeWins++
            else if (awayScore > homeScore) awayWins++
            else draws++
            
            recentMatches.push({
              home_score: homeScore,
              away_score: awayScore,
              date: game.matchDate || '',
            })
          }
          
          matchDetails.h2h = { homeWins, draws, awayWins, recentMatches }
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

  // Additional derived state (isLive and isHalftime already computed above before hooks)
  const isScheduled = match.status.toLowerCase().includes('scheduled') || match.status.toLowerCase().includes('pre')
  const isFinished = match.status.includes('FINAL') || match.status.toLowerCase().includes('finished') || match.status.toLowerCase().includes('ft')

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
                {/* Live indicator */}
                {isLive && !isHalftime && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-500 text-sm font-bold">LIVE</span>
                    <span className="text-red-400 text-sm font-bold">{match.minute}&apos;</span>
                  </div>
                )}
                
                {/* Halftime indicator with countdown */}
                {isHalftime && (
                  <div className="mb-2 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-500 rounded text-sm font-bold">HALF TIME</span>
                    </div>
                    {halftimeCountdown && (
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Resumes in: <span className="font-mono text-amber-400">{halftimeCountdown}</span>
                      </p>
                    )}
                  </div>
                )}
                
                <div className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isScheduled ? 'vs' : `${match.home_score} - ${match.away_score}`}
                </div>
                
                {isFinished && (
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
            {/* Match Info Card (Venue, Referee, Weather) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Venue Info */}
              <div className="bg-[var(--card-bg)] border rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Venue</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{match.venue || 'TBD'}</p>
                  </div>
                </div>
              </div>
              
              {/* Referee Info */}
              <div className="bg-[var(--card-bg)] border rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-xl">👨‍⚖️</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Referee</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{match.referee || 'TBD'}</p>
                  </div>
                </div>
              </div>
              
              {/* Date/Time */}
              <div className="bg-[var(--card-bg)] border rounded-xl p-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-xl">📅</span>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Date</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(match.date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather & Referee Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MatchWeather 
                matchId={matchId}
                venue={match.venue}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
              />
              <RefereeInfo
                matchId={matchId}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
              />
            </div>

            {/* Event Summary Card */}
            {match.events.length > 0 && (
              <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)]">Match Summary</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Home Team Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{match.home_team}</h4>
                      <div className="space-y-2">
                        {/* Goals */}
                        {match.events.filter(e => e.team === 'home' && (e.type === 'goal' || e.type === 'own_goal')).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.events
                              .filter(e => e.team === 'home' && (e.type === 'goal' || e.type === 'own_goal'))
                              .map((e, i) => (
                                <div key={i} className="text-sm">
                                  <span className="text-[var(--text-primary)]">
                                    {e.type === 'own_goal' ? '⚽🔴' : '⚽'} {e.player}
                                  </span>
                                  <span className="text-[var(--text-tertiary)]"> {e.minute}&apos;{e.addedTime ? `+${e.addedTime}` : ''}</span>
                                  {e.relatedPlayer && (
                                    <span className="text-[var(--text-tertiary)] text-xs ml-1">(assist: {e.relatedPlayer})</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                        {/* Cards */}
                        {match.events.filter(e => e.team === 'home' && (e.type === 'yellow_card' || e.type === 'red_card')).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {match.events
                              .filter(e => e.team === 'home' && (e.type === 'yellow_card' || e.type === 'red_card'))
                              .map((e, i) => (
                                <span key={i} className="text-xs text-[var(--text-secondary)] bg-[var(--muted-bg)] px-2 py-1 rounded">
                                  {e.type === 'yellow_card' ? '🟨' : '🟥'} {e.player} {e.minute}&apos;
                                </span>
                              ))}
                          </div>
                        )}
                        {/* Substitutions */}
                        {match.events.filter(e => e.team === 'home' && e.type === 'substitution').length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {match.events
                              .filter(e => e.team === 'home' && e.type === 'substitution')
                              .map((e, i) => (
                                <span key={i} className="text-xs text-[var(--text-secondary)] bg-[var(--muted-bg)] px-2 py-1 rounded">
                                  🔄 {e.player} ↔ {e.relatedPlayer || '?'} {e.minute}&apos;
                                </span>
                              ))}
                          </div>
                        )}
                        {match.events.filter(e => e.team === 'home').length === 0 && (
                          <p className="text-sm text-[var(--text-tertiary)]">No notable events</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Away Team Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{match.away_team}</h4>
                      <div className="space-y-2">
                        {/* Goals */}
                        {match.events.filter(e => e.team === 'away' && (e.type === 'goal' || e.type === 'own_goal')).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {match.events
                              .filter(e => e.team === 'away' && (e.type === 'goal' || e.type === 'own_goal'))
                              .map((e, i) => (
                                <div key={i} className="text-sm">
                                  <span className="text-[var(--text-primary)]">
                                    {e.type === 'own_goal' ? '⚽🔴' : '⚽'} {e.player}
                                  </span>
                                  <span className="text-[var(--text-tertiary)]"> {e.minute}&apos;{e.addedTime ? `+${e.addedTime}` : ''}</span>
                                  {e.relatedPlayer && (
                                    <span className="text-[var(--text-tertiary)] text-xs ml-1">(assist: {e.relatedPlayer})</span>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                        {/* Cards */}
                        {match.events.filter(e => e.team === 'away' && (e.type === 'yellow_card' || e.type === 'red_card')).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {match.events
                              .filter(e => e.team === 'away' && (e.type === 'yellow_card' || e.type === 'red_card'))
                              .map((e, i) => (
                                <span key={i} className="text-xs text-[var(--text-secondary)] bg-[var(--muted-bg)] px-2 py-1 rounded">
                                  {e.type === 'yellow_card' ? '🟨' : '🟥'} {e.player} {e.minute}&apos;
                                </span>
                              ))}
                          </div>
                        )}
                        {/* Substitutions */}
                        {match.events.filter(e => e.team === 'away' && e.type === 'substitution').length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {match.events
                              .filter(e => e.team === 'away' && e.type === 'substitution')
                              .map((e, i) => (
                                <span key={i} className="text-xs text-[var(--text-secondary)] bg-[var(--muted-bg)] px-2 py-1 rounded">
                                  🔄 {e.player} ↔ {e.relatedPlayer || '?'} {e.minute}&apos;
                                </span>
                              ))}
                          </div>
                        )}
                        {match.events.filter(e => e.team === 'away').length === 0 && (
                          <p className="text-sm text-[var(--text-tertiary)]">No notable events</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Stats Row */}
                  <div className="flex justify-center gap-8 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[var(--accent-primary)]">
                        {match.events.filter(e => e.team === 'home' && (e.type === 'goal' || e.type === 'own_goal')).length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Goals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">
                        {match.events.filter(e => e.team === 'home' && e.type === 'yellow_card').length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Yellow</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-500">
                        {match.events.filter(e => e.team === 'home' && e.type === 'red_card').length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Red</p>
                    </div>
                    <div className="h-8 w-px bg-[var(--border-color)]" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">
                        {match.events.filter(e => e.team === 'away' && (e.type === 'goal' || e.type === 'own_goal')).length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Goals</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">
                        {match.events.filter(e => e.team === 'away' && e.type === 'yellow_card').length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Yellow</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-500">
                        {match.events.filter(e => e.team === 'away' && e.type === 'red_card').length}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">Red</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
          <div className="space-y-6">
            {/* Formation display - Lineup tab only shows formations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Home Team Formation */}
              <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)]">{match.home_team}</h3>
                  {match.lineups.homeFormation && (
                    <span className="text-sm font-mono px-3 py-1 rounded-full bg-blue-500/20 text-blue-500">
                      {match.lineups.homeFormation}
                    </span>
                  )}
                </div>
                
                {/* Pitch visualization with improved component */}
                <PitchBackground>
                  <FormationDisplay
                    players={match.lineups.home}
                    formation={match.lineups.homeFormation}
                    teamName={match.home_team}
                    teamColor="blue"
                  />
                </PitchBackground>
                
                {/* Substitutes */}
                {match.lineups.home.length > 11 && (
                  <SubstitutesBench players={match.lineups.home.slice(11)} />
                )}
                
                {/* Player list */}
                <div className="p-4 max-h-[200px] overflow-y-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Starting XI</p>
                  <div className="space-y-1">
                    {match.lineups.home.slice(0, 11).map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{player.jersey || idx + 1}</span>
                          <span className="text-[var(--text-primary)]">{player.name}</span>
                        </div>
                        {player.position && (
                          <span className="text-xs text-[var(--text-tertiary)] bg-[var(--muted-bg)] px-2 py-0.5 rounded">{player.position}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Away Team Formation */}
              <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="font-semibold text-[var(--text-primary)]">{match.away_team}</h3>
                  {match.lineups.awayFormation && (
                    <span className="text-sm font-mono px-3 py-1 rounded-full bg-orange-500/20 text-orange-500">
                      {match.lineups.awayFormation}
                    </span>
                  )}
                </div>
                
                {/* Pitch visualization with improved component */}
                <PitchBackground>
                  <FormationDisplay
                    players={match.lineups.away}
                    formation={match.lineups.awayFormation}
                    teamName={match.away_team}
                    teamColor="orange"
                  />
                </PitchBackground>
                
                {/* Substitutes */}
                {match.lineups.away.length > 11 && (
                  <SubstitutesBench players={match.lineups.away.slice(11)} />
                )}
                
                {/* Player list */}
                <div className="p-4 max-h-[200px] overflow-y-auto border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Starting XI</p>
                  <div className="space-y-1">
                    {match.lineups.away.slice(0, 11).map((player, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{player.jersey || idx + 1}</span>
                          <span className="text-[var(--text-primary)]">{player.name}</span>
                        </div>
                        {player.position && (
                          <span className="text-xs text-[var(--text-tertiary)] bg-[var(--muted-bg)] px-2 py-0.5 rounded">{player.position}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
            
            {/* Full League Standings Table */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-[var(--text-primary)]">{match.league} Standings</h4>
                {!match.fullStandings?.length && (
                  <span className="text-xs text-[var(--text-tertiary)]">Data unavailable</span>
                )}
              </div>
              
              {match.fullStandings && match.fullStandings.length > 0 ? (
                <div className="bg-[var(--card-bg)] border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-[var(--muted-bg)]">
                        <tr className="text-xs text-[var(--text-tertiary)] border-b" style={{ borderColor: 'var(--border-color)' }}>
                          <th className="text-left py-2 px-3 font-medium">#</th>
                          <th className="text-left py-2 px-3 font-medium">Team</th>
                          <th className="text-center py-2 px-3 font-medium">P</th>
                          <th className="text-center py-2 px-3 font-medium">W</th>
                          <th className="text-center py-2 px-3 font-medium">D</th>
                          <th className="text-center py-2 px-3 font-medium">L</th>
                          <th className="text-center py-2 px-3 font-medium">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {match.fullStandings.map((team) => {
                          // Compare by team name for reliable identification
                          const teamNameLower = (team.teamName || '').toLowerCase()
                          const homeTeamLower = match.home_team.toLowerCase()
                          const awayTeamLower = match.away_team.toLowerCase()
                          const isHomeTeam = teamNameLower.includes(homeTeamLower) || homeTeamLower.includes(teamNameLower)
                          const isAwayTeam = teamNameLower.includes(awayTeamLower) || awayTeamLower.includes(teamNameLower)
                          const isHighlighted = isHomeTeam || isAwayTeam
                          
                          return (
                            <tr
                              key={team.position}
                              className={`border-b text-sm transition-colors ${
                                isHighlighted 
                                  ? isHomeTeam 
                                    ? 'bg-blue-500/20 border-l-4 border-l-blue-500' 
                                    : 'bg-orange-500/20 border-l-4 border-l-orange-500'
                                  : 'hover:bg-[var(--muted-bg)]'
                              }`}
                              style={{ borderColor: 'var(--border-color)' }}
                            >
                              <td className={`py-2 px-3 ${isHighlighted ? 'font-bold' : ''}`} style={{ color: 'var(--text-secondary)' }}>
                                {team.position}
                              </td>
                              <td className={`py-2 px-3 ${isHighlighted ? 'font-bold text-blue-500' : 'font-medium'} ${isAwayTeam ? 'text-orange-500' : ''}`} style={{ color: isHighlighted ? undefined : 'var(--text-primary)' }}>
                                {team.teamName}
                                {isHighlighted && (
                                  <span className="ml-2 text-xs">
                                    {isHomeTeam ? '(H)' : '(A)'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>{team.played}</td>
                              <td className="py-2 px-3 text-center text-green-500">{team.won}</td>
                              <td className="py-2 px-3 text-center" style={{ color: 'var(--text-tertiary)' }}>{team.drawn}</td>
                              <td className="py-2 px-3 text-center text-red-400">{team.lost}</td>
                              <td className={`py-2 px-3 text-center font-bold ${isHomeTeam ? 'text-blue-500' : ''} ${isAwayTeam ? 'text-orange-500' : ''}`} style={{ color: isHighlighted ? undefined : 'var(--text-primary)' }}>
                                {team.points}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend */}
                  <div className="p-3 border-t flex gap-4 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500/20 border-l-2 border-l-blue-500" />
                      <span>{match.home_team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500/20 border-l-2 border-l-orange-500" />
                      <span>{match.away_team}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-[var(--muted-bg)] rounded-xl">
                  <span className="text-3xl mb-3 block">📊</span>
                  <p className="text-[var(--text-secondary)]">League standings not available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'h2h' && (
          <div className="space-y-6">
            {/* Use the new HeadToHeadDisplay component */}
            <HeadToHeadDisplay
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              matchId={matchId}
              initialData={match.h2h.recentMatches.length > 0 ? {
                totalMatches: match.h2h.homeWins + match.h2h.draws + match.h2h.awayWins,
                team1: {
                  name: match.home_team,
                  wins: match.h2h.homeWins,
                  goals: 0,
                  cleanSheets: 0,
                  homeWins: 0,
                  awayWins: 0,
                },
                team2: {
                  name: match.away_team,
                  wins: match.h2h.awayWins,
                  goals: 0,
                  cleanSheets: 0,
                  homeWins: 0,
                  awayWins: 0,
                },
                draws: match.h2h.draws,
                avgGoalsPerMatch: 0,
                recentForm: [],
                recentMatches: match.h2h.recentMatches.map((m, idx) => ({
                  id: `h2h-${idx}`,
                  date: m.date,
                  competition: '',
                  homeTeam: m.homeTeam || match.home_team,
                  awayTeam: m.awayTeam || match.away_team,
                  homeScore: m.home_score,
                  awayScore: m.away_score,
                  winner: m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : 'draw',
                })),
                streaks: {
                  longestWinStreak: { team: match.home_team, count: 0 },
                },
              } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  )
}
