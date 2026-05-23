// app/api/predictions/route.ts
import { NextResponse } from 'next/server'
import predictions from '@/ml/predictions.json'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fixtureId = searchParams.get('fixture_id')

  if (fixtureId) {
    const prediction = (predictions as any[]).find(
      (p) => p.fixture_id === Number(fixtureId)
    )
    return NextResponse.json(prediction || null)
  }

  return NextResponse.json(predictions)
}
