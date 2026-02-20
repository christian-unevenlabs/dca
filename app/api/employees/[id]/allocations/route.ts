import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAllocations } from '@/lib/payroll'

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const allocations = await prisma.tokenAllocation.findMany({
      where: { employeeId: params.id },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(allocations)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { allocations } = body as {
      allocations: Array<{
        tokenSymbol: string
        tokenAddress: string
        chainId: number
        chainName: string
        percentage: number
      }>
    }

    if (!Array.isArray(allocations)) {
      return NextResponse.json({ error: 'allocations must be an array' }, { status: 400 })
    }

    const validationError = validateAllocations(allocations)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Replace all allocations atomically
    await prisma.$transaction([
      prisma.tokenAllocation.deleteMany({ where: { employeeId: params.id } }),
      prisma.tokenAllocation.createMany({
        data: allocations.map((a) => ({ ...a, employeeId: params.id })),
      }),
    ])

    const updated = await prisma.tokenAllocation.findMany({
      where: { employeeId: params.id },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save allocations' }, { status: 500 })
  }
}
