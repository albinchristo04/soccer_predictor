'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'

interface TeamSearchResult {
  name: string
  league: string
}

interface PredictionResult {
  success?: boolean
  predictions?: {
    home_win?: number
    draw?: number
    away_win?: number
  }
  home_team?: string
  away_team?: string
  home_league?: string
  away_league?: string
  is_cross_league?: boolean
  predicted_home_goals?: number
  predicted_away_goals?: number
  confidence?: number
  ratings?: {
    home_elo: number
    away_elo: number
    elo_difference: number
  }
  analysis?: {
    predicted_winner: string
    home_advantage_applied: boolean
    factors_considered: string[]
    note: string
  }
  error?: string
}

// Team Search Autocomplete Component
function TeamSearchInput({
  label,
  value,
  onSelect,
  placeholder,
  icon
}: {
  label: string
  value: { name: string; league: string } | null
  onSelect: (team: { name: string; league: string } | null) => void
  placeholder: string
  icon: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TeamSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search teams API
  const searchTeams = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search-teams?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.teams || [])
      }
    } catch (err) {
      console.error('Error searching teams:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && !value) {
        searchTeams(query)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, value, searchTeams])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (team: TeamSearchResult) => {
    onSelect(team)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      
      {value ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)]">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-[var(--text-primary)]">{value.name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{value.league}</p>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
            {icon}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-14 pr-4 py-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && !value && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] shadow-xl"
        >
          {results.map((team, idx) => (
            <button
              key={`${team.name}-${team.league}-${idx}`}
              onClick={() => handleSelect(team)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--card-hover)] transition-colors text-left"
            >
              <span className="text-lg">⚽</span>
              <div>
                <p className="text-[var(--text-primary)] font-medium">{team.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{team.league}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !loading && !value && (
        <div className="absolute z-50 w-full mt-2 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-center">
          <p className="text-[var(--text-secondary)]">No teams found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  )
}

function PredictPageContent() {
  const [homeTeam, setHomeTeam] = useState<{ name: string; league: string } | null>(null)
  const [awayTeam, setAwayTeam] = useState<{ name: string; league: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)

  // Reset result when teams change
  useEffect(() => {
    setResult(null)
  }, [homeTeam, awayTeam])

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) return
    if (homeTeam.name === awayTeam.name) {
      setResult({ error: 'Please select different teams' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/predict/any-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_team: homeTeam.name,
          away_team: awayTeam.name,
          home_league: homeTeam.league,
          away_league: awayTeam.league,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Prediction failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Prediction failed' })
    } finally {
      setLoading(false)
    }
  }

  const canPredict = homeTeam && awayTeam && homeTeam.name !== awayTeam.name

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent dark:to-slate-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-300">AI-Powered Match Predictor</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
              Match Predictor
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Enter any two teams from our database to get AI-powered match predictions based on ELO ratings, form, and historical data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Selection */}
        <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-3xl border border-[var(--border-color)] p-6 md:p-8 mb-8">
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Home Team */}
            <div>
              <TeamSearchInput
                label="Home Team"
                value={homeTeam}
                onSelect={setHomeTeam}
                placeholder="Search for home team..."
                icon="🏠"
              />
            </div>

            {/* VS Divider */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[var(--text-secondary)] font-bold text-sm">VS</span>
              </div>
            </div>
            
            <div className="md:hidden flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] border border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[var(--text-secondary)] font-bold text-sm">VS</span>
              </div>
            </div>

            {/* Away Team */}
            <div>
              <TeamSearchInput
                label="Away Team"
                value={awayTeam}
                onSelect={setAwayTeam}
                placeholder="Search for away team..."
                icon="✈️"
              />
            </div>
          </div>

          {/* Predict Button */}
          <div className="mt-8">
            <button
              onClick={handlePredict}
              disabled={loading || !canPredict}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-gray-200 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Match...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>Get Prediction</span>
                </>
              )}
            </button>
          </div>

          {/* Cross-league indicator */}
          {homeTeam && awayTeam && homeTeam.league !== awayTeam.league && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <span>🌍</span>
              <span>Cross-league prediction: {homeTeam.league} vs {awayTeam.league}</span>
            </div>
          )}
        </div>

        {/* Prediction Results */}
        {result && !result.error && result.predictions && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Prediction Card */}
            <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-3xl border border-[var(--border-color)] overflow-hidden">
              {/* Winner Banner */}
              {(() => {
                const homeWin = result.predictions.home_win || 0
                const draw = result.predictions.draw || 0
                const awayWin = result.predictions.away_win || 0
                const hWin = homeWin * 100
                const d = draw * 100
                const aWin = awayWin * 100
                
                let winner = { team: 'Draw', type: 'draw', prob: d }
                if (hWin > d && hWin > aWin) winner = { team: result.home_team || '', type: 'home', prob: hWin }
                else if (aWin > d && aWin > hWin) winner = { team: result.away_team || '', type: 'away', prob: aWin }

                return (
                  <>
                    <div className={`p-8 text-center ${
                      winner.type === 'home' ? 'bg-gradient-to-r from-emerald-600/20 to-transparent' :
                      winner.type === 'away' ? 'bg-gradient-to-l from-emerald-600/20 to-transparent' :
                      'bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20'
                    }`}>
                      <p className="text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Predicted Winner
                      </p>
                      <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">{winner.team}</h3>
                      <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">{winner.prob.toFixed(1)}% probability</p>
                    </div>

                    {/* Score Prediction */}
                    <div className="p-6 border-b border-[var(--border-color)]">
                      <p className="text-center text-sm text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                        Expected Scoreline
                      </p>
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center flex-1">
                          <p className="text-sm text-[var(--text-secondary)] mb-2">{result.home_team}</p>
                          <p className="text-sm text-[var(--text-tertiary)] mb-1">{result.home_league}</p>
                          <div className="text-5xl font-bold text-[var(--text-primary)]">
                            {result.predicted_home_goals?.toFixed(0) || '-'}
                          </div>
                        </div>
                        <div className="text-2xl text-[var(--text-tertiary)]">-</div>
                        <div className="text-center flex-1">
                          <p className="text-sm text-[var(--text-secondary)] mb-2">{result.away_team}</p>
                          <p className="text-sm text-[var(--text-tertiary)] mb-1">{result.away_league}</p>
                          <div className="text-5xl font-bold text-[var(--text-primary)]">
                            {result.predicted_away_goals?.toFixed(0) || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Probability Breakdown */}
                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                        Win Probability
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">{result.home_team}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{hWin.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${hWin}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">Draw</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">{d.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${d}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">{result.away_team}</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">{aWin.toFixed(1)}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                              style={{ width: `${aWin}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Ratings & Analysis Card */}
            {result.ratings && (
              <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-3xl border border-[var(--border-color)] p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Team Ratings Comparison
                </h4>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 rounded-xl bg-[var(--background-secondary)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{result.home_team}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{result.ratings.home_elo}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">ELO Rating</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[var(--background-secondary)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Difference</p>
                    <p className={`text-2xl font-bold ${result.ratings.elo_difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {result.ratings.elo_difference >= 0 ? '+' : ''}{result.ratings.elo_difference}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">Home Advantage</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-[var(--background-secondary)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{result.away_team}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{result.ratings.away_elo}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">ELO Rating</p>
                  </div>
                </div>

                {/* Confidence Score */}
                {result.confidence && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--text-secondary)]">Model Confidence</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{result.confidence.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Factors Considered */}
                {result.analysis?.factors_considered && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">Factors Considered:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.factors_considered.map((factor, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-[var(--background-secondary)] text-xs text-[var(--text-secondary)]">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Note */}
                {result.analysis?.note && (
                  <div className="mt-4 p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-color)]">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="text-indigo-600 dark:text-indigo-400">💡 Note:</span> {result.analysis.note}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-800 dark:text-amber-200/80 text-center">
                <span className="font-semibold">⚠️ Disclaimer:</span> Predictions are based on statistical models and historical data. 
                Football is unpredictable - use for entertainment only, not betting.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {result?.error && (
          <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-3xl border border-rose-500/30 p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Prediction Failed</p>
                <p className="text-sm text-[var(--text-secondary)]">{result.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        {!result && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--border-color)] p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">ELO Ratings</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Teams are ranked using an advanced ELO system updated after every match
                </p>
              </div>
              <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--border-color)] p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Home Advantage</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Home teams receive a +65 ELO point boost to reflect historical home advantage
                </p>
              </div>
              <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl border border-[var(--border-color)] p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">Cross-League</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  League strength coefficients adjust ratings for cross-league comparisons
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PredictPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PredictPageContent />
    </Suspense>
  )
}
