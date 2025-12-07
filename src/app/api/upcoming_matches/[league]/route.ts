// Next.js API route for upcoming matches with real predictions
import { NextResponse } from 'next/server'
import { getUpcomingMatchesWithPredictions } from '@/lib/predictionService'

export async function GET(
  request: Request,
  { params }: { params: { league: string } }
) {
  const { league } = params

  try {
    const upcomingMatches = getUpcomingMatchesWithPredictions(league, 50)
    return NextResponse.json(upcomingMatches)
  } catch (error: any) {
    console.error('Error loading matches:', error)
    return NextResponse.json(
      { error: 'Failed to load matches', details: error.message },
      { status: 500 }
    )
  }
}
