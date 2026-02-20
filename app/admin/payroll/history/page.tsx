'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatusPill } from '@/components/shared/StatusPill'
import { formatUSD, formatDate } from '@/lib/utils'
import { TokenIcon } from '@/components/shared/TokenIcon'
import { Skeleton } from '@/components/ui/skeleton'
import { History } from 'lucide-react'

interface PayEvent { id: string; amountUSDC: number; toToken: string; toChain: string; status: string; relayFeeUSD: number | null; employee: { name: string } }
interface PayrollRun { id: string; totalAmount: number; currency: string; status: string; createdAt: string; executedAt: string | null; company: { name: string }; payEvents: PayEvent[]; _count: { payEvents: number } }

export default function PayrollHistoryPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payroll/runs')
      .then(r => r.json())
      .then(data => { setRuns(data); if (data.length > 0) setSelected(data[0].id) })
      .finally(() => setLoading(false))
  }, [])

  const selectedRun = runs.find(r => r.id === selected)

  useEffect(() => {
    if (selected && !selectedRun?.payEvents) {
      fetch(`/api/payroll/runs/${selected}`)
        .then(r => r.json())
        .then(data => setRuns(prev => prev.map(r => r.id === selected ? data : r)))
    }
  }, [selected])

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payroll History</h1>
        <p className="text-sm text-gray-400">{runs.length} runs total</p>
      </div>

      {runs.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <div className="flex flex-col items-center justify-center py-16">
            <History className="mb-3 h-12 w-12 text-gray-600" />
            <p className="text-gray-400">No payroll runs yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-1">
            {runs.map(run => (
              <button key={run.id} onClick={() => setSelected(run.id)}
                className={`w-full rounded-lg border p-4 text-left transition-all ${selected === run.id ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between"><span className="font-medium text-white">{formatUSD(run.totalAmount)}</span><StatusPill status={run.status} /></div>
                <p className="mt-1 text-xs text-gray-400">{run.company.name} · {formatDate(run.executedAt ?? run.createdAt)}</p>
                <p className="text-xs text-gray-500">{run._count.payEvents} events</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedRun && (
              <Card className="border-white/10 bg-white/5">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">{formatUSD(selectedRun.totalAmount)}</p>
                      <p className="text-sm text-gray-400">{selectedRun.company.name} · {formatDate(selectedRun.executedAt ?? selectedRun.createdAt)}</p>
                    </div>
                    <StatusPill status={selectedRun.status} />
                  </div>
                </div>
                {selectedRun.payEvents && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-white/10"><th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Employee</th><th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Amount</th><th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Token</th><th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Fee</th><th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedRun.payEvents.map(evt => (
                          <tr key={evt.id} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-sm text-white">{evt.employee.name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-white">{formatUSD(evt.amountUSDC)}</td>
                            <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm text-gray-300"><TokenIcon symbol={evt.toToken} size="sm" />{evt.toToken} · {evt.toChain}</span></td>
                            <td className="px-4 py-3 text-sm text-yellow-400">{evt.relayFeeUSD != null ? formatUSD(evt.relayFeeUSD) : '—'}</td>
                            <td className="px-4 py-3"><StatusPill status={evt.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
