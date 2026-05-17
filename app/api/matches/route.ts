import { NextResponse } from "next/server"

export async function GET() {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      {
        headers: {
          'x-Auth-Token': process.env.FOOTBALL_API_KEY!,
        },
        next:{revalidate: 3600},
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
}