import { NextResponse } from 'next/server'

const HEADERS = { 'x-apisports-key': process.env.APIFOOTBALL_KEY! }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  const [fixturesRes, standingsRes] = await Promise.all([
    fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
      headers: HEADERS,
      next: { revalidate: 3600 }
    }),
    fetch('https://v3.football.api-sports.io/standings?league=1&season=2026', {
      headers: HEADERS,
      next: { revalidate: 3600 }
    })
  ])

  const [fixturesData, standingsData] = await Promise.all([
    fixturesRes.json(),
    standingsRes.json()
  ])

  const groupMap: Record<number, string> = {}
  const standingsByGroup: Record<string, any[]> = {}

  const standings = standingsData.response[0]?.league?.standings || []
  standings.forEach((groupArray: any[]) => {
    groupArray.forEach((entry: any) => {
      groupMap[entry.team.id] = entry.group
      if (!standingsByGroup[entry.group]) standingsByGroup[entry.group] = []
      standingsByGroup[entry.group].push(entry)
    })
  })

  let fixtures = (fixturesData.response || []).map((match: any) => ({
    ...match,
    group:
      groupMap[match.teams.home.id] || groupMap[match.teams.away.id] || null
  }))

  if (teamId) {
    fixtures = fixtures.filter(
      (f: any) =>
        f.teams.home.id === Number(teamId) || f.teams.away.id === Number(teamId)
    )
  }

  return NextResponse.json({ fixtures, standingsByGroup })
}
