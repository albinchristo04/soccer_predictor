'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface PredictionResultProps {
  result: {
    predictions: {
      home_win?: number
      draw?: number
      away_win?: number
      team_a_win?: number
      team_b_win?: number
    }
    home_team?: string
    away_team?: string
    team_a?: string
    team_b?: string
    league_a?: string
    league_b?: string
  }
  mode: 'head-to-head' | 'cross-league'
}

export const PredictionResult = ({ result, mode }: PredictionResultProps) => {
  const formatProbability = (prob: number) => `${(prob * 100).toFixed(1)}%`

  const getChartData = () => {
    if (mode === 'head-to-head') {
      return [
        {
          name: `${result.home_team} Wins`,
          probability: result.predictions.home_win,
          fill: '#00C853'
        },
        {
          name: 'Draw',
          probability: result.predictions.draw,
          fill: '#FFD700'
        },
        {
          name: `${result.away_team} Wins`,
          probability: result.predictions.away_win,
          fill: '#FF5252'
        }
      ]
    }

    return [
      {
        name: `${result.team_a} Wins`,
        probability: result.predictions.team_a_win,
        fill: '#00C853'
      },
      {
        name: 'Draw',
        probability: result.predictions.draw,
        fill: '#FFD700'
      },
      {
        name: `${result.team_b} Wins`,
        probability: result.predictions.team_b_win,
        fill: '#FF5252'
      }
    ]
  }

  const getWinningTeam = () => {
    if (mode === 'head-to-head') {
      const { home_win, away_win } = result.predictions
      if (home_win && away_win) {
        return home_win > away_win ? result.home_team : result.away_team
      }
    } else {
      const { team_a_win, team_b_win } = result.predictions
      if (team_a_win && team_b_win) {
        return team_a_win > team_b_win ? result.team_a : result.team_b
      }
    }
    return null
  }

  const winningTeam = getWinningTeam()
  const chartData = getChartData()

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        {mode === 'head-to-head' ? (
          <>
            {result.home_team} vs {result.away_team}
          </>
        ) : (
          <>
            {result.team_a} ({result.league_a}) vs {result.team_b} ({result.league_b})
          </>
        )}
      </h2>

      <div className="mb-6">
        <p className="text-xl mb-2">
          🏆 Most Likely Winner: <span className="text-accent font-bold">{winningTeam}</span>
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
            <Tooltip
              formatter={(value: number) => formatProbability(value)}
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
            />
            <Bar dataKey="probability" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 text-sm text-secondary">
        ⚠️ Predictions are for educational and entertainment purposes only
      </div>
    </div>
  )
}