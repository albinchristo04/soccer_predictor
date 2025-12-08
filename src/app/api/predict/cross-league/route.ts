import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, calculateTeamStats, findTeam } from '@/lib/dataService'

interface CrossLeagueRequest {
  league_a: string
  team_a: string
  league_b: string
  team_b: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CrossLeagueRequest = await request.json()
    const { league_a, team_a, league_b, team_b } = body
    
    if (!league_a || !team_a || !league_b || !team_b) {
      return NextResponse.json(
        { error: 'Missing required fields: league_a, team_a, league_b, team_b' },
        { status: 400 }
      )
    }
    
    const matchesA = await loadLeagueData(league_a)
    const matchesB = await loadLeagueData(league_b)
    
    const foundTeamA = findTeam(team_a, matchesA)
    const foundTeamB = findTeam(team_b, matchesB)
    
    if (!foundTeamA) {
      return NextResponse.json(
        { error: `Team "${team_a}" not found in ${league_a}` },
        { status: 404 }
      )
    }
    
    if (!foundTeamB) {
      return NextResponse.json(
        { error: `Team "${team_b}" not found in ${league_b}` },
        { status: 404 }
      )
    }
    
    const statsA = calculateTeamStats(matchesA, foundTeamA)
    const statsB = calculateTeamStats(matchesB, foundTeamB)
    
    // Cross-league prediction based on normalized stats
    const strengthA = (statsA.win_rate * 0.4 + statsA.avg_goals_scored * 0.3 + (1 - statsA.avg_goals_conceded / 3) * 0.3)
    const strengthB = (statsB.win_rate * 0.4 + statsB.avg_goals_scored * 0.3 + (1 - statsB.avg_goals_conceded / 3) * 0.3)
    
    const diff = strengthA - strengthB
    
    let teamAWin = 0.33 + diff * 0.5
    let teamBWin = 0.33 - diff * 0.5
    let draw = 0.34 - Math.abs(diff) * 0.2
    
    // Normalize
    teamAWin = Math.max(0.1, Math.min(0.7, teamAWin))
    teamBWin = Math.max(0.1, Math.min(0.7, teamBWin))
    draw = Math.max(0.15, Math.min(0.4, draw))
    
    const total = teamAWin + draw + teamBWin
    
    const prediction = {
      team_a: foundTeamA,
      team_b: foundTeamB,
      league_a,
      league_b,
      predicted_team_a_win: parseFloat((teamAWin / total).toFixed(3)),
      predicted_draw: parseFloat((draw / total).toFixed(3)),
      predicted_team_b_win: parseFloat((teamBWin / total).toFixed(3)),
      predicted_team_a_goals: parseFloat((statsA.avg_goals_scored * 0.8 + 0.5).toFixed(1)),
      predicted_team_b_goals: parseFloat((statsB.avg_goals_scored * 0.8 + 0.5).toFixed(1)),
      confidence: 0.65,
      team_a_stats: statsA,
      team_b_stats: statsB
    }
    
    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error predicting cross-league match:', error)
    return NextResponse.json(
      { error: 'Failed to predict match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
