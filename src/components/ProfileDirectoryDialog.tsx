import { useEffect } from 'react'
import { CheckCircle2, Clock3, Mail, ShieldCheck, UserRound, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface ProfileDirectoryDialogProps { open: boolean; onClose: () => void }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'
}

export function ProfileDirectoryDialog({ open, onClose }: ProfileDirectoryDialogProps) {
  const { adminName, adminRole, adminEmail, subRole } = useAuth()
  const displayRole = adminRole === 'WOM' ? 'Warehouse' : adminRole
  const displayEmployment = subRole || 'Regular'

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button type="button" aria-label="Close profile" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" className="relative flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5 sm:px-8">
          <div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">Account directory</p><h2 id="profile-dialog-title" className="mt-1 text-2xl font-semibold tracking-tight">Profile</h2><p className="mt-1 text-sm text-muted-foreground">Your current account details and access identity.</p></div>
          <button type="button" onClick={onClose} aria-label="Close profile" className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-background/60 p-5 sm:flex-row sm:items-center"><div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-semibold text-primary ring-8 ring-primary/5" aria-hidden="true">{initials(adminName)}</div><div className="min-w-0"><h3 className="truncate text-xl font-semibold">{adminName || 'Current user'}</h3><p className="mt-1 text-sm text-muted-foreground">{displayRole}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary"><CheckCircle2 className="size-3.5" aria-hidden="true" /> Active</span><span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{displayEmployment}</span></div></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Mail className="size-3.5" aria-hidden="true" /> Email</div><p className="mt-3 break-all text-sm font-medium">{adminEmail || 'Not available'}</p></div>
            <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><ShieldCheck className="size-3.5" aria-hidden="true" /> Role</div><p className="mt-3 text-sm font-medium">{displayRole || 'Not available'}</p></div>
            <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" /> Employment</div><p className="mt-3 text-sm font-medium">{displayEmployment}</p></div>
            <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" /> Account status</div><p className="mt-3 flex items-center gap-2 text-sm font-medium"><span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" /> Active</p></div>
          </div>
        </div>
      </section>
    </div>
  )
}
