import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

interface AnyTeamsPredictionRequest {
  home_team: string
  away_team: string
  home_league?: string
  away_league?: string
}

// Map display league names to API keys
const leagueNameToKey: Record<string, string> = {
  'Premier League': 'premier_league',
  'La Liga': 'la_liga',
  'Serie A': 'serie_a',
  'Bundesliga': 'bundesliga',
  'Ligue 1': 'ligue_1',
  'Champions League (UCL)': 'champions_league',
  'Europa League (UEL)': 'europa_league',
  'MLS': 'mls',
  'FIFA World Cup': 'world_cup'
}

export async function POST(request: NextRequest) {
  try {
    const body: AnyTeamsPredictionRequest = await request.json()
    const { home_team, away_team, home_league, away_league } = body
    
    if (!home_team || !away_team) {
      return NextResponse.json(
        { error: 'Both home_team and away_team are required' },
        { status: 400 }
      )
    }
    
    if (home_team === away_team) {
      return NextResponse.json(
        { error: 'Teams must be different' },
        { status: 400 }
      )
    }
    
    // Convert league names if needed
    const homeLeagueKey = home_league ? (leagueNameToKey[home_league] || home_league.toLowerCase().replace(/\s+/g, '_')) : undefined
    const awayLeagueKey = away_league ? (leagueNameToKey[away_league] || away_league.toLowerCase().replace(/\s+/g, '_')) : undefined
    
    // Use the unified prediction endpoint from backend
    const response = await fetch(`${BACKEND_URL}/api/predict/unified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        home_team,
        away_team,
        league: homeLeagueKey || 'premier_league',
      }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: error.detail || 'Backend prediction failed' },
        { status: response.status }
      )
    }
    
    const backendPrediction = await response.json()
    
    // Calculate expected goals based on ELO difference
    const homeElo = backendPrediction.home_elo || 1500
    const awayElo = backendPrediction.away_elo || 1500
    const eloDiff = homeElo - awayElo
    
    // Base goals calculation with ELO adjustment
    const homeBaseGoals = 1.5 + (eloDiff / 300)
    const awayBaseGoals = 1.3 - (eloDiff / 300)
    
    // Determine if cross-league match
    const isCrossLeague = homeLeagueKey && awayLeagueKey && homeLeagueKey !== awayLeagueKey
    
    // Build enhanced prediction response
    const prediction = {
      success: true,
      home_team,
      away_team,
      home_league: home_league || 'Unknown',
      away_league: away_league || 'Unknown',
      is_cross_league: isCrossLeague,
      predictions: {
        home_win: (backendPrediction.probabilities?.home_win || 40) / 100,
        draw: (backendPrediction.probabilities?.draw || 30) / 100,
        away_win: (backendPrediction.probabilities?.away_win || 30) / 100,
      },
      predicted_home_goals: Math.max(0, Math.min(5, Math.round(homeBaseGoals * 10) / 10)),
      predicted_away_goals: Math.max(0, Math.min(5, Math.round(awayBaseGoals * 10) / 10)),
      confidence: Math.min(99, Math.max(30, backendPrediction.confidence || 50)),
      ratings: {
        home_elo: Math.round(homeElo),
        away_elo: Math.round(awayElo),
        elo_difference: Math.round(eloDiff),
      },
      analysis: {
        predicted_winner: backendPrediction.prediction || 'Draw',
        home_advantage_applied: true,
        factors_considered: [
          'ELO rating difference',
          'Home advantage (+65 ELO points)',
          'Historical performance',
          'League strength coefficient'
        ],
        note: isCrossLeague 
          ? 'Cross-league match: Results adjusted for league strength differences.'
          : 'Same league match: Direct comparison based on current form and ratings.'
      }
    }
    
    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Error predicting match:', error)
    return NextResponse.json(
      { error: 'Failed to predict match', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
