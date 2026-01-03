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

  if (data?.leagues) {
    for (const league of data.leagues) {
      matchesByLeague.set(league.name, league.matches);
      
      for (const match of league.matches) {
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
