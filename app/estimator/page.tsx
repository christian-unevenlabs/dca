'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatUSD } from '@/lib/utils'
import { TrendingUp, Zap } from 'lucide-react'

const BPS_TIERS = [5, 10, 15, 20, 25, 30]

const VOLUME_SCENARIOS = [
  { label: '1 company · 10 employees', monthly: 100_000 },
  { label: '10 companies · 10 employees', monthly: 1_000_000 },
  { label: '50 companies · 20 employees', monthly: 10_000_000 },
  { label: '200 companies · 50 employees', monthly: 100_000_000 },
]

interface ActualStats {
  totalRouted: number
  totalFees: number
  avgBps: number
  runCount: number
}

function bpsFee(usdcAmount: number, bps: number) {
  return usdcAmount * (bps / 10_000)
}

export default function EstimatorPage() {
  const [amount, setAmount] = useState('100000')
  const [customBps, setCustomBps] = useState('15')
  const [actualStats, setActualStats] = useState<ActualStats | null>(null)

  useEffect(() => {
    fetch('/api/payroll/stats')
      .then(r => r.json())
      .then(setActualStats)
      .catch(() => null)
  }, [])

  const usdcAmount = parseFloat(amount) || 0
  const bps = parseFloat(customBps) || 15

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue Estimator</h1>
        <p className="text-sm text-gray-400">Estimate Relay fee revenue based on USDC routing volume</p>
      </div>

      {/* Actual stats from DB */}
      {actualStats && actualStats.runCount > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total Routed (Demo Data)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{formatUSD(actualStats.totalRouted)}</p>
              <p className="mt-1 text-xs text-gray-500">{actualStats.runCount} payroll runs</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total Fees Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{formatUSD(actualStats.totalFees)}</p>
              <p className="mt-1 text-xs text-gray-500">from demo payroll data</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Avg Take Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-indigo-400">
                {actualStats.avgBps.toFixed(1)} <span className="text-sm font-normal text-gray-400">bps</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">{(actualStats.avgBps / 100).toFixed(3)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calculator */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Zap className="h-4 w-4 text-indigo-400" /> Custom Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">USDC Volume to Route</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
                placeholder="100000"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Take Rate (BPS)</Label>
              <Input
                type="number"
                value={customBps}
                onChange={e => setCustomBps(e.target.value)}
                className="border-white/10 bg-white/5 text-white"
                placeholder="15"
                min={0}
                max={1000}
              />
              <p className="text-xs text-gray-500">{(bps / 100).toFixed(3)}% of routed volume</p>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-indigo-400">Relay Revenue</p>
              <p className="mt-1 text-4xl font-bold text-white">{formatUSD(bpsFee(usdcAmount, bps))}</p>
              <p className="mt-1 text-sm text-gray-400">
                on {formatUSD(usdcAmount)} routed at {bps} bps
              </p>
            </div>

            {/* BPS comparison strip */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">At other rates</p>
              {BPS_TIERS.filter(t => t !== bps).map(t => (
                <div key={t} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="text-gray-400">{t} bps</span>
                  <span className="font-medium text-white">{formatUSD(bpsFee(usdcAmount, t))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Volume scenario table */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> Volume Scenarios at {bps} bps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Scenario</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Monthly Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Monthly Rev</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Annual Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {VOLUME_SCENARIOS.map(s => (
                  <tr key={s.label} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-gray-300">{s.label}</td>
                    <td className="px-4 py-3 text-right text-sm text-white">{formatUSD(s.monthly)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-400">
                      {formatUSD(bpsFee(s.monthly, bps))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-green-400">
                      {formatUSD(bpsFee(s.monthly * 12, bps))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Per-paycheck breakdown */}
            <div className="border-t border-white/10 p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-gray-500">Per paycheck at {bps} bps</p>
              <div className="grid grid-cols-3 gap-3">
                {[1_000, 5_000, 10_000].map(perCheck => (
                  <div key={perCheck} className="rounded-lg bg-white/5 p-3 text-center">
                    <p className="text-xs text-gray-400">{formatUSD(perCheck)}</p>
                    <p className="mt-1 text-base font-semibold text-white">{formatUSD(bpsFee(perCheck, bps))}</p>
                    <p className="text-xs text-gray-500">earned</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
