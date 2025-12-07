/**
 * Serverless-compatible prediction service for Vercel deployment
 */

import fs from 'fs'
import path from 'path'

export interface TeamStats {
  goalsScored: number
  goalsConceded: number
  winRate: number
  drawRate: number
  lossRate: number
  matchCount: number
  homeWinRate?: number
  awayWinRate?: number
  recentForm: number
}

export interface MatchPrediction {
  homeWin: number
  draw: number
  awayWin: number
  predictedHomeGoals: number
  predictedAwayGoals: number
  confidence: number
}

interface MatchData {
  home_team: string
  away_team: string
  date: string
  home_goals: string
  away_goals: string
  result: string
  status: string
  season: string
}

function parseCSV(csvContent: string): MatchData[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const match: Record<string, string> = {}
    headers.forEach((header, index) => {
      match[header] = values[index]?.trim() || ''
    })
    return match as unknown as MatchData
  })
}

export function loadLeagueData(league: string): MatchData[] {
  try {
    const filePath = path.join(process.cwd(), 'fbref_data', 'processed', `${league}_processed.csv`)
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    return parseCSV(csvContent)
  } catch (error) {
    console.error(`Error loading league data for ${league}:`, error)
    throw new Error(`League data for "${league}" not found or could not be loaded`)
  }
}

export function calculateTeamStats(matches: MatchData[], teamName: string): TeamStats {
  const teamLower = teamName.toLowerCase()
  const allSeasons = Array.from(new Set(matches.map(m => m.season))).sort()
  const recentSeasons = allSeasons.slice(-2)
  const recentMatches = matches.filter(m => recentSeasons.includes(m.season))
  
  const teamMatches = recentMatches.filter(match => {
    const isHomeMatch = match.home_team.toLowerCase() === teamLower
    const isAwayMatch = match.away_team.toLowerCase() === teamLower
    return isHomeMatch || isAwayMatch
  }).filter(m => m.status === 'played')
  
  if (teamMatches.length === 0) {
    return {
      goalsScored: 1.3, goalsConceded: 1.3, winRate: 0.33,
      drawRate: 0.30, lossRate: 0.37, matchCount: 0, recentForm: 0.5
    }
  }
  
  let wins = 0, draws = 0, losses = 0
  let goalsScored = 0, goalsConceded = 0
  let homeWins = 0, homeMatches = 0, awayWins = 0, awayMatches = 0
  const last5 = teamMatches.slice(-5)
  let formPoints = 0
  
  teamMatches.forEach(match => {
    const isHomeMatch = match.home_team.toLowerCase() === teamLower
    const homeGoals = parseFloat(match.home_goals) || 0
    const awayGoals = parseFloat(match.away_goals) || 0
    
    if (isHomeMatch) {
      goalsScored += homeGoals
      goalsConceded += awayGoals
      homeMatches++
      if (match.result === 'win') { wins++; homeWins++ }
      else if (match.result === 'draw') draws++
      else losses++
    } else {
      goalsScored += awayGoals
      goalsConceded += homeGoals
      awayMatches++
      if (match.result === 'loss') { wins++; awayWins++ }
      else if (match.result === 'draw') draws++
      else losses++
    }
    
    if (last5.includes(match)) {
      const isLast5Home = match.home_team.toLowerCase() === teamLower
      if ((isLast5Home && match.result === 'win') || (!isLast5Home && match.result === 'loss')) {
        formPoints += 3
      } else if (match.result === 'draw') {
        formPoints += 1
      }
    }
  })
  
  const totalMatches = teamMatches.length
  const recentForm = last5.length > 0 ? formPoints / (last5.length * 3) : 0.5
  
  return {
    goalsScored: goalsScored / totalMatches,
    goalsConceded: goalsConceded / totalMatches,
    winRate: wins / totalMatches,
    drawRate: draws / totalMatches,
    lossRate: losses / totalMatches,
    matchCount: totalMatches,
    homeWinRate: homeMatches > 0 ? homeWins / homeMatches : undefined,
    awayWinRate: awayMatches > 0 ? awayWins / awayMatches : undefined,
    recentForm
  }
}

export function predictMatch(homeTeam: string, awayTeam: string, matches: MatchData[]): MatchPrediction {
  const homeStats = calculateTeamStats(matches, homeTeam)
  const awayStats = calculateTeamStats(matches, awayTeam)
  
  const HOME_ADVANTAGE = 0.37
  let expectedHomeGoals = (homeStats.goalsScored + awayStats.goalsConceded) / 2 + HOME_ADVANTAGE
  let expectedAwayGoals = (awayStats.goalsScored + homeStats.goalsConceded) / 2
  
  const formDiff = homeStats.recentForm - awayStats.recentForm
  const formAdjustment = formDiff * 0.8
  
  expectedHomeGoals += formAdjustment
  expectedAwayGoals -= formAdjustment
  
  expectedHomeGoals = Math.max(0.5, Math.min(4.0, expectedHomeGoals))
  expectedAwayGoals = Math.max(0.5, Math.min(4.0, expectedAwayGoals))
  
  const goalDiff = expectedHomeGoals - expectedAwayGoals
  
  let homeWinProb: number, drawProb: number, awayWinProb: number
  
  if (Math.abs(goalDiff) > 0.8) {
    const strength = Math.min(Math.abs(goalDiff) / 2.5, 0.8)
    if (goalDiff > 0) {
      homeWinProb = 0.35 + (strength * 0.45)
      drawProb = 0.30 - (strength * 0.18)
      awayWinProb = 0.35 - (strength * 0.27)
    } else {
      awayWinProb = 0.30 + (strength * 0.45)
      drawProb = 0.30 - (strength * 0.18)
      homeWinProb = 0.40 - (strength * 0.32)
    }
  } else {
    const slight = Math.abs(goalDiff) / 0.8
    if (goalDiff > 0) {
      homeWinProb = 0.40 + (slight * 0.10)
      drawProb = 0.30 - (slight * 0.05)
      awayWinProb = 0.30 - (slight * 0.05)
    } else if (goalDiff < 0) {
      awayWinProb = 0.32 + (slight * 0.10)
      drawProb = 0.30 - (slight * 0.05)
      homeWinProb = 0.38 - (slight * 0.05)
    } else {
      homeWinProb = 0.38
      drawProb = 0.28
      awayWinProb = 0.34
    }
  }
  
  const total = homeWinProb + drawProb + awayWinProb
  homeWinProb /= total
  drawProb /= total
  awayWinProb /= total
  
  if (homeWinProb > awayWinProb + 0.15) {
    const minDiff = 0.5 + ((homeWinProb - awayWinProb) * 2.5)
    if (expectedHomeGoals - expectedAwayGoals < minDiff) {
      expectedHomeGoals = expectedAwayGoals + minDiff
    }
  } else if (awayWinProb > homeWinProb + 0.15) {
    const minDiff = 0.5 + ((awayWinProb - homeWinProb) * 2.5)
    if (expectedAwayGoals - expectedHomeGoals < minDiff) {
      expectedAwayGoals = expectedHomeGoals + minDiff
    }
  }
  
  const maxProb = Math.max(homeWinProb, drawProb, awayWinProb)
  const confidence = maxProb > 0.5 ? (maxProb - 0.33) / 0.67 : (maxProb - 0.33) / 0.17
  
  return {
    homeWin: Math.round(homeWinProb * 100) / 100,
    draw: Math.round(drawProb * 100) / 100,
    awayWin: Math.round(awayWinProb * 100) / 100,
    predictedHomeGoals: Math.round(expectedHomeGoals * 10) / 10,
    predictedAwayGoals: Math.round(expectedAwayGoals * 10) / 10,
    confidence: Math.round(confidence * 100) / 100
  }
}

export function getLeagueTeams(matches: MatchData[]): string[] {
  const teams = new Set<string>()
  matches.forEach(match => {
    if (match.home_team) teams.add(match.home_team)
    if (match.away_team) teams.add(match.away_team)
  })
  return Array.from(teams).sort()
}

export function findTeam(teamInput: string, teams: string[]): string | null {
  const input = teamInput.toLowerCase().trim()
  const exactMatch = teams.find(t => t.toLowerCase() === input)
  if (exactMatch) return exactMatch
  const partialMatch = teams.find(t => t.toLowerCase().includes(input))
  if (partialMatch) return partialMatch
  return null
}

export function getUpcomingMatchesWithPredictions(
  league: string,
  limit: number = 50
): Array<{
  date: string
  home_team: string
  away_team: string
  predicted_home_win: number
  predicted_draw: number
  predicted_away_win: number
  predicted_home_goals: number
  predicted_away_goals: number
}> {
  const matches = loadLeagueData(league)
  const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, limit)
  
  return upcoming.map(match => {
    const prediction = predictMatch(match.home_team, match.away_team, matches)
    return {
      date: match.date,
      home_team: match.home_team,
      away_team: match.away_team,
      predicted_home_win: prediction.homeWin,
      predicted_draw: prediction.draw,
      predicted_away_win: prediction.awayWin,
      predicted_home_goals: prediction.predictedHomeGoals,
      predicted_away_goals: prediction.predictedAwayGoals
    }
  })
}
