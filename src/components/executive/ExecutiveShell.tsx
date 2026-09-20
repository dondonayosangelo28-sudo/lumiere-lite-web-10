import { useState, type ReactNode } from 'react'
import { ExecutiveMobileDrawer } from '@/components/executive/ExecutiveMobileDrawer'
import { ExecutiveRail } from '@/components/executive/ExecutiveRail'
import { ExecutiveTopBar } from '@/components/executive/ExecutiveTopBar'
import type { ExecutiveDestinationId } from '@/lib/executive-destinations'
import { useNav } from '@/lib/nav'

interface ExecutiveShellProps {
  activeId: ExecutiveDestinationId
  onSelect: (id: ExecutiveDestinationId) => void
  /* Sticky region pinned to the top of the scroll area (title, stat cards, filters). */
  stickyHeader?: ReactNode
  children: ReactNode
}

// Fixed console frame for the Executive experience — mirrors AdminShell
// exactly: no labeled sidebar, no wordmark, no bottom profile card.
//
// Hard layout rule: the icon rail and top bar live OUTSIDE the scroll
// container, so they never move. Inside the content column only the body
// scrolls; the optional sticky header stays pinned while the body slides
// beneath it.
export function ExecutiveShell({ activeId, onSelect, stickyHeader, children }: ExecutiveShellProps) {
  const { executiveRailOpen, toggleExecutiveRail } = useNav()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleDestinationSelect = (id: ExecutiveDestinationId) => {
    if (id === activeId) {
      toggleExecutiveRail()
      return
    }

    onSelect(id)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background md:fixed md:inset-0 md:h-auto md:flex-row">
      <ExecutiveRail
        activeId={activeId}
        onSelect={handleDestinationSelect}
        open={executiveRailOpen}
        onToggle={toggleExecutiveRail}
      />

      <div className="flex min-w-0 flex-1 flex-col md:min-h-0">
        <ExecutiveTopBar onOpenMenu={() => setMobileNavOpen(true)} />

        {/* Mobile uses normal document scrolling; desktop keeps the content scroller. */}
        <div className="executive-mobile-shell flex-1 overflow-x-hidden overflow-visible pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:overflow-visible md:min-h-0 md:overflow-y-auto md:pb-0">
          {stickyHeader && (
            <div className="executive-mobile-sticky sticky top-0 z-20 border-b border-border bg-background/95 px-5 py-6 backdrop-blur max-md:top-16 max-sm:px-3 max-sm:pt-3 max-sm:pb-[19px] sm:px-8">
              {stickyHeader}
            </div>
          )}
          <div className="px-5 pt-[15px] pb-6 max-sm:px-3 max-sm:pt-[15px] max-sm:pb-3 sm:px-8">{children}</div>
        </div>
      </div>
      <ExecutiveMobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeId={activeId}
        onSelect={onSelect}
      />
    </div>
  )
}
