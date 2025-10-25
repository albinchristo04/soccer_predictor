'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { SoccerSpinner } from '@/components/SoccerSpinner'
import { PredictionResult } from '@/components/PredictionResult'

type Match = {
  date: string
  home_team: string
  away_team: string
  predicted_home_win: number
  predicted_draw: number
  predicted_away_win: number
}

type ViewMode = 'week' | 'day'

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function UpcomingMatches() {
  const [selectedLeague, setSelectedLeague] = useState('premier_league')
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)

  const leagueOptions = {
    'Premier League': 'premier_league',
    'La Liga': 'la_liga',
    'Bundesliga': 'bundesliga',
    'Serie A': 'serie_a',
    'Ligue 1': 'ligue_1',
    'Champions League (UCL)': 'ucl',
    'Europa League (UEL)': 'uel',
    'MLS': 'mls',
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 6 }), // Start from Saturday
    end: endOfWeek(selectedDate, { weekStartsOn: 6 }) 
  })

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upcoming_matches/${selectedLeague}`
        )
        if (!response.ok) throw new Error('Failed to fetch matches')
        const data = await response.json()
        setMatches(data)
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [selectedLeague])

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
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Upcoming Matches</h1>
        
        <div className="bg-secondary p-6 rounded-lg mb-8">
          <p className="text-lg text-gray-300 mb-4">
            Welcome to the Upcoming Matches feature! Here you can explore upcoming soccer matches across various leagues
            and see AI-powered predictions for match outcomes. Our advanced machine learning model analyzes historical
            data to provide win, draw, and loss probabilities for each match.
          </p>
          <p className="text-md text-gray-400">
            Select a league below to view matches in an easy-to-navigate weekly calendar format. Click on any day to see
            detailed predictions for that day's matches.
          </p>
        </div>
        
        {/* League Selector */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <label htmlFor="league-select" className="text-lg font-semibold">
            Select League:
          </label>
          <select
            id="league-select"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="w-full md:w-64 p-2 bg-secondary text-text rounded-lg border border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Select a league...</option>
            {Object.entries(leagueOptions).map(([name, value]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedLeague ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-400">Please select a league to view upcoming matches</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <SoccerSpinner />
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-secondary rounded-lg p-8">
          <p className="text-xl text-gray-300 mb-4">No upcoming matches found</p>
          <p className="text-md text-gray-400 text-center">
            There are no scheduled matches for this league at the moment.
            Please check back later or select a different league.
          </p>
        </div>
      ) : (
        <>
          {/* View Mode Toggle */}
          <div className="flex justify-end mb-4 space-x-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'week' ? 'bg-accent text-black' : 'bg-secondary text-text hover:bg-accent/20'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'day' ? 'bg-accent text-black' : 'bg-secondary text-text hover:bg-accent/20'
              }`}
            >
              Day View
            </button>
          </div>

          {viewMode === 'week' ? (
            // Week View
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((date) => {
                const dayMatches = getMatchesForDate(date)
                const isToday = formatDate(date) === formatDate(new Date())
                
                return (
                  <div
                    key={date.toString()}
                    className={`p-4 rounded-lg ${
                      isToday ? 'bg-accent/20' : 'bg-secondary'
                    } cursor-pointer hover:bg-accent/10 transition-colors`}
                    onClick={() => {
                      setSelectedDate(date)
                      setViewMode('day')
                    }}
                  >
                    <div className="font-semibold mb-2">
                      {format(date, 'EEE, MMM d')}
                    </div>
                    {dayMatches.length > 0 ? (
                      <div className="text-sm space-y-2">
                        {dayMatches.map((match, idx) => (
                          <div key={idx} className="truncate">
                            {match.home_team} vs {match.away_team}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No matches</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            // Day View
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              {getMatchesForDate(selectedDate).map((match, idx) => (
                <div key={idx} className="bg-secondary p-6 rounded-lg">
                  <div className="text-xl font-semibold mb-4">
                    {match.home_team} vs {match.away_team}
                  </div>
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
              ))}
              {getMatchesForDate(selectedDate).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No matches scheduled for this day
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
