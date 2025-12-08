import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import * as cheerio from 'cheerio'

export async function GET(request: Request, { params }: { params: Promise<{ league: string, season: string }> }) {
  const { league, season } = await params

  try {
    const seasonLinksPath = path.join(process.cwd(), 'fbref_data', 'season_links.json')
    const seasonLinksData = await fs.readFile(seasonLinksPath, 'utf-8')
    const seasonLinks = JSON.parse(seasonLinksData)

    const leagueSeasons = seasonLinks[league]
    if (!leagueSeasons) {
      return new NextResponse(`League not found: ${league}`, { status: 404 })
    }

    const seasonInfo = leagueSeasons.find((s: any) => s.season === season)
    if (!seasonInfo) {
      return new NextResponse(`Season not found: ${season}`, { status: 404 })
    }

    const response = await fetch(seasonInfo.fixtures_url)
    if (!response.ok) {
      return new NextResponse(`Failed to fetch fixtures from ${seasonInfo.fixtures_url}`, { status: response.status })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const matches: any[] = []
    $('table.stats_table tbody tr').each((i, el) => {
      const date = $(el).find('td[data-stat="date"]').text()
      const homeTeam = $(el).find('td[data-stat="squad_a"]').text()
      const awayTeam = $(el).find('td[data-stat="squad_b"]').text()

      if (date && homeTeam && awayTeam) {
        matches.push({
          date,
          home_team: homeTeam,
          away_team: awayTeam,
        })
      }
    })

    return NextResponse.json(matches)
  } catch (error: any) {
    console.error(error)
    return new NextResponse(error.message, { status: 500 })
  }
}
