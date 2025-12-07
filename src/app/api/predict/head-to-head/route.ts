import { NextRequest, NextResponse } from 'next/server';
import { loadLeagueData, predictMatch, findTeam, getLeagueTeams } from '@/lib/predictionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { league, home_team, away_team } = body;

    if (!league || !home_team || !away_team) {
      return NextResponse.json(
        { error: 'Missing required fields: league, home_team, away_team' },
        { status: 400 }
      );
    }

    // Load league data
    const matches = loadLeagueData(league);
    const teams = getLeagueTeams(matches);

    // Find teams (with fuzzy matching)
    const homeTeamMatch = findTeam(home_team, teams);
    const awayTeamMatch = findTeam(away_team, teams);

    if (!homeTeamMatch) {
      return NextResponse.json(
        { error: `Home team '${home_team}' not found in ${league}` },
        { status: 404 }
      );
    }

    if (!awayTeamMatch) {
      return NextResponse.json(
        { error: `Away team '${away_team}' not found in ${league}` },
        { status: 404 }
      );
    }

    // Get prediction
    const prediction = predictMatch(homeTeamMatch, awayTeamMatch, matches);

    return NextResponse.json({
      success: true,
      predictions: {
        home_win: prediction.homeWin,
        draw: prediction.draw,
        away_win: prediction.awayWin,
      },
      predicted_home_goals: prediction.predictedHomeGoals,
      predicted_away_goals: prediction.predictedAwayGoals,
      home_team: homeTeamMatch,
      away_team: awayTeamMatch,
    });
  } catch (error: any) {
    console.error('Error in head-to-head prediction:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
