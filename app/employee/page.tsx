'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TokenIcon } from '@/components/shared/TokenIcon'
import { StatusPill } from '@/components/shared/StatusPill'
import { formatUSD, formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { CHAINS, TOKENS, getTokensForChain } from '@/lib/chains'
import { Plus, Trash2, Save, ExternalLink, Loader2, User } from 'lucide-react'

interface Allocation {
  tokenSymbol: string
  tokenAddress: string
  chainId: number
  chainName: string
  percentage: number
}

interface PayEvent {
  id: string
  amountUSDC: number
  toToken: string
  toChain: string
  toChainId: number
  relayTxHash: string | null
  status: string
  createdAt: string
  relayFeeUSD: number | null
}

interface Employee {
  id: string
  name: string
  email: string
  walletAddress: string | null
  allocations: Allocation[]
  payHistory: PayEvent[]
  company: { name: string }
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingEmployee, setLoadingEmployee] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then((data: Employee[]) => {
        setEmployees(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingEmployee(true)
    fetch(`/api/employees/${selectedId}`)
      .then(r => r.json())
      .then((data: Employee) => {
        setEmployee(data)
        setAllocations(data.allocations ?? [])
      })
      .finally(() => setLoadingEmployee(false))
  }, [selectedId])

  const totalPct = Math.round(allocations.reduce((s, a) => s + a.percentage, 0) * 100) / 100
  const isValid = allocations.length === 0 || totalPct === 100

  function addRow() {
    setAllocations(prev => [...prev, {
      tokenSymbol: 'USDC',
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      chainId: 1,
      chainName: 'Ethereum',
      percentage: 0,
    }])
  }

  function removeRow(i: number) {
    setAllocations(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleChainChange(i: number, chainId: number) {
    const chain = CHAINS.find(c => c.id === chainId)
    if (!chain) return
    const tokens = getTokensForChain(chainId)
    const first = tokens[0]
    setAllocations(prev => prev.map((a, idx) => idx === i ? {
      ...a,
      chainId,
      chainName: chain.name,
      tokenSymbol: first?.symbol ?? 'USDC',
      tokenAddress: first?.addresses[chainId] ?? '',
    } : a))
  }

  function handleTokenChange(i: number, symbol: string, chainId: number) {
    const token = TOKENS.find(t => t.symbol === symbol)
    if (!token) return
    setAllocations(prev => prev.map((a, idx) => idx === i ? {
      ...a,
      tokenSymbol: symbol,
      tokenAddress: token.addresses[chainId] ?? '',
    } : a))
  }

  function handlePctChange(i: number, value: string) {
    const pct = parseFloat(value) || 0
    setAllocations(prev => prev.map((a, idx) => idx === i ? { ...a, percentage: pct } : a))
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${selectedId}/allocations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Saved', description: 'Token preferences updated.' })
    } catch (err) {
      toast({ title: 'Save failed', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Employee Portal</h1>
        <p className="text-sm text-gray-400">View pay history and manage token preferences</p>
      </div>

      {/* Employee selector */}
      <div className="flex flex-wrap gap-2">
        {employees.map(e => (
          <button
            key={e.id}
            onClick={() => setSelectedId(e.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              selectedId === e.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {loadingEmployee ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : employee ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Left: profile + allocation editor */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <User className="h-4 w-4 text-indigo-400" /> Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: 'Name', value: employee.name },
                  { label: 'Email', value: employee.email },
                  { label: 'Company', value: employee.company.name },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallet</span>
                  <span className="font-mono text-xs text-indigo-400">
                    {employee.walletAddress ? truncateAddress(employee.walletAddress) : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base text-white">Token Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocations.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No preferences set — you'll receive USDC on Solana by default.
                  </p>
                )}

                {allocations.map((a, i) => {
                  const tokensOnChain = getTokensForChain(a.chainId)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={String(a.chainId)} onValueChange={v => handleChainChange(i, parseInt(v))}>
                        <SelectTrigger className="h-9 w-36 border-white/10 bg-white/5 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1d2e]">
                          {CHAINS.map(c => (
                            <SelectItem key={c.id} value={String(c.id)} className="text-white text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={a.tokenSymbol} onValueChange={v => handleTokenChange(i, v, a.chainId)}>
                        <SelectTrigger className="h-9 w-24 border-white/10 bg-white/5 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#1a1d2e]">
                          {tokensOnChain.map(t => (
                            <SelectItem key={t.symbol} value={t.symbol} className="text-white text-xs">
                              {t.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={a.percentage}
                          onChange={e => handlePctChange(i, e.target.value)}
                          className="h-9 w-16 border-white/10 bg-white/5 text-center text-white text-xs"
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>

                      <button onClick={() => removeRow(i)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}

                {allocations.length > 0 && (
                  <div className={`flex items-center justify-between rounded-lg p-2 text-xs ${
                    isValid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    <span>Total</span>
                    <span className="font-medium">{totalPct}% {!isValid && '— must equal 100%'}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={addRow} variant="outline" size="sm"
                    className="gap-1 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10">
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={saving || !isValid}
                    className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: pay history */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-base text-white">Pay History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employee.payHistory.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">No payments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Token</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tx</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {employee.payHistory.map(evt => (
                        <tr key={evt.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-xs text-white">{formatDate(evt.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-white">{formatUSD(evt.amountUSDC)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                              <TokenIcon symbol={evt.toToken} size="sm" />
                              {evt.toToken} · {evt.toChain}
                            </span>
                          </td>
                          <td className="px-4 py-3"><StatusPill status={evt.status} /></td>
                          <td className="px-4 py-3">
                            {evt.relayTxHash ? (
                              <a href={getExplorerUrl(evt.toChainId, evt.relayTxHash)} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                                <span className="font-mono">{truncateAddress(evt.relayTxHash, 3)}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : <span className="text-xs text-gray-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
