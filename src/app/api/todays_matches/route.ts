import { NextResponse } from 'next/server'

interface Match {
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  time: string
  status: string
  league: string
  match_id: string | number
  venue?: string
}

// ESPN league IDs for major leagues
const ESPN_LEAGUES = [
  { id: 'eng.1', name: 'Premier League' },
  { id: 'esp.1', name: 'La Liga' },
  { id: 'ita.1', name: 'Serie A' },
  { id: 'ger.1', name: 'Bundesliga' },
  { id: 'fra.1', name: 'Ligue 1' },
  { id: 'usa.1', name: 'MLS' },
  { id: 'uefa.champions', name: 'Champions League' },
  { id: 'uefa.europa', name: 'Europa League' },
]

async function fetchESPNMatches(): Promise<Match[]> {
  const allMatches: Match[] = []
  
  // Get today's date in YYYYMMDD format for ESPN API
  const today = new Date()
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  
  for (const league of ESPN_LEAGUES) {
    try {
      // Use dates parameter to explicitly request today's matches
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard?dates=${todayStr}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 60 },
        }
      )
      
      if (!response.ok) continue
      
      const data = await response.json()
      
      for (const event of data.events || []) {
        const competition = event.competitions?.[0]
        if (!competition) continue
        
        const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')
        const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')
        
        if (!homeTeam || !awayTeam) continue
        
        const statusType = competition.status?.type?.name || 'STATUS_SCHEDULED'
        let status = 'upcoming'
        if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FULL_TIME') {
          status = 'completed'
        } else if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME' || statusType === 'STATUS_FIRST_HALF' || statusType === 'STATUS_SECOND_HALF') {
          status = 'live'
        }
        
        allMatches.push({
          home_team: homeTeam.team?.displayName || homeTeam.team?.name || '',
          away_team: awayTeam.team?.displayName || awayTeam.team?.name || '',
          home_score: status !== 'upcoming' ? parseInt(homeTeam.score || '0') : null,
          away_score: status !== 'upcoming' ? parseInt(awayTeam.score || '0') : null,
          time: event.date || '',
          status,
          league: league.name,
          match_id: event.id,
          venue: competition.venue?.fullName,
        })
      }
    } catch (error) {
      console.error(`Error fetching ${league.name} from ESPN:`, error)
    }
  }
  
  return allMatches
}

async function fetchFotMobMatches(): Promise<Match[]> {
  const matches: Match[] = []
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  
  try {
    const response = await fetch(`https://www.fotmob.com/api/matches?date=${today}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.fotmob.com/',
      },
      next: { revalidate: 60 },
    })
    
    if (!response.ok) {
      throw new Error(`FotMob API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.leagues && Array.isArray(data.leagues)) {
      for (const league of data.leagues) {
        const leagueName = league.name || 'Unknown'
        
        for (const match of league.matches || []) {
          const isFinished = match.status?.finished === true
          const isStarted = match.status?.started === true
          
          let status = 'upcoming'
          if (isFinished) {
            status = 'completed'
          } else if (isStarted) {
            status = 'live'
          }
          
          matches.push({
            home_team: match.home?.name || match.home?.shortName || '',
            away_team: match.away?.name || match.away?.shortName || '',
            home_score: match.home?.score ?? null,
            away_score: match.away?.score ?? null,
            time: match.status?.utcTime || '',
            status,
            league: leagueName,
            match_id: match.id,
          })
        }
      }
    }
  } catch (error) {
    console.error('Error fetching from FotMob:', error)
  }
  
  return matches
}

// Sample data for when APIs are unavailable - no longer used to avoid showing inaccurate data
// Users will see "No matches" when APIs are blocked

export async function GET() {
  try {
    // Try ESPN first, then FotMob
    let matches = await fetchESPNMatches()
    
    if (matches.length === 0) {
      matches = await fetchFotMobMatches()
    }
    
    // Categorize matches
    const result = {
      live: matches.filter(m => m.status === 'live'),
      upcoming: matches.filter(m => m.status === 'upcoming'),
      completed: matches.filter(m => m.status === 'completed'),
      leagues: [] as { name: string; matches: Match[] }[],
      source: matches.length > 0 && matches[0].match_id.toString().startsWith('sample') ? 'sample' : 'live'
    }
    
    // Group by league
    const leagueMap = new Map<string, Match[]>()
    for (const match of matches) {
      const leagueMatches = leagueMap.get(match.league) || []
      leagueMatches.push(match)
      leagueMap.set(match.league, leagueMatches)
    }
    
    result.leagues = Array.from(leagueMap.entries()).map(([name, matches]) => ({
      name,
      matches,
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching today\'s matches:', error)
    // Return empty data instead of fake data when APIs fail
    return NextResponse.json({
      live: [],
      upcoming: [],
      completed: [],
      leagues: [],
      source: 'error'
    })
  }
}
