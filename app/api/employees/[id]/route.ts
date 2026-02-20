import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        allocations: true,
        company: true,
        payHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { payrollRun: { select: { id: true, executedAt: true } } },
        },
      },
    })
    return NextResponse.json(employee)
  } catch {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { walletAddress, name, email } = body
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: { walletAddress, name, email },
      include: { allocations: true },
    })
    return NextResponse.json(employee)
  } catch {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}
