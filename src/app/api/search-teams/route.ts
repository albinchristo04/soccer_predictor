import { NextRequest, NextResponse } from 'next/server'
import { teams } from '@/data/leagues'

// Priority order for leagues when deduplicating teams
const leaguePriority: Record<string, number> = {
  'Premier League': 1,
  'La Liga': 2,
  'Serie A': 3,
  'Bundesliga': 4,
  'Ligue 1': 5,
  'MLS': 6,
  'Champions League (UCL)': 7,
  'Europa League (UEL)': 8,
  'FIFA World Cup': 9,
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  
  if (query.length < 2) {
    return NextResponse.json({ teams: [] })
  }
  
  const searchLower = query.toLowerCase()
  
  // Search across all leagues and collect all matches
  const allMatches: { name: string; league: string; priority: number }[] = []
  
  for (const [league, teamList] of Object.entries(teams)) {
    for (const team of teamList) {
      if (team.toLowerCase().includes(searchLower)) {
        allMatches.push({ 
          name: team, 
          league, 
          priority: leaguePriority[league] || 10 
        })
      }
    }
  }
  
  // Deduplicate by team name, keeping the one from the highest priority (domestic) league
  const teamMap = new Map<string, { name: string; league: string; priority: number }>()
  
  for (const match of allMatches) {
    const existing = teamMap.get(match.name.toLowerCase())
    if (!existing || match.priority < existing.priority) {
      teamMap.set(match.name.toLowerCase(), match)
    }
  }
  
  // Convert to array and sort by relevance
  const results = Array.from(teamMap.values()).map(({ name, league }) => ({ name, league }))
  
  results.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(searchLower)
    const bStartsWith = b.name.toLowerCase().startsWith(searchLower)
    
    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1
    return a.name.localeCompare(b.name)
  })
  
  // Limit results
  return NextResponse.json({ teams: results.slice(0, 20) })
}
