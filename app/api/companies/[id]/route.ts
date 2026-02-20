import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        _count: { select: { employees: true, payrollRuns: true } },
        employees: {
          include: {
            allocations: true,
            _count: { select: { payHistory: true } },
          },
        },
        payrollRuns: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { _count: { select: { payEvents: true } } },
        },
      },
    })
    return NextResponse.json(company)
  } catch (err) {
    const msg = (err as Error).message ?? 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
