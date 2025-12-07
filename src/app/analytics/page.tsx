'use client'

import React, { useState, useEffect } from 'react';
import { leagues } from '@/data/leagues';
import { LeagueStats } from '../../components/LeagueStats';
import MLMetricsVisualizations from '../../components/MLMetricsVisualizations';
import { SoccerSpinner } from '../../components/SoccerSpinner';

export default function AnalyticsPage() {
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null)
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
  };

  const mappedLeague = selectedLeague ? leagueNameMap[selectedLeague] : null;

  useEffect(() => {
    if (selectedLeague) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000); // Simulate loading time
      return () => clearTimeout(timer);
    }
  }, [selectedLeague]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-primary sm:text-6xl md:text-7xl">League Analytics</h1>
        <p className="mt-4 text-xl text-secondary max-w-3xl mx-auto">
          Dive deep into the statistics of each league. Explore interactive charts to understand league dynamics, team performance, and the key factors that influence match outcomes.
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
      ) : mappedLeague && (
        <div className="space-y-12">
        {/* League Stats Component */}
        <div className="mb-16 transform transition-all duration-300 hover:scale-[1.01]">
          <LeagueStats league={mappedLeague} />
        </div>

        {/* ML Metrics Visualizations */}
        <div className="mb-12">
          <MLMetricsVisualizations league={mappedLeague} />
        </div>
        </div>
      )}
    </div>
  )
}