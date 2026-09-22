import type { ReactNode } from 'react'

interface EventDetailSectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function EventDetailSection({ title, action, children }: EventDetailSectionProps) {
  return (
    <section className="border-t border-border/80 pt-7 first:border-t-0 first:pt-0">
      <div className="flex items-end justify-between gap-4 border-b border-border/80 pb-2.5">
        <h2 className="font-serif text-xl font-medium tracking-[-0.015em] text-foreground">{title}</h2>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  )
}

interface SectionButtonProps {
  onClick: () => void
  children: ReactNode
}

export function SectionButton({ onClick, children }: SectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition-colors hover:bg-accent"
    >
      {children}
    </button>
  )
}
