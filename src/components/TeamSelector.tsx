'use client'

import { useStore } from '@/store/store'
import { leagues, teams } from '@/data/leagues'

interface TeamSelectorProps {
  type: 'head-to-head' | 'cross-league'
  formData: any
  setFormData: (data: any) => void
}

export const TeamSelector = ({ type, formData, setFormData }: TeamSelectorProps) => {

  if (type === 'head-to-head') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">League</label>
          <select
            value={formData.league}
            onChange={(e) => setFormData({ ...formData, league: e.target.value })}
            className="w-full p-2 bg-background rounded border border-gray-700"
          >
            <option value="">Select League</option>
            {leagues.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Home Team</label>
            <select
              value={formData.home_team}
              onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
              className="w-full p-2 bg-background rounded border border-gray-700"
              disabled={!formData.league}
            >
              <option value="">Select Home Team</option>
              {formData.league && teams[formData.league as keyof typeof teams].map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Away Team</label>
            <select
              value={formData.away_team}
              onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
              className="w-full p-2 bg-background rounded border border-gray-700"
              disabled={!formData.league}
            >
              <option value="">Select Away Team</option>
              {formData.league && teams[formData.league as keyof typeof teams].map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">League A</label>
          <select
            value={formData.league_a}
            onChange={(e) => setFormData({ ...formData, league_a: e.target.value })}
            className="w-full p-2 bg-background rounded border border-gray-700"
          >
            <option value="">Select League</option>
            {leagues.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Team A</label>
            <select
              value={formData.team_a}
              onChange={(e) => setFormData({ ...formData, team_a: e.target.value })}
              className="w-full p-2 bg-background rounded border border-gray-700"
              disabled={!formData.league_a}
            >
              <option value="">Select Team</option>
              {formData.league_a && teams[formData.league_a as keyof typeof teams].map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">League B</label>
          <select
            value={formData.league_b}
            onChange={(e) => setFormData({ ...formData, league_b: e.target.value })}
            className="w-full p-2 bg-background rounded border border-gray-700"
          >
            <option value="">Select League</option>
            {leagues.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Team B</label>
            <select
              value={formData.team_b}
              onChange={(e) => setFormData({ ...formData, team_b: e.target.value })}
              className="w-full p-2 bg-background rounded border border-gray-700"
              disabled={!formData.league_b}
            >
              <option value="">Select Team</option>
              {formData.league_b && teams[formData.league_b as keyof typeof teams].map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}