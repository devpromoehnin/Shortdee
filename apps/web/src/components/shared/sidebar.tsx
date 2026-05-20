'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Video, Scissors, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/lives', label: 'ไลฟ์ของฉัน', icon: Video },
  { href: '/clips', label: 'คลิป', icon: Scissors },
  { href: '/analytics', label: 'สถิติ', icon: BarChart3 },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r border-secondary/10 bg-white p-4">
      <Link href="/dashboard" className="mb-6 px-2 text-xl font-bold text-primary">
        ClipDee
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-ink/70 hover:bg-secondary/5 hover:text-ink',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
