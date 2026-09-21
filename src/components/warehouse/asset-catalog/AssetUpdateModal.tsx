import { useState } from 'react'
import { X } from 'lucide-react'
import { updateCatalogAsset, type CatalogAsset } from '@/lib/warehouse-catalog'

interface AssetUpdateModalProps {
  asset: CatalogAsset
  mode: 'edit' | 'stock'
  onClose: () => void
  onSaved: (asset: CatalogAsset) => void
}

export function AssetUpdateModal({ asset, mode, onClose, onSaved }: AssetUpdateModalProps) {
  const [name, setName] = useState(asset.name)
  const [itemCallName, setItemCallName] = useState(asset.itemCallName ?? '')
  const [description, setDescription] = useState(asset.description ?? '')
  const [count, setCount] = useState(String(asset.currentStock ?? 0))
  const [reason, setReason] = useState('Routine Physical Count')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isStock = mode === 'stock'
  const numericCount = Number(count)
  const variance = numericCount - (asset.currentStock ?? 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (isStock && (!count.trim() || !Number.isInteger(numericCount) || numericCount < 0)) {
      setError('Enter a whole number of zero or greater.')
      return
    }
    if (!isStock && !name.trim()) {
      setError('Asset name is required.')
      return
    }

    setSaving(true)
    const changes = isStock
      ? { currentStock: numericCount }
      : { name: name.trim(), itemCallName: itemCallName.trim() || name.trim(), description: description.trim() }
    const saved = await updateCatalogAsset(asset.id, changes)
    setSaving(false)
    if (!saved) {
      setError('The asset could not be updated. No changes were saved.')
      return
    }
    onSaved({ ...asset, ...changes })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <form className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary">{isStock ? 'Physical Count' : 'Edit Asset'}</p>
            <h2 className="mt-1 font-serif text-xl text-card-foreground">{asset.name}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{asset.assetId}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close update modal" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {isStock ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border border-border bg-background/70 p-3"><p className="text-[0.58rem] uppercase tracking-wider text-muted-foreground">Stock on hand</p><p className="mt-1 text-lg font-semibold text-card-foreground">{asset.currentStock ?? 0} {asset.unit}</p></div>
                <div className="rounded-lg border border-border bg-background/70 p-3"><p className="text-[0.58rem] uppercase tracking-wider text-muted-foreground">Physical count</p><p className={"mt-1 text-lg font-semibold " + (variance === 0 ? 'text-card-foreground' : variance > 0 ? 'text-emerald-600' : 'text-destructive')}>{count || '—'}</p></div>
                <div className="rounded-lg border border-border bg-background/70 p-3"><p className="text-[0.58rem] uppercase tracking-wider text-muted-foreground">Variance</p><p className={"mt-1 text-lg font-semibold " + (variance === 0 ? 'text-card-foreground' : variance > 0 ? 'text-emerald-600' : 'text-destructive')}>{Number.isFinite(variance) ? (variance > 0 ? `+${variance}` : variance) : '—'}</p></div>
              </div>
              <label className="block text-xs font-semibold text-card-foreground">Physical Count<input autoFocus inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30" /></label>
              <label className="block text-xs font-semibold text-card-foreground">Reason<select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"><option>Routine Physical Count</option><option>Stock Correction</option><option>Damaged / Missing</option><option>Returned</option><option>Other</option></select></label>
              <label className="block text-xs font-semibold text-card-foreground">Notes <span className="font-normal text-muted-foreground">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold text-card-foreground">Asset Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
              <label className="block text-xs font-semibold text-card-foreground">Item Call Name<input value={itemCallName} onChange={(event) => setItemCallName(event.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
              <label className="block text-xs font-semibold text-card-foreground">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            </>
          )}
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4"><button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">Cancel</button><button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : isStock ? 'Save Count' : 'Save Changes'}</button></div>
      </form>
    </div>
  )
}
