'use client';

import React, { use } from 'react';
import { useMatch } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePredictions';
import TeamForm from '@/components/team/TeamForm';
import PredictionCard from '@/components/prediction/PredictionCard';
import { useRouter } from 'next/navigation';

interface MatchDetailsPageProps {
  params: Promise<{ matchId: string }>;
}

export default function MatchDetailsPage({ params }: MatchDetailsPageProps) {
  const resolvedParams = use(params);
  const matchId = parseInt(resolvedParams.matchId, 10);
  const router = useRouter();
  
  const { match, isLoading: matchLoading, error: matchError } = useMatch({ 
    matchId, 
    refetchInterval: 30000 // Refresh every 30s for live matches
  });
  
  const { prediction, isLoading: predLoading } = usePrediction({ matchId });

  if (matchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="text-emerald-500 hover:text-emerald-600 mb-4"
          >
            ← Back
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            Failed to load match: {matchError.message}
          </div>
        </div>
      </div>
    );
  }

  if (matchLoading || !match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const general = match.general || {};
  const content = match.content || {};
  const homeTeam = general.homeTeam || {};
  const awayTeam = general.awayTeam || {};
  const isLive = general.started && !general.finished;
  const isFinished = general.finished;

  // Parse stats if available
  const stats = content.stats?.Ede || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button 
            onClick={() => router.back()}
            className="text-white/80 hover:text-white mb-4 text-sm"
          >
            ← Back to matches
          </button>
          
          <div className="text-center text-white/80 text-sm mb-4">
            {general.leagueName}
          </div>
          
          {/* Teams and Score */}
          <div className="flex items-center justify-center gap-8">
            {/* Home Team */}
            <div className="text-center flex-1">
              <div className="text-xl md:text-2xl font-bold">{homeTeam.name}</div>
            </div>
            
            {/* Score */}
            <div className="text-center">
              {isLive || isFinished ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl md:text-5xl font-bold">
                    {general.homeTeam?.score ?? 0}
                  </span>
                  <span className="text-2xl text-white/60">-</span>
                  <span className="text-4xl md:text-5xl font-bold">
                    {general.awayTeam?.score ?? 0}
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-medium text-white/80">
                  {general.matchTimeUTC 
                    ? new Date(general.matchTimeUTC).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })
                    : 'TBD'
                  }
                </div>
              )}
              
              {isLive && (
                <div className="mt-2 px-3 py-1 bg-red-500 rounded-full text-sm font-medium animate-pulse">
                  LIVE • {general.liveTime?.short || ''}
                </div>
              )}
              
              {isFinished && (
                <div className="mt-2 text-white/60 text-sm">Full Time</div>
              )}
            </div>
            
            {/* Away Team */}
            <div className="text-center flex-1">
              <div className="text-xl md:text-2xl font-bold">{awayTeam.name}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Prediction Card */}
        {prediction && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Prediction
            </h2>
            <PredictionCard prediction={prediction} />
          </div>
        )}
        
        {predLoading && !prediction && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Generating prediction...</p>
          </div>
        )}
        
        {/* Match Stats */}
        {stats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Stats
            </h2>
            <div className="space-y-4">
              {stats.map((stat: any, index: number) => (
                <StatRow
                  key={index}
                  label={stat.title}
                  homeValue={stat.stats?.[0]?.value}
                  awayValue={stat.stats?.[1]?.value}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Lineups */}
        {content.lineup && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lineups
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <LineupSection 
                team={homeTeam.name} 
                lineup={content.lineup.lineup?.[0]} 
              />
              <LineupSection 
                team={awayTeam.name} 
                lineup={content.lineup.lineup?.[1]} 
              />
            </div>
          </div>
        )}
        
        {/* Match Events */}
        {content.matchFacts?.events?.events && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Match Events
            </h2>
            <div className="space-y-3">
              {content.matchFacts.events.events.map((event: any, index: number) => (
                <EventRow key={index} event={event} homeTeamId={homeTeam.id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, homeValue, awayValue }: { label: string; homeValue: any; awayValue: any }) {
  const homeNum = parseFloat(String(homeValue).replace('%', '')) || 0;
  const awayNum = parseFloat(String(awayValue).replace('%', '')) || 0;
  const total = homeNum + awayNum || 1;
  const homePercent = (homeNum / total) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-900 dark:text-white">{homeValue}</span>
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{awayValue}</span>
      </div>
      <div className="flex h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="bg-emerald-500 transition-all"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-blue-500 flex-1"
        />
      </div>
    </div>
  );
}

function LineupSection({ team, lineup }: { team: string; lineup: any }) {
  if (!lineup) return null;

  return (
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">{team}</h3>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Formation: {lineup.formation}
      </div>
      <div className="space-y-1">
        {lineup.players?.flat().map((player: any, index: number) => (
          <div 
            key={index}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-6 text-gray-400">{player.shirt}</span>
            <span className="text-gray-900 dark:text-white">{player.name}</span>
            {player.rating && (
              <span className="ml-auto px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                {player.rating}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventRow({ event, homeTeamId }: { event: any; homeTeamId: number }) {
  const isHome = event.teamId === homeTeamId;
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Goal':
        return '⚽';
      case 'YellowCard':
        return '🟨';
      case 'RedCard':
        return '🟥';
      case 'Substitution':
        return '🔄';
      default:
        return '•';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${isHome ? '' : 'flex-row-reverse'}`}>
      <span className="text-sm text-gray-500">{event.time?.main}'</span>
      <span>{getEventIcon(event.type)}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {event.player?.name || event.nameStr}
      </span>
    </div>
  );
}
