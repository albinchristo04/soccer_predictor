'use client'

import { useState } from 'react'
import { leagues } from '@/data/leagues'

export default function AnalyticsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

  const visualizations = [
    'confusion_matrix',
    'feature_importance',
    'goals_distribution',
    'result_distribution',
    'season_trends'
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      <p className="mb-8">This page provides a visual analysis of the data used to train the prediction models. Select a league from the dropdown below to see the following visualizations:</p>
      <ul className="list-disc list-inside mb-8">
        <li>Confusion Matrix: A table showing the performance of the classification model.</li>
        <li>Feature Importance: A bar chart showing the most important features for the model.</li>
        <li>Goals Distribution: A histogram showing the distribution of goals scored by the home and away teams.</li>
        <li>Result Distribution: A bar chart showing the distribution of match results (win, draw, loss).</li>
        <li>Season Trends: A line chart showing the trend of goals and home wins over the seasons.</li>
      </ul>

      <div className="mb-8">
        <select
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="bg-secondary p-2 rounded-lg"
        >
          <option value="">Select a league</option>
          {leagues.map((league) => (
            <option key={league} value={league}>
              {league}
            </option>
          ))}
        </select>
      </div>

      {selectedLeague && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {visualizations.map((vis) => (
            <div key={vis} className="bg-secondary p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">{vis.replace(/_/g, ' ').toUpperCase()}</h2>
              <img src={`http://localhost:8000/api/analytics/${selectedLeague}/${selectedLeague}_${vis}`} alt={vis} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}