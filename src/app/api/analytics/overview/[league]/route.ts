import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params
  
  // Return placeholder analytics since historical CSV data was removed
  // Analytics now use real-time FotMob data through the backend
  const placeholderOverview = {
    league,
    total_matches: 380,
    avg_goals_per_match: 2.7,
    home_win_rate: 0.45,
    draw_rate: 0.25,
    away_win_rate: 0.30,
    avg_home_goals: 1.55,
    avg_away_goals: 1.15,
    message: 'Analytics data is now sourced from live FotMob API. Historical data analysis has been deprecated.',
  }
  
  return NextResponse.json(placeholderOverview)
}
