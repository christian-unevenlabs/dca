import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    const runs = await prisma.payrollRun.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { payEvents: true } },
      },
    })
    return NextResponse.json(runs)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payroll runs' }, { status: 500 })
  }
}
