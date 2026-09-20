import { type ReactNode, useMemo } from 'react'
import { CalendarClock, Moon, PackageSearch, Sun, User } from 'lucide-react'
import { usePortal } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { useDarkMode } from '@/lib/theme'
import { NotificationsBell, type NotificationEntry } from '@/components/NotificationsBell'
import { getCatalogAssets, getLowStockAssets } from '@/lib/warehouse-catalog'
import { getDispatchActivity } from '@/lib/warehouse-dispatch'
import { useEffect, useRef, useState } from 'react'

interface WarehouseTopBarProps {
  mobileLeading?: ReactNode
}

export function WarehouseTopBar({ mobileLeading }: WarehouseTopBarProps) {
  const { adminName, adminRole, setConfirmLogout } = useAuth()
  const { events } = usePortal()
  const { dark, toggle } = useDarkMode()
  const [menuOpen, setMenuOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const notifications = useMemo<NotificationEntry[]>(() => {
    const activity = getDispatchActivity().slice(0, 3).map((entry) => ({
      id: entry.id,
      icon: CalendarClock,
      color: entry.tone === 'warning' ? 'text-amber-500' : entry.tone === 'success' ? 'text-primary' : 'text-sky-500',
      text: entry.message,
      time: 'Dispatch Activity',
      unread: entry.tone === 'warning',
    }))
    const lowStock = getLowStockAssets(getCatalogAssets()).slice(0, 3).map((asset) => ({
      id: `low-${asset.id}`,
      icon: PackageSearch,
      color: 'text-amber-500',
      text: `${asset.name} (${asset.assetId}) is running low on stock.`,
      time: 'Asset Inventory',
      unread: false,
    }))
    const event = events.find((item) => item.status === 'Initialized' || item.status === 'On Hold')
    if (event) activity.unshift({
      id: `event-${event.id}`,
      icon: CalendarClock,
      color: 'text-sky-500',
      text: `"${event.title}" is awaiting confirmation.`,
      time: 'Event Operations',
      unread: true,
    })
    return [...activity, ...lowStock]
  }, [events])

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
      <div className="flex items-center gap-3">
        {mobileLeading}
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:text-xs sm:tracking-[0.15em]">
          {dateLabel} <span className="mx-1 text-border">|</span> {timeLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <NotificationsBell notifications={notifications} size="md" />
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Account menu" className="flex size-10 items-center justify-center rounded-full border border-border bg-primary/15 text-primary transition-colors hover:bg-primary/25">
            <User className="size-4" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              <div className="px-4 py-3"><p className="truncate text-sm font-semibold text-card-foreground">{adminName}</p><p className="truncate text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">{adminRole}</p></div>
              <div className="border-t border-border">
                <button type="button" role="menuitem" onClick={toggle} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-card-foreground transition-colors hover:bg-accent">{dark ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}{dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setConfirmLogout(true) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-destructive transition-colors hover:bg-accent">Sign out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
