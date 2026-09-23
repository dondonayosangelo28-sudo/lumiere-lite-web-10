import { useState } from 'react'
import { X } from 'lucide-react'
import type { EmploymentType, NewEmployeeRecordDraft } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (draft: NewEmployeeRecordDraft) => void
}

const inputClass = 'mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30'

export function EmployeeRecordModal({ open, onClose, onCreate }: Props) {
  const emptyDraft: NewEmployeeRecordDraft = { firstName: '', surname: '', middleName: '', contact: '', employmentType: 'On-call', onCallAssignment: 'Warehouse', otherRole: '' }
  const [draft, setDraft] = useState<NewEmployeeRecordDraft>(emptyDraft)
  if (!open) return null
  const valid = Boolean(draft.firstName.trim() && draft.surname.trim() && /^\d{11}$/.test(draft.contact) && (draft.onCallAssignment === 'Warehouse' || draft.otherRole.trim()))
  const close = () => { setDraft(emptyDraft); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-700/70 p-4" role="dialog" aria-modal="true" aria-label="New employee record">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-card shadow-2xl">
        <div className="flex items-center justify-between bg-primary px-6 py-3.5"><div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground">New Employee Record</h2><p className="mt-1 text-[0.65rem] text-primary-foreground/80">No email, password, or portal access</p></div><button type="button" onClick={close} className="text-primary-foreground/80 hover:text-primary-foreground" aria-label="Close"><X className="size-4" /></button></div>
        <div className="space-y-4 px-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">First Name<input className={inputClass} value={draft.firstName} onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))} placeholder="Lucia" /></label><label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">Middle Name<input className={inputClass} value={draft.middleName} onChange={(e) => setDraft((p) => ({ ...p, middleName: e.target.value }))} placeholder="Optional" /></label><label className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">Surname<input className={inputClass} value={draft.surname} onChange={(e) => setDraft((p) => ({ ...p, surname: e.target.value }))} placeholder="Mendes" /></label></div>
          <label className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">Contact Number<input className={inputClass} value={draft.contact} onChange={(e) => setDraft((p) => ({ ...p, contact: e.target.value.replace(/\D/g, '').slice(0, 11) }))} placeholder="09123456789" inputMode="numeric" /></label>
          <label className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">Employment Type<select className={`${inputClass} appearance-none`} value={draft.employmentType} onChange={(e) => setDraft((p) => ({ ...p, employmentType: e.target.value as EmploymentType }))}><option value="On-call">On-call</option></select></label>
          <label className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">On-call Assignment<select className={`${inputClass} appearance-none`} value={draft.onCallAssignment} onChange={(e) => setDraft((p) => ({ ...p, onCallAssignment: e.target.value as 'Warehouse' | 'Other' }))}><option value="Warehouse">Warehouse</option><option value="Other">Other</option></select></label>
          {draft.onCallAssignment === 'Other' && <label className="block text-[0.65rem] font-bold uppercase tracking-[0.1em] text-foreground">Other Role<input className={inputClass} value={draft.otherRole} onChange={(e) => setDraft((p) => ({ ...p, otherRole: e.target.value }))} placeholder="e.g. Floral Assistant" /></label>}
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">This record can be archived and reactivated, but it will never create portal credentials.</div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={close} className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">Cancel</button><button type="button" disabled={!valid} onClick={() => { onCreate(draft); close() }} className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Create Record</button></div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeRecordModal
