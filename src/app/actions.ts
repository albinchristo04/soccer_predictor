'use server';

import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.join(process.cwd(), 'fbref_data');

const leagueToFileMap: { [key: string]: string } = {
  "uefa champions league": "ucl",
  "uefa europa league": "uel",
  "fifa world cup": "world_cup",
};

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
  relegated?: boolean;
}

export async function fetchAllSeasons(league: string) {
  const lowerCaseLeague = league.toLowerCase();
  const fileName = leagueToFileMap[lowerCaseLeague] || lowerCaseLeague.replace(/ /g, '_');
  const seasonsPath = path.join(dataDir, `${fileName}.csv`);
  const seasonsFile = fs.readFileSync(seasonsPath, 'utf-8');
  const lines = seasonsFile.split('\n').slice(1);
  const seasons = new Set<string>();
  lines.forEach(line => {
    const columns = line.split(',');
    if (columns[3]) {
      const seasonString = columns[3].match(/(\d{4}-\d{4}|\d{4})/);
      if (seasonString) {
        seasons.add(seasonString[0]);
      }
    }
  });
  return Array.from(seasons).sort().reverse();
}

export async function getTeams(league: string) {
  const teamsPath = path.join(dataDir, league, 'teams.csv');
  const teamsFile = fs.readFileSync(teamsPath, 'utf-8');
  const teams = teamsFile.split('\n').slice(1).map(line => line.split(',')[1]);
  return teams.filter(Boolean);
}



export async function getSeasonStats(league: string, season: string): Promise<SeasonStats[]> {
  const lowerCaseLeague = league.toLowerCase();
  const fileName = leagueToFileMap[lowerCaseLeague] || lowerCaseLeague.replace(/ /g, '_');
  const seasonStatsPath = path.join(dataDir, `${fileName}.csv`);
  const seasonStatsFile = fs.readFileSync(seasonStatsPath, 'utf-8');
  const lines = seasonStatsFile.split('\n');

  const stats: SeasonStats[] = [];
  lines.forEach(line => {
    const columns = line.split(',');
    // Ensure basic columns exist for a potential team stat row
    if (columns[3] && columns[10] && columns[12] && columns[18]) {
      const rank = parseInt(columns[0]);
      const seasonInColumn = columns[3].match(/(\d{4}-\d{4}|\d{4})/);

      // Further filter for valid team rows and the correct season
      if (!isNaN(rank) && rank > 0 && !columns[10].includes('•') && seasonInColumn && seasonInColumn[0] === season) {
        stats.push({
          Season: season,
          Squad: columns[10],
          W: columns[12],
          D: columns[13],
          L: columns[14],
          GF: columns[15],
          GA: columns[16],
          GD: parseInt(columns[15]) - parseInt(columns[16]),
          Pts: columns[18],
          Sh: '0',
          SoT: '0',
          FK: '0',
          PK: '0',
          Cmp: '0',
          Att: '0',
          'Cmp%': '0',
          CK: '0',
          CrdY: '0',
          CrdR: '0',
          Fls: '0',
          PKcon: '0',
          OG: '0',
          relegated: columns[26] ? columns[26].includes('Relegated') : false,
        });
      }
    }
  });

  return stats;
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