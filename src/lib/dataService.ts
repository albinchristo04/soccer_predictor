/**
 * Data Service - Server-side utilities for loading and analyzing soccer match data
 * This replaces the Python backend for Vercel deployment
 */

import path from 'path'
import fs from 'fs/promises'

export interface Match {
  home_team: string
  away_team: string
  date: string
  attendance: string
  venue: string
  referee: string
  status: string
  home_goals: number
  away_goals: number
  season: string
  home_form_goals_scored: number
  home_form_goals_conceded: number
  home_form_win_rate: number
  away_form_goals_scored: number
  away_form_goals_conceded: number
  away_form_win_rate: number
  result: 'win' | 'draw' | 'loss'
}

export interface LeagueOverview {
  total_matches: number
  avg_goals_per_match: string
  home_win_percentage: string
  draw_percentage: string
  away_win_percentage: string
  total_goals: number
  seasons_covered: number
}

export interface TeamStats {
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
  win_rate: number
  avg_goals_scored: number
  avg_goals_conceded: number
  home_win_rate: number
  away_win_rate: number
  recent_form: string[]
}

export interface PredictionResult {
  home_team: string
  away_team: string
  predicted_home_win: number
  predicted_draw: number
  predicted_away_win: number
  predicted_home_goals: number
  predicted_away_goals: number
  confidence: number
  factors: {
    home_advantage: number
    form_difference: number
    goals_ratio: number
  }
}

// Cache for loaded data
const dataCache: Map<string, Match[]> = new Map()

/**
 * Parse CSV data into Match objects
 */
export function parseCSV(csv: string): Match[] {
  const lines = csv.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    // Handle CSV parsing with potential commas in values
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const obj: Record<string, string> = {}
    header.forEach((key, index) => {
      obj[key] = values[index] || ''
    })
    
    return {
      home_team: obj.home_team || '',
      away_team: obj.away_team || '',
      date: obj.date || '',
      attendance: obj.attendance || '',
      venue: obj.venue || '',
      referee: obj.referee || '',
      status: obj.status || '',
      home_goals: parseFloat(obj.home_goals) || 0,
      away_goals: parseFloat(obj.away_goals) || 0,
      season: obj.season || '',
      home_form_goals_scored: parseFloat(obj.home_form_goals_scored) || 0,
      home_form_goals_conceded: parseFloat(obj.home_form_goals_conceded) || 0,
      home_form_win_rate: parseFloat(obj.home_form_win_rate) || 0,
      away_form_goals_scored: parseFloat(obj.away_form_goals_scored) || 0,
      away_form_goals_conceded: parseFloat(obj.away_form_goals_conceded) || 0,
      away_form_win_rate: parseFloat(obj.away_form_win_rate) || 0,
      result: (obj.result as 'win' | 'draw' | 'loss') || 'draw'
    }
  })
}

/**
 * Load league data from CSV file
 */
export async function loadLeagueData(league: string): Promise<Match[]> {
  // Check cache first
  if (dataCache.has(league)) {
    return dataCache.get(league)!
  }
  
  const filePath = path.join(process.cwd(), 'fbref_data', 'processed', `${league}_processed.csv`)
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const matches = parseCSV(fileContent)
  
  // Cache the data
  dataCache.set(league, matches)
  
  return matches
}

/**
 * Get all unique teams in a league
 */
export function getLeagueTeams(matches: Match[]): string[] {
  const teams = new Set<string>()
  matches.forEach(match => {
    if (match.home_team) teams.add(match.home_team)
    if (match.away_team) teams.add(match.away_team)
  })
  return Array.from(teams).sort()
}

/**
 * Calculate league overview statistics
 */
export function calculateLeagueOverview(matches: Match[]): LeagueOverview {
  const completedMatches = matches.filter(m => 
    m.status.toLowerCase() === 'played' || 
    m.status.toLowerCase() === 'completed' ||
    (m.home_goals !== undefined && m.away_goals !== undefined && m.result)
  )
  
  const totalMatches = completedMatches.length
  const totalGoals = completedMatches.reduce((sum, m) => sum + m.home_goals + m.away_goals, 0)
  
  const homeWins = completedMatches.filter(m => m.result === 'win').length
  const draws = completedMatches.filter(m => m.result === 'draw').length
  const awayWins = completedMatches.filter(m => m.result === 'loss').length
  
  const seasons = new Set(completedMatches.map(m => m.season))
  
  return {
    total_matches: totalMatches,
    avg_goals_per_match: totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '0.00',
    home_win_percentage: totalMatches > 0 ? ((homeWins / totalMatches) * 100).toFixed(1) : '0.0',
    draw_percentage: totalMatches > 0 ? ((draws / totalMatches) * 100).toFixed(1) : '0.0',
    away_win_percentage: totalMatches > 0 ? ((awayWins / totalMatches) * 100).toFixed(1) : '0.0',
    total_goals: totalGoals,
    seasons_covered: seasons.size
  }
}

/**
 * Calculate team statistics
 */
export function calculateTeamStats(matches: Match[], teamName: string): TeamStats {
  const teamMatches = matches.filter(m => 
    (m.home_team.toLowerCase() === teamName.toLowerCase() || 
     m.away_team.toLowerCase() === teamName.toLowerCase()) &&
    (m.status.toLowerCase() === 'played' || m.status.toLowerCase() === 'completed')
  )
  
  let wins = 0, draws = 0, losses = 0
  let goalsScored = 0, goalsConceded = 0
  let homeWins = 0, homeMatches = 0
  let awayWins = 0, awayMatches = 0
  const recentForm: string[] = []
  
  // Sort by date descending for recent form
  const sortedMatches = [...teamMatches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  sortedMatches.forEach((match, index) => {
    const isHome = match.home_team.toLowerCase() === teamName.toLowerCase()
    
    if (isHome) {
      homeMatches++
      goalsScored += match.home_goals
      goalsConceded += match.away_goals
      
      if (match.result === 'win') {
        wins++
        homeWins++
        if (index < 5) recentForm.push('W')
      } else if (match.result === 'draw') {
        draws++
        if (index < 5) recentForm.push('D')
      } else {
        losses++
        if (index < 5) recentForm.push('L')
      }
    } else {
      awayMatches++
      goalsScored += match.away_goals
      goalsConceded += match.home_goals
      
      if (match.result === 'loss') {
        wins++
        awayWins++
        if (index < 5) recentForm.push('W')
      } else if (match.result === 'draw') {
        draws++
        if (index < 5) recentForm.push('D')
      } else {
        losses++
        if (index < 5) recentForm.push('L')
      }
    }
  })
  
  const matchesPlayed = wins + draws + losses
  
  return {
    matches_played: matchesPlayed,
    wins,
    draws,
    losses,
    goals_scored: goalsScored,
    goals_conceded: goalsConceded,
    win_rate: matchesPlayed > 0 ? wins / matchesPlayed : 0,
    avg_goals_scored: matchesPlayed > 0 ? goalsScored / matchesPlayed : 0,
    avg_goals_conceded: matchesPlayed > 0 ? goalsConceded / matchesPlayed : 0,
    home_win_rate: homeMatches > 0 ? homeWins / homeMatches : 0,
    away_win_rate: awayMatches > 0 ? awayWins / awayMatches : 0,
    recent_form: recentForm
  }
}

/**
 * Find team by name (handles partial matches)
 */
export function findTeam(teamInput: string, matches: Match[]): string | null {
  const teams = getLeagueTeams(matches)
  const input = teamInput.toLowerCase().trim()
  
  // Exact match
  const exact = teams.find(t => t.toLowerCase() === input)
  if (exact) return exact
  
  // Partial match
  const partial = teams.find(t => t.toLowerCase().includes(input))
  if (partial) return partial
  
  return null
}

/**
 * Get head-to-head history between two teams
 */
export function getHeadToHead(matches: Match[], teamA: string, teamB: string): Match[] {
  const teamALower = teamA.toLowerCase()
  const teamBLower = teamB.toLowerCase()
  
  return matches.filter(m => 
    ((m.home_team.toLowerCase() === teamALower && m.away_team.toLowerCase() === teamBLower) ||
     (m.home_team.toLowerCase() === teamBLower && m.away_team.toLowerCase() === teamALower)) &&
    (m.status.toLowerCase() === 'played' || m.status.toLowerCase() === 'completed')
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Predict match outcome based on statistical analysis
 */
export function predictMatch(
  matches: Match[], 
  homeTeam: string, 
  awayTeam: string
): PredictionResult {
  const homeStats = calculateTeamStats(matches, homeTeam)
  const awayStats = calculateTeamStats(matches, awayTeam)
  const h2hMatches = getHeadToHead(matches, homeTeam, awayTeam)
  
  // Calculate base probabilities from team win rates
  const homeWinRate = homeStats.win_rate
  const awayWinRate = awayStats.win_rate
  
  // Home advantage factor (typically 5-10% boost)
  const homeAdvantage = 0.08
  
  // Form-based adjustment (more weight on recent form)
  const homeRecentWins = homeStats.recent_form.filter(f => f === 'W').length / 5
  const awayRecentWins = awayStats.recent_form.filter(f => f === 'W').length / 5
  const homeRecentLosses = homeStats.recent_form.filter(f => f === 'L').length / 5
  const awayRecentLosses = awayStats.recent_form.filter(f => f === 'L').length / 5
  const formDifference = ((homeRecentWins - homeRecentLosses) - (awayRecentWins - awayRecentLosses)) * 0.12
  
  // Goals-based adjustment (stronger impact)
  const homeGoalRatio = homeStats.avg_goals_scored / Math.max(homeStats.avg_goals_conceded, 0.5)
  const awayGoalRatio = awayStats.avg_goals_scored / Math.max(awayStats.avg_goals_conceded, 0.5)
  const goalsAdjustment = ((homeGoalRatio - awayGoalRatio) / (homeGoalRatio + awayGoalRatio + 0.1)) * 0.15
  
  // Win rate difference adjustment
  const winRateAdjustment = (homeWinRate - awayWinRate) * 0.2
  
  // Head-to-head adjustment
  let h2hAdjustment = 0
  if (h2hMatches.length > 0) {
    const homeTeamLower = homeTeam.toLowerCase()
    const h2hWins = h2hMatches.filter(m => 
      (m.home_team.toLowerCase() === homeTeamLower && m.result === 'win') ||
      (m.away_team.toLowerCase() === homeTeamLower && m.result === 'loss')
    ).length
    h2hAdjustment = ((h2hWins / h2hMatches.length) - 0.5) * 0.1
  }
  
  // Calculate raw probabilities with more variance
  let rawHomeWin = 0.33 + homeAdvantage + formDifference + goalsAdjustment + h2hAdjustment + winRateAdjustment
  let rawAwayWin = 0.33 - homeAdvantage - formDifference - goalsAdjustment - h2hAdjustment - winRateAdjustment
  let rawDraw = 0.34 - Math.abs(formDifference + goalsAdjustment + winRateAdjustment) * 0.3
  
  // Ensure probabilities are within bounds
  rawHomeWin = Math.max(0.08, Math.min(0.75, rawHomeWin))
  rawAwayWin = Math.max(0.08, Math.min(0.75, rawAwayWin))
  rawDraw = Math.max(0.12, Math.min(0.45, rawDraw))
  
  // Normalize to sum to 1
  const total = rawHomeWin + rawDraw + rawAwayWin
  const homeWinProb = rawHomeWin / total
  const drawProb = rawDraw / total
  const awayWinProb = rawAwayWin / total
  
  // Predict goals - ensure they align with winner probabilities
  const leagueAvgGoals = matches.filter(m => m.status.toLowerCase() === 'played')
    .reduce((sum, m) => sum + m.home_goals + m.away_goals, 0) / 
    Math.max(matches.filter(m => m.status.toLowerCase() === 'played').length, 1) / 2 || 1.3
  
  // Base goal expectations
  let baseHomeGoals = leagueAvgGoals * (homeStats.avg_goals_scored / Math.max(homeStats.avg_goals_scored + homeStats.avg_goals_conceded, 0.1)) * 2
  let baseAwayGoals = leagueAvgGoals * (awayStats.avg_goals_scored / Math.max(awayStats.avg_goals_scored + awayStats.avg_goals_conceded, 0.1)) * 2
  
  // Home advantage boost for goals
  baseHomeGoals *= 1.1
  
  // Now ENSURE the scoreline matches the predicted winner
  const probDiff = Math.abs(homeWinProb - awayWinProb)
  
  if (homeWinProb > awayWinProb && homeWinProb > drawProb) {
    // Home team should win - ensure home goals > away goals
    if (baseHomeGoals <= baseAwayGoals) {
      baseHomeGoals = baseAwayGoals + 0.3 + probDiff * 2
    } else {
      // Increase the margin based on probability difference
      baseHomeGoals = baseAwayGoals + (baseHomeGoals - baseAwayGoals) * (1 + probDiff)
    }
  } else if (awayWinProb > homeWinProb && awayWinProb > drawProb) {
    // Away team should win - ensure away goals > home goals
    if (baseAwayGoals <= baseHomeGoals) {
      baseAwayGoals = baseHomeGoals + 0.3 + probDiff * 2
    } else {
      // Increase the margin based on probability difference
      baseAwayGoals = baseHomeGoals + (baseAwayGoals - baseHomeGoals) * (1 + probDiff)
    }
  } else {
    // Draw is most likely - make goals roughly equal
    const avgGoals = (baseHomeGoals + baseAwayGoals) / 2
    baseHomeGoals = avgGoals + 0.1  // Slight home advantage
    baseAwayGoals = avgGoals
  }
  
  // Ensure reasonable bounds
  const predictedHomeGoals = Math.max(0.5, Math.min(4.5, baseHomeGoals))
  const predictedAwayGoals = Math.max(0.3, Math.min(4.0, baseAwayGoals))
  
  // Calculate confidence based on data quality
  const dataPoints = homeStats.matches_played + awayStats.matches_played + h2hMatches.length * 2
  const confidence = Math.min(0.95, 0.5 + (dataPoints / 200) * 0.45)
  
  return {
    home_team: homeTeam,
    away_team: awayTeam,
    predicted_home_win: parseFloat(homeWinProb.toFixed(3)),
    predicted_draw: parseFloat(drawProb.toFixed(3)),
    predicted_away_win: parseFloat(awayWinProb.toFixed(3)),
    predicted_home_goals: parseFloat(predictedHomeGoals.toFixed(1)),
    predicted_away_goals: parseFloat(predictedAwayGoals.toFixed(1)),
    confidence: parseFloat(confidence.toFixed(2)),
    factors: {
      home_advantage: parseFloat((homeAdvantage * 100).toFixed(1)),
      form_difference: parseFloat((formDifference * 100).toFixed(1)),
      goals_ratio: parseFloat((goalsAdjustment * 100).toFixed(1))
    }
  }
}

/**
 * Get goals distribution for visualization
 */
export function getGoalsDistribution(matches: Match[]): Record<number, number> {
  const completedMatches = matches.filter(m => 
    m.status.toLowerCase() === 'played' || m.status.toLowerCase() === 'completed'
  )
  
  const distribution: Record<number, number> = {}
  
  completedMatches.forEach(match => {
    const totalGoals = Math.round(match.home_goals + match.away_goals)
    distribution[totalGoals] = (distribution[totalGoals] || 0) + 1
  })
  
  return distribution
}

/**
 * Get result distribution for visualization
 */
export function getResultDistribution(matches: Match[]): { result: string; count: number; percentage: string }[] {
  const completedMatches = matches.filter(m => 
    m.status.toLowerCase() === 'played' || m.status.toLowerCase() === 'completed'
  )
  
  const total = completedMatches.length
  const homeWins = completedMatches.filter(m => m.result === 'win').length
  const draws = completedMatches.filter(m => m.result === 'draw').length
  const awayWins = completedMatches.filter(m => m.result === 'loss').length
  
  return [
    { result: 'Home Win', count: homeWins, percentage: ((homeWins / total) * 100).toFixed(1) },
    { result: 'Draw', count: draws, percentage: ((draws / total) * 100).toFixed(1) },
    { result: 'Away Win', count: awayWins, percentage: ((awayWins / total) * 100).toFixed(1) }
  ]
}

/**
 * Get season trends for visualization
 */
export function getSeasonTrends(matches: Match[]): { season: string; avg_goals: number; home_win_rate: number; total_matches: number }[] {
  const completedMatches = matches.filter(m => 
    m.status.toLowerCase() === 'played' || m.status.toLowerCase() === 'completed'
  )
  
  const bySeason: Record<string, Match[]> = {}
  completedMatches.forEach(match => {
    if (!bySeason[match.season]) bySeason[match.season] = []
    bySeason[match.season].push(match)
  })
  
  return Object.entries(bySeason)
    .map(([season, seasonMatches]) => {
      const totalGoals = seasonMatches.reduce((sum, m) => sum + m.home_goals + m.away_goals, 0)
      const homeWins = seasonMatches.filter(m => m.result === 'win').length
      
      return {
        season,
        avg_goals: parseFloat((totalGoals / seasonMatches.length).toFixed(2)),
        home_win_rate: parseFloat(((homeWins / seasonMatches.length) * 100).toFixed(1)),
        total_matches: seasonMatches.length
      }
    })
    .sort((a, b) => a.season.localeCompare(b.season))
    .slice(-10) // Last 10 seasons
}
