
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { league: string } }
) {
  const league = params.league;
  try {
    const backendResponse = await fetch(`http://127.0.0.1:8000/api/analytics/goals_distribution/${league}`);
    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return new NextResponse(JSON.stringify(data), { status: backendResponse.status });
    }

    return new NextResponse(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
