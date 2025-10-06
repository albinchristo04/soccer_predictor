'use server';

import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export interface Match {
  Season: string;
  Date: string;
  Home: string;
  xG: string;
  'Home Goals': string;
  'Away Goals': string;
  'xG.1': string;
  Away: string;
  Attendance: string;
  Venue: string;
}

export interface SeasonStats {
  Season: string;
  Squad: string;
  W: string;
  D: string;
  L: string;
  GF: string;
  GA: string;
  Pts: string;
  Sh: string;
  SoT: string;
  FK: string;
  PK: string;
  Cmp: string;
  Att: string;
  'Cmp%': string;
  CK: string;
  CrdY: string;
  CrdR: string;
  Fls: string;
  PKcon: string;
  OG: string;
  GD?: number;
}

export async function fetchAllSeasons(league: string) {
  const seasonsPath = path.join(dataDir, league, 'seasons.csv');
  const seasonsFile = fs.readFileSync(seasonsPath, 'utf-8');
  const seasons = seasonsFile.split('\n').slice(1).map(line => line.split(',')[1]);
  return seasons.filter(Boolean);
}

export async function getTeams(league: string) {
  const teamsPath = path.join(dataDir, league, 'teams.csv');
  const teamsFile = fs.readFileSync(teamsPath, 'utf-8');
  const teams = teamsFile.split('\n').slice(1).map(line => line.split(',')[1]);
  return teams.filter(Boolean);
}

export async function getMatches(league: string, season: string): Promise<Match[]> {
  const matchesPath = path.join(dataDir, league, 'matches.csv');
  const matchesFile = fs.readFileSync(matchesPath, 'utf-8');
  const lines = matchesFile.split('\n');
  const headers = lines[0].split(',');

  const matches = lines.slice(1).map(line => {
    const values = line.split(',');
    const match: Match = {} as Match;
    headers.forEach((header, i) => {
      match[header.trim() as keyof Match] = values[i];
    });
    return match;
  });

  return matches.filter(match => match.Season === season);
}

export async function getSeasonStats(league: string, season: string): Promise<SeasonStats[]> {
  const seasonStatsPath = path.join(dataDir, league, 'seasonstats.csv');
  const seasonStatsFile = fs.readFileSync(seasonStatsPath, 'utf-8');
  const lines = seasonStatsFile.split('\n');
  const headers = lines[0].split(',');

  const stats = lines.slice(1).map(line => {
    const values = line.split(',');
    const seasonStat: SeasonStats = {} as SeasonStats;
    headers.forEach((header, i) => {
      seasonStat[header.trim() as keyof SeasonStats] = values[i];
    });
    return seasonStat;
  });

  return stats.filter(stat => stat.Season === season);
}

export async function fetchRankedSeasonStats(league: string, season: string): Promise<SeasonStats[]> {
  const seasonStats = await getSeasonStats(league, season);

  const rankedStats = seasonStats.map(stat => {
    const GF = parseInt(stat.GF, 10) || 0;
    const GA = parseInt(stat.GA, 10) || 0;
    const goalDifference = GF - GA;
    return {
      ...stat,
      GD: goalDifference,
    };
  });

  rankedStats.sort((a, b) => {
    const ptsA = parseInt(a.Pts, 10) || 0;
    const ptsB = parseInt(b.Pts, 10) || 0;
    if (ptsB !== ptsA) {
      return ptsB - ptsA;
    }

    if (b.GD !== a.GD) {
      return b.GD - a.GD;
    }

    const gfA = parseInt(a.GF, 10) || 0;
    const gfB = parseInt(b.GF, 10) || 0;
    return gfB - gfA;
  });

  return rankedStats;
}

export async function fetchChartsData(league: string, season: string) {
  const matches = await getMatches(league, season);

  const homeWins = matches.filter(match => Number(match['Home Goals']) > Number(match['Away Goals'])).length;
  const awayWins = matches.filter(match => Number(match['Away Goals']) > Number(match['Home Goals'])).length;
  const draws = matches.filter(match => Number(match['Home Goals']) === Number(match['Away Goals'])).length;

  const stats = await getSeasonStats(league, season);
  const wdlData = stats.map(team => ({
    name: team.Squad,
    W: Number(team.W),
    D: Number(team.D),
    L: Number(team.L),
  }));

  return {
    outcomeData: [
      { name: 'Home Wins', value: homeWins },
      { name: 'Away Wins', value: awayWins },
      { name: 'Draws', value: draws },
    ],
    wdlData,
  };
}

export async function fetchTeamPerformanceData(league: string, season: string) {
  const matches = await getMatches(league, season);
  const seasonStats = await getSeasonStats(league, season);
  const teams = seasonStats.map(stat => stat.Squad);

  // Sort matches by date
  matches.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  const teamPoints: { [key: string]: number } = {};
  teams.forEach(team => {
    teamPoints[team] = 0;
  });

  const performanceDataMap = new Map<string, any>();

  matches.forEach(match => {
    if (!match.Date || !match.Home || !match.Away) {
      return;
    }

    const homeTeam = match.Home;
    const awayTeam = match.Away;
    const homeGoals = parseInt(match['Home Goals'], 10);
    const awayGoals = parseInt(match['Away Goals'], 10);

    let homePoints = 0;
    let awayPoints = 0;

    if (homeGoals > awayGoals) {
      homePoints = 3;
    } else if (homeGoals < awayGoals) {
      awayPoints = 3;
    } else {
      homePoints = 1;
      awayPoints = 1;
    }
    
    if (teamPoints[homeTeam] !== undefined) teamPoints[homeTeam] += homePoints;
    if (teamPoints[awayTeam] !== undefined) teamPoints[awayTeam] += awayPoints;

    performanceDataMap.set(match.Date, { ...teamPoints });
  });

  const performanceData = Array.from(performanceDataMap.entries()).map(([date, points]) => ({
    date,
    ...points
  }));

  return { performanceData, teams };
}

function calculateLinearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n === 0) {
    return { m: 0, c: 0, rSquared: 0 };
  }

  const sumX = data.reduce((acc, point) => acc + point.x, 0);
  const sumY = data.reduce((acc, point) => acc + point.y, 0);
  const sumXY = data.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumX2 = data.reduce((acc, point) => acc + point.x * point.x, 0);
  const sumY2 = data.reduce((acc, point) => acc + point.y * point.y, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const c = (sumY - m * sumX) / n;

  const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const rSquared = r * r;

  return { m, c, rSquared };
}

export async function fetchSeasonAnalysisData(league: string, season: string) {
  const stats = await getSeasonStats(league, season);

  const goalsData = stats.map(team => ({
    name: team.Squad,
    GF: Number(team.GF),
    GA: Number(team.GA),
  }));

  const shotsData = stats.map(team => ({
    name: team.Squad,
    Shots: Number(team.Sh),
    SoT: Number(team.SoT),
  }));

  const goalsRegression = calculateLinearRegression(goalsData.map(d => ({ x: d.GF, y: d.GA })));
  const shotsRegression = calculateLinearRegression(shotsData.map(d => ({ x: d.Shots, y: d.SoT })));

  return {
    goalsData,
    shotsData,
    goalsRegression,
    shotsRegression,
  };
}

export async function fetchAverageGoalsPerSeason(league: string) {
  const matchesPath = path.join(dataDir, league, 'matches.csv');
  const matchesFile = fs.readFileSync(matchesPath, 'utf-8');
  const lines = matchesFile.split('\n');
  const headers = lines[0].split(',');

  const matches = lines.slice(1).map(line => {
    const values = line.split(',');
    const match: Match = {} as Match;
    headers.forEach((header, i) => {
      match[header.trim() as keyof Match] = values[i];
    });
    return match;
  });

  const seasonalGoals: { [season: string]: { totalGoals: number; matchCount: number } } = {};

  matches.forEach(match => {
    if (match.Season && match['Home Goals'] && match['Away Goals']) {
      const season = match.Season;
      const totalGoals = Number(match['Home Goals']) + Number(match['Away Goals']);
      if (!seasonalGoals[season]) {
        seasonalGoals[season] = { totalGoals: 0, matchCount: 0 };
      }
      seasonalGoals[season].totalGoals += totalGoals;
      seasonalGoals[season].matchCount++;
    }
  });

  const avgGoalsPerSeason = Object.entries(seasonalGoals).map(([season, data]) => ({
    season,
    avgGoals: data.totalGoals / data.matchCount,
  }));

  // Sort by season
  avgGoalsPerSeason.sort((a, b) => a.season.localeCompare(b.season));

  return avgGoalsPerSeason;
}