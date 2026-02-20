/**
 * Payroll execution logic for Relay Pay.
 * Handles quote fetching, simulated execution, and DB record creation.
 */

import { prisma } from './prisma'
import { getRelayQuote, executeRelaySwap, buildMockSameChainQuote } from './relay'
import { DEFAULT_ALLOCATION, getTokenAddress, NATIVE_ETH_ADDRESS } from './chains'
import type { Employee, TokenAllocation } from '@prisma/client'

export interface PayrollRunInput {
  companyId: string
  totalAmount: number
  currency?: string
  employeeAmounts?: Record<string, number> // employeeId -> USDC amount (optional custom split)
}

export interface PayEventResult {
  employeeId: string
  employeeName: string
  allocationId: string
  tokenSymbol: string
  chainName: string
  amountUSDC: number
  txHash: string
  feeBps: number
  feeUSD: number
  status: 'complete' | 'failed'
  error?: string
}

/**
 * Validates that an employee's token allocations sum to exactly 100%.
 * Returns an error message if invalid, or null if valid.
 */
export function validateAllocations(
  allocations: { percentage: number }[]
): string | null {
  if (allocations.length === 0) return null // will use default
  const total = allocations.reduce((sum, a) => sum + a.percentage, 0)
  const rounded = Math.round(total * 100) / 100
  if (rounded !== 100) {
    return `Allocations must sum to 100% (got ${rounded}%)`
  }
  return null
}

/**
 * Splits a total payroll amount equally among employees.
 * Returns a map of employeeId -> USDC amount.
 */
export function splitPayrollEqually(
  employees: { id: string }[],
  totalAmount: number
): Record<string, number> {
  if (employees.length === 0) return {}
  const perEmployee = Math.floor((totalAmount / employees.length) * 100) / 100
  const result: Record<string, number> = {}
  let remaining = totalAmount

  employees.forEach((emp, idx) => {
    if (idx === employees.length - 1) {
      // Last employee gets the remainder to avoid rounding issues
      result[emp.id] = Math.round(remaining * 100) / 100
    } else {
      result[emp.id] = perEmployee
      remaining -= perEmployee
    }
  })

  return result
}

/**
 * Fetches a Relay quote for a single pay event, with fallback to mock on API error.
 */
async function fetchQuoteForAllocation(params: {
  companyWallet: string
  companyChainId: number
  companyUsdcAddress: string
  employeeWallet: string
  allocation: TokenAllocation
  amountUSDC: number
}): Promise<{ feeBps: number; feeUSD: number; quoteId: string }> {
  const amountWei = BigInt(Math.round(params.amountUSDC * 1e6)).toString()

  const isSameUSDC =
    params.allocation.tokenSymbol === 'USDC' &&
    params.allocation.chainId === params.companyChainId

  try {
    const quote = isSameUSDC
      ? buildMockSameChainQuote({
          originChainId: params.companyChainId,
          destinationChainId: params.allocation.chainId,
          originCurrency: params.companyUsdcAddress,
          destinationCurrency: params.allocation.tokenAddress,
          amount: amountWei,
          user: params.companyWallet,
          recipient: params.employeeWallet,
        })
      : await getRelayQuote({
          originChainId: params.companyChainId,
          destinationChainId: params.allocation.chainId,
          originCurrency: params.companyUsdcAddress,
          destinationCurrency: params.allocation.tokenAddress,
          amount: amountWei,
          user: params.companyWallet,
          recipient: params.employeeWallet,
        })

    const result = await executeRelaySwap(quote)
    return {
      feeBps: result.feeBps,
      feeUSD: result.feeUSD,
      quoteId: quote.requestId,
    }
  } catch (err) {
    // On API error, use realistic mock fees (15 bps default)
    const DEFAULT_FEE_BPS = 15
    console.warn('[Payroll] Quote fetch failed, using mock fees:', (err as Error).message)
    return {
      feeBps: DEFAULT_FEE_BPS,
      feeUSD: Math.round(params.amountUSDC * (DEFAULT_FEE_BPS / 10000) * 100) / 100,
      quoteId: 'mock-' + Math.random().toString(36).slice(2),
    }
  }
}

/**
 * Executes a full payroll run for a company.
 * For each employee and each allocation, fetches a Relay quote and simulates execution.
 * Creates PayEvent records for all transactions.
 */
export async function executePayrollRun(
  input: PayrollRunInput
): Promise<{ payrollRunId: string; results: PayEventResult[] }> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: input.companyId },
    include: {
      employees: {
        include: { allocations: true },
      },
    },
  })

  const employees = company.employees as (Employee & { allocations: TokenAllocation[] })[]

  // Determine per-employee amounts
  const amounts =
    input.employeeAmounts ??
    splitPayrollEqually(employees, input.totalAmount)

  // Determine company USDC address
  const companyChainId = company.chain === 'ethereum' ? 1 :
    company.chain === 'base' ? 8453 :
    company.chain === 'optimism' ? 10 :
    company.chain === 'arbitrum' ? 42161 : 1

  const usdcAddresses: Record<string, string> = {
    '1': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '8453': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    '10': '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    '42161': '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  }
  const companyUsdcAddress = usdcAddresses[String(companyChainId)] ??
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

  // Create the payroll run record
  const payrollRun = await prisma.payrollRun.create({
    data: {
      companyId: company.id,
      totalAmount: input.totalAmount,
      currency: input.currency ?? 'USDC',
      status: 'processing',
    },
  })

  const results: PayEventResult[] = []

  for (const employee of employees) {
    const employeeAmount = amounts[employee.id] ?? 0
    if (employeeAmount <= 0) continue

    // Use default allocation if none set
    const allocations: TokenAllocation[] =
      employee.allocations.length > 0
        ? employee.allocations
        : [
            {
              id: 'default',
              employeeId: employee.id,
              tokenSymbol: DEFAULT_ALLOCATION.tokenSymbol,
              tokenAddress: DEFAULT_ALLOCATION.tokenAddress,
              chainId: DEFAULT_ALLOCATION.chainId,
              chainName: DEFAULT_ALLOCATION.chainName,
              percentage: DEFAULT_ALLOCATION.percentage,
              updatedAt: new Date(),
            },
          ]

    const employeeWallet =
      employee.walletAddress ?? '0x0000000000000000000000000000000000000000'

    for (const allocation of allocations) {
      const allocationAmount =
        Math.round((employeeAmount * allocation.percentage) / 100 * 100) / 100

      let txHash = ''
      let feeBps = 0
      let feeUSD = 0
      let quoteId = ''
      let status: 'complete' | 'failed' = 'complete'
      let errorMsg: string | undefined

      try {
        const quoteResult = await fetchQuoteForAllocation({
          companyWallet: company.walletAddress,
          companyChainId,
          companyUsdcAddress,
          employeeWallet,
          allocation,
          amountUSDC: allocationAmount,
        })

        feeBps = quoteResult.feeBps
        feeUSD = quoteResult.feeUSD
        quoteId = quoteResult.quoteId
        txHash =
          '0x' +
          Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join('')
      } catch (err) {
        status = 'failed'
        errorMsg = (err as Error).message
        txHash = ''
      }

      // Create the PayEvent record
      await prisma.payEvent.create({
        data: {
          employeeId: employee.id,
          payrollRunId: payrollRun.id,
          amountUSDC: allocationAmount,
          toToken: allocation.tokenSymbol,
          toChain: allocation.chainName,
          toChainId: allocation.chainId,
          toAddress: employeeWallet,
          relayQuoteId: quoteId || null,
          relayTxHash: txHash || null,
          status,
          relayFeeBps: feeBps,
          relayFeeUSD: feeUSD,
        },
      })

      results.push({
        employeeId: employee.id,
        employeeName: employee.name,
        allocationId: allocation.id,
        tokenSymbol: allocation.tokenSymbol,
        chainName: allocation.chainName,
        amountUSDC: allocationAmount,
        txHash,
        feeBps,
        feeUSD,
        status,
        error: errorMsg,
      })
    }
  }

  // Mark payroll run as complete
  const allFailed = results.every((r) => r.status === 'failed')
  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      status: allFailed ? 'failed' : 'complete',
      executedAt: new Date(),
    },
  })

  return { payrollRunId: payrollRun.id, results }
}
