import type { ReactNode } from 'react'
import { Search, Warehouse } from 'lucide-react'

interface WarehouseHeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchInHeader?: boolean
  topBarOnly?: boolean
  hideTopBar?: boolean
  mobileLeading?: ReactNode
  desktopOnly?: boolean
}

export function WarehouseHeader({ searchQuery, onSearchChange, searchInHeader = false, topBarOnly = false, mobileLeading, desktopOnly = false }: WarehouseHeaderProps) {
  if (topBarOnly) {
    return (
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center gap-3">
          {mobileLeading}
          <span className="text-xs text-muted-foreground">Warehouse Operations</span>
        </div>
        <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Today</span>
      </div>
    )
  }

  return (
    <div className={`${desktopOnly ? 'hidden md:flex' : 'flex'} max-md:contents w-full flex-wrap items-end justify-between gap-4 border-b border-border bg-background px-5 py-6 sm:px-8`}>
      <div className="flex items-center gap-3 max-md:px-5 max-md:py-6">
        {mobileLeading}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-primary">
            <Warehouse className="size-3" aria-hidden="true" />
            Warehouse Operations Manager
          </span>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-foreground">Warehouse Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Warehouse KPIs, ingress calendar, and upcoming events.</p>
        </div>
      </div>
      {searchInHeader && (
        <div className="max-md:sticky max-md:top-16 max-md:z-20 max-md:-mx-5 max-md:w-[calc(100%+2.5rem)] max-md:border-b max-md:border-border max-md:bg-background max-md:px-5 max-md:py-3 relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-8 top-1/2 size-4 -translate-y-1/2 text-muted-foreground max-md:left-8" aria-hidden="true" />
          <label htmlFor="warehouse-event-search" className="sr-only">Search events</label>
          <input id="warehouse-event-search" type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search events" className="h-10 w-full rounded-lg border border-border/80 bg-card pl-10 pr-4 text-xs text-card-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 max-md:text-base" />
        </div>
      )}
    </div>
  )
}
