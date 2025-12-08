import { NextRequest, NextResponse } from 'next/server'
import { loadLeagueData, calculateLeagueOverview } from '@/lib/dataService'

export async function GET(
  request: NextRequest,
  { params }: { params: { league: string } }
) {
  const { league } = params
  
  try {
    const matches = await loadLeagueData(league)
    const overview = calculateLeagueOverview(matches)
    
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error loading league overview:', error)
    return NextResponse.json(
      { error: 'Failed to load league data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
