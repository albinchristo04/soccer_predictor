'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface LeagueStatsProps {
  league: string
}

export const LeagueStats = ({ league }: LeagueStatsProps) => {
  const { data, error } = useSWR(`/api/analytics/overview/${league}`, fetcher)

  if (error) return <div className="text-red-500 text-center">Failed to load stats</div>
  if (!data) return <div className="text-gray-400 text-center">Loading...</div>

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
      <div className="border-4 border-green-500 rounded-2xl p-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-900/50 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
            <span className="text-5xl">⚽</span>
            League Overview
            <span className="text-5xl">⚽</span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-green-400 to-blue-500 mx-auto mt-3"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl shadow-lg border-2 border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-center hover:shadow-xl transition-shadow duration-300 hover:scale-105 transform"
            >
              <div className="text-5xl mb-3">{stat.icon}</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{stat.label}</div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400 mt-2">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
