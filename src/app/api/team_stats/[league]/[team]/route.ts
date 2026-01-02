import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, calculateTeamStats, findTeam } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string; team: string }> }
) {
  const { league, team } = await params
  const decodedTeam = decodeURIComponent(team)

  try {
    const matches = await loadLeagueData(league)
    
    // Find the team (handles partial matches)
    const foundTeam = findTeam(decodedTeam, matches)
    
    if (!foundTeam) {
      return NextResponse.json(
        { error: `Team "${decodedTeam}" not found in ${league}` },
        { status: 404 }
      )
    }
    
    const stats = calculateTeamStats(matches, foundTeam)
    
    return NextResponse.json({
      team: foundTeam,
      league: league,
      ...stats
    })
  } catch (error) {
    console.error('Error loading team stats:', error)
    return NextResponse.json(
      { error: 'Failed to load team statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
