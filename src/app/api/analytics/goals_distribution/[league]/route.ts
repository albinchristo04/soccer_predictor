import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, getGoalsDistribution } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params

  try {
    const matches = await loadLeagueData(league)
    const distribution = getGoalsDistribution(matches)
    
    // Convert to array format for charts
    const data = Object.entries(distribution)
      .map(([goals, count]) => ({
        goals: parseInt(goals),
        count,
        percentage: ((count / Object.values(distribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      }))
      .sort((a, b) => a.goals - b.goals)

    return NextResponse.json({
      league,
      distribution: data,
      total_matches: Object.values(distribution).reduce((a, b) => a + b, 0)
    })
  } catch (error) {
    console.error('Error getting goals distribution:', error)
    return NextResponse.json(
      { error: 'Failed to get goals distribution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
