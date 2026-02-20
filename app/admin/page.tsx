'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/shared/StatusPill'
import { formatUSD, formatDate, truncateAddress } from '@/lib/utils'
import { Users, DollarSign, Clock, AlertCircle, ArrowRight, Plus, Wallet, Play } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Company {
  id: string
  name: string
  walletAddress: string
  chain: string
  balance: number
  _count: { employees: number; payrollRuns: number }
}

interface PayrollRun {
  id: string
  totalAmount: number
  status: string
  createdAt: string
  executedAt: string | null
  _count: { payEvents: number }
}

interface CompanyDetail extends Company {
  employees: Array<{ id: string; allocations: unknown[] }>
  payrollRuns: PayrollRun[]
}

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompany, setActiveCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data)
        if (data.length > 0) {
          return fetch(`/api/companies/${data[0].id}`)
            .then((r) => r.json())
            .then(setActiveCompany)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const totalPaid = activeCompany?.payrollRuns
    .filter((r) => r.status === 'complete')
    .reduce((sum, r) => sum + r.totalAmount, 0) ?? 0

  const lastPayroll = activeCompany?.payrollRuns.find((r) => r.status === 'complete')

  const pendingAllocations = activeCompany?.employees.filter(
    (e) => (e.allocations as unknown[]).length === 0
  ).length ?? 0

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{activeCompany?.name ?? 'Dashboard'}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {activeCompany?.walletAddress ? (
              <>Wallet: <span className="font-mono text-indigo-400">{truncateAddress(activeCompany.walletAddress)}</span></>
            ) : 'No wallet connected'}
            {' · '}
            <span className="capitalize">{activeCompany?.chain ?? 'ethereum'}</span>
          </p>
        </div>

        {/* Company switcher */}
        {companies.length > 1 && (
          <div className="flex items-center gap-2">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  fetch(`/api/companies/${c.id}`).then(r => r.json()).then(setActiveCompany)
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeCompany?.id === c.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/payroll">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Play className="h-4 w-4" />
            Run Payroll
          </Button>
        </Link>
        <Link href="/admin/employees">
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </Link>
        <Link href="/admin/wallet">
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10">
            <Wallet className="h-4 w-4" />
            Fund Wallet
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{activeCompany?._count.employees ?? 0}</div>
            <p className="mt-1 text-xs text-gray-500">
              {pendingAllocations > 0 ? `${pendingAllocations} pending allocation setup` : 'All configured'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Company Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {formatUSD(activeCompany?.balance ?? 0)}
            </div>
            <p className="mt-1 text-xs text-gray-500">USDC available</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Last Payroll</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {lastPayroll ? formatDate(lastPayroll.executedAt ?? lastPayroll.createdAt) : '—'}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {lastPayroll ? formatUSD(lastPayroll.totalAmount) : 'No payrolls yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Paid (All Time)</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{formatUSD(totalPaid)}</div>
            <p className="mt-1 text-xs text-gray-500">
              {activeCompany?.payrollRuns.filter((r) => r.status === 'complete').length ?? 0} completed runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Allocations Alert */}
      {pendingAllocations > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-300">
            {pendingAllocations} employee{pendingAllocations > 1 ? 's' : ''} haven't set up token preferences — they'll receive USDC on Solana by default.
          </p>
          <Link href="/admin/employees" className="ml-auto">
            <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              View Employees
            </Button>
          </Link>
        </div>
      )}

      {/* Recent Payroll Runs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Payroll Runs</h2>
          <Link href="/admin/payroll/history">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-400 hover:text-white">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {activeCompany?.payrollRuns.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-sm text-gray-400">No payroll runs yet</p>
              <Link href="/admin/payroll" className="mt-3">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Run First Payroll</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Employees</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeCompany?.payrollRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">
                        {formatDate(run.executedAt ?? run.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {formatUSD(run.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{run._count.payEvents}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={run.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/payroll/history`}>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
