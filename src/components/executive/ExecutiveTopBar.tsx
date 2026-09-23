import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, LogOut, Menu, Moon, PackageSearch, Sun, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { usePortal } from '@/lib/store'
import { useDarkMode } from '@/lib/theme'
import { NotificationsBell, type NotificationEntry } from '@/components/NotificationsBell'
import { ProfileDirectoryDialog } from '@/components/ProfileDirectoryDialog'

// Constant top bar for the Executive console: live date/time, the shared
// notification bell (size="md", matching the Admin top-bar scale), and a
// profile menu. Sits alongside the rail outside the scroll container so it
// never scrolls with page content — mirrors AdminTopBar exactly, only
// swapping the plain bell for the shared NotificationsBell.
interface ExecutiveTopBarProps {
  onOpenMenu?: () => void
}

export function ExecutiveTopBar({ onOpenMenu }: ExecutiveTopBarProps) {
  const { adminName, adminRole, setConfirmLogout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const { events, inventory } = usePortal()
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Same operational signals surfaced as "pending actions" on the Executive
  // Dashboard, reframed as notification entries for the shared bell.
  const notifications = useMemo<NotificationEntry[]>(() => {
    const items: NotificationEntry[] = []

    const awaitingEvent = events.find((e) => e.status === 'Initialized' || e.status === 'On Hold')
    if (awaitingEvent) {
      items.push({
        id: `ev-${awaitingEvent.id}`,
        icon: CalendarClock,
        color: 'text-sky-500',
        text: `"${awaitingEvent.title}" is awaiting confirmation.`,
        time: 'Event Operations',
        unread: true,
        destination: { route: 'registry' },
      })
    }

    const restock = inventory.find((i) => i.status === 'Critical Deficit' || i.status === 'Low Stock')
    if (restock) {
      items.push({
        id: `rs-${restock.id}`,
        icon: PackageSearch,
        color: 'text-amber-500',
        text: `${restock.name} (${restock.assetId}) is running low on stock.`,
        time: 'Asset Inventory',
        unread: false,
        destination: { route: 'inventory' },
      })
    }

    return items
  }, [events, inventory])

  return (
    <>
    <header className="max-md:sticky max-md:top-0 max-md:z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
      <div className="flex min-w-0 items-center">
        {onOpenMenu && (
          <button type="button" onClick={onOpenMenu} aria-label="Open navigation menu" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background md:hidden">
            <Menu className="size-4" aria-hidden="true" />
          </button>
        )}
        <p className="min-w-0 pl-2 pr-2 leading-tight text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:pl-0 sm:pr-3 sm:leading-normal sm:text-xs sm:tracking-[0.15em]">
        {dateLabel} <span className="mx-1 text-border">|</span> {timeLabel}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsBell notifications={notifications} size="md" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-primary/15 text-primary transition-colors hover:bg-primary/25"
          >
            <User className="size-4" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
            >
              <div className="px-4 py-3">
                <p className="truncate text-sm font-semibold text-card-foreground">{adminName}</p>
                <p className="truncate text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
                  {adminRole}
                </p>
              </div>
              <div className="border-t border-border">
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setProfileOpen(true) }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-card-foreground transition-colors hover:bg-accent">
                  <User className="size-3.5" aria-hidden="true" />
                  View profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={toggle}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-card-foreground transition-colors hover:bg-accent"
                >
                  {dark ? (
                    <Sun className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Moon className="size-3.5" aria-hidden="true" />
                  )}
                  {dark ? 'Switch to light mode' : 'Switch to dark mode'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmLogout(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-destructive transition-colors hover:bg-accent"
                >
                  <LogOut className="size-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
      <ProfileDirectoryDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
