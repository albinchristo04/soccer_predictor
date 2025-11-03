'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/store/store'
import { TeamSelector } from '@/components/TeamSelector'
import { PredictionResult } from '@/components/PredictionResult'
import { SoccerSpinner } from '@/components/SoccerSpinner'

type PredictionMode = 'head-to-head' | 'cross-league'

function PredictPageContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<PredictionMode | null>(null)
  
  useEffect(() => {
    const queryMode = searchParams.get('mode')
    if (queryMode === 'cross-league') {
      setMode('cross-league')
    } else {
      setMode('head-to-head')
    }
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { selectedLeague } = useStore()

  const [formData, setFormData] = useState({
    league: '',
    league_a: '',
    league_b: '',
    home_team: '',
    away_team: '',
    team_a: '',
    team_b: ''
  })

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

  useEffect(() => {
    setResult(null);
  }, [formData]);

  const handlePredict = async () => {
    setLoading(true)
    setResult(null)
    try {
      console.log("NEXT_PUBLIC_BACKEND_URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
      const endpoint = mode === 'head-to-head' 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/predict/head-to-head`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/predict/cross-league`

      const payload = mode === 'head-to-head'
        ? {
            league: leagueNameMap[formData.league],
            home_team: formData.home_team,
            away_team: formData.away_team
          }
        : {
            league_a: leagueNameMap[formData.league_a],
            team_a: formData.team_a,
            league_b: leagueNameMap[formData.league_b],
            team_b: formData.team_b
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      // Handle error state here
    } finally {
      setLoading(false)
    }
  }

  if (mode === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <SoccerSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-800 sm:text-6xl md:text-7xl">Match Prediction</h1>
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Select two teams to see the predicted outcome of a match between them.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Mode Toggle */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-300 ${
              mode === 'head-to-head' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setMode('head-to-head')}
          >
            🏠 Head-to-Head
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-300 ${
              mode === 'cross-league' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setMode('cross-league')}
          >
            🌍 Cross-League
          </button>
        </div>

        {/* Prediction Form */}
        <div className="bg-white p-8 rounded-xl shadow-2xl mb-8 border-2 border-gray-200">
          {mode === 'head-to-head' ? (
            <div className="space-y-6">
              <TeamSelector
                type="head-to-head"
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <TeamSelector
                type="cross-league"
                formData={formData}
                setFormData={setFormData}
              />
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full mt-8 px-6 py-4 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <SoccerSpinner />
                <span className="ml-3">Predicting...</span>
              </div>
            ) : (
              'Predict Match'
            )}
          </button>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center mt-8">
            <SoccerSpinner />
          </div>
        ) : result && (
          <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-gray-200">
            <PredictionResult result={result} mode={mode} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PredictPage() {
  return (
    <Suspense fallback={<SoccerSpinner />}>
      <PredictPageContent />
    </Suspense>
  )
}
