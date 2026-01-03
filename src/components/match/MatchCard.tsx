'use client';

import React from 'react';

interface MatchCardProps {
  match: {
    id: number;
    status: {
      started?: boolean;
      finished?: boolean;
      liveTime?: { short?: string };
      scoreStr?: string;
    };
    home: {
      name: string;
      shortName?: string;
      id: number;
    };
    away: {
      name: string;
      shortName?: string;
      id: number;
    };
    result?: {
      home: number;
      away: number;
    };
    time?: string;
  };
  league?: {
    id: number;
    name: string;
    country?: string;
  };
  showLeague?: boolean;
  onClick?: () => void;
}

export default function MatchCard({ match, league, showLeague = true, onClick }: MatchCardProps) {
  const isLive = match.status?.started && !match.status?.finished;
  const isFinished = match.status?.finished;
  const isUpcoming = !match.status?.started;

  const homeScore = match.result?.home ?? '-';
  const awayScore = match.result?.away ?? '-';
  
  const liveMinute = match.status?.liveTime?.short || '';

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md 
        transition-all duration-200 cursor-pointer overflow-hidden
        border border-gray-100 dark:border-gray-700
        ${isLive ? 'ring-2 ring-green-500' : ''}
      `}
      onClick={onClick}
    >
      {/* League Header */}
      {showLeague && league && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {league.name}
          </span>
        </div>
      )}
      
      {/* Match Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-right pr-4">
            <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
              {match.home.shortName || match.home.name}
            </span>
          </div>
          
          {/* Score / Time */}
          <div className="flex flex-col items-center min-w-[80px]">
            {isUpcoming ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {match.time || 'TBD'}
              </span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${isLive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {homeScore}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className={`text-xl font-bold ${isLive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {awayScore}
                  </span>
                </div>
                {isLive && (
                  <span className="text-xs text-green-500 font-semibold animate-pulse mt-1">
                    {liveMinute}
                  </span>
                )}
                {isFinished && (
                  <span className="text-xs text-gray-400 mt-1">FT</span>
                )}
              </>
            )}
          </div>
          
          {/* Away Team */}
          <div className="flex-1 text-left pl-4">
            <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
              {match.away.shortName || match.away.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
