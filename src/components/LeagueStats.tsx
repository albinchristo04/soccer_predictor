'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface LeagueStatsProps {
  league: string
}

export const LeagueStats = ({ league }: LeagueStatsProps) => {
  const { data, error } = useSWR(`/api/analytics/overview/${league}`, fetcher)

  if (error) return <div>Failed to load stats</div>
  if (!data) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Total Matches</p>
        <p className="text-2xl font-bold">{data.total_matches}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Avg Goals / Match</p>
        <p className="text-2xl font-bold">{data.avg_goals_per_match}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Home Win %</p>
        <p className="text-2xl font-bold">{data.home_win_percentage}%</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Draw %</p>
        <p className="text-2xl font-bold">{data.draw_percentage}%</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">Away Win %</p>
        <p className="text-2xl font-bold">{data.away_win_percentage}%</p>
      </div>
    </div>
  )
}
