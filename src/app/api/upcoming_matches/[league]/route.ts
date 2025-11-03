// NOTE: This Next.js API route is currently not being used.
// The upcoming matches page calls the Python backend directly at:
// ${NEXT_PUBLIC_BACKEND_URL}/api/upcoming_matches/${league}
// This route is kept as a fallback option.

import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

// Helper function to parse CSV data
const parseCSV = (csv: string) => {
  const lines = csv.trim().split('\n')
  const header = lines[0].split(',')
  const data = lines.slice(1).map(line => {
    const values = line.split(',')
    return header.reduce((obj, key, index) => {
      obj[key.trim()] = values[index].trim()
      return obj
    }, {} as Record<string, string>)
  })
  return data
}

export async function GET(request: Request, { params }: { params: { league: string } }) {
  const { league } = params
  const filePath = path.join(process.cwd(), 'fbref_data', 'processed', `${league}_processed.csv`)

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const matches = parseCSV(fileContent)

    const upcomingMatches = matches
      .filter(match => match.status === 'Scheduled')
      .map(match => ({
        ...match,
        date: new Date(match.date).toISOString(),
      }));

    return NextResponse.json(upcomingMatches)
  } catch (error) {
    console.error(error)
    return new NextResponse('Failed to load matches', { status: 500 })
  }
}
