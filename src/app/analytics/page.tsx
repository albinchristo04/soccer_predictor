'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const leagueCompetitiveness = [
  { league: 'Premier League', competitiveness: 0.85 },
  { league: 'LaLiga', competitiveness: 0.82 },
  { league: 'Bundesliga', competitiveness: 0.78 },
  { league: 'Serie A', competitiveness: 0.80 }
]

const homeAdvantage = [
  { league: 'Premier League', homeWins: 0.45, draws: 0.25, awayWins: 0.30 },
  { league: 'LaLiga', homeWins: 0.47, draws: 0.26, awayWins: 0.27 },
  { league: 'Bundesliga', homeWins: 0.46, draws: 0.24, awayWins: 0.30 },
  { league: 'Serie A', homeWins: 0.48, draws: 0.25, awayWins: 0.27 }
]

const featureImportance = [
  { feature: 'Home Goals Scored', importance: 0.18 },
  { feature: 'Away Goals Scored', importance: 0.16 },
  { feature: 'Home Goals Conceded', importance: 0.15 },
  { feature: 'Away Goals Conceded', importance: 0.14 },
  { feature: 'Home Form', importance: 0.12 },
  { feature: 'Away Form', importance: 0.11 },
  { feature: 'Head to Head', importance: 0.08 },
  { feature: 'League Position', importance: 0.06 }
].sort((a, b) => b.importance - a.importance)

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 gap-8">
        {/* League Competitiveness */}
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">League Competitiveness Index</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leagueCompetitiveness}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="league" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                />
                <Bar dataKey="competitiveness" fill="#00C853" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Home Advantage */}
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Home vs Away Advantage</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={homeAdvantage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="league" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="homeWins" name="Home Wins" fill="#00C853" />
                <Bar dataKey="draws" name="Draws" fill="#FFD700" />
                <Bar dataKey="awayWins" name="Away Wins" fill="#FF5252" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Feature Importance */}
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Model Feature Importance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 0.2]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" width={150} />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                />
                <Bar dataKey="importance" fill="#00C853" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}