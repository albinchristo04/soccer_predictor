import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, getSeasonTrends } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: { league: string } }
) {
  const league = params.league

  try {
    const matches = await loadLeagueData(league)
    const trends = getSeasonTrends(matches)

    return NextResponse.json({
      league,
      trends,
      seasons_count: trends.length
    })
  } catch (error) {
    console.error('Error getting season trends:', error)
    return NextResponse.json(
      { error: 'Failed to get season trends', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
