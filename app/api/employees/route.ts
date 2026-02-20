import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    const employees = await prisma.employee.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        allocations: true,
        company: { select: { id: true, name: true } },
        _count: { select: { payHistory: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(employees)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, companyId, walletAddress } = body
    if (!name || !email || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const employee = await prisma.employee.create({
      data: { name, email, companyId, walletAddress },
    })
    return NextResponse.json(employee, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
