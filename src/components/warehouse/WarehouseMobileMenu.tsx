import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WAREHOUSE_MODULES } from '@/lib/warehouse-modules'
import { useWarehouseNav } from '@/lib/warehouse-nav'

export function WarehouseMobileMenu() {
  const [open, setOpen] = useState(false)
  const { activeModuleId, selectModule } = useWarehouseNav()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleSelect = (id: typeof WAREHOUSE_MODULES[number]['id']) => {
    selectModule(id)
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open warehouse navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-card-foreground shadow-sm"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close warehouse navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/45" />
          <aside className="fixed inset-y-0 left-0 z-[51] flex h-[100dvh] w-72 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-medium tracking-[0.18em] text-sidebar-primary">LUMIERE</span>
              <button type="button" aria-label="Close warehouse navigation" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="my-4 h-px bg-sidebar-border" aria-hidden="true" />
            <nav className="flex flex-col gap-2" aria-label="Warehouse modules">
              {WAREHOUSE_MODULES.map((module) => {
                const Icon = module.icon
                const active = module.id === activeModuleId
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handleSelect(module.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {module.label}
                  </button>
                )
              })}
            </nav>
          </aside>
        </>
      )}
    </div>
  )
}
