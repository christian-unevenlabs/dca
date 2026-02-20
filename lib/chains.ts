/**
 * Supported chains and token configurations for Relay Pay.
 * Covers EVM chains + Solana with curated token lists.
 */

export interface ChainConfig {
  id: number
  name: string
  slug: string
  nativeCurrency: string
  explorerUrl: string
  color: string
  logoColor: string
}

export interface TokenConfig {
  symbol: string
  name: string
  decimals: number
  addresses: Partial<Record<number, string>> // chainId -> contract address
  coingeckoId: string
  color: string
}

export const CHAINS: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum',
    slug: 'ethereum',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    color: '#627EEA',
    logoColor: '#627EEA',
  },
  {
    id: 8453,
    name: 'Base',
    slug: 'base',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://basescan.org',
    color: '#0052FF',
    logoColor: '#0052FF',
  },
  {
    id: 10,
    name: 'Optimism',
    slug: 'optimism',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    logoColor: '#FF0420',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    slug: 'arbitrum',
    nativeCurrency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    color: '#28A0F0',
    logoColor: '#28A0F0',
  },
  {
    id: 137,
    name: 'Polygon',
    slug: 'polygon',
    nativeCurrency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    color: '#8247E5',
    logoColor: '#8247E5',
  },
  {
    id: 792703809,
    name: 'Solana',
    slug: 'solana',
    nativeCurrency: 'SOL',
    explorerUrl: 'https://solscan.io',
    color: '#9945FF',
    logoColor: '#9945FF',
  },
  {
    id: 56,
    name: 'BNB Chain',
    slug: 'bnb',
    nativeCurrency: 'BNB',
    explorerUrl: 'https://bscscan.com',
    color: '#F3BA2F',
    logoColor: '#F3BA2F',
  },
  {
    id: 43114,
    name: 'Avalanche',
    slug: 'avalanche',
    nativeCurrency: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
    color: '#E84142',
    logoColor: '#E84142',
  },
]

export const CHAIN_MAP: Record<number, ChainConfig> = Object.fromEntries(
  CHAINS.map((c) => [c.id, c])
)

/** Native ETH pseudo-address used by Relay for native asset swaps */
export const NATIVE_ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

export const TOKENS: TokenConfig[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      1: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      8453: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      10: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
      42161: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      137: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      792703809: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      56: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      43114: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    },
    coingeckoId: 'usd-coin',
    color: '#2775CA',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    addresses: {
      1: NATIVE_ETH_ADDRESS,
      8453: NATIVE_ETH_ADDRESS,
      10: NATIVE_ETH_ADDRESS,
      42161: NATIVE_ETH_ADDRESS,
    },
    coingeckoId: 'ethereum',
    color: '#627EEA',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    addresses: {
      1: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      8453: '0x0555e30da8f98308edb960aa94c0db47230d2b9c',
      10: '0x68f180fcce6836688e9084f035309e29bf0a2095',
      42161: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      137: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    },
    coingeckoId: 'wrapped-bitcoin',
    color: '#F7931A',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    addresses: {
      792703809: 'So11111111111111111111111111111111111111112',
    },
    coingeckoId: 'solana',
    color: '#9945FF',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    addresses: {
      137: NATIVE_ETH_ADDRESS,
      1: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    },
    coingeckoId: 'matic-network',
    color: '#8247E5',
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    addresses: {
      42161: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    },
    coingeckoId: 'arbitrum',
    color: '#28A0F0',
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
    addresses: {
      10: '0x4200000000000000000000000000000000000042',
    },
    coingeckoId: 'optimism',
    color: '#FF0420',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    decimals: 18,
    addresses: {
      43114: NATIVE_ETH_ADDRESS,
    },
    coingeckoId: 'avalanche-2',
    color: '#E84142',
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    addresses: {
      56: NATIVE_ETH_ADDRESS,
    },
    coingeckoId: 'binancecoin',
    color: '#F3BA2F',
  },
]

export const TOKEN_MAP: Record<string, TokenConfig> = Object.fromEntries(
  TOKENS.map((t) => [t.symbol, t])
)

/** Default allocation: USDC on Solana */
export const DEFAULT_ALLOCATION = {
  tokenSymbol: 'USDC',
  tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  chainId: 792703809,
  chainName: 'Solana',
  percentage: 100,
}

/**
 * Get the token address for a given token symbol and chain ID.
 * Returns undefined if the token is not supported on that chain.
 */
export function getTokenAddress(symbol: string, chainId: number): string | undefined {
  return TOKEN_MAP[symbol]?.addresses[chainId]
}

/**
 * Get the chain config for a given chain ID.
 */
export function getChain(chainId: number): ChainConfig | undefined {
  return CHAIN_MAP[chainId]
}

/**
 * Get all tokens supported on a given chain.
 */
export function getTokensForChain(chainId: number): TokenConfig[] {
  return TOKENS.filter((t) => t.addresses[chainId] !== undefined)
}
