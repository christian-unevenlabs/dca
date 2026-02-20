import { cn } from '@/lib/utils'

interface StatusPillProps {
  status: string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  processing: { label: 'Processing', className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  complete: { label: 'Complete', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  completed: { label: 'Complete', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/30' },
  submitted: { label: 'Submitted', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status,
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  }

  const isProcessing = status === 'processing'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {isProcessing && (
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {config.label}
    </span>
  )
}
