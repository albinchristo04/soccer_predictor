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
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">League Overview</h2>
        <div className="w-24 h-1 bg-green-500 mx-auto mt-2"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-3">{stat.icon}</div>
            <div className="text-lg font-semibold text-gray-300">{stat.label}</div>
            <div className="text-3xl font-bold text-blue-400 mt-1">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
