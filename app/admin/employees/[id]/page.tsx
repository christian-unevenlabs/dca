'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChainBadge } from '@/components/shared/ChainBadge'
import { TokenIcon } from '@/components/shared/TokenIcon'
import { StatusPill } from '@/components/shared/StatusPill'
import { formatUSD, formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils'
import { ArrowLeft, ExternalLink, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TOKEN_MAP } from '@/lib/chains'

interface Allocation { id: string; tokenSymbol: string; chainName: string; chainId: number; percentage: number }
interface PayEvent { id: string; amountUSDC: number; toToken: string; toChain: string; toChainId: number; relayTxHash: string | null; status: string; createdAt: string; relayFeeUSD: number | null }
interface Employee { id: string; name: string; email: string; walletAddress: string | null; allocations: Allocation[]; payHistory: PayEvent[]; company: { name: string } }

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/employees/${params.id}`)
      .then((r) => r.json())
      .then(setEmployee)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!employee) return <p className="text-gray-400">Employee not found</p>

  const totalReceived = employee.payHistory.reduce((s, e) => s + e.amountUSDC, 0)
  const pieData = employee.allocations.map((a) => ({
    name: `${a.percentage}% ${a.tokenSymbol} (${a.chainName})`,
    value: a.percentage,
    color: TOKEN_MAP[a.tokenSymbol]?.color ?? '#6366f1',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/employees">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{employee.name}</h1>
          <p className="text-sm text-gray-400">{employee.email} · {employee.company.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Wallet Info */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Wallet className="h-4 w-4 text-indigo-400" />Wallet</CardTitle></CardHeader>
          <CardContent>
            {employee.walletAddress ? (
              <p className="break-all font-mono text-sm text-indigo-400">{employee.walletAddress}</p>
            ) : (
              <p className="text-sm text-gray-500">No wallet connected — will use company default</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-gray-500">Total Received</p>
                <p className="mt-1 text-lg font-semibold text-white">{formatUSD(totalReceived)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-gray-500">Pay Events</p>
                <p className="mt-1 text-lg font-semibold text-white">{employee.payHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Chart */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-base text-white">Token Allocations</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-gray-500">Default: 100% USDC on Solana</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: '#1e2130', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend formatter={(v) => <span className="text-xs text-gray-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pay History */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader><CardTitle className="text-base text-white">Pay History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {employee.payHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p>No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10"><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Token</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fee</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tx</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {employee.payHistory.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-white">{formatDate(evt.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{formatUSD(evt.amountUSDC)}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm text-gray-300"><TokenIcon symbol={evt.toToken} size="sm" />{evt.toToken}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{evt.relayFeeUSD != null ? formatUSD(evt.relayFeeUSD) : '—'}</td>
                      <td className="px-4 py-3">{evt.relayTxHash ? <a href={getExplorerUrl(evt.toChainId, evt.relayTxHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><span className="font-mono">{truncateAddress(evt.relayTxHash, 3)}</span><ExternalLink className="h-3 w-3" /></a> : <span className="text-xs text-gray-600">—</span>}</td>
                      <td className="px-4 py-3"><StatusPill status={evt.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
