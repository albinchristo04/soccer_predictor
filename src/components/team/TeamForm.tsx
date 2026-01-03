'use client';

import React from 'react';

interface TeamFormProps {
  form: string[];
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function TeamForm({ form, showLabels = false, size = 'md' }: TeamFormProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-9 h-9 text-base',
  };
  
  const getResultColor = (result: string) => {
    switch (result.toUpperCase()) {
      case 'W':
        return 'bg-green-500 text-white';
      case 'D':
        return 'bg-gray-400 text-white';
      case 'L':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result.toUpperCase()) {
      case 'W':
        return 'Win';
      case 'D':
        return 'Draw';
      case 'L':
        return 'Loss';
      default:
        return result;
    }
  };

  const formPoints = form.reduce((acc, r) => {
    if (r.toUpperCase() === 'W') return acc + 3;
    if (r.toUpperCase() === 'D') return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {form.map((result, index) => (
          <div
            key={index}
            className={`
              ${sizeClasses[size]} 
              ${getResultColor(result)}
              rounded-full flex items-center justify-center font-bold
              transition-transform hover:scale-110
            `}
            title={getResultLabel(result)}
          >
            {result.toUpperCase()}
          </div>
        ))}
      </div>
      {showLabels && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formPoints} pts from last {form.length}
        </div>
      )}
    </div>
  );
}

interface TeamFormDetailedProps {
  teamName: string;
  form: string[];
  stats?: {
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
  };
}

export function TeamFormDetailed({ teamName, form, stats }: TeamFormDetailedProps) {
  const formPoints = form.reduce((acc, r) => {
    if (r.toUpperCase() === 'W') return acc + 3;
    if (r.toUpperCase() === 'D') return acc + 1;
    return acc;
  }, 0);

  const wins = stats?.wins ?? form.filter(r => r.toUpperCase() === 'W').length;
  const draws = stats?.draws ?? form.filter(r => r.toUpperCase() === 'D').length;
  const losses = stats?.losses ?? form.filter(r => r.toUpperCase() === 'L').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{teamName}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Last {form.length} matches
        </span>
      </div>
      
      <div className="flex justify-center mb-4">
        <TeamForm form={form} size="lg" />
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formPoints}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{wins}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{draws}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Draws</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{losses}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Losses</div>
        </div>
      </div>
      
      {stats && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Goals</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats.goalsScored} scored, {stats.goalsConceded} conceded
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
