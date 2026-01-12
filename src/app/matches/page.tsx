'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// League configuration with ESPN IDs
const LEAGUES = [
  { id: 'eng.1', name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'esp.1', name: 'La Liga', country: 'Spain', flag: '🇪🇸' },
  { id: 'ita.1', name: 'Serie A', country: 'Italy', flag: '🇮🇹' },
  { id: 'ger.1', name: 'Bundesliga', country: 'Germany', flag: '🇩🇪' },
  { id: 'fra.1', name: 'Ligue 1', country: 'France', flag: '🇫🇷' },
  { id: 'usa.1', name: 'MLS', country: 'USA', flag: '🇺🇸' },
  { id: 'uefa.champions', name: 'Champions League', country: 'Europe', flag: '🏆' },
  { id: 'uefa.europa', name: 'Europa League', country: 'Europe', flag: '🏆' },
];

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  time: string;
  status: string;
  minute?: number;
  venue?: string;
}

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
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<typeof LEAGUES[0] | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings'>('fixtures');
  const [dateFilter, setDateFilter] = useState<'past' | 'today' | 'upcoming'>('today');

  // Fetch matches when league is selected
  useEffect(() => {
    if (!selectedLeague) return;

    const fetchMatches = async () => {
      setLoadingMatches(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${selectedLeague.id}/scoreboard`);
        if (res.ok) {
          const data = await res.json();
          const matchList: Match[] = (data.events || []).map((event: any) => {
            const competition = event.competitions?.[0];
            const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
            const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
            const statusType = competition?.status?.type?.name || 'STATUS_SCHEDULED';
            
            let status = 'upcoming';
            let minute: number | undefined;
            if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FULL_TIME') {
              status = 'completed';
            } else if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME' || statusType.includes('HALF')) {
              status = 'live';
              minute = competition?.status?.displayClock ? parseInt(competition.status.displayClock) : undefined;
            }

            return {
              id: event.id,
              home_team: homeTeam?.team?.displayName || '',
              away_team: awayTeam?.team?.displayName || '',
              home_score: status !== 'upcoming' ? parseInt(homeTeam?.score || '0') : null,
              away_score: status !== 'upcoming' ? parseInt(awayTeam?.score || '0') : null,
              time: event.date || '',
              status,
              minute,
              venue: competition?.venue?.fullName,
            };
          });
          setMatches(matchList);
        }
      } catch (e) {
        console.error('Error fetching matches:', e);
      } finally {
        setLoadingMatches(false);
      }
    };

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

    fetchMatches();
    fetchStandings();
  }, [selectedLeague]);

  const formatMatchTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return 'TBD';
    }
  };

  const formatMatchDate = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

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
                onClick={() => setSelectedLeague(league)}
                className="group flex items-center gap-4 p-5 rounded-2xl border transition-all text-left fm-card"
              >
                <span className="text-3xl">{league.flag}</span>
                <div>
                  <p className="text-lg font-semibold group-hover:text-indigo-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
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
            onClick={() => setSelectedLeague(null)}
            className="flex items-center gap-2 hover:opacity-80 mb-4 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to leagues
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-4xl">{selectedLeague.flag}</span>
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
          <div>
            {loadingMatches ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}?league=${selectedLeague.id}`}
                    className={`block p-4 rounded-xl border transition-all ${
                      match.status === 'live'
                        ? 'bg-red-950/30 border-red-800/50 hover:border-red-600/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Date/Time */}
                      <div className="w-20 text-center flex-shrink-0">
                        {match.status === 'live' ? (
                          <div className="flex flex-col items-center">
                            <span className="text-red-400 font-bold text-sm animate-pulse">LIVE</span>
                            {match.minute && (
                              <span className="text-red-400 text-xs">{match.minute}&apos;</span>
                            )}
                          </div>
                        ) : match.status === 'completed' ? (
                          <span className="text-slate-500 text-sm">FT</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs">{formatMatchDate(match.time)}</span>
                            <span className="text-indigo-400 font-medium text-sm">{formatMatchTime(match.time)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Teams & Score */}
                      <div className="flex-1 flex items-center justify-center gap-4">
                        <span className="flex-1 text-right text-white font-medium">{match.home_team}</span>
                        <div className="w-16 text-center">
                          {match.status === 'upcoming' ? (
                            <span className="text-slate-500">vs</span>
                          ) : (
                            <span className={`font-bold text-lg ${match.status === 'live' ? 'text-white' : 'text-slate-300'}`}>
                              {match.home_score} - {match.away_score}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 text-left text-white font-medium">{match.away_team}</span>
                      </div>
                      
                      {/* Arrow */}
                      <div className="w-8 text-right">
                        <svg className="w-5 h-5 text-slate-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {match.venue && (
                      <p className="text-center text-slate-500 text-xs mt-2">{match.venue}</p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl mb-4 block">📅</span>
                <p>No fixtures available for this league</p>
              </div>
            )}
          </div>
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
