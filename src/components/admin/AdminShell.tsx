import { useState, type ReactNode } from 'react'
import { AdminMobileDrawer } from '@/components/admin/AdminMobileDrawer'
import { AdminRail } from '@/components/admin/AdminRail'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import type { AdminDestinationId } from '@/lib/admin-destinations'

interface AdminShellProps {
  activeId: AdminDestinationId
  onSelect: (id: AdminDestinationId) => void
  /* Sticky region pinned to the top of the scroll area (title and subtitle only). */
  stickyHeader?: ReactNode
  children: ReactNode
}

// Fixed console frame for the Admin experience.
//
// Hard layout rule: the icon rail and top bar live OUTSIDE the scroll
// container, so they never move. Inside the content column only the body
// scrolls; the optional sticky header stays pinned while the body slides
// beneath it. Tables rendered in `children` pin their own column-header row
// independently, via a bounded, self-scrolling wrapper (see WorkforceTable /
// AdminSecurityAuditPage) rather than reading this header's height — nesting
// sticky inside this page scroll would require the table's own horizontal
// scroll wrapper to stay `overflow-visible` on the y axis, which the CSS spec
// doesn't allow once `overflow-x` is set to anything but `visible`.
export function AdminShell({ activeId, onSelect, stickyHeader, children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background sm:fixed sm:inset-0 sm:h-auto sm:flex-row">
      <AdminRail activeId={activeId} onSelect={onSelect} />

      <div className="flex min-w-0 flex-1 flex-col max-md:w-full max-md:min-w-0 sm:min-h-0">
        <AdminTopBar onOpenMenu={() => setMobileNavOpen(true)} />

        {/* Mobile uses normal document scrolling; desktop keeps the content scroller. */}
        <div className="flex-1 overflow-x-hidden overflow-visible pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-sm:overflow-visible max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden sm:min-h-0 sm:overflow-y-auto sm:pb-0">
          {stickyHeader && (
            <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-5 py-6 backdrop-blur max-sm:top-0 max-sm:px-3 max-sm:pt-3 max-sm:pb-[19px] sm:px-8">
              {stickyHeader}
            </div>
          )}
          <div className="px-5 pt-[15px] pb-6 max-sm:px-3 max-sm:pt-[15px] max-sm:pb-3 sm:px-8">{children}</div>
        </div>
      </div>
      <AdminMobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        activeId={activeId}
        onSelect={onSelect}
      />
    </div>
  )
}
