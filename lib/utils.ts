import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as USD with 2 decimal places and thousand separators.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Truncates an Ethereum/Solana address for display.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '—'
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Formats a date as a readable string.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Returns the block explorer URL for a given chain and tx hash.
 */
export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io/tx',
    8453: 'https://basescan.org/tx',
    10: 'https://optimistic.etherscan.io/tx',
    42161: 'https://arbiscan.io/tx',
    137: 'https://polygonscan.com/tx',
    792703809: 'https://solscan.io/tx',
    56: 'https://bscscan.com/tx',
    43114: 'https://snowtrace.io/tx',
  }
  const base = explorers[chainId] ?? 'https://etherscan.io/tx'
  return `${base}/${txHash}`
}

/**
 * Formats a large number with K/M/B suffixes.
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return formatUSD(n)
}
