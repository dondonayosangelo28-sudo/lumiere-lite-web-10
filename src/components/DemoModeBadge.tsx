import { DEMO_MODE } from '@/lib/demo-mode'

export function DemoModeBadge() {
  if (!DEMO_MODE) return null

  return (
    <span className="shrink-0 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-primary">
      DEMO MODE
    </span>
  )
}
