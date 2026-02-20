import { NextResponse } from 'next/server'
import { getSupportedTokens } from '@/lib/relay'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const chainId = searchParams.get('chainId')
    if (!chainId) {
      return NextResponse.json({ error: 'chainId is required' }, { status: 400 })
    }
    const tokens = await getSupportedTokens(parseInt(chainId))
    return NextResponse.json(tokens)
  } catch (err) {
    const msg = (err as Error).message ?? 'Failed to fetch tokens'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
