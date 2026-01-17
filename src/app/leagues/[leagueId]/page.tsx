import LeagueHomePage from '@/components/league/LeagueHomePage'
import TournamentHomePage from '@/components/tournament/TournamentHomePage'

// League configuration for known leagues
const LEAGUE_CONFIG: Record<string, { name: string; country: string; isTournament?: boolean; tournamentId?: 'champions_league' | 'europa_league' | 'world_cup' }> = {
  'eng.1': { name: 'Premier League', country: 'England' },
  'esp.1': { name: 'La Liga', country: 'Spain' },
  'ger.1': { name: 'Bundesliga', country: 'Germany' },
  'ita.1': { name: 'Serie A', country: 'Italy' },
  'fra.1': { name: 'Ligue 1', country: 'France' },
  'usa.1': { name: 'MLS', country: 'USA' },
  'uefa.champions': { name: 'UEFA Champions League', country: 'Europe', isTournament: true, tournamentId: 'champions_league' },
  'uefa.europa': { name: 'UEFA Europa League', country: 'Europe', isTournament: true, tournamentId: 'europa_league' },
  'fifa.world': { name: 'FIFA World Cup', country: 'International', isTournament: true, tournamentId: 'world_cup' },
  'premier_league': { name: 'Premier League', country: 'England' },
  'la_liga': { name: 'La Liga', country: 'Spain' },
  'bundesliga': { name: 'Bundesliga', country: 'Germany' },
  'serie_a': { name: 'Serie A', country: 'Italy' },
  'ligue_1': { name: 'Ligue 1', country: 'France' },
  'champions_league': { name: 'UEFA Champions League', country: 'Europe', isTournament: true, tournamentId: 'champions_league' },
  'europa_league': { name: 'UEFA Europa League', country: 'Europe', isTournament: true, tournamentId: 'europa_league' },
  'world_cup': { name: 'FIFA World Cup', country: 'International', isTournament: true, tournamentId: 'world_cup' },
  'mls': { name: 'MLS', country: 'USA' },
}

interface LeaguePageParams {
  params: Promise<{
    leagueId: string
  }>
}

export default async function LeaguePage({ params }: LeaguePageParams) {
  const { leagueId } = await params
  const config = LEAGUE_CONFIG[leagueId] || { 
    name: leagueId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    country: 'Unknown'
  }
  
  // Use TournamentHomePage for tournament competitions (UCL, UEL, World Cup)
  if (config.isTournament && config.tournamentId) {
    return (
      <TournamentHomePage
        tournamentId={config.tournamentId}
        tournamentName={config.name}
      />
    )
  }
  
  return (
    <LeagueHomePage
      leagueId={leagueId}
      leagueName={config.name}
      country={config.country}
    />
  )
}

export function generateStaticParams() {
  return Object.keys(LEAGUE_CONFIG).map((leagueId) => ({
    leagueId,
  }))
}

export async function generateMetadata({ params }: LeaguePageParams) {
  const { leagueId } = await params
  const config = LEAGUE_CONFIG[leagueId]
  const name = config?.name || leagueId
  
  return {
    title: `${name} | Soccer Predictor`,
    description: `Latest standings, fixtures, results and predictions for ${name}`,
  }
}
