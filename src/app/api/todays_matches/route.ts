import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

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

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/todays_matches`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    
    // Handle both array format and structured format
    let matches: Match[] = []
    
    if (Array.isArray(data)) {
      matches = data
    } else if (data.leagues && Array.isArray(data.leagues)) {
      // FotMob format - flatten leagues
      for (const league of data.leagues) {
        for (const match of league.matches || []) {
          matches.push({
            home_team: match.home?.name || '',
            away_team: match.away?.name || '',
            home_score: match.home?.score ?? null,
            away_score: match.away?.score ?? null,
            time: match.status?.utcTime || '',
            status: match.status?.finished ? 'completed' : (match.status?.started ? 'live' : 'upcoming'),
            league: league.name || '',
            match_id: match.id,
          })
        }
      }
    } else if (data.live || data.upcoming || data.completed) {
      // Already in correct format
      return NextResponse.json(data)
    }
    
    // Categorize matches
    const result = {
      live: matches.filter(m => m.status === 'live'),
      upcoming: matches.filter(m => m.status === 'upcoming'),
      completed: matches.filter(m => m.status === 'completed' || m.status === 'finished'),
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching today\'s matches:', error)
    // Return empty structure as fallback
    return NextResponse.json({
      live: [],
      upcoming: [],
      completed: []
    })
  }
}
