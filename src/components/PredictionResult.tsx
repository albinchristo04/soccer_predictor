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
  const { predictions, home_team, away_team, team_a, team_b, league_a, league_b } = result;

  const winProb = mode === 'head-to-head' ? (predictions.home_win ?? 0) : (predictions.team_a_win ?? 0);
  const drawProb = predictions.draw ?? 0;
  const lossProb = mode === 'head-to-head' ? (predictions.away_win ?? 0) : (predictions.team_b_win ?? 0);

  const homeTeamName = mode === 'head-to-head' ? home_team : team_a;
  const awayTeamName = mode === 'head-to-head' ? away_team : team_b;

  const getOutcome = () => {
    if (winProb > drawProb && winProb > lossProb) {
      return { outcome: homeTeamName, probability: winProb };
    } else if (lossProb > winProb && lossProb > drawProb) {
      return { outcome: awayTeamName, probability: lossProb };
    } else {
      return { outcome: 'Draw', probability: drawProb };
    }
  };

  const mostLikelyOutcome = getOutcome();

  const chartData = [
    {
      name: `${homeTeamName} Wins`,
      probability: winProb,
      fill: '#00C853',
    },
    {
      name: 'Draw',
      probability: drawProb,
      fill: '#FFD700',
    },
    {
      name: `${awayTeamName} Wins`,
      probability: lossProb,
      fill: '#FF5252',
    },
  ];

  return (
    <div className="bg-secondary p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-2 text-center uppercase">
        {homeTeamName} <span className="text-gray-400">vs</span> {awayTeamName}
      </h2>
      {mode === 'cross-league' && (
        <p className="text-md text-gray-400 text-center mb-6">
          ({league_a}) vs ({league_b})
        </p>
      )}

      <div className="mb-8 text-center">
        <p className="text-lg uppercase font-semibold mb-2">Most Likely Outcome</p>
        <p className="text-4xl font-bold text-accent">
          {mostLikelyOutcome.outcome}
        </p>
        <p className="text-lg text-gray-400">
          with a probability of {(mostLikelyOutcome.probability * 100).toFixed(1)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 my-8 text-center">
        <div>
          <p className="text-lg font-semibold uppercase">{homeTeamName} Win</p>
          <p className="text-3xl font-bold text-green-500">{(winProb * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-lg font-semibold uppercase">Draw</p>
          <p className="text-3xl font-bold text-yellow-500">{(drawProb * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-lg font-semibold uppercase">{awayTeamName} Win</p>
          <p className="text-3xl font-bold text-red-500">{(lossProb * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="name" width={150} tick={{ textTransform: 'uppercase' }} />
            <Tooltip
              formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
            />
            <Bar dataKey="probability" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>⚠️ Predictions are for educational and entertainment purposes only.</p>
        <p>Scoreline prediction is not available with the current model.</p>
      </div>
    </div>
  )
}