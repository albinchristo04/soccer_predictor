import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string; date: string }> }
) {
  const { league, date } = await params
  
  try {
    const url = `${BACKEND_URL}/api/matches_by_date/${league}/${date}`
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // For 404 or other errors, return empty array gracefully
    if (!response.ok) {
      console.warn(`Backend returned ${response.status} for matches_by_date/${league}/${date}`)
      return NextResponse.json([])
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching matches by date:', error)
    return NextResponse.json([])
  }
}
