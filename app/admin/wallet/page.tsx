'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatUSD, truncateAddress } from '@/lib/utils'
import { Wallet, Copy, CheckCircle, AlertTriangle, ArrowDownToLine } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Company { id: string; name: string; walletAddress: string; chain: string; balance: number }

export default function WalletPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [fundAmount, setFundAmount] = useState('5000')

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then(setCompanies).finally(() => setLoading(false))
  }, [])

  const company = companies[0]

  async function copyAddress() {
    if (!company?.walletAddress) return
    await navigator.clipboard.writeText(company.walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied!', description: 'Wallet address copied to clipboard' })
  }

  function handleFund() {
    toast({ title: 'Funding simulated', description: `${formatUSD(parseFloat(fundAmount))} USDC would be sent to the company wallet in production.` })
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
  if (!company) return <p className="text-gray-400">No company found</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Company Wallet</h1>
        <p className="text-sm text-gray-400">Manage the funding source for payroll runs</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Wallet className="h-4 w-4 text-indigo-400" />Wallet Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400">Company</Label>
              <p className="mt-1 font-medium text-white">{company.name}</p>
            </div>
            <div>
              <Label className="text-gray-400">Network</Label>
              <p className="mt-1 font-medium capitalize text-white">{company.chain}</p>
            </div>
            <div>
              <Label className="text-gray-400">Address</Label>
              <div className="mt-1 flex items-center gap-2">
                <p className="flex-1 break-all font-mono text-sm text-indigo-400">{company.walletAddress}</p>
                <Button onClick={copyAddress} variant="ghost" size="icon" className="flex-shrink-0 text-gray-400 hover:text-white">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">Available Balance</p>
              <p className="mt-1 text-3xl font-bold text-white">{formatUSD(company.balance)}</p>
              <p className="mt-0.5 text-sm text-gray-400">USDC</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><ArrowDownToLine className="h-4 w-4 text-green-400" />Fund Wallet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-300">This is a prototype. No real transactions occur. In production, you would send USDC to the company wallet address above.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Amount (USDC)</Label>
              <Input value={fundAmount} onChange={e => setFundAmount(e.target.value)} type="number" className="border-white/10 bg-white/5 text-white" />
            </div>
            <div className="rounded-lg bg-white/5 p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Current balance</span><span className="text-white">{formatUSD(company.balance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Adding</span><span className="text-green-400">+ {formatUSD(parseFloat(fundAmount) || 0)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-medium"><span className="text-gray-300">New balance</span><span className="text-white">{formatUSD(company.balance + (parseFloat(fundAmount) || 0))}</span></div>
            </div>
            <Button onClick={handleFund} className="w-full bg-green-600 hover:bg-green-700">
              Simulate Funding
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
