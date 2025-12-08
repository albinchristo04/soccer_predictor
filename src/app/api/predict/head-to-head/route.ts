import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, predictMatch, findTeam } from '@/lib/dataService'

interface HeadToHeadRequest {
  league: string
  home_team: string
  away_team: string
}

export async function POST(request: NextRequest) {
  try {
    const body: HeadToHeadRequest = await request.json()
    const { league, home_team, away_team } = body
    
    if (!league || !home_team || !away_team) {
      return NextResponse.json(
        { error: 'Missing required fields: league, home_team, away_team' },
        { status: 400 }
      )
    }
    
    const matches = await loadLeagueData(league)
    
    // Find teams (handles partial matches)
    const foundHomeTeam = findTeam(home_team, matches)
    const foundAwayTeam = findTeam(away_team, matches)
    
    if (!foundHomeTeam) {
      return NextResponse.json(
        { error: `Home team "${home_team}" not found in ${league}` },
        { status: 404 }
      )
    }
    
    if (!foundAwayTeam) {
      return NextResponse.json(
        { error: `Away team "${away_team}" not found in ${league}` },
        { status: 404 }
      )
    }
    
    const prediction = predictMatch(matches, foundHomeTeam, foundAwayTeam)
    
    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error predicting match:', error)
    return NextResponse.json(
      { error: 'Failed to predict match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
