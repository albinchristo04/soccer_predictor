'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Types for knockout bracket
export interface KnockoutMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  homePenalties?: number
  awayPenalties?: number
  date?: string
  time?: string
  status: 'scheduled' | 'live' | 'finished'
  venue?: string
  round: string
  leg?: 1 | 2
  aggregateHome?: number
  aggregateAway?: number
  winner?: 'home' | 'away' | null
}

export interface BracketRound {
  name: string
  matches: KnockoutMatch[]
}

interface TeamProbability {
  team: string
  probability: number
}

interface SimulationData {
  champion: TeamProbability[]
  final: TeamProbability[]
  semi_finals: TeamProbability[]
  quarter_finals: TeamProbability[]
  round_of_16?: TeamProbability[]
}

interface KnockoutBracketProps {
  tournament: 'champions_league' | 'europa_league' | 'world_cup'
  rounds?: BracketRound[]
  simulationData?: SimulationData
  showProbabilities?: boolean
  onMatchClick?: (match: KnockoutMatch) => void
}

const TOURNAMENT_CONFIG = {
  champions_league: {
    name: 'UEFA Champions League',
    emoji: '🏆',
    gradient: 'from-blue-800 to-indigo-600',
    color: 'blue',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    rounds: ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'],
    isTwoLegged: [true, true, true, false], // R16, QF, SF are two-legged, Final is single
  },
  europa_league: {
    name: 'UEFA Europa League',
    emoji: '🏆',
    gradient: 'from-orange-500 to-amber-500',
    color: 'orange',
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-500',
    rounds: ['Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Final'],
    isTwoLegged: [true, true, true, true, false],
  },
  world_cup: {
    name: 'FIFA World Cup',
    emoji: '🌍',
    gradient: 'from-purple-900 to-red-800',
    color: 'purple',
    textColor: 'text-purple-500',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    rounds: ['Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Third Place', 'Final'],
    isTwoLegged: [false, false, false, false, false], // World Cup uses single matches
  },
}

// Match card component for the bracket
function BracketMatchCard({
  match,
  config,
  probability,
  showProbability,
  onMatchClick,
  isCompact = false,
}: {
  match: KnockoutMatch
  config: typeof TOURNAMENT_CONFIG.champions_league
  probability?: { home?: number; away?: number }
  showProbability?: boolean
  onMatchClick?: (match: KnockoutMatch) => void
  isCompact?: boolean
}) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  
  // Determine winner styling
  const homeWon = match.winner === 'home'
  const awayWon = match.winner === 'away'
  
  const handleClick = () => {
    if (onMatchClick) {
      onMatchClick(match)
    }
  }

  return (
    <div
      className={`
        bg-[var(--card-bg)] rounded-xl border overflow-hidden
        transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:border-[var(--accent-primary)]
        ${isLive ? 'border-red-500 shadow-red-500/20' : ''}
        ${isCompact ? 'w-[180px]' : 'w-[220px]'}
      `}
      style={{ borderColor: isLive ? undefined : 'var(--border-color)' }}
      onClick={handleClick}
    >
      {/* Match header with date/status */}
      <div className={`px-3 py-1.5 text-xs flex items-center justify-between ${isLive ? 'bg-red-500/20' : 'bg-[var(--muted-bg)]'}`}>
        {isLive ? (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-red-500">LIVE</span>
          </div>
        ) : isFinished ? (
          <span className="text-[var(--text-tertiary)]">FT</span>
        ) : match.date ? (
          <span className="text-[var(--text-tertiary)]">{match.date}</span>
        ) : (
          <span className="text-[var(--text-tertiary)]">TBD</span>
        )}
        {match.leg && (
          <span className="text-[var(--text-tertiary)]">Leg {match.leg}</span>
        )}
      </div>
      
      {/* Teams */}
      <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
        {/* Home Team */}
        <div className={`px-3 py-2 flex items-center justify-between ${homeWon ? 'bg-green-500/10' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-sm font-medium truncate ${homeWon ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
              {match.homeTeam || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showProbability && probability?.home !== undefined && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {(probability.home * 100).toFixed(0)}%
              </span>
            )}
            {match.homeScore !== undefined && (
              <span className={`font-bold ${homeWon ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
                {match.homeScore}
                {match.homePenalties !== undefined && (
                  <span className="text-xs text-[var(--text-tertiary)] ml-0.5">({match.homePenalties})</span>
                )}
              </span>
            )}
          </div>
        </div>
        
        {/* Away Team */}
        <div className={`px-3 py-2 flex items-center justify-between ${awayWon ? 'bg-green-500/10' : ''}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`text-sm font-medium truncate ${awayWon ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
              {match.awayTeam || 'TBD'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showProbability && probability?.away !== undefined && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {(probability.away * 100).toFixed(0)}%
              </span>
            )}
            {match.awayScore !== undefined && (
              <span className={`font-bold ${awayWon ? 'text-green-500' : 'text-[var(--text-primary)]'}`}>
                {match.awayScore}
                {match.awayPenalties !== undefined && (
                  <span className="text-xs text-[var(--text-tertiary)] ml-0.5">({match.awayPenalties})</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Aggregate for two-legged ties */}
      {(match.aggregateHome !== undefined || match.aggregateAway !== undefined) && (
        <div className="px-3 py-1.5 bg-[var(--muted-bg)] text-xs text-center text-[var(--text-tertiary)]">
          Agg: {match.aggregateHome ?? 0} - {match.aggregateAway ?? 0}
        </div>
      )}
    </div>
  )
}

// Connector line component
function BracketConnector({ direction, height = 40 }: { direction: 'left' | 'right'; height?: number }) {
  return (
    <div
      className={`relative ${direction === 'left' ? 'mr-4' : 'ml-4'}`}
      style={{ width: 24, height }}
    >
      <svg
        className="absolute inset-0 text-[var(--border-color)]"
        viewBox={`0 0 24 ${height}`}
        preserveAspectRatio="none"
      >
        {direction === 'left' ? (
          <>
            <line x1="24" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="0" x2="12" y2={height} stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1={height} x2="24" y2={height} stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1={height / 2} x2="12" y2={height / 2} stroke="currentColor" strokeWidth="2" />
          </>
        ) : (
          <>
            <line x1="0" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="0" x2="12" y2={height} stroke="currentColor" strokeWidth="2" />
            <line x1="0" y1={height} x2="12" y2={height} stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1={height / 2} x2="24" y2={height / 2} stroke="currentColor" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  )
}

// Main bracket visualization
export default function KnockoutBracket({
  tournament,
  rounds = [],
  simulationData,
  showProbabilities = false,
  onMatchClick,
}: KnockoutBracketProps) {
  const config = TOURNAMENT_CONFIG[tournament]
  
  // Mapping from display round names to simulation data keys
  const ROUND_NAME_TO_KEY: Record<string, keyof SimulationData> = {
    'round of 16': 'round_of_16',
    'round of 32': 'round_of_16', // Map to closest available key
    'quarter-finals': 'quarter_finals',
    'quarter-final': 'quarter_finals',
    'semi-finals': 'semi_finals',
    'semi-final': 'semi_finals',
    'final': 'final',
    'third place': 'semi_finals', // Third place uses semi-final teams
  }
  
  // Helper to get probability for a team in a specific round
  const getTeamProbability = (teamName: string, roundName: string): number | undefined => {
    if (!simulationData || !showProbabilities) return undefined
    
    // Use the mapping to get the correct key, with fallback to string manipulation
    const normalizedRound = roundName.toLowerCase()
    const roundKey = ROUND_NAME_TO_KEY[normalizedRound] || 
      normalizedRound.replace(/-/g, '_').replace(/ /g, '_') as keyof SimulationData
    
    const roundData = simulationData[roundKey]
    if (!roundData) return undefined
    
    const teamData = roundData.find(t => t.team.toLowerCase() === teamName.toLowerCase())
    return teamData?.probability
  }
  
  // Group matches by round
  const matchesByRound: Record<string, KnockoutMatch[]> = {}
  for (const round of rounds) {
    matchesByRound[round.name] = round.matches
  }
  
  // If no rounds provided, show a placeholder bracket
  if (rounds.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border rounded-2xl p-6" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className={`text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2`}>
          <span>{config.emoji}</span>
          <span>{config.name} Knockout Stage</span>
        </h2>
        
        <div className="text-center py-12">
          <p className="text-[var(--text-tertiary)] mb-4">Knockout bracket will appear once teams are confirmed</p>
          <Link 
            href={`/leagues/${tournament}`}
            className={`inline-block px-6 py-3 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-semibold hover:opacity-90 transition-opacity`}
          >
            View Tournament Details
          </Link>
        </div>
      </div>
    )
  }
  
  // Render the bracket
  return (
    <div className="bg-[var(--card-bg)] border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} px-6 py-4`}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>{config.emoji}</span>
          <span>{config.name} Knockout Stage</span>
        </h2>
        {showProbabilities && simulationData && (
          <p className="text-white/70 text-sm mt-1">
            Probabilities based on simulation model
          </p>
        )}
      </div>
      
      {/* Bracket visualization */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-max">
          {/* Horizontal bracket layout */}
          <div className="flex items-center justify-center gap-8">
            {config.rounds.map((roundName, roundIdx) => {
              const roundMatches = matchesByRound[roundName] || []
              // Calculate expected number of matches for this round:
              // In a knockout tournament, each round halves the number of teams.
              // Starting from the first round (R16 = 8 matches), we have:
              // R16: 2^3=8, QF: 2^2=4, SF: 2^1=2, Final: 2^0=1
              // Formula: 2^(totalRounds - 1 - currentRoundIndex)
              const matchCount = roundMatches.length || Math.pow(2, config.rounds.length - 1 - roundIdx)
              
              return (
                <div key={roundName} className="flex flex-col items-center">
                  {/* Round header */}
                  <div className={`mb-4 px-4 py-2 rounded-full ${config.bgColor}/10`}>
                    <h3 className={`text-sm font-semibold ${config.textColor}`}>
                      {roundName}
                    </h3>
                  </div>
                  
                  {/* Matches */}
                  <div 
                    className="flex flex-col gap-4"
                    style={{
                      // Increase spacing between matches as we go deeper in bracket
                      // to align with the bracket structure visually
                      gap: `${Math.pow(2, roundIdx + 1) * 16}px`
                    }}
                  >
                    {roundMatches.length > 0 ? (
                      roundMatches.map((match, matchIdx) => (
                        <BracketMatchCard
                          key={match.id}
                          match={match}
                          config={config}
                          showProbability={showProbabilities}
                          probability={{
                            home: getTeamProbability(match.homeTeam, roundName),
                            away: getTeamProbability(match.awayTeam, roundName),
                          }}
                          onMatchClick={onMatchClick}
                          isCompact={roundIdx < 2}
                        />
                      ))
                    ) : (
                      // Placeholder matches
                      Array.from({ length: matchCount }).map((_, idx) => (
                        <div
                          key={idx}
                          className="w-[180px] h-[84px] rounded-xl border-2 border-dashed flex items-center justify-center"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <span className="text-sm text-[var(--text-tertiary)]">TBD</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Champion display if we have simulation data */}
      {simulationData?.champion && simulationData.champion.length > 0 && (
        <div className={`border-t px-6 py-4 bg-gradient-to-r ${config.gradient}/10`} style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl">🏆</span>
            <div className="text-center">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Predicted Champion</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {simulationData.champion[0].team}
              </p>
              <p className={`text-sm ${config.textColor}`}>
                {(simulationData.champion[0].probability * 100).toFixed(1)}% probability
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export types - note: BracketRound and KnockoutMatch are already exported as interfaces above
export type { SimulationData, TeamProbability }
