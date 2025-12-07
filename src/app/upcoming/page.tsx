'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isWithinInterval, parseISO } from 'date-fns'
import { leagues } from '@/data/leagues'
import { SoccerSpinner } from '@/components/SoccerSpinner'
import { PredictionResult } from '@/components/PredictionResult'

type Match = {
  date: string
  home_team: string
  away_team: string
  predicted_home_win: number
  predicted_draw: number
  predicted_away_win: number
  predicted_home_goals?: number
  predicted_away_goals?: number
}

type ViewMode = 'week' | 'day'

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function UpcomingMatches() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)

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

  const mappedLeague = selectedLeague ? leagueNameMap[selectedLeague] : null

  // Week view: current week and next 3 weeks
  const today = new Date()
  const weekDays = eachDayOfInterval({
    start: startOfWeek(today, { weekStartsOn: 0 }), // Start from Sunday
    end: endOfWeek(addWeeks(today, 3), { weekStartsOn: 0 })  // End 3 weeks from now
  })

  useEffect(() => {
    const fetchMatches = async () => {
      if (!mappedLeague) return
      setLoading(true)
      try {
        // Use Next.js API route (relative path) in production, Python backend in development
        const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upcoming_matches/${mappedLeague}`
          : `/api/upcoming_matches/${mappedLeague}`
        
        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error('Failed to fetch matches')
        const data = await response.json()
        
        // Filter matches to only show those within the next 4 weeks
        const fourWeeksFromNow = addWeeks(today, 4)
        const filteredMatches = data.filter((match: Match) => {
          try {
            const matchDate = parseISO(match.date)
            return isWithinInterval(matchDate, { start: today, end: fourWeeksFromNow })
          } catch {
            return false
          }
        })
        
        setMatches(filteredMatches)
      } catch (error) {
        console.error('Error fetching matches:', error)
        setMatches([]) // Clear matches on error
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [mappedLeague])

  const matchesByDate = matches.reduce((acc: Record<string, Match[]>, match) => {
    const date = match.date.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {})

  const getMatchesForDate = (date: Date) => {
    return matchesByDate[formatDate(date)] || []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-primary sm:text-6xl md:text-7xl">Upcoming Matches</h1>
        <p className="mt-4 text-xl text-secondary max-w-3xl mx-auto">
          Explore upcoming matches and see AI-powered predictions for various leagues.
        </p>
      </div>

      <div className="mb-10 flex justify-center">
        <div className="relative">
          <select
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="appearance-none bg-card border-2 border-brand-500 text-primary text-lg rounded-lg py-3 px-5 pr-10 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500 transition duration-300 ease-in-out shadow-card"
          >
            <option value="">Select a league</option>
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-600">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.143-.446 1.579 0L10 10.405l2.905-2.857c.436-.446 1.143-.446 1.579 0 .436.445.436 1.167 0 1.612l-3.695 3.63c-.436.446-1.143.446-1.579 0L5.516 9.16c-.436-.445-.436-1.167 0-1.612z"/></svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <SoccerSpinner />
        </div>
      ) : mappedLeague && matches.length === 0 ? (
        <div className="text-center card-professional p-8 rounded-2xl shadow-card-lg bg-card">
          <p className="text-2xl font-semibold text-primary mb-4">No Upcoming Matches</p>
          <p className="text-secondary">There are no scheduled matches for this league in the next 4 weeks. Please check back later.</p>
        </div>
      ) : mappedLeague && (
        <div className="card-professional p-8 rounded-2xl shadow-card-lg bg-card">
          {/* View Mode Toggle */}
          <div className="flex justify-end mb-6 space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === 'week' ? 'bg-brand-500 text-white shadow-glow' : 'bg-secondary text-primary hover:bg-card-bg-hover'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                viewMode === 'day' ? 'bg-brand-500 text-white shadow-glow' : 'bg-secondary text-primary hover:bg-card-bg-hover'
              }`}
            >
              Day View
            </button>
          </div>

          {viewMode === 'week' ? (
            // Week View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {weekDays.map((date) => {
                const dayMatches = getMatchesForDate(date)
                const isToday = formatDate(date) === formatDate(new Date())
                
                return (
                  <div
                    key={date.toString()}
                    className={`p-4 rounded-lg transition-all duration-300 cursor-pointer ${
                      isToday 
                        ? 'bg-brand-100 dark:bg-brand-900/30 border-2 border-brand-500' 
                        : 'bg-secondary hover:bg-card-bg-hover border-2 border-primary'
                    }`}
                    onClick={() => {
                      setSelectedDate(date)
                      setViewMode('day')
                    }}
                  >
                    <div className="font-bold text-center text-primary mb-3">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-center text-secondary mb-4">
                      {format(date, 'MMM d')}
                    </div>
                    <div className="space-y-2">
                      {dayMatches.length > 0 ? (
                        dayMatches.map((match, idx) => (
                          <div key={idx} className="text-xs text-center text-primary truncate">
                            {match.home_team} vs {match.away_team}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-center text-tertiary">No matches</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Day View
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <button
                  onClick={() => setViewMode('week')}
                  className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-card-bg-hover transition-colors duration-300"
                >
                  ← Back to Week View
                </button>
              </div>
              {getMatchesForDate(selectedDate).length > 0 ? (
                getMatchesForDate(selectedDate).map((match, idx) => (
                  <div key={idx} className="glass-effect p-6 rounded-lg shadow-card-lg border-2 border-primary">
                    <div className="text-xl font-semibold text-primary mb-4 text-center">
                      {match.home_team} vs {match.away_team}
                    </div>
                    {match.predicted_home_goals !== undefined && match.predicted_away_goals !== undefined && (
                      <div className="text-center mb-4">
                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                          Predicted Scoreline: {match.predicted_home_goals} - {match.predicted_away_goals}
                        </span>
                      </div>
                    )}
                    <PredictionResult
                      result={{
                        predictions: {
                          home_win: match.predicted_home_win,
                          draw: match.predicted_draw,
                          away_win: match.predicted_away_win
                        },
                        home_team: match.home_team,
                        away_team: match.away_team
                      }}
                      mode="head-to-head"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-secondary py-8">
                  No matches scheduled for this day.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
