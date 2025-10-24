'use client'

import { useState } from 'react'
import { leagues } from '@/data/leagues'
import { LeagueStats } from '@/components/LeagueStats'
import { ResultDistributionChart } from '@/components/ResultDistributionChart'
import { GoalsDistributionChart } from '@/components/GoalsDistributionChart'
import { ModelMetrics } from '@/components/ModelMetrics'
import { ConfusionMatrix } from '@/components/ConfusionMatrix'
import { FeatureImportance } from '@/components/FeatureImportance'
import { TrainClassificationReport } from '@/components/TrainClassificationReport'
import { TestClassificationReport } from '@/components/TestClassificationReport'

export default function AnalyticsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)

  const leagueNameMap: Record<string, string> = {
    'Premier League': 'premier_league',
    'La Liga': 'la_liga',
    'Serie A': 'serie_a',
    'Bundesliga': 'bundesliga',
    'Ligue 1': 'ligue_1',
    'Champions League (UCL)': 'ucl',
    'Europa League (UEL)': 'uel',
    'MLS': 'mls',
    'FIFA World Cup': 'world_cup'
  };

  const mappedLeague = selectedLeague ? leagueNameMap[selectedLeague] : null;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">League Analytics</h1>
      <p className="text-lg text-gray-400 mb-8">
        This page provides a deep dive into the statistics of each league. Explore interactive charts to understand league dynamics, team performance, and the key factors that influence match outcomes.
      </p>
      
      <div className="mb-8">
        <select
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="bg-secondary p-3 rounded-lg text-lg"
        >
          <option value="">Select a league to view analytics</option>
          {leagues.map((league) => (
            <option key={league} value={league}>
              {league}
            </option>
          ))}
        </select>
      </div>

      {mappedLeague && (
        <div className="space-y-8">
          <LeagueStats league={mappedLeague} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-secondary p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Result Distribution</h2>
              <ResultDistributionChart league={mappedLeague} />
            </div>
            <div className="bg-secondary p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Goals per Match Distribution</h2>
              <GoalsDistributionChart league={mappedLeague} />
            </div>
          </div>



          <ModelMetrics league={mappedLeague} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TrainClassificationReport league={mappedLeague} />
            <TestClassificationReport league={mappedLeague} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ConfusionMatrix league={mappedLeague} />
            <FeatureImportance league={mappedLeague} />
          </div>
        </div>
      )}
    </div>
  )
}