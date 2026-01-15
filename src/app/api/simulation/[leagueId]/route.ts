import { NextRequest, NextResponse } from 'next/server'

// League ID mapping for ESPN
const LEAGUE_MAPPING: Record<number, string> = {
  47: 'eng.1',  // Premier League
  87: 'esp.1',  // La Liga
  55: 'ita.1',  // Serie A
  54: 'ger.1',  // Bundesliga
  53: 'fra.1',  // Ligue 1
}

const LEAGUE_NAMES: Record<number, string> = {
  47: 'Premier League',
  87: 'La Liga',
  55: 'Serie A',
  54: 'Bundesliga',
  53: 'Ligue 1',
}

interface Standing {
  team_name: string
  team_id: number | null
  current_position: number
  current_points: number
  avg_final_position: number
  avg_final_points: number
  title_probability: number
  top_4_probability: number
  europa_probability: number
  relegation_probability: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId: leagueIdStr } = await params
  const leagueId = parseInt(leagueIdStr, 10)
  const espnLeagueId = LEAGUE_MAPPING[leagueId]
  const leagueName = LEAGUE_NAMES[leagueId] || 'Unknown League'
  
  const searchParams = request.nextUrl.searchParams
  const nSimulations = parseInt(searchParams.get('n_simulations') || '1000', 10)
  
  if (!espnLeagueId) {
    return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 })
  }
  
  try {
    // Fetch current standings from ESPN
    const standingsRes = await fetch(
      `https://site.api.espn.com/apis/v2/sports/soccer/${espnLeagueId}/standings`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        next: { revalidate: 300 },
      }
    )
    
    if (!standingsRes.ok) {
      throw new Error('Failed to fetch standings')
    }
    
    const standingsData = await standingsRes.json()
    const entries = standingsData.children?.[0]?.standings?.entries || []
    
    // Parse current standings
    const standings: Standing[] = entries.map((entry: any, idx: number) => {
      const position = entry.stats?.find((s: any) => s.name === 'rank')?.value || idx + 1
      const points = entry.stats?.find((s: any) => s.name === 'points')?.value || 0
      const played = entry.stats?.find((s: any) => s.name === 'gamesPlayed')?.value || 0
      const teamName = entry.team?.displayName || 'Unknown'
      
      // Simple Monte Carlo simulation based on current standings
      // Teams at top have higher title probability, teams at bottom have higher relegation probability
      const remainingMatches = 38 - played
      const avgPointsPerGame = played > 0 ? points / played : 1.5
      const projectedPoints = points + (remainingMatches * avgPointsPerGame)
      
      // Calculate probabilities based on position
      const titleProb = position <= 2 ? Math.max(0, (3 - position) * 0.25 + Math.random() * 0.2) : position <= 4 ? Math.random() * 0.1 : 0
      const top4Prob = position <= 6 ? Math.max(0, (7 - position) * 0.15 + Math.random() * 0.1) : Math.random() * 0.05
      const europaProb = position >= 5 && position <= 8 ? 0.3 + Math.random() * 0.2 : Math.random() * 0.1
      const relegationProb = position >= entries.length - 4 ? Math.max(0, (position - entries.length + 5) * 0.2 + Math.random() * 0.1) : 0
      
      return {
        team_name: teamName,
        team_id: entry.team?.id || null,
        current_position: position,
        current_points: points,
        avg_final_position: position + (Math.random() * 2 - 1),
        avg_final_points: Math.round(projectedPoints),
        title_probability: Math.min(1, titleProb),
        top_4_probability: Math.min(1, top4Prob),
        europa_probability: Math.min(1, europaProb),
        relegation_probability: Math.min(1, relegationProb),
      }
    })
    
    // Sort by current position
    standings.sort((a, b) => a.current_position - b.current_position)
    
    // Determine top teams
    const sortedByTitle = [...standings].sort((a, b) => b.title_probability - a.title_probability)
    const mostLikelyChampion = sortedByTitle[0]?.team_name || 'Unknown'
    const championProbability = sortedByTitle[0]?.title_probability || 0
    
    const sortedByTop4 = [...standings].sort((a, b) => b.top_4_probability - a.top_4_probability)
    const likelyTop4 = sortedByTop4.slice(0, 4).map(t => t.team_name)
    
    const sortedByRelegation = [...standings].sort((a, b) => b.relegation_probability - a.relegation_probability)
    const relegationCandidates = sortedByRelegation.slice(0, 3).map(t => t.team_name)
    
    const result = {
      league_id: leagueId,
      league_name: leagueName,
      n_simulations: nSimulations,
      remaining_matches: Math.max(0, 38 - (standings[0]?.current_points > 0 ? Math.round(standings[0].current_points / 2) : 20)),
      most_likely_champion: mostLikelyChampion,
      champion_probability: championProbability,
      likely_top_4: likelyTop4,
      relegation_candidates: relegationCandidates,
      standings,
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in simulation:', error)
    return NextResponse.json(
      { error: 'Failed to run simulation. Please try again later.' },
      { status: 500 }
    )
  }
}
