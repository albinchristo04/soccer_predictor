'use client';

import React, { useState } from 'react';
import { useTodayMatches, useLiveMatches } from '@/hooks/useMatches';
import MatchCard from '@/components/match/MatchCard';
import LiveScoreTicker from '@/components/match/LiveScoreTicker';
import { useRouter } from 'next/navigation';

type TabType = 'all' | 'live' | 'upcoming' | 'finished';

export default function MatchesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const { 
    matchesByLeague, 
    allMatches, 
    liveCount, 
    upcomingCount, 
    finishedCount, 
    isLoading, 
    error 
  } = useTodayMatches();
  
  const { matches: liveMatches } = useLiveMatches({ pollingInterval: 30000 });

  const filterMatches = (matches: any[]) => {
    switch (activeTab) {
      case 'live':
        return matches.filter(m => m.status?.started && !m.status?.finished);
      case 'upcoming':
        return matches.filter(m => !m.status?.started);
      case 'finished':
        return matches.filter(m => m.status?.finished);
      default:
        return matches;
    }
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allMatches.length },
    { id: 'live', label: 'Live', count: liveCount },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'finished', label: 'Finished', count: finishedCount },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            Failed to load matches: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Live Score Ticker */}
      {liveMatches.length > 0 && <LiveScoreTicker matches={liveMatches} />}
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Today's Matches
          </h1>
          
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-colors
                  ${activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(matchesByLeague.entries()).map(([leagueName, matches]) => {
              const filteredMatches = filterMatches(matches);
              
              if (filteredMatches.length === 0) return null;
              
              return (
                <div key={leagueName}>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {leagueName}
                  </h2>
                  <div className="space-y-3">
                    {filteredMatches.map((match: any) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        showLeague={false}
                        onClick={() => router.push(`/matches/${match.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {allMatches.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No matches scheduled for today
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
