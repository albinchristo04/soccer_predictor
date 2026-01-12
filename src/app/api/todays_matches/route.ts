import { NextResponse } from 'next/server'

// FotMob API base URL and league IDs
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api'

const LEAGUE_IDS: Record<string, number> = {
  'Premier League': 47,
  'La Liga': 87,
  'Bundesliga': 54,
  'Serie A': 55,
  'Ligue 1': 53,
  'MLS': 130,
  'Champions League': 42,
  'Europa League': 73,
}

interface Match {
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  time: string
  status: string
  league: string
  match_id: string | number
}

async function fetchFotMobMatches(): Promise<Match[]> {
  const matches: Match[] = []
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  
  try {
    // Fetch matches for today from FotMob
    const response = await fetch(`${FOTMOB_BASE_URL}/matches?date=${today}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    })
    
    if (!response.ok) {
      throw new Error(`FotMob API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // FotMob returns matches grouped by league
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

export async function GET() {
  try {
    // Try to fetch from FotMob directly
    const matches = await fetchFotMobMatches()
    
    // Categorize matches
    const result = {
      live: matches.filter(m => m.status === 'live'),
      upcoming: matches.filter(m => m.status === 'upcoming'),
      completed: matches.filter(m => m.status === 'completed'),
      leagues: [] as { name: string; matches: Match[] }[],
    }
    
    // Group by league for the matches page
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
    // Return empty structure as fallback
    return NextResponse.json({
      live: [],
      upcoming: [],
      completed: [],
      leagues: []
    })
  }
}
