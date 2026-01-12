import { NextRequest, NextResponse } from 'next/server'
import { teams } from '@/data/leagues'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''
  
  if (query.length < 2) {
    return NextResponse.json({ teams: [] })
  }
  
  const searchLower = query.toLowerCase()
  
  // Search across all leagues
  const results: { name: string; league: string }[] = []
  
  for (const [league, teamList] of Object.entries(teams)) {
    for (const team of teamList) {
      if (team.toLowerCase().includes(searchLower)) {
        results.push({ name: team, league })
      }
    }
  }
  
  // Sort by relevance (exact start match first, then contains)
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
