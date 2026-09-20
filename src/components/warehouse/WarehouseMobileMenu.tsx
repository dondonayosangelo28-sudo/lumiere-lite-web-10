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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const handleSelect = (id: (typeof WAREHOUSE_MODULES)[number]['id']) => {
    selectModule(id)
    setOpen(false)
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open warehouse navigation"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-primary/15 text-primary"
      >
        <Menu className="size-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/45" role="presentation" onClick={() => setOpen(false)}>
          <aside
            className="h-[100dvh] w-72 bg-sidebar px-4 py-5 text-sidebar-foreground shadow-2xl"
            role="dialog"
            aria-label="Warehouse navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg font-medium tracking-[0.18em] text-sidebar-primary">LUMIERE</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close warehouse navigation" className="flex size-9 items-center justify-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <div className="my-5 h-px bg-sidebar-border" aria-hidden="true" />
            <nav className="space-y-2" aria-label="Warehouse modules">
              {WAREHOUSE_MODULES.map((module) => {
                const Icon = module.icon
                const active = module.id === activeModuleId
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handleSelect(module.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground')}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {module.label}
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
