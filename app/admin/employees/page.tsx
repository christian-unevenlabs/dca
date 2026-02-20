'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusPill } from '@/components/shared/StatusPill'
import { ChainBadge } from '@/components/shared/ChainBadge'
import { TokenIcon } from '@/components/shared/TokenIcon'
import { formatDate, truncateAddress } from '@/lib/utils'
import { Search, ArrowRight, UserX } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Allocation {
  tokenSymbol: string
  chainId: number
  percentage: number
}

interface Employee {
  id: string
  name: string
  email: string
  walletAddress: string | null
  allocations: Allocation[]
  _count: { payHistory: number }
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .finally(() => setLoading(false))
  }, [])

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-sm text-gray-400">{employees.length} team members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-gray-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <div className="flex flex-col items-center justify-center py-16">
            <UserX className="mb-3 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">No employees found</p>
          </div>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Wallet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Allocation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Pay Events</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{emp.name}</div>
                      <div className="text-xs text-gray-400">{emp.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      {emp.walletAddress ? (
                        <span className="font-mono text-xs text-indigo-400">
                          {truncateAddress(emp.walletAddress)}
                        </span>
                      ) : (
                        <StatusPill status="pending" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {emp.allocations.length === 0 ? (
                        <span className="text-xs text-gray-500">Default (USDC/Solana)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {emp.allocations.map((a, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                              <TokenIcon symbol={a.tokenSymbol} size="sm" />
                              {a.percentage}% {a.tokenSymbol}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">{emp._count.payHistory}</td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/employees/${emp.id}`}>
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
  )
}
