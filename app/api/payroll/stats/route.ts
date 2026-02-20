import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [runCount, volumeAgg, feeAgg] = await Promise.all([
      prisma.payrollRun.count({ where: { status: 'complete' } }),
      prisma.payrollRun.aggregate({
        where: { status: 'complete' },
        _sum: { totalAmount: true },
      }),
      prisma.payEvent.aggregate({
        where: { status: 'complete' },
        _sum: { relayFeeUSD: true, amountUSDC: true },
        _avg: { relayFeeBps: true },
      }),
    ])

    const totalRouted = volumeAgg._sum.totalAmount ?? 0
    const totalFees = feeAgg._sum.relayFeeUSD ?? 0
    const avgBps = feeAgg._avg.relayFeeBps ?? 0

    return NextResponse.json({ totalRouted, totalFees, avgBps, runCount })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
