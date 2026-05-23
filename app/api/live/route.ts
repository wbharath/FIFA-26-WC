import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch(
    'https://v3.football.api-sports.io/fixtures?live=all&league=1',
    {
      headers: {
        'x-apisports-key': process.env.APIFOOTBALL_KEY!
      },
      next: { revalidate: 1200 } // 20 minutes
    }
  )
  const data = await res.json()
  return NextResponse.json(data.response)
}
