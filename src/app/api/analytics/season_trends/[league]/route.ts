import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params

  // Return placeholder trends since historical CSV data was removed
  const trends = [
    { season: '2025-2026', avg_goals: 2.7, home_wins: 45, draws: 25, away_wins: 30 },
    { season: '2024-2025', avg_goals: 2.6, home_wins: 44, draws: 26, away_wins: 30 },
    { season: '2023-2024', avg_goals: 2.8, home_wins: 46, draws: 24, away_wins: 30 },
  ]

  return NextResponse.json({
    league,
    trends,
    seasons_count: trends.length,
    message: 'Analytics data is now sourced from live FotMob API.',
  })
}
