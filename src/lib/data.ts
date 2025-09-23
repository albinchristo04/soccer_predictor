import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

export function getSeasons() {
  const seasonsPath = path.join(dataDir, 'seasons.csv');
  const seasonsFile = fs.readFileSync(seasonsPath, 'utf-8');
  const seasons = seasonsFile.split('\n').slice(1).map(line => line.split(',')[1]);
  return seasons.filter(Boolean);
}

export function getTeams() {
  const teamsPath = path.join(dataDir, 'teams.csv');
  const teamsFile = fs.readFileSync(teamsPath, 'utf-8');
  const teams = teamsFile.split('\n').slice(1).map(line => line.split(',')[1]);
  return teams.filter(Boolean);
}

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

export function getMatches(season: string): Match[] {
  const matchesPath = path.join(dataDir, 'matches.csv');
  const matchesFile = fs.readFileSync(matchesPath, 'utf-8');
  const lines = matchesFile.split('\n');
  const headers = lines[0].split(',');

  const matches = lines.slice(1).map(line => {
    const values = line.split(',');
    const match: any = {};
    headers.forEach((header, i) => {
      match[header.trim()] = values[i];
    });
    return match;
  });

  return matches.filter(match => match.Season === season);
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

export function getSeasonStats(season: string): SeasonStats[] {
  const seasonStatsPath = path.join(dataDir, 'seasonstats.csv');
  const seasonStatsFile = fs.readFileSync(seasonStatsPath, 'utf-8');
  const lines = seasonStatsFile.split('\n');
  const headers = lines[0].split(',');

  const stats = lines.slice(1).map(line => {
    const values = line.split(',');
    const seasonStat: any = {};
    headers.forEach((header, i) => {
      seasonStat[header.trim()] = values[i];
    });
    return seasonStat;
  });

  return stats.filter(stat => stat.Season === season);
}

export function getRankedSeasonStats(season: string): SeasonStats[] {
  const seasonStats = getSeasonStats(season);

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
