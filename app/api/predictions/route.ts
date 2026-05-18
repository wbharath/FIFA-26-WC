import { NextResponse } from 'next/server'
import predictions from '@/ml/predictions.json'

export async function GET() {
  return NextResponse.json(predictions)
}
