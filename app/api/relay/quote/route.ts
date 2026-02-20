import { NextResponse } from 'next/server'
import { getRelayQuote } from '@/lib/relay'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const quote = await getRelayQuote(body)
    return NextResponse.json(quote)
  } catch (err) {
    const msg = (err as Error).message ?? 'Failed to get quote'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
