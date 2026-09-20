import { useRef, useState, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { EXECUTIVE_DESTINATIONS, type ExecutiveDestinationId } from '@/lib/executive-destinations'

interface ExecutiveRailProps {
  activeId: ExecutiveDestinationId
  onSelect: (id: ExecutiveDestinationId) => void
  open: boolean
  onToggle: () => void
}

// Fixed navigation rail for the Executive console. It stays outside the
// scroll container so the navigation remains available while content scrolls.
export function ExecutiveRail({ activeId, onSelect, open, onToggle }: ExecutiveRailProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [drawerX, setDrawerX] = useState(-280)
  const gesture = useRef<{ startX: number; startY: number; startTime: number; mode: 'edge' | 'drawer' } | null>(null)
  const dragging = useRef(false)

  const isMobile = () => window.matchMedia('(max-width: 767px)').matches
  const beginGesture = (event: PointerEvent<HTMLElement>, mode: 'edge' | 'drawer') => {
    if (!isMobile() || event.pointerType === 'mouse') return
    const isEdgeStart = mode === 'edge' && event.clientX <= 24
    if (mode === 'edge' && !isEdgeStart) return
    gesture.current = { startX: event.clientX, startY: event.clientY, startTime: event.timeStamp, mode }
    dragging.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveGesture = (event: PointerEvent<HTMLElement>) => {
    const activeGesture = gesture.current
    if (!activeGesture) return
    const deltaX = event.clientX - activeGesture.startX
    const deltaY = event.clientY - activeGesture.startY
    if (!dragging.current) {
      if (Math.abs(deltaX) <= Math.abs(deltaY) || (activeGesture.mode === 'edge' && deltaX <= 0) || (activeGesture.mode === 'drawer' && deltaX >= 0)) {
        if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) gesture.current = null
        return
      }
      dragging.current = true
    }
    event.preventDefault()
    const nextX = activeGesture.mode === 'edge' ? Math.min(0, -280 + deltaX) : Math.max(-280, Math.min(0, deltaX))
    setDrawerX(nextX)
  }
  const endGesture = (event: PointerEvent<HTMLElement>) => {
    const activeGesture = gesture.current
    if (!activeGesture) return
    const deltaX = event.clientX - activeGesture.startX
    const elapsed = Math.max(1, event.timeStamp - activeGesture.startTime)
    const velocity = Math.abs(deltaX) / elapsed
    const shouldOpen = activeGesture.mode === 'edge' && (drawerX >= -196 || velocity > 0.8)
    const shouldClose = activeGesture.mode === 'drawer' && (drawerX <= -84 || velocity > 0.8)
    setMobileOpen(activeGesture.mode === 'edge' ? shouldOpen : !shouldClose)
    setDrawerX(activeGesture.mode === 'edge' ? (shouldOpen ? 0 : -280) : shouldClose ? -280 : 0)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    gesture.current = null
    dragging.current = false
  }
  const cancelGesture = (event: PointerEvent<HTMLElement>) => {
    if (!gesture.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    gesture.current = null
    dragging.current = false
    setDrawerX(mobileOpen ? 0 : -280)
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-auto fixed inset-y-0 left-0 z-40 w-6 md:hidden"
        onPointerDown={(event) => beginGesture(event, 'edge')}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={cancelGesture}
        style={{ touchAction: 'pan-y' }}
      />
      <div
        aria-hidden={!mobileOpen}
        className={cn('fixed inset-0 z-40 bg-black/25 transition-opacity duration-200 md:hidden', mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}
        onClick={() => { setMobileOpen(false); setDrawerX(-280) }}
      />
      <aside
      onPointerDown={(event) => beginGesture(event, 'drawer')}
      onPointerMove={moveGesture}
      onPointerUp={endGesture}
      onPointerCancel={cancelGesture}
      style={{ transform: typeof window !== 'undefined' && isMobile() ? `translateX(${drawerX}px)` : undefined, transition: dragging.current ? 'none' : 'transform 220ms ease-out', touchAction: 'pan-y' }}
      onClick={(event) => {
        if (window.matchMedia('(min-width: 768px)').matches && !event.target.closest('nav')) onToggle()
      }}
      className={cn(
        'relative shrink-0 order-last z-50 flex w-full cursor-pointer items-center justify-center border-t border-sidebar-border bg-sidebar px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 transition-all duration-200 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[280px] max-md:max-w-[82vw] max-md:border-r max-md:border-t-0 max-md:px-0 max-md:py-4 md:static md:order-first md:h-full md:flex-col md:justify-start md:border-r md:border-t-0 md:px-0 md:py-4',
        open ? 'md:w-64' : 'md:w-12',
      )}
    >
      <div className={cn('mb-3 hidden items-center md:flex', open ? 'w-full justify-between px-4' : 'justify-center')}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Lumiere brand, collapse navigation' : 'Lumiere brand, expand navigation'}
          aria-expanded={open}
          className={cn('flex items-center rounded-lg text-sidebar-primary transition-colors hover:bg-sidebar-accent', open ? 'px-1' : 'size-9 justify-center')}
        >
          {open ? <span className="font-serif text-lg font-medium tracking-[0.18em]">LUMIERE</span> : <span className="font-serif text-lg font-medium leading-none">L</span>}
        </button>
      </div>

      <div className="hidden md:mb-3 md:block md:h-px md:w-8 md:bg-sidebar-border" aria-hidden="true" />

      <nav className={cn('items-center justify-around gap-1 max-md:flex max-md:w-full md:w-auto md:flex-col md:gap-2', mobileOpen ? 'flex w-full' : 'hidden max-md:hidden md:flex')} aria-label="Executive destinations">
        {EXECUTIVE_DESTINATIONS.map((destination) => {
          const Icon = destination.icon
          const active = destination.id === activeId
          return (
            <button
              key={destination.id}
              type="button"
              onClick={() => { onSelect(destination.id); setMobileOpen(false); setDrawerX(-280) }}
              aria-label={destination.label}
              aria-current={active ? 'true' : undefined}
              title={destination.label}
              className={cn(
                'flex size-11 items-center justify-center gap-3 rounded-lg transition-colors md:h-10 md:w-full md:justify-start md:px-3',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn('hidden truncate text-sm font-medium md:block', !open && 'md:hidden')}>
                {destination.label}
              </span>
            </button>
          )
        })}
      </nav>
      </aside>
    </>
  )
}
