import { NextRequest, NextResponse } from 'next/server';
import { loadLeagueData, predictMatch, findTeam, getLeagueTeams, calculateTeamStats } from '@/lib/predictionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { league_a, team_a, league_b, team_b } = body;

    if (!league_a || !team_a || !league_b || !team_b) {
      return NextResponse.json(
        { error: 'Missing required fields: league_a, team_a, league_b, team_b' },
        { status: 400 }
      );
    }

    // Load both league datasets
    const matchesA = loadLeagueData(league_a);
    const matchesB = loadLeagueData(league_b);
    
    const teamsA = getLeagueTeams(matchesA);
    const teamsB = getLeagueTeams(matchesB);

    // Find teams
    const teamAMatch = findTeam(team_a, teamsA);
    const teamBMatch = findTeam(team_b, teamsB);

    if (!teamAMatch) {
      return NextResponse.json(
        { error: `Team '${team_a}' not found in ${league_a}` },
        { status: 404 }
      );
    }

    if (!teamBMatch) {
      return NextResponse.json(
        { error: `Team '${team_b}' not found in ${league_b}` },
        { status: 404 }
      );
    }

    // For cross-league, combine datasets for neutral prediction
    const combinedMatches = [...matchesA, ...matchesB];
    
    // Get prediction (team_a as home, team_b as away)
    const prediction = predictMatch(teamAMatch, teamBMatch, combinedMatches);

    return NextResponse.json({
      success: true,
      predictions: {
        team_a_win: prediction.homeWin,
        draw: prediction.draw,
        team_b_win: prediction.awayWin,
      },
      predicted_team_a_goals: prediction.predictedHomeGoals,
      predicted_team_b_goals: prediction.predictedAwayGoals,
      team_a: teamAMatch,
      team_b: teamBMatch,
      league_a,
      league_b,
    });
  } catch (error: any) {
    console.error('Error in cross-league prediction:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
