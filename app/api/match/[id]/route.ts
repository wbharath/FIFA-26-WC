import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?id=${id}`,
    {
      headers: {
        'x-apisports-key': process.env.APIFOOTBALL_KEY!
      },
      next: { revalidate: 300 }
    }
  )
  const data = await res.json()
  return NextResponse.json(data.response[0] ?? null)
}
