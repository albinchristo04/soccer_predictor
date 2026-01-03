'use client';

import { useState, useEffect, useCallback } from 'react';
import { predictionsApi, Prediction } from '@/lib/api';

interface UsePredictionOptions {
  matchId: number;
}

interface UsePredictionResult {
  prediction: Prediction | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePrediction({ matchId }: UsePredictionOptions): UsePredictionResult {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!matchId) return;
    
    setIsLoading(true);
    try {
      const data = await predictionsApi.getForMatch(matchId);
      setPrediction(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch prediction'));
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return { prediction, isLoading, error, refetch: fetchPrediction };
}

interface UseTodayPredictionsResult {
  predictions: Prediction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTodayPredictions(): UseTodayPredictionsResult {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      const data = await predictionsApi.getToday();
      setPredictions(data.predictions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch predictions'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return { predictions, isLoading, error, refetch: fetchPredictions };
}

interface UseQuickPredictionOptions {
  homeTeam: string;
  awayTeam: string;
  enabled?: boolean;
}

export function useQuickPrediction({ homeTeam, awayTeam, enabled = true }: UseQuickPredictionOptions) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!homeTeam || !awayTeam || !enabled) return;
    
    setIsLoading(true);
    try {
      const result = await predictionsApi.getQuick(homeTeam, awayTeam);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch prediction'));
    } finally {
      setIsLoading(false);
    }
  }, [homeTeam, awayTeam, enabled]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return { data, isLoading, error, refetch: fetchPrediction };
}
