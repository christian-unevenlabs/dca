'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TokenIcon } from '@/components/shared/TokenIcon'
import { ChainBadge } from '@/components/shared/ChainBadge'
import { StatusPill } from '@/components/shared/StatusPill'
import { formatUSD } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Play, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Allocation { tokenSymbol: string; chainName: string; chainId: number; percentage: number }
interface Employee { id: string; name: string; email: string; allocations: Allocation[] }
interface Company { id: string; name: string; balance: number; employees: Employee[] }
interface PayEventResult { employeeName: string; tokenSymbol: string; chainName: string; amountUSDC: number; txHash: string; feeBps: number; feeUSD: number; status: string }

export default function PayrollRunPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompanyId, setActiveCompanyId] = useState('')
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)
  const [amount, setAmount] = useState('10000')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PayEventResult[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then((data: Company[]) => {
        setCompanies(data)
        if (data.length > 0) {
          setActiveCompanyId(data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!activeCompanyId) return
    fetch(`/api/companies/${activeCompanyId}`)
      .then(r => r.json())
      .then(setActiveCompany)
  }, [activeCompanyId])
  const totalAmount = parseFloat(amount) || 0
  const perEmployee = activeCompany ? totalAmount / (activeCompany.employees?.length || 1) : 0

  async function handleRun() {
    if (!activeCompanyId || totalAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: activeCompanyId, totalAmount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data.results)
      toast({ title: 'Payroll complete!', description: `${data.results.length} pay events created.` })
    } catch (err) {
      const msg = (err as Error).message
      setError(msg)
      toast({ title: 'Payroll failed', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Run Payroll</h1>
          <p className="text-sm text-gray-400">Distribute USDC to all employees via Relay</p>
        </div>
        <Link href="/admin/payroll/history">
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-gray-300">
            View History <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {!results ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Config Panel */}
          <Card className="border-white/10 bg-white/5 lg:col-span-1">
            <CardHeader><CardTitle className="text-base text-white">Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Company</Label>
                <div className="flex flex-col gap-2">
                  {companies.map(c => (
                    <button key={c.id} onClick={() => setActiveCompanyId(c.id)}
                      className={`rounded-lg px-3 py-2 text-sm text-left transition-all ${activeCompanyId === c.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Total Amount (USDC)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="10000"
                  min={0}
                />
              </div>
              {activeCompany && (
                <div className="rounded-lg bg-white/5 p-3 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Employees</span><span className="text-white">{activeCompany.employees?.length ?? 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Per Employee</span><span className="text-white">{formatUSD(perEmployee)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Est. Relay Fees (15bps)</span><span className="text-yellow-400">~{formatUSD(totalAmount * 0.0015)}</span></div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
              )}
              <Button onClick={handleRun} disabled={loading || !activeCompanyId} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><Play className="mr-2 h-4 w-4" />Execute Payroll</>}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-white/10 bg-white/5 lg:col-span-2">
            <CardHeader><CardTitle className="text-base text-white">Preview</CardTitle></CardHeader>
            <CardContent>
              {!activeCompany ? <p className="text-sm text-gray-500">Select a company to preview</p> : (
                <div className="space-y-3">
                  {activeCompany.employees?.map(emp => (
                    <div key={emp.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium text-white">{emp.name}</p><p className="text-xs text-gray-400">{emp.email}</p></div>
                        <span className="text-sm font-medium text-green-400">{formatUSD(perEmployee)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {emp.allocations.length === 0 ? (
                          <span className="text-xs text-gray-500">Default: USDC on Solana</span>
                        ) : emp.allocations.map((a, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                            <TokenIcon symbol={a.tokenSymbol} size="sm" />{a.percentage}% {a.tokenSymbol} → {a.chainName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Results */
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-medium text-green-300">Payroll executed successfully</p>
              <p className="text-sm text-green-400/70">{results.length} pay events · {formatUSD(results.reduce((s, r) => s + r.feeUSD, 0))} in Relay fees</p>
            </div>
            <Link href="/admin/payroll/history" className="ml-auto">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">View History</Button>
            </Link>
          </div>
          <Card className="border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10"><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Employee</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Token</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Chain</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fee</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-white">{r.employeeName}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{formatUSD(r.amountUSDC)}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm text-gray-300"><TokenIcon symbol={r.tokenSymbol} size="sm" />{r.tokenSymbol}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{r.chainName}</td>
                      <td className="px-4 py-3 text-sm text-yellow-400">{formatUSD(r.feeUSD)}</td>
                      <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Button onClick={() => setResults(null)} variant="outline" className="border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
            Run Another Payroll
          </Button>
        </div>
      )}
    </div>
  )
}
