import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
    {
      headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY! },
      next: { revalidate: 300 }
    }
  )
  const data = await res.json()
  const response = data.response as any[]

  if (!response || response.length < 2 || !response[0]?.startXI?.length) {
    return NextResponse.json(null)
  }

  return NextResponse.json(
    {
      home: {
        team: response[0].team,
        formation: response[0].formation,
        startXI: response[0].startXI,
        substitutes: response[0].substitutes
      },
      away: {
        team: response[1].team,
        formation: response[1].formation,
        startXI: response[1].startXI,
        substitutes: response[1].substitutes
      }
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    }
  )
}
