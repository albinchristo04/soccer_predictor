import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, calculateTeamStats, predictMatch, findTeam } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params

  try {
    const matches = await loadLeagueData(league)
    
    // Filter for scheduled matches only
    const scheduledMatches = matches
      .filter(match => match.status === 'Scheduled')
      .slice(0, 50) // Limit to 50 matches
    
    // Add predictions for each match
    const upcomingMatches = scheduledMatches.map(match => {
      const homeTeam = findTeam(match.home_team, matches) || match.home_team
      const awayTeam = findTeam(match.away_team, matches) || match.away_team
      
      // Get predictions
      const prediction = predictMatch(matches, homeTeam, awayTeam)
      
      return {
        date: new Date(match.date).toISOString(),
        home_team: homeTeam,
        away_team: awayTeam,
        predicted_home_win: prediction.predicted_home_win,
        predicted_draw: prediction.predicted_draw,
        predicted_away_win: prediction.predicted_away_win,
        predicted_home_goals: prediction.predicted_home_goals,
        predicted_away_goals: prediction.predicted_away_goals,
        confidence: prediction.confidence,
        factors: prediction.factors
      }
    })

    return NextResponse.json(upcomingMatches)
  } catch (error) {
    console.error('Error loading upcoming matches:', error)
    return NextResponse.json(
      { error: 'Failed to load matches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
