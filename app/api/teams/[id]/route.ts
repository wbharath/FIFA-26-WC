import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(`https://api.football-data.org/v4/teams/${id}`, {
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_API_KEY!
    },
    next: { revalidate: 3600 }
  })
  const data = await res.json()
  return NextResponse.json(data)
}
