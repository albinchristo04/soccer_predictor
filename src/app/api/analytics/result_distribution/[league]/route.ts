import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, getResultDistribution } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params

  try {
    const matches = await loadLeagueData(league)
    const distribution = getResultDistribution(matches)

    return NextResponse.json({
      league,
      distribution,
      total_matches: distribution.reduce((sum, d) => sum + d.count, 0)
    })
  } catch (error) {
    console.error('Error getting result distribution:', error)
    return NextResponse.json(
      { error: 'Failed to get result distribution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
