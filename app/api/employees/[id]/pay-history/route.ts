import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const events = await prisma.payEvent.findMany({
      where: { employeeId: params.id },
      orderBy: { createdAt: 'desc' },
      include: { payrollRun: { select: { id: true, executedAt: true, totalAmount: true } } },
    })
    return NextResponse.json(events)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch pay history' }, { status: 500 })
  }
}
