import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { addVendor, type WarehouseVendor } from '@/lib/warehouse-vendors'
import { createVendorApi } from '@/lib/vendorApi'

interface AddVendorModalProps {
  onClose: () => void
  // Receives the freshly registered vendor so a caller opening this from a
  // selector can immediately select it.
  onCreated?: (vendor: WarehouseVendor) => void
}

export function AddVendorModal({ onClose, onCreated }: AddVendorModalProps) {
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const missing = [
    name.trim().length === 0 ? 'vendor name' : null,
    contactName.trim().length === 0 ? 'contact person' : null,
  ].filter(Boolean)
  const canSubmit = missing.length === 0

  const fieldClass =
    'rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30'
  const labelClass = 'text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted-foreground'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)
    setError(null)
    if (!canSubmit) return

    setIsSubmitting(true)
    const apiVendor = await createVendorApi({ name: name.trim() })
    if (!apiVendor) {
      setError('Unable to add vendor. Please try again.')
      setIsSubmitting(false)
      return
    }

    const vendor = addVendor({
      name,
      contactName,
      email,
      phone,
      specialty: specialty || 'General supply',
      leadTimeHours: 24,
      status: 'Active',
    })
    onCreated?.(vendor)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm max-md:h-[100dvh] max-md:bg-black/40 max-md:backdrop-blur-none max-md:p-3 max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        // Stops the click from also reaching a parent modal's backdrop when
        // this is opened inline from a vendor selector.
        event.stopPropagation()
        onClose()
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Vendor registry
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium text-card-foreground">Add New Vendor</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <form id="add-vendor-form" onSubmit={handleSubmit} className="grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto px-6 py-5">
          {hasSubmitted && missing.length > 0 && (
            <p className="col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              Required information is missing. Please complete the highlighted fields.
            </p>
          )}
          {error && (
            <p className="col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className={labelClass}>Vendor name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Northbay Event Supply"
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Contact person</span>
            <input value={contactName} onChange={(event) => setContactName(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Phone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5">
            <span className={labelClass}>Specialty</span>
            <input
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              placeholder="e.g. Linens, runners & tablescape textiles"
              className={fieldClass}
            />
          </label>
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className="text-[0.62rem] text-muted-foreground">
            {isSubmitting ? 'Adding vendor…' : 'Add the vendor’s master information.'}
          </p>
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-card-foreground transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-vendor-form"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
          >
            Add Vendor
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
