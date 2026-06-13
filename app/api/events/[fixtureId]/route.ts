import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
    {
      headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY! },
      cache: 'no-store'
    }
  )
  const data = await res.json()
  const response = data.response as any[]

  if (!response || response.length === 0) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'no-store' }
    })
  }

  const events = response
    .filter((e: any) => e.type === 'subst' || e.type === 'Goal')
    .map((e: any) => ({
      time: { elapsed: e.time.elapsed },
      team: { id: e.team.id },
      player: { id: e.player?.id, name: e.player?.name },
      assist: { id: e.assist?.id, name: e.assist?.name },
      type: e.type as 'Goal' | 'subst',
      detail: e.detail as string
    }))

  return NextResponse.json(events, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' }
  })
}
