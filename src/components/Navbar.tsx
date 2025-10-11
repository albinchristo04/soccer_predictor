'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/store'
import { League } from '@/types/api'

// Model type definition
interface Model {
  name: string
  available: boolean
}

// Available leagues
const leagues: League[] = [
  'premier_league',
  'la_liga',
  'bundesliga',
  'serie_a',
  'ligue_1',
  'mls',
  'ucl',
  'uel'
]

// Available models
const models: Model[] = [
  { name: 'RandomForest', available: true },
  { name: 'XGBoost', available: false },
  { name: 'Neural Network', available: false },
  { name: 'Ensemble', available: false }
]

// League name formatting
const formatLeagueName = (league: League): string => {
  const formatted = league.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  return formatted === 'Ucl' ? 'Champions League' 
       : formatted === 'Uel' ? 'Europa League'
       : formatted
}

export const Navbar = () => {
  const { selectedLeague, setSelectedLeague } = useStore()
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const leagueDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(event.target as Node)) {
        setIsLeagueDropdownOpen(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, dropdown: 'league' | 'model') => {
    if (e.key === 'Escape') {
      dropdown === 'league' ? setIsLeagueDropdownOpen(false) : setIsModelDropdownOpen(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-secondary py-4 shadow-lg" role="navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-accent transition-colors">
            ⚽ Soccer Stats Predictor
          </Link>

          <div className="flex items-center space-x-6">
            <div className="relative" ref={leagueDropdownRef}>
              <button 
                aria-haspopup="true"
                aria-expanded={isLeagueDropdownOpen}
                aria-label="Select league"
                onClick={() => setIsLeagueDropdownOpen(!isLeagueDropdownOpen)}
                onKeyDown={(e) => handleKeyDown(e, 'league')}
                className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
              >
                {selectedLeague ? formatLeagueName(selectedLeague as League) : 'Select League'} ▼
              </button>
              {isLeagueDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {leagues.map((league: League) => (
                    <button
                      key={league}
                      role="menuitem"
                      className="block w-full text-left px-4 py-2 hover:bg-background hover:text-accent focus:outline-none focus:bg-background focus:text-accent"
                      onClick={() => {
                        setSelectedLeague(league)
                        setIsLeagueDropdownOpen(false)
                      }}
                    >
                      {formatLeagueName(league)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={modelDropdownRef}>
              <button 
                aria-haspopup="true"
                aria-expanded={isModelDropdownOpen}
                aria-label="Select model"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                onKeyDown={(e) => handleKeyDown(e, 'model')}
                className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
              >
                Model ▼
              </button>
              {isModelDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {models.map(model => (
                    <button
                      key={model.name}
                      role="menuitem"
                      className={`block w-full text-left px-4 py-2 ${
                        model.available 
                          ? 'hover:bg-background hover:text-accent focus:bg-background focus:text-accent' 
                          : 'text-gray-500 cursor-not-allowed'
                      } focus:outline-none`}
                      disabled={!model.available}
                      aria-disabled={!model.available}
                    >
                      {model.name} {!model.available && '(coming soon)'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link 
              href="/predict" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              Predict
            </Link>
            <Link 
              href="/analyze" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              Analyze
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}