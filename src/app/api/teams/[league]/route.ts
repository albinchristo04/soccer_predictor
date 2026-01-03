import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params

  try {
    const response = await fetch(`${BACKEND_URL}/api/teams/${league}`, {
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json({ success: true, teams: data.teams || [] })
  } catch (error: any) {
    console.error('Error loading teams:', error)
    return NextResponse.json(
      { error: 'Failed to load teams', details: error.message },
      { status: 500 }
    )
  }
}
