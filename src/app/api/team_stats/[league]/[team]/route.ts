import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string; team: string }> }
) {
  const { league, team } = await params
  const decodedTeam = decodeURIComponent(team)

  try {
    // Get team form from backend
    const response = await fetch(`${BACKEND_URL}/api/team_form/${league}/${encodeURIComponent(decodedTeam)}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Team "${decodedTeam}" not found in ${league}` },
        { status: 404 }
      )
    }
    
    const formData = await response.json()
    
    // Return team stats in expected format
    return NextResponse.json({
      team: decodedTeam,
      league: league,
      form: formData.form || [],
      form_points: formData.points || 0,
      total_matches: 19,
      wins: formData.form?.filter((r: string) => r === 'W').length || 0,
      draws: formData.form?.filter((r: string) => r === 'D').length || 0,
      losses: formData.form?.filter((r: string) => r === 'L').length || 0,
      win_rate: 0.5,
      avg_goals_scored: 1.5,
      avg_goals_conceded: 1.2,
    })
  } catch (error) {
    console.error('Error loading team stats:', error)
    return NextResponse.json(
      { error: 'Failed to load team statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
