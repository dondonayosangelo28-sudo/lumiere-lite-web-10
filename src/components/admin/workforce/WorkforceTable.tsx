import { useEffect, useRef, useState } from 'react'
import { MoreVertical, PauseCircle, PlayCircle, LogOut, Pencil } from 'lucide-react'
import type { AccountStatus, Staff } from '@/lib/types'
import { cn } from '@/lib/utils'
import { RoleBadge, StatusBadge } from './WorkforceBadges'
import { CompactStatStrip } from '@/components/CompactStatStrip'
import { EmptyState } from '@/components/EmptyState'

interface Props {
  rows: Staff[]
  resolveStatus: (s: Staff) => AccountStatus
  onRowClick: (s: Staff) => void
  onSuspend: (s: Staff) => void
  onForceLogout: (s: Staff) => void
  onEdit: (s: Staff) => void
  // Deep-linked staff id (from ?highlight=) to scroll to and visually pulse.
  highlightId?: string | null
  // Compact inline counters rendered in the table header strip, replacing the
  // old standalone stat cards so the table rows are visible without scrolling.
  stats: { label: string; value: number }[]
}

function sessionLabel(s: Staff) {
  if (s.recordKind === 'employee-record') return 'No Portal Access'
  return s.sessionStatus
}

export function WorkforceTable({
  rows,
  resolveStatus,
  onRowClick,
  onSuspend,
  onForceLogout,
  onEdit,
  highlightId,
  stats,
}: Props) {
  const [menuId, setMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top?: number
    bottom?: number
    right: number
  } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const highlightRef = useRef<HTMLTableRowElement | null>(null)
  const menuHeight = 3 * 34 + 8

  const closeMenu = () => {
    setMenuId(null)
    setMenuPosition(null)
  }

  const openMenu = (id: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    const rect = trigger.getBoundingClientRect()
    const right = Math.max(8, window.innerWidth - rect.right)
    const openDownward = rect.bottom + menuHeight <= window.innerHeight - 8

    setMenuPosition(
      openDownward
        ? { top: rect.bottom + 4, right }
        : { bottom: window.innerHeight - rect.top + 4, right },
    )
    setMenuId(id)
  }

  // Scroll the highlighted row into view once it's rendered.
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  // Close the kebab menu on any outside click, table scroll, or viewport change.
  useEffect(() => {
    if (!menuId) return

    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        closeMenu()
      }
    }
    const onScroll = () => closeMenu()
    const onResize = () => closeMenu()

    document.addEventListener('mousedown', onDoc)
    scrollContainerRef.current?.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      scrollContainerRef.current?.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [menuId])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Compact inline counters replacing the old standalone stat cards — keeps the
          numbers visible without pushing table rows below the fold. */}
      <CompactStatStrip stats={stats} />
      {/* This div is the scroll container for BOTH axes (a lone `overflow-x-auto` computes
          `overflow-y: auto` too per the CSS spec, which would silently create a second,
          non-scrolling ancestor and break `position: sticky` on the thead below). Giving it
          an explicit max-height makes that scroll behavior real and lets the header stick
          to the top of this table specifically, independent of the page's own scroll. */}
      <div ref={scrollContainerRef} className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted">
              {[
                'Employee ID',
                'Full Name',
                'Role',
                'Account Status',
                'Session Status',
                'Last Access',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="bg-muted px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8">
                  <EmptyState
                    title="No workforce records found"
                    message="No staff accounts or employee records match your search query or role/status filters."
                  />
                </td>
              </tr>
            ) : (
              rows.map((s) => {
              const status = resolveStatus(s)
              const isRecord = s.recordKind === 'employee-record'
              const suspended = status === 'Suspended'
              const isHighlighted = highlightId === s.id
              return (
                <tr
                  key={s.id}
                  ref={isHighlighted ? highlightRef : undefined}
                  onClick={() => onRowClick(s)}
                  className={cn(
                    'group cursor-pointer border-b border-border/60 transition last:border-0 hover:bg-muted/40',
                    isHighlighted && 'row-highlight ring-1 ring-inset ring-primary/50',
                  )}
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                    {s.employeeId}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-card-foreground">
                      {s.firstName} {s.middleName?.trim() ? `${s.middleName.trim()} ` : ''}{s.surname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRecord ? (s.employmentType ?? 'Employee Record') : s.email}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge role={s.role} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{sessionLabel(s)}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{s.lastAccess}</td>
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (menuId === s.id) {
                            closeMenu()
                          } else {
                            openMenu(s.id, e.currentTarget)
                          }
                        }}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label={`Actions for ${s.firstName} ${s.middleName?.trim() ? `${s.middleName.trim()} ` : ''}${s.surname}`}
                        aria-haspopup="menu"
                        aria-expanded={menuId === s.id}
                      >
                        <MoreVertical className="size-4" />
                      </button>
                      {menuId === s.id && (
                        <div
                          ref={menuRef}
                          role="menu"
                          className="fixed z-30 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-xl"
                          style={menuPosition ?? undefined}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuId(null)
                              onSuspend(s)
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-popover-foreground transition hover:bg-muted"
                          >
                            {suspended ? (
                              <PlayCircle className="size-3.5" />
                            ) : (
                              <PauseCircle className="size-3.5" />
                            )}
                            {suspended
                              ? isRecord
                                ? 'Reactivate'
                                : 'Reactivate'
                              : isRecord
                                ? 'Archive'
                                : 'Suspend'}
                          </button>
                          {!isRecord && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuId(null)
                                onForceLogout(s)
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-popover-foreground transition hover:bg-muted"
                            >
                              <LogOut className="size-3.5" />
                              Force Logout
                            </button>
                          )}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuId(null)
                              onEdit(s)
                            }}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-popover-foreground transition hover:bg-muted"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
