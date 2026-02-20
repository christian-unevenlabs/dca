import { CHAIN_MAP } from '@/lib/chains'
import { cn } from '@/lib/utils'

interface ChainBadgeProps {
  chainId: number
  className?: string
  showName?: boolean
  size?: 'sm' | 'md'
}

const CHAIN_EMOJIS: Record<number, string> = {
  1: '⟠',
  8453: '🔵',
  10: '🔴',
  42161: '🔷',
  137: '🟣',
  792703809: '◎',
  56: '🟡',
  43114: '🔺',
}

export function ChainBadge({ chainId, className, showName = true, size = 'md' }: ChainBadgeProps) {
  const chain = CHAIN_MAP[chainId]
  if (!chain) return <span className="text-muted-foreground text-xs">Unknown</span>

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs',
        className
      )}
      style={{
        backgroundColor: chain.color + '22',
        color: chain.color,
        border: `1px solid ${chain.color}44`,
      }}
    >
      <span>{CHAIN_EMOJIS[chainId] ?? '○'}</span>
      {showName && <span>{chain.name}</span>}
    </span>
  )
}
