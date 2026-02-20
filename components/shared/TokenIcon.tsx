import { TOKEN_MAP } from '@/lib/chains'
import { cn } from '@/lib/utils'

interface TokenIconProps {
  symbol: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const TOKEN_EMOJIS: Record<string, string> = {
  ETH: '⟠',
  WBTC: '₿',
  BTC: '₿',
  SOL: '◎',
  USDC: '$',
  MATIC: '⬡',
  ARB: '⬡',
  OP: '⭕',
  AVAX: '▲',
  BNB: '⬡',
}

const SIZES = {
  sm: 'w-5 h-5 text-xs',
  md: 'w-7 h-7 text-sm',
  lg: 'w-10 h-10 text-base',
}

export function TokenIcon({ symbol, size = 'md', className }: TokenIconProps) {
  const token = TOKEN_MAP[symbol]
  const color = token?.color ?? '#6B7280'
  const emoji = TOKEN_EMOJIS[symbol] ?? symbol[0]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold flex-shrink-0',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: color + '22', color }}
      title={token?.name ?? symbol}
    >
      {emoji}
    </span>
  )
}
