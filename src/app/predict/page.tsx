  'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { leagueNames as leagues, teams } from '@/data/leagues'

type PredictionMode = 'head-to-head' | 'cross-league'

interface TeamStats {
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
  win_rate: number
  avg_goals_scored: number
  avg_goals_conceded: number
  home_win_rate: number
  away_win_rate: number
  recent_form: string[]
}

interface HeadToHeadMatch {
  date: string
  home_team: string
  away_team: string
  home_goals: number
  away_goals: number
  result: string
}

interface PredictionResult {
  predictions?: {
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
  predicted_home_goals?: number
  predicted_away_goals?: number
  predicted_team_a_goals?: number
  predicted_team_b_goals?: number
  confidence?: number
  error?: string
}

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
}

// Stat comparison bar component
function StatBar({ 
  label, 
  valueA, 
  valueB, 
  format = 'number',
  higherIsBetter = true 
}: { 
  label: string
  valueA: number
  valueB: number
  format?: 'number' | 'percent' | 'decimal'
  higherIsBetter?: boolean
}) {
  // Ensure values are valid numbers, default to 0 if undefined/null/NaN
  const safeA = typeof valueA === 'number' && !isNaN(valueA) ? valueA : 0
  const safeB = typeof valueB === 'number' && !isNaN(valueB) ? valueB : 0
  
  const maxVal = Math.max(safeA, safeB, 0.01)
  const percentA = (safeA / maxVal) * 100
  const percentB = (safeB / maxVal) * 100
  
  const formatValue = (val: number) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0
    if (format === 'percent') return `${(safeVal * 100).toFixed(0)}%`
    if (format === 'decimal') return safeVal.toFixed(2)
    return safeVal.toFixed(0)
  }
  
  const aIsWinning = higherIsBetter ? safeA > safeB : safeA < safeB
  const bIsWinning = higherIsBetter ? safeB > safeA : safeB < safeA
  const isTie = Math.abs(safeA - safeB) < 0.001
  
  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-bold text-sm ${aIsWinning ? 'text-[var(--success)]' : isTie ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'}`}>
          {formatValue(valueA)}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
          {label}
        </span>
        <span className={`font-bold text-sm ${bIsWinning ? 'text-[var(--success)]' : isTie ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'}`}>
          {formatValue(valueB)}
        </span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-[var(--background)] rounded-full overflow-hidden flex justify-end">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${aIsWinning ? 'bg-[var(--success)]' : isTie ? 'bg-[var(--warning)]' : 'bg-[var(--text-tertiary)]/30'}`}
            style={{ width: `${percentA}%` }}
          />
        </div>
        <div className="flex-1 bg-[var(--background)] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${bIsWinning ? 'bg-[var(--success)]' : isTie ? 'bg-[var(--warning)]' : 'bg-[var(--text-tertiary)]/30'}`}
            style={{ width: `${percentB}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function FormDisplay({ form }: { form: string[] }) {
  return (
    <div className="flex gap-1 justify-center">
      {form.slice(0, 5).map((result, idx) => (
        <span 
          key={idx}
          className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
            result === 'W' ? 'bg-[var(--success)] text-black' :
            result === 'D' ? 'bg-[var(--warning)] text-black' :
            'bg-[var(--danger)] text-white'
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  )
}

function PredictPageContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<PredictionMode>('head-to-head')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [statsA, setStatsA] = useState<TeamStats | null>(null)
  const [statsB, setStatsB] = useState<TeamStats | null>(null)
  const [h2hMatches, setH2hMatches] = useState<HeadToHeadMatch[]>([])
  const [loadingStats, setLoadingStats] = useState(false)

  const [formData, setFormData] = useState({
    league: '',
    league_a: '',
    league_b: '',
    home_team: '',
    away_team: '',
    team_a: '',
    team_b: ''
  })

  useEffect(() => {
    const queryMode = searchParams.get('mode')
    if (queryMode === 'cross-league') {
      setMode('cross-league')
    } else {
      setMode('head-to-head')
    }
  }, [searchParams])

  useEffect(() => {
    setResult(null)
    setStatsA(null)
    setStatsB(null)
    setH2hMatches([])
  }, [formData, mode])

  const fetchTeamStats = async () => {
    setLoadingStats(true)
    try {
      const teamAName = mode === 'head-to-head' ? formData.home_team : formData.team_a
      const teamBName = mode === 'head-to-head' ? formData.away_team : formData.team_b
      const leagueA = mode === 'head-to-head' ? leagueNameMap[formData.league] : leagueNameMap[formData.league_a]
      const leagueB = mode === 'head-to-head' ? leagueNameMap[formData.league] : leagueNameMap[formData.league_b]

      // Try the new team_form endpoint first (uses FotMob for live data), fallback to team_stats
      const [resA, resB] = await Promise.all([
        fetch(`/api/team_form/${leagueA}/${encodeURIComponent(teamAName)}`).catch(() => 
          fetch(`/api/team_stats/${leagueA}/${encodeURIComponent(teamAName)}`)
        ),
        fetch(`/api/team_form/${leagueB}/${encodeURIComponent(teamBName)}`).catch(() => 
          fetch(`/api/team_stats/${leagueB}/${encodeURIComponent(teamBName)}`)
        )
      ])

      if (resA.ok) {
        const dataA = await resA.json()
        setStatsA(dataA)
      }
      if (resB.ok) {
        const dataB = await resB.json()
        setStatsB(dataB)
      }

      // Fetch head-to-head matches for same-league comparisons
      if (mode === 'head-to-head' && formData.league) {
        const h2hRes = await fetch(`/api/head_to_head/${leagueA}/${encodeURIComponent(teamAName)}/${encodeURIComponent(teamBName)}`)
        if (h2hRes.ok) {
          const h2hData = await h2hRes.json()
          setH2hMatches(h2hData.slice(0, 10))
        }
      }
    } catch (err) {
      console.error('Error fetching team stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  const handlePredict = async () => {
    setLoading(true)
    setResult(null)
    try {
      const endpoint = mode === 'head-to-head' 
        ? '/api/predict/head-to-head'
        : '/api/predict/cross-league'

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Prediction failed')
      }

      const data = await response.json()
      
      if (mode === 'cross-league' && data) {
        setResult({
          predictions: {
            team_a_win: data.predicted_team_a_win,
            draw: data.predicted_draw,
            team_b_win: data.predicted_team_b_win
          },
          team_a: data.team_a,
          team_b: data.team_b,
          league_a: data.league_a,
          league_b: data.league_b,
          predicted_team_a_goals: data.predicted_team_a_goals,
          predicted_team_b_goals: data.predicted_team_b_goals,
          confidence: data.confidence
        })
      } else if (mode === 'head-to-head' && data) {
        setResult({
          predictions: {
            home_win: data.predicted_home_win,
            draw: data.predicted_draw,
            away_win: data.predicted_away_win
          },
          home_team: data.home_team,
          away_team: data.away_team,
          predicted_home_goals: data.predicted_home_goals,
          predicted_away_goals: data.predicted_away_goals,
          confidence: data.confidence
        })
      }

      // Also fetch team stats after prediction
      await fetchTeamStats()
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Prediction failed' })
    } finally {
      setLoading(false)
    }
  }

  const canPredict = mode === 'head-to-head' 
    ? formData.league && formData.home_team && formData.away_team && formData.home_team !== formData.away_team
    : formData.league_a && formData.team_a && formData.league_b && formData.team_b

  // Get team names for display
  const teamAName = mode === 'head-to-head' ? (result?.home_team || formData.home_team) : (result?.team_a || formData.team_a)
  const teamBName = mode === 'head-to-head' ? (result?.away_team || formData.away_team) : (result?.team_b || formData.team_b)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Match Predictor</h1>
          <p className="text-[var(--text-secondary)]">
            Get AI-powered predictions with detailed team analysis and head-to-head history
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Toggle */}
        <div className="tab-nav mb-8 p-1 inline-flex">
          <button
            onClick={() => setMode('head-to-head')}
            className={`tab-item ${mode === 'head-to-head' ? 'active' : ''}`}
          >
            🎯 Head-to-Head
          </button>
          <button
            onClick={() => setMode('cross-league')}
            className={`tab-item ${mode === 'cross-league' ? 'active' : ''}`}
          >
            🌍 Cross-League
          </button>
        </div>

        {/* Prediction Form */}
        <div className="fm-card p-6 mb-8">
          {mode === 'head-to-head' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Select League
                </label>
                <select
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value, home_team: '', away_team: '' })}
                  className="fm-select"
                >
                  <option value="">Choose a league...</option>
                  {leagues.map(league => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Home Team
                  </label>
                  <select
                    value={formData.home_team}
                    onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                    disabled={!formData.league}
                    className="fm-select"
                  >
                    <option value="">Select team...</option>
                    {formData.league && teams[formData.league]?.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Away Team
                  </label>
                  <select
                    value={formData.away_team}
                    onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                    disabled={!formData.league}
                    className="fm-select"
                  >
                    <option value="">Select team...</option>
                    {formData.league && teams[formData.league]?.filter(t => t !== formData.home_team).map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    League A
                  </label>
                  <select
                    value={formData.league_a}
                    onChange={(e) => setFormData({ ...formData, league_a: e.target.value, team_a: '' })}
                    className="fm-select"
                  >
                    <option value="">Choose a league...</option>
                    {leagues.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Team A
                  </label>
                  <select
                    value={formData.team_a}
                    onChange={(e) => setFormData({ ...formData, team_a: e.target.value })}
                    disabled={!formData.league_a}
                    className="fm-select"
                  >
                    <option value="">Select team...</option>
                    {formData.league_a && teams[formData.league_a]?.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-2xl">⚔️</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    League B
                  </label>
                  <select
                    value={formData.league_b}
                    onChange={(e) => setFormData({ ...formData, league_b: e.target.value, team_b: '' })}
                    className="fm-select"
                  >
                    <option value="">Choose a league...</option>
                    {leagues.map(league => (
                      <option key={league} value={league}>{league}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Team B
                  </label>
                  <select
                    value={formData.team_b}
                    onChange={(e) => setFormData({ ...formData, team_b: e.target.value })}
                    disabled={!formData.league_b}
                    className="fm-select"
                  >
                    <option value="">Select team...</option>
                    {formData.league_b && teams[formData.league_b]?.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading || !canPredict}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="spinner w-5 h-5 border-2"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>Get Prediction</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && !result.error && result.predictions && (
          <div className="space-y-6 animate-fade-in">
            {/* Prediction Result Card */}
            <div className="fm-card overflow-hidden">
              {/* Winner Banner */}
              {(() => {
                const homeWin = mode === 'head-to-head' ? result.predictions.home_win : result.predictions.team_a_win
                const awayWin = mode === 'head-to-head' ? result.predictions.away_win : result.predictions.team_b_win
                const draw = result.predictions.draw
                const hWin = (homeWin || 0) * 100
                const aWin = (awayWin || 0) * 100
                const d = (draw || 0) * 100
                
                let winner = { team: 'Draw', type: 'draw', prob: d }
                if (hWin > d && hWin > aWin) winner = { team: teamAName, type: 'home', prob: hWin }
                else if (aWin > d && aWin > hWin) winner = { team: teamBName, type: 'away', prob: aWin }
                
                const homeGoals = mode === 'head-to-head' ? result.predicted_home_goals : result.predicted_team_a_goals
                const awayGoals = mode === 'head-to-head' ? result.predicted_away_goals : result.predicted_team_b_goals

                return (
                  <>
                    <div className={`p-6 text-center ${
                      winner.type === 'home' ? 'bg-gradient-to-r from-[var(--success)]/20 to-transparent' :
                      winner.type === 'away' ? 'bg-gradient-to-l from-[var(--success)]/20 to-transparent' :
                      'bg-gradient-to-r from-[var(--warning)]/20 via-transparent to-[var(--warning)]/20'
                    }`}>
                      <p className="text-sm text-[var(--text-tertiary)] mb-2 uppercase tracking-wider font-medium">
                        Predicted Winner
                      </p>
                      <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{winner.team}</h3>
                      <p className="text-[var(--accent-primary)] font-semibold">{winner.prob.toFixed(1)}% probability</p>
                    </div>

                    {/* Score Prediction */}
                    <div className="p-6 border-b border-[var(--border-color)]">
                      <p className="text-center text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                        Expected Scoreline
                      </p>
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center flex-1">
                          <p className="text-sm text-[var(--text-secondary)] mb-2">{teamAName}</p>
                          <div className="text-5xl font-bold text-[var(--text-primary)]">
                            {homeGoals?.toFixed(0) || '-'}
                          </div>
                        </div>
                        <div className="text-2xl text-[var(--text-tertiary)]">-</div>
                        <div className="text-center flex-1">
                          <p className="text-sm text-[var(--text-secondary)] mb-2">{teamBName}</p>
                          <div className="text-5xl font-bold text-[var(--text-primary)]">
                            {awayGoals?.toFixed(0) || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Probability Breakdown */}
                    <div className="p-6">
                      <h4 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">
                        Win Probability
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">{teamAName}</span>
                            <span className="font-bold text-[var(--success)]">{hWin.toFixed(1)}%</span>
                          </div>
                          <div className="prediction-bar h-3">
                            <div className="prediction-bar-fill home h-full" style={{ width: `${hWin}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">Draw</span>
                            <span className="font-bold text-[var(--warning)]">{d.toFixed(1)}%</span>
                          </div>
                          <div className="prediction-bar h-3">
                            <div className="prediction-bar-fill draw h-full" style={{ width: `${d}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[var(--text-primary)] font-medium">{teamBName}</span>
                            <span className="font-bold text-[var(--danger)]">{aWin.toFixed(1)}%</span>
                          </div>
                          <div className="prediction-bar h-3">
                            <div className="prediction-bar-fill away h-full" style={{ width: `${aWin}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    {result.confidence && (
                      <div className="px-6 pb-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--background)]">
                          <span className="text-sm text-[var(--text-secondary)]">Model Confidence</span>
                          <span className="font-semibold text-[var(--accent-primary)]">
                            {(result.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Team Stats Comparison */}
            {(statsA || statsB) && (
              <div className="fm-card overflow-hidden">
                <div className="p-4 bg-[var(--background)] border-b border-[var(--border-color)]">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <span>📊</span> Team Statistics Comparison
                  </h3>
                </div>
                
                {loadingStats ? (
                  <div className="p-8 flex justify-center">
                    <div className="spinner"></div>
                  </div>
                ) : statsA && statsB ? (
                  <div className="p-6">
                    {/* Team Headers */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center flex-1">
                        <h4 className="font-bold text-[var(--text-primary)]">{teamAName}</h4>
                        <p className="text-xs text-[var(--text-tertiary)]">{statsA.matches_played} matches</p>
                      </div>
                      <div className="px-4 text-[var(--text-tertiary)]">vs</div>
                      <div className="text-center flex-1">
                        <h4 className="font-bold text-[var(--text-primary)]">{teamBName}</h4>
                        <p className="text-xs text-[var(--text-tertiary)]">{statsB.matches_played} matches</p>
                      </div>
                    </div>

                    {/* Stats Bars */}
                    <div className="space-y-1 divide-y divide-[var(--border-color)]">
                      <StatBar label="Wins" valueA={statsA.wins} valueB={statsB.wins} />
                      <StatBar label="Win Rate" valueA={statsA.win_rate} valueB={statsB.win_rate} format="percent" />
                      <StatBar label="Goals Scored" valueA={statsA.goals_scored} valueB={statsB.goals_scored} />
                      <StatBar label="Goals/Game" valueA={statsA.avg_goals_scored} valueB={statsB.avg_goals_scored} format="decimal" />
                      <StatBar label="Goals Conceded" valueA={statsA.goals_conceded} valueB={statsB.goals_conceded} higherIsBetter={false} />
                      <StatBar label="Conceded/Game" valueA={statsA.avg_goals_conceded} valueB={statsB.avg_goals_conceded} format="decimal" higherIsBetter={false} />
                      <StatBar label="Home Win Rate" valueA={statsA.home_win_rate} valueB={statsB.home_win_rate} format="percent" />
                      <StatBar label="Away Win Rate" valueA={statsA.away_win_rate} valueB={statsB.away_win_rate} format="percent" />
                    </div>

                    {/* Recent Form */}
                    <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
                      <p className="text-center text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Recent Form (Last 5)</p>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <FormDisplay form={statsA.recent_form} />
                        </div>
                        <div className="px-4 text-[var(--text-tertiary)]">vs</div>
                        <div className="flex-1">
                          <FormDisplay form={statsB.recent_form} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-[var(--text-secondary)]">
                    Unable to load team statistics
                  </div>
                )}
              </div>
            )}

            {/* Head-to-Head History */}
            {h2hMatches.length > 0 && (
              <div className="fm-card overflow-hidden">
                <div className="p-4 bg-[var(--background)] border-b border-[var(--border-color)]">
                  <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <span>⚔️</span> Head-to-Head History
                  </h3>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {h2hMatches.map((match, idx) => {
                    const homeWon = match.home_goals > match.away_goals
                    const awayWon = match.away_goals > match.home_goals
                    return (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${homeWon ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                              {match.home_team}
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {match.home_goals} - {match.away_goals}
                            </span>
                            <span className={`text-sm font-medium ${awayWon ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                              {match.away_team}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {new Date(match.date).toLocaleDateString()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {result?.error && (
          <div className="fm-card p-6 border-l-4 border-l-[var(--danger)]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Prediction Failed</p>
                <p className="text-sm text-[var(--text-secondary)]">{result.error}</p>
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
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    }>
      <PredictPageContent />
    </Suspense>
  )
}
