'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface LeagueStatsProps {
  league: string
}

export const LeagueStats = ({ league }: LeagueStatsProps) => {
  const { data, error } = useSWR(`/api/analytics/overview/${league}`, fetcher)

  if (error) return <div className="text-red-500 dark:text-red-400 text-center text-lg font-semibold">Failed to load stats. Please check that the backend server is running.</div>
  if (!data) return <div className="text-tertiary text-center text-lg">Loading...</div>

  const stats = [
    { label: "Total Matches", value: data.total_matches, icon: '🏟️' },
    { label: "Avg Goals / Match", value: data.avg_goals_per_match, icon: '⚽' },
    { label: "Home Win %", value: `${data.home_win_percentage}%`, icon: '🏠' },
    { label: "Draw %", value: `${data.draw_percentage}%`, icon: '🤝' },
    { label: "Away Win %", value: `${data.away_win_percentage}%`, icon: '✈️' },
  ];

  return (
    <div className="w-full">
      {/* Prominent border around entire league stats section */}
      <div className="border-4 border-brand-500 rounded-2xl p-8 glass-effect shadow-card-lg">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
            <span className="text-5xl">⚽</span>
            League Overview
            <span className="text-5xl">⚽</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-brand-400 to-brand-600 mx-auto mt-3 rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="card-professional p-6 rounded-xl flex flex-col items-center justify-center text-center"
            >
              <div className="text-5xl mb-3">{stat.icon}</div>
              <div className="text-sm font-semibold text-secondary uppercase tracking-wide">{stat.label}</div>
              <div className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
