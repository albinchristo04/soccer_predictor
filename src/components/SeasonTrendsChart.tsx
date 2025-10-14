'use client'

import useSWR from 'swr'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface SeasonTrendsChartProps {
  league: string
}

export const SeasonTrendsChart = ({ league }: SeasonTrendsChartProps) => {
  const { data, error } = useSWR(`/api/analytics/season_trends/${league}`, fetcher)

  if (error) return <div>Failed to load chart</div>
  if (!data) return <div>Loading...</div>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="season" label={{ value: "Season", position: "insideBottom", offset: 0, dy: 10, style: { textAnchor: 'middle' } }} />
        <YAxis label={{ value: "Average Goals per Match", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: 'middle' } }} />
        <Tooltip />
        <Line type="monotone" dataKey="total_goals" name="Avg Goals / Match" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
