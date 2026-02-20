'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, User, TrendingUp, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Admin', icon: Building2, match: '/admin' },
  { href: '/employee', label: 'Employee', icon: User, match: '/employee' },
  { href: '/estimator', label: 'Estimator', icon: TrendingUp, match: '/estimator' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1117]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Relay Pay'}
            </span>
            <span className="hidden rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400 sm:block">
              Beta
            </span>
          </Link>

          {/* Role Switcher */}
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
              const isActive = pathname.startsWith(match)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="hidden sm:block">Live</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
