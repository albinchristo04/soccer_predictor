'use client'

import { useMemo } from 'react'

interface PlayerLineup {
  name: string
  position?: string
  jersey?: number
  isSubstitute?: boolean
  rating?: number
  events?: {
    goal?: number
    assist?: number
    yellowCard?: boolean
    redCard?: boolean
    subOff?: number
    subOn?: number
  }
}

interface FormationDisplayProps {
  players: PlayerLineup[]
  formation?: string
  teamName: string
  teamColor?: 'blue' | 'orange' | 'red' | 'green'
  showStats?: boolean
}

// Comprehensive position mapping to formation roles
const POSITION_TO_ROLE: Record<string, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  // Goalkeepers
  'GK': 'GK', 'G': 'GK', 'Goalkeeper': 'GK',
  
  // Defenders
  'CB': 'DEF', 'LB': 'DEF', 'RB': 'DEF', 'LWB': 'DEF', 'RWB': 'DEF',
  'D': 'DEF', 'DF': 'DEF', 'SW': 'DEF', 'LCB': 'DEF', 'RCB': 'DEF',
  'Defender': 'DEF', 'Center Back': 'DEF', 'Left Back': 'DEF', 'Right Back': 'DEF',
  
  // Midfielders
  'CM': 'MID', 'CDM': 'MID', 'CAM': 'MID', 'LM': 'MID', 'RM': 'MID',
  'DM': 'MID', 'AM': 'MID', 'M': 'MID', 'MF': 'MID',
  'LCM': 'MID', 'RCM': 'MID', 'LDM': 'MID', 'RDM': 'MID',
  'Midfielder': 'MID', 'Attacking Midfielder': 'MID', 'Defensive Midfielder': 'MID',
  
  // Forwards
  'ST': 'FWD', 'LW': 'FWD', 'RW': 'FWD', 'CF': 'FWD', 'F': 'FWD', 'FW': 'FWD',
  'SS': 'FWD', 'LF': 'FWD', 'RF': 'FWD',
  'Forward': 'FWD', 'Striker': 'FWD', 'Left Wing': 'FWD', 'Right Wing': 'FWD',
}

// Common formation configurations
const FORMATION_CONFIGS: Record<string, number[][]> = {
  // 4 at back
  '4-3-3': [[1], [4], [3], [3]],
  '4-4-2': [[1], [4], [4], [2]],
  '4-2-3-1': [[1], [4], [2, 3], [1]],
  '4-1-4-1': [[1], [4], [1, 4], [1]],
  '4-5-1': [[1], [4], [5], [1]],
  '4-4-1-1': [[1], [4], [4, 1], [1]],
  '4-1-2-3': [[1], [4], [1, 2], [3]],
  '4-3-2-1': [[1], [4], [3, 2], [1]],
  
  // 3 at back
  '3-4-3': [[1], [3], [4], [3]],
  '3-5-2': [[1], [3], [5], [2]],
  '3-4-2-1': [[1], [3], [4, 2], [1]],
  '3-4-1-2': [[1], [3], [4, 1], [2]],
  '3-1-4-2': [[1], [3], [1, 4], [2]],
  
  // 5 at back
  '5-3-2': [[1], [5], [3], [2]],
  '5-4-1': [[1], [5], [4], [1]],
  '5-2-3': [[1], [5], [2], [3]],
}

// Color schemes for teams
const TEAM_COLORS = {
  blue: {
    gk: 'bg-yellow-500',
    def: 'bg-blue-700',
    mid: 'bg-blue-500',
    fwd: 'bg-blue-400',
  },
  orange: {
    gk: 'bg-yellow-500',
    def: 'bg-orange-700',
    mid: 'bg-orange-500',
    fwd: 'bg-red-500',
  },
  red: {
    gk: 'bg-yellow-500',
    def: 'bg-red-800',
    mid: 'bg-red-600',
    fwd: 'bg-red-500',
  },
  green: {
    gk: 'bg-yellow-500',
    def: 'bg-green-700',
    mid: 'bg-green-500',
    fwd: 'bg-green-400',
  },
}

export default function FormationDisplay({
  players,
  formation,
  teamName,
  teamColor = 'blue',
  showStats = true,
}: FormationDisplayProps) {
  const colors = TEAM_COLORS[teamColor]
  
  // Parse and organize players into formation rows
  const formationRows = useMemo(() => {
    const starters = players.slice(0, 11)
    
    if (starters.length === 0) return null
    
    // Try to identify players by their positions first
    const gk: PlayerLineup[] = []
    const def: PlayerLineup[] = []
    const mid: PlayerLineup[] = []
    const fwd: PlayerLineup[] = []
    const unassigned: PlayerLineup[] = []
    
    starters.forEach(player => {
      const role = player.position ? POSITION_TO_ROLE[player.position] : undefined
      
      switch (role) {
        case 'GK': gk.push(player); break
        case 'DEF': def.push(player); break
        case 'MID': mid.push(player); break
        case 'FWD': fwd.push(player); break
        default: unassigned.push(player)
      }
    })
    
    const hasPositionData = gk.length > 0 || def.length > 0 || mid.length > 0 || fwd.length > 0
    
    // If we have position data, use it
    if (hasPositionData && gk.length === 1) {
      // Distribute unassigned players intelligently
      unassigned.forEach((player, idx) => {
        // Try to fit into the formation
        if (def.length < 5) def.push(player)
        else if (mid.length < 5) mid.push(player)
        else fwd.push(player)
      })
      
      return {
        rows: [
          { players: fwd, color: colors.fwd, label: 'FWD' },
          { players: mid, color: colors.mid, label: 'MID' },
          { players: def, color: colors.def, label: 'DEF' },
          { players: gk, color: colors.gk, label: 'GK' },
        ].filter(row => row.players.length > 0),
        formation: `${def.length}-${mid.length}-${fwd.length}`,
      }
    }
    
    // Parse formation string and distribute players
    const parseFormation = (formationStr: string | undefined): number[] => {
      if (!formationStr) return [4, 3, 3] // Default
      
      // Clean and parse
      const cleaned = formationStr.replace(/[^0-9-]/g, '')
      const parts = cleaned.split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n > 0)
      
      if (parts.length >= 2) {
        // Ensure total is 10 (excluding GK)
        const total = parts.reduce((a, b) => a + b, 0)
        if (total === 10) return parts
        
        // Adjust if needed
        if (total < 10) {
          parts[parts.length - 1] += (10 - total)
        }
        return parts
      }
      
      return [4, 3, 3]
    }
    
    const formationNumbers = parseFormation(formation)
    
    // Distribute players by formation
    const rows: { players: PlayerLineup[]; color: string; label: string }[] = []
    let playerIndex = 1 // Start after GK
    
    // Build formation rows (from defense to attack)
    const rowLabels = ['DEF', 'MID', 'FWD', 'FWD'] // For formations with 4 rows
    const rowColors = [colors.def, colors.mid, colors.fwd, colors.fwd]
    
    formationNumbers.forEach((count, idx) => {
      const rowPlayers = starters.slice(playerIndex, playerIndex + count)
      if (rowPlayers.length > 0) {
        rows.push({
          players: rowPlayers,
          color: rowColors[Math.min(idx, rowColors.length - 1)],
          label: rowLabels[Math.min(idx, rowLabels.length - 1)],
        })
      }
      playerIndex += count
    })
    
    // Reverse so FWD is at top
    rows.reverse()
    
    // Add GK at bottom
    rows.push({
      players: starters.slice(0, 1),
      color: colors.gk,
      label: 'GK',
    })
    
    return {
      rows,
      formation: formationNumbers.join('-'),
    }
  }, [players, formation, colors])
  
  // Render a player node with jersey and name
  const renderPlayer = (player: PlayerLineup, idx: number, bgColor: string) => {
    const lastName = player.name.split(' ').pop() || player.name
    const hasEvents = player.events && (
      player.events.goal || player.events.assist || 
      player.events.yellowCard || player.events.redCard
    )
    
    return (
      <div
        key={`${player.name}-${idx}`}
        className="flex flex-col items-center group relative"
      >
        {/* Player circle */}
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/60 transition-transform group-hover:scale-110`}
        >
          {player.jersey || (idx + 1)}
        </div>
        
        {/* Player name */}
        <p className="text-[10px] sm:text-xs text-white mt-1 max-w-[60px] sm:max-w-[70px] truncate text-center drop-shadow-md font-medium">
          {lastName}
        </p>
        
        {/* Event indicators */}
        {hasEvents && showStats && (
          <div className="absolute -top-2 -right-1 flex gap-0.5">
            {player.events?.goal && (
              <span className="text-[10px] bg-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                ⚽
              </span>
            )}
            {player.events?.assist && (
              <span className="text-[10px] bg-white rounded-full w-4 h-4 flex items-center justify-center shadow">
                👟
              </span>
            )}
            {player.events?.yellowCard && (
              <span className="w-2 h-3 bg-yellow-400 rounded-sm shadow" />
            )}
            {player.events?.redCard && (
              <span className="w-2 h-3 bg-red-500 rounded-sm shadow" />
            )}
          </div>
        )}
        
        {/* Hover tooltip with full name */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {player.name}
          {player.position && <span className="ml-1 text-white/70">({player.position})</span>}
        </div>
      </div>
    )
  }
  
  if (!formationRows) {
    return (
      <div className="flex items-center justify-center h-[300px] text-white/60">
        Lineup not available
      </div>
    )
  }
  
  return (
    <div className="relative h-full min-h-[320px] flex flex-col justify-between py-3 gap-4">
      {formationRows.rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex justify-center items-center gap-3 sm:gap-4 px-2"
          style={{
            // Distribute evenly across the pitch
            flex: row.label === 'GK' ? '0 0 auto' : 1,
          }}
        >
          {row.players.map((player, playerIdx) => 
            renderPlayer(player, playerIdx, row.color)
          )}
        </div>
      ))}
    </div>
  )
}

// Separate component for the pitch background
export function PitchBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-gradient-to-b from-green-700 via-green-600 to-green-700 p-4 min-h-[350px] overflow-hidden">
      {/* Pitch pattern stripes */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`h-[10%] ${i % 2 === 0 ? 'bg-black/10' : ''}`}
          />
        ))}
      </div>
      
      {/* Pitch lines */}
      <div className="absolute inset-4 border-2 border-white/40 rounded-lg">
        {/* Center line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/40" />
        
        {/* Center circle */}
        <div className="absolute left-1/2 top-1/2 w-20 h-20 -ml-10 -mt-10 rounded-full border-2 border-white/40" />
        <div className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-white/40" />
        
        {/* Top goal area (18-yard box) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/40 border-t-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 border-2 border-white/40 border-t-0" />
        
        {/* Bottom goal area */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/40 border-b-0" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 border-2 border-white/40 border-b-0" />
        
        {/* Corner arcs */}
        <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-full" />
        <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-full" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-full" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}

// Substitutes bench component
export function SubstitutesBench({ players }: { players: PlayerLineup[] }) {
  if (players.length === 0) return null
  
  return (
    <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Substitutes</h4>
      <div className="flex flex-wrap gap-2">
        {players.map((player, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--muted-bg)]"
          >
            <span className="w-5 h-5 rounded-full bg-gray-500 text-white text-[10px] flex items-center justify-center">
              {player.jersey || (idx + 12)}
            </span>
            <span className="text-xs text-[var(--text-primary)]">
              {player.name}
            </span>
            {player.position && (
              <span className="text-[10px] text-[var(--text-tertiary)]">
                {player.position}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
