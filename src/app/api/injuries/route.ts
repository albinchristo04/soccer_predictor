import { NextRequest, NextResponse } from 'next/server'

interface Injury {
  player: string
  position: string
  injury: string
  status: 'out' | 'doubtful' | 'questionable' | 'probable'
  expectedReturn?: string
  impactRating: number // 1-10, how much this affects the team
}

interface TeamInjuries {
  team: string
  league: string
  injuries: Injury[]
  overallImpact: 'minimal' | 'moderate' | 'significant' | 'severe'
  impactScore: number
}

// Sample injury data for major teams
const TEAM_INJURIES: Record<string, Injury[]> = {
  'liverpool': [
    { player: 'Diogo Jota', position: 'FW', injury: 'Muscle', status: 'out', expectedReturn: '2 weeks', impactRating: 7 },
    { player: 'Federico Chiesa', position: 'FW', injury: 'Hamstring', status: 'doubtful', expectedReturn: '1 week', impactRating: 6 },
  ],
  'arsenal': [
    { player: 'Bukayo Saka', position: 'RW', injury: 'Hamstring', status: 'doubtful', expectedReturn: 'Unknown', impactRating: 9 },
    { player: 'Ethan Nwaneri', position: 'MF', injury: 'Muscle', status: 'questionable', expectedReturn: '1 week', impactRating: 4 },
  ],
  'manchester city': [
    { player: 'Rodri', position: 'MF', injury: 'ACL', status: 'out', expectedReturn: 'Season', impactRating: 10 },
    { player: 'Oscar Bobb', position: 'MF', injury: 'Leg', status: 'out', expectedReturn: '2 months', impactRating: 5 },
    { player: 'Nathan Ake', position: 'DF', injury: 'Muscle', status: 'doubtful', expectedReturn: '1 week', impactRating: 6 },
  ],
  'chelsea': [
    { player: 'Romeo Lavia', position: 'MF', injury: 'Hamstring', status: 'questionable', expectedReturn: '1 week', impactRating: 6 },
    { player: 'Wesley Fofana', position: 'DF', injury: 'Knee', status: 'probable', expectedReturn: 'Available', impactRating: 7 },
  ],
  'manchester united': [
    { player: 'Luke Shaw', position: 'DF', injury: 'Calf', status: 'out', expectedReturn: '3 weeks', impactRating: 7 },
    { player: 'Leny Yoro', position: 'DF', injury: 'Foot', status: 'out', expectedReturn: '2 months', impactRating: 6 },
    { player: 'Tyrell Malacia', position: 'DF', injury: 'Knee', status: 'out', expectedReturn: 'Unknown', impactRating: 5 },
  ],
  'tottenham': [
    { player: 'Micky van de Ven', position: 'DF', injury: 'Hamstring', status: 'out', expectedReturn: '4 weeks', impactRating: 8 },
    { player: 'Richarlison', position: 'FW', injury: 'Muscle', status: 'doubtful', expectedReturn: '1 week', impactRating: 6 },
    { player: 'Wilson Odobert', position: 'FW', injury: 'Hamstring', status: 'out', expectedReturn: '2 months', impactRating: 5 },
  ],
  'real madrid': [
    { player: 'Dani Carvajal', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: 'Season', impactRating: 9 },
    { player: 'Eder Militao', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: 'Season', impactRating: 8 },
    { player: 'David Alaba', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: 'Unknown', impactRating: 7 },
  ],
  'barcelona': [
    { player: 'Marc-Andre ter Stegen', position: 'GK', injury: 'Knee', status: 'out', expectedReturn: 'Season', impactRating: 9 },
    { player: 'Ronald Araujo', position: 'DF', injury: 'Hamstring', status: 'out', expectedReturn: '2 months', impactRating: 8 },
    { player: 'Andreas Christensen', position: 'DF', injury: 'Achilles', status: 'out', expectedReturn: '1 month', impactRating: 6 },
  ],
  'bayern munich': [
    { player: 'Harry Kane', position: 'FW', injury: 'Muscle', status: 'probable', expectedReturn: 'Available', impactRating: 9 },
    { player: 'Josip Stanisic', position: 'DF', injury: 'Knee', status: 'out', expectedReturn: '2 months', impactRating: 5 },
  ],
  'juventus': [
    { player: 'Gleison Bremer', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: 'Season', impactRating: 8 },
    { player: 'Juan Cabal', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: 'Season', impactRating: 6 },
    { player: 'Arkadiusz Milik', position: 'FW', injury: 'Knee', status: 'out', expectedReturn: '1 month', impactRating: 5 },
  ],
  'inter': [
    { player: 'Francesco Acerbi', position: 'DF', injury: 'Muscle', status: 'questionable', expectedReturn: '1 week', impactRating: 6 },
    { player: 'Tajon Buchanan', position: 'DF', injury: 'Leg', status: 'out', expectedReturn: '2 months', impactRating: 4 },
  ],
  'napoli': [
    { player: 'Stanislav Lobotka', position: 'MF', injury: 'Muscle', status: 'probable', expectedReturn: 'Available', impactRating: 7 },
  ],
  'paris saint-germain': [
    { player: 'Presnel Kimpembe', position: 'DF', injury: 'Achilles', status: 'out', expectedReturn: 'Unknown', impactRating: 6 },
    { player: 'Lucas Hernandez', position: 'DF', injury: 'ACL', status: 'out', expectedReturn: '1 month', impactRating: 7 },
    { player: 'Goncalo Ramos', position: 'FW', injury: 'Ankle', status: 'out', expectedReturn: '2 weeks', impactRating: 6 },
  ],
}

function getOverallImpact(injuries: Injury[]): { impact: 'minimal' | 'moderate' | 'significant' | 'severe'; score: number } {
  if (injuries.length === 0) {
    return { impact: 'minimal', score: 0 }
  }
  
  // Calculate weighted impact score
  const outInjuries = injuries.filter(i => i.status === 'out')
  const doubtfulInjuries = injuries.filter(i => i.status === 'doubtful')
  
  const score = injuries.reduce((sum, inj) => {
    const statusMultiplier = 
      inj.status === 'out' ? 1.0 :
      inj.status === 'doubtful' ? 0.7 :
      inj.status === 'questionable' ? 0.4 : 0.2
    return sum + (inj.impactRating * statusMultiplier)
  }, 0)
  
  let impact: 'minimal' | 'moderate' | 'significant' | 'severe' = 'minimal'
  if (score >= 25) impact = 'severe'
  else if (score >= 15) impact = 'significant'
  else if (score >= 8) impact = 'moderate'
  
  return { impact, score: Math.round(score) }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const team = searchParams.get('team')
  
  try {
    if (team) {
      // Get injuries for specific team
      const teamKey = team.toLowerCase()
      const injuries = TEAM_INJURIES[teamKey] || []
      const { impact, score } = getOverallImpact(injuries)
      
      const result: TeamInjuries = {
        team: team,
        league: getLeagueForTeam(teamKey),
        injuries,
        overallImpact: impact,
        impactScore: score,
      }
      
      return NextResponse.json(result)
    }
    
    // Return all teams' injuries
    const allInjuries = Object.entries(TEAM_INJURIES).map(([teamName, injuries]) => {
      const { impact, score } = getOverallImpact(injuries)
      return {
        team: teamName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        league: getLeagueForTeam(teamName),
        injuries,
        overallImpact: impact,
        impactScore: score,
      }
    })
    
    return NextResponse.json({
      teams: allInjuries,
      totalInjuries: allInjuries.reduce((sum, t) => sum + t.injuries.length, 0),
      source: 'simulated',
      note: 'Injury data is for demonstration. Integrate with a sports data API for live updates.'
    })
  } catch (error) {
    console.error('Error fetching injuries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch injury data' },
      { status: 500 }
    )
  }
}

function getLeagueForTeam(team: string): string {
  const premierLeague = ['arsenal', 'chelsea', 'liverpool', 'manchester city', 'manchester united', 'tottenham', 'newcastle united', 'aston villa']
  const laLiga = ['real madrid', 'barcelona', 'atletico madrid', 'sevilla', 'villarreal']
  const serieA = ['inter', 'milan', 'juventus', 'napoli', 'roma', 'lazio', 'atalanta']
  const bundesliga = ['bayern munich', 'dortmund', 'rb leipzig', 'leverkusen']
  const ligue1 = ['paris saint-germain', 'marseille', 'lyon', 'monaco', 'lille']
  
  if (premierLeague.includes(team)) return 'Premier League'
  if (laLiga.includes(team)) return 'La Liga'
  if (serieA.includes(team)) return 'Serie A'
  if (bundesliga.includes(team)) return 'Bundesliga'
  if (ligue1.includes(team)) return 'Ligue 1'
  return 'Unknown'
}
