import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const run = await prisma.payrollRun.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        company: true,
        payEvents: {
          include: { employee: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    return NextResponse.json(run)
  } catch {
    return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
  }
}
