import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ league: string }> }
) {
  const { league } = await params
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  
  try {
    let url = `${BACKEND_URL}/api/calendar/${league}`
    const queryParams = new URLSearchParams()
    
    if (year) queryParams.set('year', year)
    if (month) queryParams.set('month', month)
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`
    }
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching calendar:', error)
    // Return fallback calendar structure
    const now = new Date()
    return NextResponse.json({
      year: year ? parseInt(year) : now.getFullYear(),
      month: month ? parseInt(month) : now.getMonth() + 1,
      month_name: now.toLocaleString('default', { month: 'long' }),
      weeks: [],
      total_matches: 0
    })
  }
}
