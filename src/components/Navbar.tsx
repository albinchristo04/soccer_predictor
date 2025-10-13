'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/store'
import { leagues } from '@/data/leagues'



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
    <nav className="sticky top-0 z-50 bg-secondary py-4 shadow-lg" role="navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-accent transition-colors">
            ⚽ Soccer Stats Predictor
          </Link>

          <div className="flex items-center space-x-6">
            <Link 
              href="/predict" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              Predict
            </Link>
            <Link 
              href="/analytics" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              Analytics
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-md"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}