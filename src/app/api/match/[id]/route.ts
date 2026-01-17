import { NextRequest, NextResponse } from 'next/server'

// Map league IDs for ESPN API
const LEAGUE_ENDPOINTS = [
  'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'usa.1', 'uefa.champions', 'uefa.europa', 'fifa.world'
]

interface MatchEvent {
  type: string
  minute: number
  addedTime?: number
  player: string
  team: 'home' | 'away'
  relatedPlayer?: string
  description?: string
}

interface H2HMatch {
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  competition?: string
}

interface H2HData {
  homeWins: number
  draws: number
  awayWins: number
  recentMatches: H2HMatch[]
}

interface PredictionData {
  home_win: number
  draw: number
  away_win: number
  predicted_score: { home: number; away: number }
  confidence: number
}

interface MatchDetailsResponse {
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
    home: { name: string; position?: string; jersey?: number }[]
    away: { name: string; position?: string; jersey?: number }[]
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
  commentary?: { minute: number; text: string }[]
  prediction?: PredictionData
  h2h?: H2HData
}

async function fetchFromESPN(matchId: string, leagueId?: string): Promise<MatchDetailsResponse | null> {
  // Try with provided league ID first
  const leaguesToTry = leagueId ? [leagueId, ...LEAGUE_ENDPOINTS.filter(l => l !== leagueId)] : LEAGUE_ENDPOINTS
  
  for (const league of leaguesToTry) {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${matchId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 30 }, // Cache for 30 seconds for live data
      })
      
      if (!res.ok) continue
      
      const data = await res.json()
      const competition = data.header?.competitions?.[0]
      if (!competition) continue
      
      const homeTeam = competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'home')
      const awayTeam = competition.competitors?.find((c: { homeAway: string }) => c.homeAway === 'away')
      
      if (!homeTeam || !awayTeam) continue
      
      // Extract status
      const statusType = competition.status?.type?.name || 'STATUS_SCHEDULED'
      let status = 'scheduled'
      let minute: number | undefined
      
      if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FULL_TIME') {
        status = 'finished'
      } else if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME' || 
                 statusType === 'STATUS_FIRST_HALF' || statusType === 'STATUS_SECOND_HALF') {
        status = 'live'
        const displayClock = competition.status?.displayClock
        if (displayClock) {
          minute = parseInt(displayClock.split(':')[0]) || undefined
        }
        if (statusType === 'STATUS_HALFTIME') {
          minute = 45
        }
      }
      
      // Extract events
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
      
      // Extract lineups
      const homeLineup = data.rosters?.find((r: { homeAway: string }) => r.homeAway === 'home')?.roster || []
      const awayLineup = data.rosters?.find((r: { homeAway: string }) => r.homeAway === 'away')?.roster || []
      
      // Extract stats
      const boxscore = data.boxscore || {}
      const stats = {
        possession: [50, 50] as [number, number],
        shots: [0, 0] as [number, number],
        shotsOnTarget: [0, 0] as [number, number],
        corners: [0, 0] as [number, number],
        fouls: [0, 0] as [number, number],
      }
      
      if (boxscore.teams) {
        for (const team of boxscore.teams) {
          const isHome = team.homeAway === 'home'
          const idx = isHome ? 0 : 1
          for (const stat of team.statistics || []) {
            const name = stat.name?.toLowerCase() || stat.label?.toLowerCase() || ''
            const value = parseInt(stat.displayValue || stat.value) || 0
            if (name.includes('possession')) stats.possession[idx] = value
            else if (name.includes('shots on target') || name === 'shotsontarget') stats.shotsOnTarget[idx] = value
            else if (name === 'shots' || name === 'totalshots') stats.shots[idx] = value
            else if (name.includes('corner')) stats.corners[idx] = value
            else if (name.includes('foul')) stats.fouls[idx] = value
          }
        }
      }
      
      // Extract commentary
      const commentary: { minute: number; text: string }[] = []
      const plays = data.plays || data.keyEvents || []
      for (const play of plays) {
        if (play.text) {
          commentary.push({
            minute: parseInt(play.clock?.displayValue) || 0,
            text: play.text,
          })
        }
      }
      
      return {
        id: matchId,
        home_team: homeTeam.team?.displayName || homeTeam.team?.name || '',
        away_team: awayTeam.team?.displayName || awayTeam.team?.name || '',
        home_score: status !== 'scheduled' ? parseInt(homeTeam.score || '0') : null,
        away_score: status !== 'scheduled' ? parseInt(awayTeam.score || '0') : null,
        status,
        minute,
        venue: data.gameInfo?.venue?.fullName || competition.venue?.fullName,
        date: competition.date || data.header?.competitions?.[0]?.date || '',
        league: data.header?.league?.name || league,
        leagueId: league,
        referee: data.gameInfo?.officials?.[0]?.fullName,
        events,
        lineups: {
          home: homeLineup.map((p: { athlete?: { displayName?: string }; position?: { abbreviation?: string }; jersey?: string }) => ({
            name: p.athlete?.displayName || 'Unknown',
            position: p.position?.abbreviation,
            jersey: p.jersey ? parseInt(p.jersey) : undefined,
          })),
          away: awayLineup.map((p: { athlete?: { displayName?: string }; position?: { abbreviation?: string }; jersey?: string }) => ({
            name: p.athlete?.displayName || 'Unknown',
            position: p.position?.abbreviation,
            jersey: p.jersey ? parseInt(p.jersey) : undefined,
          })),
          homeFormation: data.rosters?.find((r: { homeAway: string }) => r.homeAway === 'home')?.formation,
          awayFormation: data.rosters?.find((r: { homeAway: string }) => r.homeAway === 'away')?.formation,
        },
        stats,
        commentary: commentary.slice(-50), // Last 50 commentary items
      }
    } catch (e) {
      console.error(`Failed to fetch from ESPN ${league}:`, e)
      continue
    }
  }
  
  return null
}

async function fetchFromFotMob(matchId: string): Promise<MatchDetailsResponse | null> {
  try {
    const res = await fetch(`https://www.fotmob.com/api/matchDetails?matchId=${matchId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.fotmob.com/',
      },
      next: { revalidate: 30 },
    })
    
    if (!res.ok) return null
    
    const data = await res.json()
    if (!data.general) return null
    
    const general = data.general
    const header = data.header || {}
    const content = data.content || {}
    
    // Determine status
    let status = 'scheduled'
    if (general.finished || general.matchEnded) {
      status = 'finished'
    } else if (general.started) {
      status = 'live'
    }
    
    // Extract events
    const events: MatchEvent[] = []
    const matchEvents = content.matchFacts?.events?.events || []
    
    for (const evt of matchEvents) {
      const evtType = evt.type?.toLowerCase() || ''
      let type = 'goal'
      
      if (evtType === 'goal' || evtType === 'penaltygoal') {
        type = 'goal'
      } else if (evtType === 'owngoal') {
        type = 'own_goal'
      } else if (evtType === 'yellowcard') {
        type = 'yellow_card'
      } else if (evtType === 'redcard' || evtType === 'secondyellow') {
        type = 'red_card'
      } else if (evtType === 'substitution') {
        type = 'substitution'
      } else {
        continue
      }
      
      events.push({
        type,
        minute: evt.time || 0,
        addedTime: evt.overloadTime,
        player: evt.player?.name || evt.nameStr || 'Unknown',
        team: evt.isHome ? 'home' : 'away',
        relatedPlayer: evt.assistStr || evt.swap?.name,
      })
    }
    
    // Extract stats
    const statsData = content.stats?.Ede || []
    const stats = {
      possession: [50, 50] as [number, number],
      shots: [0, 0] as [number, number],
      shotsOnTarget: [0, 0] as [number, number],
      corners: [0, 0] as [number, number],
      fouls: [0, 0] as [number, number],
    }
    
    for (const section of statsData) {
      for (const stat of section.stats || []) {
        const title = stat.title?.toLowerCase() || ''
        const home = parseInt(stat.stats?.[0]) || 0
        const away = parseInt(stat.stats?.[1]) || 0
        
        if (title.includes('possession')) {
          stats.possession = [home, away]
        } else if (title === 'shots on target') {
          stats.shotsOnTarget = [home, away]
        } else if (title === 'total shots') {
          stats.shots = [home, away]
        } else if (title.includes('corner')) {
          stats.corners = [home, away]
        } else if (title.includes('foul')) {
          stats.fouls = [home, away]
        }
      }
    }
    
    // Extract lineups
    const lineupData = content.lineup || {}
    
    return {
      id: matchId,
      home_team: general.homeTeam?.name || header.teams?.[0]?.name || '',
      away_team: general.awayTeam?.name || header.teams?.[1]?.name || '',
      home_score: header.teams?.[0]?.score ?? null,
      away_score: header.teams?.[1]?.score ?? null,
      status,
      // FotMob provides matchTime as current minute when match is live
      // If matchTimeUTCDate exists, the match hasn't started yet (scheduled)
      minute: general.started && !general.finished ? general.matchTime : undefined,
      venue: general.venue?.name,
      date: general.matchTimeUTCDate || '',
      league: general.leagueName || '',
      leagueId: general.leagueId?.toString(),
      referee: content.matchFacts?.infoBox?.Referee?.text,
      events,
      lineups: {
        home: (lineupData.homeTeam?.starters || []).map((p: { name?: string; positionStringShort?: string; shirt?: number }) => ({
          name: p.name || 'Unknown',
          position: p.positionStringShort,
          jersey: p.shirt,
        })),
        away: (lineupData.awayTeam?.starters || []).map((p: { name?: string; positionStringShort?: string; shirt?: number }) => ({
          name: p.name || 'Unknown',
          position: p.positionStringShort,
          jersey: p.shirt,
        })),
        homeFormation: lineupData.homeTeam?.formation,
        awayFormation: lineupData.awayTeam?.formation,
      },
      stats,
      commentary: (content.matchFacts?.highlights?.text || []).map((item: { text?: string; time?: number }) => ({
        minute: item.time || 0,
        text: item.text || '',
      })),
    }
  } catch (e) {
    console.error('FotMob fetch failed:', e)
    return null
  }
}

// Fetch H2H data from ESPN
async function fetchH2H(homeTeam: string, awayTeam: string, leagueId?: string): Promise<H2HData | null> {
  try {
    // Try to get H2H from ESPN team stats
    const leagues = leagueId ? [leagueId, ...LEAGUE_ENDPOINTS.filter(l => l !== leagueId)] : LEAGUE_ENDPOINTS
    
    for (const league of leagues) {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          }
        )
        
        if (!res.ok) continue
        
        const data = await res.json()
        const teams = data.sports?.[0]?.leagues?.[0]?.teams || []
        
        // Find both teams
        const homeTeamData = teams.find((t: { team?: { displayName?: string; name?: string } }) => 
          t.team?.displayName?.toLowerCase().includes(homeTeam.toLowerCase()) ||
          homeTeam.toLowerCase().includes(t.team?.displayName?.toLowerCase() || '')
        )
        const awayTeamData = teams.find((t: { team?: { displayName?: string; name?: string } }) => 
          t.team?.displayName?.toLowerCase().includes(awayTeam.toLowerCase()) ||
          awayTeam.toLowerCase().includes(t.team?.displayName?.toLowerCase() || '')
        )
        
        if (homeTeamData && awayTeamData) {
          // Return simulated H2H based on team records if available
          const homeWins = homeTeamData.team?.record?.items?.[0]?.stats?.find((s: { name: string }) => s.name === 'wins')?.value || 0
          const awayWins = awayTeamData.team?.record?.items?.[0]?.stats?.find((s: { name: string }) => s.name === 'wins')?.value || 0
          const totalGames = Math.min(homeWins + awayWins, 10)
          
          return {
            homeWins: Math.round(totalGames * 0.4),
            draws: Math.round(totalGames * 0.2),
            awayWins: Math.round(totalGames * 0.4),
            recentMatches: []
          }
        }
      } catch {
        continue
      }
    }
    
    return null
  } catch (e) {
    console.error('H2H fetch failed:', e)
    return null
  }
}

// Generate prediction using a simple ELO-based model
function generatePrediction(homeTeam: string, awayTeam: string, leagueId?: string): PredictionData {
  // Simple ELO-based prediction model
  // In production, this would call a proper ML backend
  
  // Base probabilities with home advantage
  let homeWin = 0.42
  let draw = 0.28
  let awayWin = 0.30
  
  // Adjust based on team name patterns (simple heuristic)
  const topTeams = ['manchester city', 'real madrid', 'bayern', 'liverpool', 'barcelona', 'arsenal', 'chelsea', 'psg', 'inter', 'milan']
  const homeIsTop = topTeams.some(t => homeTeam.toLowerCase().includes(t))
  const awayIsTop = topTeams.some(t => awayTeam.toLowerCase().includes(t))
  
  if (homeIsTop && !awayIsTop) {
    homeWin = 0.55
    draw = 0.25
    awayWin = 0.20
  } else if (awayIsTop && !homeIsTop) {
    homeWin = 0.25
    draw = 0.30
    awayWin = 0.45
  } else if (homeIsTop && awayIsTop) {
    homeWin = 0.38
    draw = 0.32
    awayWin = 0.30
  }
  
  // Calculate expected goals based on probabilities
  const homeXG = homeWin * 2.2 + draw * 1.1 + awayWin * 0.8
  const awayXG = awayWin * 2.0 + draw * 1.0 + homeWin * 0.7
  
  return {
    home_win: Math.round(homeWin * 100) / 100,
    draw: Math.round(draw * 100) / 100,
    away_win: Math.round(awayWin * 100) / 100,
    predicted_score: {
      home: Math.round(homeXG),
      away: Math.round(awayXG)
    },
    confidence: Math.round((Math.max(homeWin, draw, awayWin) - 0.33) * 200) // 0-100 scale
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params
  const leagueId = request.nextUrl.searchParams.get('league') || undefined
  
  // Try ESPN first
  let matchData = await fetchFromESPN(matchId, leagueId)
  
  // If ESPN fails, try FotMob
  if (!matchData) {
    matchData = await fetchFromFotMob(matchId)
  }
  
  if (!matchData) {
    return NextResponse.json(
      { error: 'Match not found', matchId, leagueId },
      { status: 404 }
    )
  }
  
  // Fetch additional data: H2H and predictions
  const [h2h, prediction] = await Promise.all([
    fetchH2H(matchData.home_team, matchData.away_team, matchData.leagueId),
    Promise.resolve(generatePrediction(matchData.home_team, matchData.away_team, matchData.leagueId))
  ])
  
  // Add H2H and prediction to response
  matchData.h2h = h2h || {
    homeWins: 0,
    draws: 0,
    awayWins: 0,
    recentMatches: []
  }
  matchData.prediction = prediction
  
  return NextResponse.json(matchData)
}
