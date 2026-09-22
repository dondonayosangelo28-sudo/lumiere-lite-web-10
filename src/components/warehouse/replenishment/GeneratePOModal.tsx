import { useState } from 'react'
import { X } from 'lucide-react'
import type { DeficitLine } from '@/lib/warehouse-replenishment'
import { getVendorById, getWarehouseVendors } from '@/lib/warehouse-vendors'
import { Pill } from '@/components/warehouse/shared/Pill'
import { DEFICIT_STATUS_TONE } from '@/components/warehouse/replenishment/tone'

interface GeneratePOModalProps {
  line: DeficitLine
  onClose: () => void
  onGenerate: (id: string, quantity: number, vendorId: string | null) => void
}

export function GeneratePOModal({ line, onClose, onGenerate }: GeneratePOModalProps) {
  const vendors = getWarehouseVendors()
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(line.primaryVendorId ?? null)
  const [quantity, setQuantity] = useState(String(line.quantityNeeded))

  const activeVendor = selectedVendorId ? getVendorById(selectedVendorId) : undefined
  const qtyNumber = Number(quantity) || 0
  const estimatedCost = qtyNumber * line.costPerUnit
  const validationMessage = !Number.isInteger(qtyNumber) || qtyNumber <= 0
    ? 'Quantity must be a whole number greater than zero.'
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm max-md:h-[100dvh] max-md:bg-black/40 max-md:backdrop-blur-none max-md:p-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Order preparation
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium text-card-foreground">{line.itemName}</h2>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone={DEFICIT_STATUS_TONE[line.status]}>{line.status}</Pill>
              {line.eventTitle && (
                <span className="text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground">
                  For {line.eventTitle}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Vendor</span>
            <select
              value={selectedVendorId ?? ''}
              onChange={(event) => setSelectedVendorId(event.target.value || null)}
              className="rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            >
              <option value="">No Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <span className="text-[0.6rem] text-muted-foreground">
              Optional — an order can proceed before a supplier is assigned.
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Quantity to order</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-background px-4 py-3">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Estimated cost</span>
            <span className="text-lg font-semibold text-card-foreground">₱{estimatedCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {validationMessage && <p role="status" className="text-xs font-medium text-destructive">{validationMessage}</p>}
          <div className="flex items-center justify-end gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
            <button
              type="button"
              disabled={qtyNumber <= 0}
              onClick={() => onGenerate(line.id, qtyNumber, selectedVendorId)}
              className="rounded-md bg-primary px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              Proceed with Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
