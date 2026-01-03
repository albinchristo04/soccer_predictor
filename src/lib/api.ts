/**
 * API client for Soccer Predictor backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE}/api/v1`;

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiRequest<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_V1}${endpoint}`;
  
  const response = await fetchWithTimeout(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }
  
  return response.json();
}

// ==================== MATCHES API ====================

export interface Match {
  id: number;
  status: {
    started?: boolean;
    finished?: boolean;
    liveTime?: { short?: string };
  };
  home: { name: string; shortName?: string; id: number };
  away: { name: string; shortName?: string; id: number };
  result?: { home: number; away: number };
  time?: string;
}

export interface MatchesResponse {
  leagues: Array<{
    id: number;
    name: string;
    ccode?: string;
    matches: Match[];
  }>;
}

export const matchesApi = {
  getToday: () => apiRequest<MatchesResponse>('/matches/today'),
  getByDate: (date: string) => apiRequest<MatchesResponse>(`/matches/date/${date}`),
  getLive: () => apiRequest<{ count: number; matches: Match[] }>('/matches/live'),
  getUpcoming: (days = 7) => apiRequest<any>(`/matches/upcoming?days=${days}`),
  getDetails: (matchId: number) => apiRequest<any>(`/matches/${matchId}`),
  getEvents: (matchId: number) => apiRequest<any>(`/matches/${matchId}/events`),
  getLineups: (matchId: number) => apiRequest<any>(`/matches/${matchId}/lineups`),
  getStats: (matchId: number) => apiRequest<any>(`/matches/${matchId}/stats`),
  getH2H: (matchId: number) => apiRequest<any>(`/matches/${matchId}/h2h`),
};

// ==================== PREDICTIONS API ====================

export interface Prediction {
  match_id: number;
  home_team: string;
  away_team: string;
  league: string;
  kickoff_time: string;
  outcome: {
    home_win: number;
    draw: number;
    away_win: number;
    confidence: number;
  };
  goals: {
    home_expected_goals: number;
    away_expected_goals: number;
    total_expected_goals: number;
    over_1_5: number;
    over_2_5: number;
    over_3_5: number;
    btts_yes: number;
  };
  most_likely_score: {
    score: string;
    probability: number;
  };
  alternative_scores: Array<{ score: string; probability: number }>;
  factors: {
    home_elo: number;
    away_elo: number;
    elo_difference: number;
    home_form_score: number;
    away_form_score: number;
  };
  confidence: {
    data_quality: number;
    model_certainty: number;
    overall: number;
  };
  model_version: string;
}

export const predictionsApi = {
  getForMatch: (matchId: number) => apiRequest<Prediction>(`/predictions/match/${matchId}`),
  getToday: () => apiRequest<{ predictions: Prediction[] }>('/predictions/today'),
  getBatch: (matchIds: number[]) => 
    apiRequest<{ predictions: Prediction[]; errors: any[] }>('/predictions/batch', {
      method: 'POST',
      body: JSON.stringify({ match_ids: matchIds }),
    }),
  getQuick: (homeTeam: string, awayTeam: string) => 
    apiRequest<any>(`/predictions/quick/${encodeURIComponent(homeTeam)}/${encodeURIComponent(awayTeam)}`),
};

// ==================== TEAMS API ====================

export interface Team {
  id: number;
  name: string;
  shortName?: string;
}

export const teamsApi = {
  search: (query: string) => apiRequest<{ results: Team[] }>(`/teams/search?q=${encodeURIComponent(query)}`),
  get: (teamId: number) => apiRequest<any>(`/teams/${teamId}`),
  getFixtures: (teamId: number) => apiRequest<any>(`/teams/${teamId}/fixtures`),
  getSquad: (teamId: number) => apiRequest<any>(`/teams/${teamId}/squad`),
  getForm: (teamId: number, matches = 5) => 
    apiRequest<{ form: string[]; points: number }>(`/teams/${teamId}/form?matches=${matches}`),
  getInjuries: (teamId: number) => apiRequest<{ injuries: any[] }>(`/teams/${teamId}/injuries`),
  getRatings: (teamName: string) => apiRequest<any>(`/teams/ratings/${encodeURIComponent(teamName)}`),
  getRankings: (top = 50) => apiRequest<{ rankings: any[] }>(`/teams/ratings/rankings?top=${top}`),
};

// ==================== LEAGUES API ====================

export interface League {
  id: number;
  name: string;
  key: string;
}

export const leaguesApi = {
  list: () => apiRequest<{ leagues: League[] }>('/leagues/'),
  get: (leagueId: number) => apiRequest<any>(`/leagues/${leagueId}`),
  getByName: (name: string) => apiRequest<any>(`/leagues/by-name/${encodeURIComponent(name)}`),
  getStandings: (leagueId: number) => apiRequest<any>(`/leagues/${leagueId}/standings`),
  getMatches: (leagueId: number) => apiRequest<any>(`/leagues/${leagueId}/matches`),
  getTopScorers: (leagueId: number) => apiRequest<any>(`/leagues/${leagueId}/top-scorers`),
};

// ==================== UTILITY FUNCTIONS ====================

export function formatKickoffTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatMatchDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function getDateString(offset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0].replace(/-/g, '');
}
