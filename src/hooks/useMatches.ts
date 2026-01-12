'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { matchesApi, Match } from '@/lib/api';

interface UseLiveMatchesOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseLiveMatchesResult {
  matches: Match[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useLiveMatches(options: UseLiveMatchesOptions = {}): UseLiveMatchesResult {
  const { pollingInterval = 30000, enabled = true } = options;
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLiveMatches = useCallback(async () => {
    try {
      const data = await matchesApi.getLive();
      setMatches(data.matches);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch live matches'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchLiveMatches();

    if (pollingInterval > 0) {
      intervalRef.current = setInterval(fetchLiveMatches, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollingInterval, fetchLiveMatches]);

  return {
    matches,
    isLoading,
    error,
    refetch: fetchLiveMatches,
    lastUpdated,
  };
}

interface UseMatchOptions {
  matchId: number;
  refetchInterval?: number;
}

export function useMatch({ matchId, refetchInterval = 0 }: UseMatchOptions) {
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;
    
    try {
      const data = await matchesApi.getDetails(matchId);
      setMatch(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch match'));
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();

    if (refetchInterval > 0) {
      const interval = setInterval(fetchMatch, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMatch, refetchInterval]);

  return { match, isLoading, error, refetch: fetchMatch };
}

interface UseTodayMatchesResult {
  matchesByLeague: Map<string, Match[]>;
  allMatches: Match[];
  liveCount: number;
  upcomingCount: number;
  finishedCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTodayMatches(): UseTodayMatchesResult {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await matchesApi.getToday();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch matches'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const matchesByLeague = new Map<string, Match[]>();
  const allMatches: Match[] = [];
  let liveCount = 0;
  let upcomingCount = 0;
  let finishedCount = 0;

  // Handle both new API format (with live/upcoming/completed arrays) and old format
  if (data?.leagues && Array.isArray(data.leagues)) {
    for (const league of data.leagues) {
      // Transform matches to expected format
      const transformedMatches = (league.matches || []).map((m: any) => ({
        id: m.match_id || m.id,
        status: {
          started: m.status === 'live' || m.status === 'completed',
          finished: m.status === 'completed',
          liveTime: m.status === 'live' ? { short: 'LIVE' } : undefined,
        },
        home: { name: m.home_team || m.home?.name, id: 0 },
        away: { name: m.away_team || m.away?.name, id: 0 },
        result: m.home_score !== null ? { home: m.home_score, away: m.away_score } : undefined,
        time: m.time,
      }));
      
      matchesByLeague.set(league.name, transformedMatches);
      
      for (const match of transformedMatches) {
        allMatches.push(match);
        
        if (match.status?.started && !match.status?.finished) {
          liveCount++;
        } else if (match.status?.finished) {
          finishedCount++;
        } else {
          upcomingCount++;
        }
      }
    }
  } else if (data?.live || data?.upcoming || data?.completed) {
    // Handle flat arrays format
    const transformMatch = (m: any, status: string) => ({
      id: m.match_id || m.id,
      status: {
        started: status === 'live' || status === 'completed',
        finished: status === 'completed',
        liveTime: status === 'live' ? { short: 'LIVE' } : undefined,
      },
      home: { name: m.home_team || m.home?.name, id: 0 },
      away: { name: m.away_team || m.away?.name, id: 0 },
      result: m.home_score !== null ? { home: m.home_score, away: m.away_score } : undefined,
      time: m.time,
      league: m.league,
    });
    
    const liveMatches = (data.live || []).map((m: any) => transformMatch(m, 'live'));
    const upcomingMatches = (data.upcoming || []).map((m: any) => transformMatch(m, 'upcoming'));
    const completedMatches = (data.completed || []).map((m: any) => transformMatch(m, 'completed'));
    
    allMatches.push(...liveMatches, ...upcomingMatches, ...completedMatches);
    liveCount = liveMatches.length;
    upcomingCount = upcomingMatches.length;
    finishedCount = completedMatches.length;
    
    // Group by league
    for (const match of allMatches) {
      const leagueName = (match as any).league || 'Other';
      const existing = matchesByLeague.get(leagueName) || [];
      existing.push(match);
      matchesByLeague.set(leagueName, existing);
    }
  }

  return {
    matchesByLeague,
    allMatches,
    liveCount,
    upcomingCount,
    finishedCount,
    isLoading,
    error,
    refetch: fetchMatches,
  };
}
