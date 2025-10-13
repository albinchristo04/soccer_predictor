'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface FeatureImportanceChartProps {
  league: string
}

export const FeatureImportanceChart = ({ league }: FeatureImportanceChartProps) => {
  const { data, error } = useSWR(`/api/analytics/feature_importance/${league}`, fetcher)

  if (error) return <div>Failed to load chart</div>
  if (!data) return <div>Loading...</div>

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="feature" width={150} />
        <Tooltip />
        <Bar dataKey="importance" name="Importance" fill="#d88488" />
      </BarChart>
    </ResponsiveContainer>
  )
}
