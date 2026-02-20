/**
 * Relay Protocol API service.
 * Handles quote fetching and token discovery via the Relay REST API.
 * Transaction execution is simulated for prototype purposes.
 */

import axios, { AxiosError } from 'axios'

const BASE_URL = process.env.RELAY_BASE_URL ?? 'https://api.relay.link'
const API_KEY = process.env.RELAY_API_KEY ?? ''

const relayClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  },
  timeout: 15000,
})

export interface RelayQuoteParams {
  /** Source chain ID (company's chain, typically Ethereum) */
  originChainId: number
  /** Destination chain ID (employee's preferred chain) */
  destinationChainId: number
  /** USDC contract address on origin chain */
  originCurrency: string
  /** Employee's desired token address on destination chain */
  destinationCurrency: string
  /** Amount in smallest units (wei/lamports as string) */
  amount: string
  /** Company wallet address (payer) */
  user: string
  /** Employee wallet address (recipient) */
  recipient: string
}

export interface RelayFee {
  amount: string
  amountUsd: string
  currency: { symbol: string; decimals: number }
}

export interface RelayStep {
  id: string
  action: string
  description: string
  items: Array<{ status: string; data: Record<string, unknown> }>
}

export interface RelayQuote {
  requestId: string
  steps: RelayStep[]
  fees: {
    relayer: RelayFee
    gas: RelayFee
    relayerGas: RelayFee
    app: RelayFee
  }
  details: {
    currencyIn: { currency: { symbol: string; decimals: number }; amount: string; amountUsd: string }
    currencyOut: { currency: { symbol: string; decimals: number }; amount: string; amountUsd: string }
    totalImpact: { usd: string; percent: string }
    rate: string
  }
}

export interface RelayToken {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  verified: boolean
}

export interface RelayStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  requestId: string
  txHashes?: string[]
  errorMessage?: string
}

/**
 * Fetches a cross-chain swap quote from the Relay API.
 * Returns pricing, fee breakdown, and execution steps.
 */
export async function getRelayQuote(params: RelayQuoteParams): Promise<RelayQuote> {
  try {
    const response = await relayClient.post<RelayQuote>('/quote', {
      originChainId: params.originChainId,
      destinationChainId: params.destinationChainId,
      originCurrency: params.originCurrency,
      destinationCurrency: params.destinationCurrency,
      amount: params.amount,
      user: params.user,
      recipient: params.recipient,
      tradeType: 'EXACT_INPUT',
    })
    return response.data
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>
    const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? 'Unknown error'
    throw new Error(`Relay quote failed: ${msg}`)
  }
}

/**
 * Simulates executing a Relay swap.
 * In production this would sign and broadcast transactions.
 * For the prototype, it generates a mock tx hash and returns immediately.
 */
export async function executeRelaySwap(quote: RelayQuote): Promise<{
  txHash: string
  requestId: string
  feeBps: number
  feeUSD: number
}> {
  // Log the execution steps for debugging
  console.log('[Relay] Simulating execution of quote:', quote.requestId)
  console.log('[Relay] Steps:', JSON.stringify(quote.steps, null, 2))

  // Generate a realistic-looking mock tx hash
  const mockHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

  // Extract fee data from quote
  const feeUSDRaw = parseFloat(quote.fees?.relayer?.amountUsd ?? '0') +
    parseFloat(quote.fees?.gas?.amountUsd ?? '0')

  const amountInUSD = parseFloat(quote.details?.currencyIn?.amountUsd ?? '0')
  const feeBps = amountInUSD > 0 ? (feeUSDRaw / amountInUSD) * 10000 : 15

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300))

  return {
    txHash: mockHash,
    requestId: quote.requestId,
    feeBps: Math.round(feeBps * 100) / 100,
    feeUSD: Math.round(feeUSDRaw * 100) / 100,
  }
}

/**
 * Polls the Relay API for the status of a submitted request.
 */
export async function getRelayStatus(requestId: string): Promise<RelayStatus> {
  try {
    const response = await relayClient.get<RelayStatus>(`/requests/v2/${requestId}`)
    return response.data
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>
    const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? 'Unknown error'
    throw new Error(`Relay status check failed: ${msg}`)
  }
}

/**
 * Fetches the list of supported tokens for a given chain from Relay.
 */
export async function getSupportedTokens(chainId: number): Promise<RelayToken[]> {
  try {
    const response = await relayClient.get<{ currencies: RelayToken[] }>(
      `/currencies/v1?chainId=${chainId}&verified=true`
    )
    return response.data?.currencies ?? []
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>
    const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? 'Unknown error'
    throw new Error(`Failed to fetch tokens for chain ${chainId}: ${msg}`)
  }
}

/**
 * Builds a mock quote for same-chain USDC transfers (no swap needed).
 * Used when origin and destination currency are both USDC.
 */
export function buildMockSameChainQuote(params: RelayQuoteParams): RelayQuote {
  const amountUSD = parseFloat(params.amount) / 1e6
  return {
    requestId: 'mock-' + Math.random().toString(36).slice(2),
    steps: [
      {
        id: 'transfer',
        action: 'transfer',
        description: 'Transfer USDC',
        items: [{ status: 'incomplete', data: {} }],
      },
    ],
    fees: {
      relayer: { amount: '0', amountUsd: '0', currency: { symbol: 'USDC', decimals: 6 } },
      gas: { amount: '0', amountUsd: '0', currency: { symbol: 'ETH', decimals: 18 } },
      relayerGas: { amount: '0', amountUsd: '0', currency: { symbol: 'ETH', decimals: 18 } },
      app: { amount: '0', amountUsd: '0', currency: { symbol: 'USDC', decimals: 6 } },
    },
    details: {
      currencyIn: {
        currency: { symbol: 'USDC', decimals: 6 },
        amount: params.amount,
        amountUsd: amountUSD.toFixed(2),
      },
      currencyOut: {
        currency: { symbol: 'USDC', decimals: 6 },
        amount: params.amount,
        amountUsd: amountUSD.toFixed(2),
      },
      totalImpact: { usd: '0', percent: '0' },
      rate: '1',
    },
  }
}
