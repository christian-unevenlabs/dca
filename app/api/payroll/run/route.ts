import { NextResponse } from 'next/server'
import { executePayrollRun } from '@/lib/payroll'

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { companyId, totalAmount, currency, employeeAmounts } = body

    if (!companyId || !totalAmount) {
      return NextResponse.json({ error: 'companyId and totalAmount are required' }, { status: 400 })
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'totalAmount must be positive' }, { status: 400 })
    }

    const result = await executePayrollRun({
      companyId,
      totalAmount: parseFloat(totalAmount),
      currency,
      employeeAmounts,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    const msg = (err as Error).message ?? 'Failed to execute payroll'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
