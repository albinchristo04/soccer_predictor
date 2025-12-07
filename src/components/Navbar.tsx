'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useStore } from '@/store/store'
import { leagues } from '@/data/leagues'
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('./ThemeToggle').then(mod => ({ default: mod.ThemeToggle })), {
  ssr: false,
  loading: () => <div className="p-2 w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
})

export const Navbar = () => {
  const { selectedLeague, setSelectedLeague } = useStore()
  const [isAnalyticsDropdownOpen, setIsAnalyticsDropdownOpen] = useState(false)
  const analyticsDropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (analyticsDropdownRef.current && !analyticsDropdownRef.current.contains(event.target as Node)) {
        setIsAnalyticsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsAnalyticsDropdownOpen(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b-4 border-green-500 dark:border-green-600 transition-colors duration-300" role="navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors">
            ⚽ Soccer Stats Predictor
          </Link>

          <div className="flex items-center space-x-6">
            <Link 
              href="/upcoming" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md"
            >
              Upcoming Matches
            </Link>
            <Link 
              href="/predict" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md"
            >
              Predict
            </Link>
            <Link 
              href="/analytics" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md"
            >
              Analytics
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md"
            >
              About
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}