import { useState } from 'react'
import { X } from 'lucide-react'
import type { DeficitLine } from '@/lib/warehouse-replenishment'

interface RecordReceiptModalProps { line: DeficitLine; onClose: () => void; onConfirm: (quantity: number, receivedDate: string, notes: string) => Promise<void> }

export function RecordReceiptModal({ line, onClose, onConfirm }: RecordReceiptModalProps) {
  const ordered = line.orderedQuantity ?? line.quantityNeeded
  const previouslyReceived = line.receivedQuantity ?? 0
  const remaining = Math.max(0, ordered - previouslyReceived)
  const [quantity, setQuantity] = useState(String(remaining))
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const quantityNumber = Number(quantity)
  const invalid = !Number.isInteger(quantityNumber) || quantityNumber <= 0 || quantityNumber > remaining

  const submit = async () => {
    if (invalid || saving) { setError(`Enter a whole number between 1 and ${remaining}.`); return }
    setSaving(true); setError('')
    try { await onConfirm(quantityNumber, receivedDate, notes) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Receipt could not be recorded. Try again.'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="receive-item-title" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-border px-6 py-5"><div><p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-primary">Warehouse receiving</p><h2 id="receive-item-title" className="mt-1 font-serif text-xl font-medium text-card-foreground">Receive Item</h2><p className="mt-1 text-sm text-card-foreground">{line.itemName}</p></div><button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button></header>
        <div className="flex flex-col gap-4 px-6 py-5">
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-4 text-sm"><div><dt className="text-xs text-muted-foreground">Event</dt><dd className="mt-1 font-medium text-card-foreground">{line.eventTitle ?? 'General stockroom'}</dd></div><div><dt className="text-xs text-muted-foreground">PO / order</dt><dd className="mt-1 font-medium text-card-foreground">{line.poRef ?? 'Order reference pending'}</dd></div><div><dt className="text-xs text-muted-foreground">Quantity ordered</dt><dd className="mt-1 font-medium text-card-foreground">{ordered} {line.unit}</dd></div><div><dt className="text-xs text-muted-foreground">Previously received</dt><dd className="mt-1 font-medium text-card-foreground">{previouslyReceived} {line.unit}</dd></div><div className="col-span-2 border-t border-border pt-3"><dt className="text-xs text-muted-foreground">Remaining to receive</dt><dd className="mt-1 text-lg font-semibold text-primary">{remaining} {line.unit}</dd></div></dl>
          <label className="flex flex-col gap-1.5"><span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Received Quantity</span><input type="number" min={1} max={remaining} value={quantity} onChange={(event) => setQuantity(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Received date</span><input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Notes <span className="font-normal normal-case tracking-normal">(optional)</span></span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" /></label>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>
        <footer className="flex justify-end gap-3 border-t border-border px-6 py-4"><button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] hover:bg-accent">Cancel</button><button type="button" onClick={submit} disabled={saving || remaining === 0} className="rounded-md bg-primary px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-40">{saving ? 'Saving…' : 'Received'}</button></footer>
      </div>
    </div>
  )
}
      
