import { NextResponse } from 'next/server'
import { loadLeagueData, getLeagueTeams } from '@/lib/predictionService'

export async function GET(
  request: Request,
  { params }: { params: { league: string } }
) {
  const { league } = params

  try {
    const matches = loadLeagueData(league)
    const teams = getLeagueTeams(matches)
    
    return NextResponse.json({ success: true, teams })
  } catch (error: any) {
    console.error('Error loading teams:', error)
    return NextResponse.json(
      { error: 'Failed to load teams', details: error.message },
      { status: 500 }
    )
  }
}
