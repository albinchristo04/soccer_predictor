import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

// Prediction calculation constants
const DEFAULT_ELO = 1500
const ELO_SCALING_FACTOR = 300
const HOME_ADVANTAGE_ELO = 65
const BASE_HOME_GOALS = 1.5
const BASE_AWAY_GOALS = 1.3
const MIN_CONFIDENCE = 30
const MAX_CONFIDENCE = 85
const MAX_PREDICTED_GOALS = 5
const BACKEND_TIMEOUT_MS = 3000

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

// League strength coefficients (used for cross-league predictions)
const leagueStrength: Record<string, number> = {
  'premier_league': 1.15,
  'la_liga': 1.10,
  'serie_a': 1.05,
  'bundesliga': 1.05,
  'ligue_1': 1.00,
  'champions_league': 1.20,
  'europa_league': 1.00,
  'mls': 0.85,
  'world_cup': 1.10,
}

/**
 * Team base ELO ratings - approximate values based on historical performance.
 * These ratings are used as fallback when the backend ML model is unavailable.
 * Ratings are calibrated to a 1500 baseline with top teams ranging from 1550-1800.
 * Source: Estimated from historical match results and UEFA coefficients.
 * Last updated: January 2026
 */
const teamBaseElo: Record<string, number> = {
  // Premier League top teams
  'manchester city': 1780,
  'liverpool': 1750,
  'arsenal': 1730,
  'chelsea': 1680,
  'manchester utd': 1660,
  'tottenham': 1650,
  'newcastle utd': 1620,
  'aston villa': 1600,
  'brighton': 1580,
  'west ham': 1560,
  // La Liga
  'real madrid': 1800,
  'barcelona': 1770,
  'atlético madrid': 1700,
  'sevilla': 1620,
  'real sociedad': 1600,
  'villarreal': 1590,
  // Serie A
  'inter': 1720,
  'milan': 1680,
  'napoli': 1700,
  'juventus': 1690,
  'roma': 1620,
  'lazio': 1600,
  'atalanta': 1640,
  // Bundesliga
  'bayern munich': 1780,
  'dortmund': 1680,
  'rb leipzig': 1660,
  'leverkusen': 1650,
  // Ligue 1
  'paris s-g': 1750,
  'marseille': 1600,
  'monaco': 1580,
  'lyon': 1570,
}

// Helper to convert league name to API key format
function normalizeLeagueKey(league: string): string {
  return leagueNameToKey[league] || league.toLowerCase().replace(/\s+/g, '_')
}

function getTeamElo(teamName: string, league?: string): number {
  const normalized = teamName.toLowerCase()
  const baseElo = teamBaseElo[normalized] || DEFAULT_ELO
  
  // Apply league strength modifier
  if (league) {
    const leagueKey = normalizeLeagueKey(league)
    const strengthMod = leagueStrength[leagueKey] || 1.0
    return baseElo * strengthMod
  }
  
  return baseElo
}

function calculateWinProbabilities(homeElo: number, awayElo: number): { home: number; draw: number; away: number } {
  // Apply home advantage
  const adjustedHomeElo = homeElo + HOME_ADVANTAGE_ELO
  const eloDiff = adjustedHomeElo - awayElo
  
  // Use logistic function for win probability
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400))
  
  // Estimate draw probability based on ELO closeness
  const drawBase = 0.25
  const drawModifier = Math.max(0, 0.15 - Math.abs(eloDiff) / 1000)
  const drawProb = drawBase + drawModifier
  
  // Calculate raw probabilities
  const awayWinProb = 1 - homeWinProb
  const totalNonDraw = homeWinProb + awayWinProb
  
  const normalizedHome = (homeWinProb / totalNonDraw) * (1 - drawProb)
  const normalizedAway = (awayWinProb / totalNonDraw) * (1 - drawProb)
  
  // Round and ensure they sum to 100
  const homeRounded = Math.round(normalizedHome * 100)
  const drawRounded = Math.round(drawProb * 100)
  // Away gets the remainder to ensure sum is exactly 100
  const awayRounded = 100 - homeRounded - drawRounded
  
  return {
    home: homeRounded,
    draw: drawRounded,
    away: Math.max(0, awayRounded)
  }
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
    const homeLeagueKey = home_league ? normalizeLeagueKey(home_league) : undefined
    const awayLeagueKey = away_league ? normalizeLeagueKey(away_league) : undefined
    
    let homeElo: number
    let awayElo: number
    let backendAvailable = false
    
    // Try to get prediction from backend first
    try {
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
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
      })
      
      if (response.ok) {
        const backendPrediction = await response.json()
        homeElo = backendPrediction.home_elo || getTeamElo(home_team, home_league)
        awayElo = backendPrediction.away_elo || getTeamElo(away_team, away_league)
        backendAvailable = true
      } else {
        homeElo = getTeamElo(home_team, home_league)
        awayElo = getTeamElo(away_team, away_league)
      }
    } catch {
      // Backend not available, use local calculation
      homeElo = getTeamElo(home_team, home_league)
      awayElo = getTeamElo(away_team, away_league)
    }
    
    // Calculate probabilities
    const probs = calculateWinProbabilities(homeElo, awayElo)
    
    // Calculate ELO difference with home advantage
    const eloDiff = (homeElo + HOME_ADVANTAGE_ELO) - awayElo
    
    // Base goals calculation with ELO adjustment
    const homeBaseGoals = BASE_HOME_GOALS + (eloDiff / ELO_SCALING_FACTOR)
    const awayBaseGoals = BASE_AWAY_GOALS - (eloDiff / ELO_SCALING_FACTOR)
    
    // Determine predicted winner
    let predictedWinner = 'Draw'
    if (probs.home > probs.draw && probs.home > probs.away) {
      predictedWinner = home_team
    } else if (probs.away > probs.draw && probs.away > probs.home) {
      predictedWinner = away_team
    }
    
    // Determine if cross-league match
    const isCrossLeague = homeLeagueKey && awayLeagueKey && homeLeagueKey !== awayLeagueKey
    
    // Calculate confidence based on ELO difference
    const confidence = Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, 50 + Math.abs(eloDiff) / 10))
    
    // Build enhanced prediction response
    const prediction = {
      success: true,
      home_team,
      away_team,
      home_league: home_league || 'Unknown',
      away_league: away_league || 'Unknown',
      is_cross_league: isCrossLeague,
      predictions: {
        home_win: probs.home / 100,
        draw: probs.draw / 100,
        away_win: probs.away / 100,
      },
      predicted_home_goals: Math.max(0, Math.min(MAX_PREDICTED_GOALS, Math.round(homeBaseGoals * 10) / 10)),
      predicted_away_goals: Math.max(0, Math.min(MAX_PREDICTED_GOALS, Math.round(awayBaseGoals * 10) / 10)),
      confidence: Math.round(confidence),
      ratings: {
        home_elo: Math.round(homeElo),
        away_elo: Math.round(awayElo),
        elo_difference: Math.round(eloDiff),
      },
      analysis: {
        predicted_winner: predictedWinner,
        home_advantage_applied: true,
        factors_considered: [
          'ELO rating difference',
          `Home advantage (+${HOME_ADVANTAGE_ELO} ELO points)`,
          'Historical performance',
          ...(isCrossLeague ? ['League strength coefficient'] : []),
          ...(backendAvailable ? ['Machine learning model'] : ['Statistical estimation'])
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
