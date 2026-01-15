'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MatchCalendar from '@/components/match/MatchCalendar';
import { leagueFlagUrls } from '@/data/leagues';

// League configuration with ESPN IDs and flag codes
const LEAGUES = [
  { id: 'eng.1', name: 'Premier League', country: 'England', flagCode: 'ENG' },
  { id: 'esp.1', name: 'La Liga', country: 'Spain', flagCode: 'ES' },
  { id: 'ita.1', name: 'Serie A', country: 'Italy', flagCode: 'IT' },
  { id: 'ger.1', name: 'Bundesliga', country: 'Germany', flagCode: 'DE' },
  { id: 'fra.1', name: 'Ligue 1', country: 'France', flagCode: 'FR' },
  { id: 'usa.1', name: 'MLS', country: 'USA', flagCode: 'US' },
  { id: 'uefa.champions', name: 'Champions League', country: 'Europe', flagCode: 'EU' },
  { id: 'uefa.europa', name: 'Europa League', country: 'Europe', flagCode: 'EU' },
];

interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leagueParam = searchParams.get('league');
  
  // Initialize selected league from URL if available
  const initialLeague = leagueParam ? LEAGUES.find(l => l.id === leagueParam) : null;
  const [selectedLeague, setSelectedLeague] = useState<typeof LEAGUES[0] | null>(initialLeague);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings'>('fixtures');

  // Update URL when league changes
  const handleSelectLeague = (league: typeof LEAGUES[0]) => {
    setSelectedLeague(league);
    router.push(`/matches?league=${league.id}`);
  };

  const handleBackToLeagues = () => {
    setSelectedLeague(null);
    router.push('/matches');
  };

  // Fetch standings when league is selected
  useEffect(() => {
    if (!selectedLeague) return;

    const fetchStandings = async () => {
      setLoadingStandings(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${selectedLeague.id}/standings`);
        if (res.ok) {
          const data = await res.json();
          const entries = data.children?.[0]?.standings?.entries || [];
          const standingsList: Standing[] = entries.map((entry: any) => ({
            position: entry.stats?.find((s: any) => s.name === 'rank')?.value || 0,
            team: entry.team?.displayName || '',
            played: entry.stats?.find((s: any) => s.name === 'gamesPlayed')?.value || 0,
            won: entry.stats?.find((s: any) => s.name === 'wins')?.value || 0,
            drawn: entry.stats?.find((s: any) => s.name === 'ties')?.value || 0,
            lost: entry.stats?.find((s: any) => s.name === 'losses')?.value || 0,
            goalsFor: entry.stats?.find((s: any) => s.name === 'pointsFor')?.value || 0,
            goalsAgainst: entry.stats?.find((s: any) => s.name === 'pointsAgainst')?.value || 0,
            goalDifference: entry.stats?.find((s: any) => s.name === 'pointDifferential')?.value || 0,
            points: entry.stats?.find((s: any) => s.name === 'points')?.value || 0,
          }));
          standingsList.sort((a, b) => a.position - b.position);
          setStandings(standingsList);
        }
      } catch (e) {
        console.error('Error fetching standings:', e);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandings();
  }, [selectedLeague]);

  // League selection view
  if (!selectedLeague) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Matches</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Select a league to view fixtures, results, and standings</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEAGUES.map((league) => (
              <button
                key={league.id}
                onClick={() => handleSelectLeague(league)}
                className="group flex items-center gap-4 p-5 rounded-2xl border transition-all text-left fm-card hover:scale-[1.02] hover:shadow-lg"
              >
                {leagueFlagUrls[league.flagCode] ? (
                  <img 
                    src={leagueFlagUrls[league.flagCode]} 
                    alt={league.country}
                    className="w-8 h-auto rounded shadow-sm"
                  />
                ) : (
                  <span className="text-3xl">🏆</span>
                )}
                <div>
                  <p className="text-lg font-semibold group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {league.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{league.country}</p>
                </div>
                <svg className="w-5 h-5 ml-auto group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // League detail view
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={handleBackToLeagues}
            className="flex items-center gap-2 hover:opacity-80 mb-4 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to leagues
          </button>
          
          <div className="flex items-center gap-4">
            {leagueFlagUrls[selectedLeague.flagCode] ? (
              <img 
                src={leagueFlagUrls[selectedLeague.flagCode]} 
                alt={selectedLeague.country}
                className="w-10 h-auto rounded shadow-sm"
              />
            ) : (
              <span className="text-4xl">🏆</span>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedLeague.name}</h1>
              <p style={{ color: 'var(--text-secondary)' }}>{selectedLeague.country}</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'fixtures'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-opacity-50'
              }`}
              style={activeTab !== 'fixtures' ? { color: 'var(--text-secondary)' } : {}}
            >
              Fixtures & Results
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'standings'
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-opacity-50'
              }`}
              style={activeTab !== 'standings' ? { color: 'var(--text-secondary)' } : {}}
            >
              Standings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'fixtures' ? (
          <MatchCalendar leagueId={selectedLeague.id} leagueName={selectedLeague.name} />
        ) : (
          <div>
            {loadingStandings ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
              </div>
            ) : standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-slate-400 text-sm border-b border-slate-700">
                      <th className="text-left py-3 px-2">#</th>
                      <th className="text-left py-3 px-2">Team</th>
                      <th className="text-center py-3 px-2">P</th>
                      <th className="text-center py-3 px-2">W</th>
                      <th className="text-center py-3 px-2">D</th>
                      <th className="text-center py-3 px-2">L</th>
                      <th className="text-center py-3 px-2">GF</th>
                      <th className="text-center py-3 px-2">GA</th>
                      <th className="text-center py-3 px-2">GD</th>
                      <th className="text-center py-3 px-2 font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, idx) => (
                      <tr
                        key={team.team}
                        className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                          idx < 4 ? 'border-l-2 border-l-green-500' : idx >= standings.length - 3 ? 'border-l-2 border-l-red-500' : ''
                        }`}
                      >
                        <td className="py-3 px-2 text-slate-400">{team.position}</td>
                        <td className="py-3 px-2 text-white font-medium">{team.team}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.played}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.won}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.drawn}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.lost}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.goalsFor}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.goalsAgainst}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.goalDifference > 0 ? '+' : ''}{team.goalDifference}</td>
                        <td className="py-3 px-2 text-center text-white font-bold">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-4 flex gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Champions League</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span>Relegation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">📊</span>
                <p>No standings available for this league</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
