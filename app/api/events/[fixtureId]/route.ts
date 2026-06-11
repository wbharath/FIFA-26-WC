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
      next: { revalidate: 60 }
    }
  )
  const data = await res.json()
  const response = data.response as any[]

  if (!response) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  }

  const subs = response
    .filter((e: any) => e.type === 'subst')
    .map((e: any) => ({
      time: { elapsed: e.time.elapsed },
      team: { id: e.team.id },
      player: { id: e.player.id, name: e.player.name },
      assist: { id: e.assist?.id, name: e.assist?.name }
    }))

  return NextResponse.json(subs, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  })
}
