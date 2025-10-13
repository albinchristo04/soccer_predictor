'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface GoalsDistributionChartProps {
  league: string
}

export const GoalsDistributionChart = ({ league }: GoalsDistributionChartProps) => {
  const { data, error } = useSWR(`/api/analytics/goals_distribution/${league}`, fetcher)

  if (error) return <div>Failed to load chart</div>
  if (!data) return <div>Loading...</div>

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" label={{ value: "Total Goals Scored", position: "insideBottom", offset: 0, dy: 10 }} />
        <YAxis label={{ value: "Number of Matches", angle: -90, position: "insideLeft" }} />
        <Tooltip />
        <Bar dataKey="value" name="Number of Matches" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  )
}
