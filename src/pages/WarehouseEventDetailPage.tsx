import { useMemo, useState } from 'react'
import { usePortal } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import type { PortalEvent } from '@/lib/types'
import type { WarehouseModuleId } from '@/lib/warehouse-modules'
import {
  dispatchBannerFor,
  getEventDetailSnapshot,
  resolveCatalogAssetForItem,
  type EventAllocatedItem,
  type EventCrewAssignment,
} from '@/lib/event-detail'
import {
  addNewBatch,
  advanceBatchStage,
  markBatchStalled,
  resolveBatchStall,
  updateBatchHandoffNote,
  updateReconciliationRow,
  useDispatchStore,
} from '@/lib/warehouse-dispatch'
import { EventDetailHeader } from '@/components/warehouse/event-detail/EventDetailHeader'
import { CrewPanel } from '@/components/warehouse/event-detail/CrewPanel'
import { ItemsPanel } from '@/components/warehouse/event-detail/ItemsPanel'
import { ReplenishmentPanel } from '@/components/warehouse/event-detail/ReplenishmentPanel'
import { DispatchPanel } from '@/components/warehouse/event-detail/DispatchPanel'
import { BatchDetailView } from '@/components/warehouse/event-detail/BatchDetailView'
import { AssignCrewModal } from '@/components/warehouse/event-detail/AssignCrewModal'
import { CrewInfoModal } from '@/components/warehouse/event-detail/CrewInfoModal'
import { EventChangesModal } from '@/components/warehouse/event-detail/EventChangesModal'
import { AssetDetailModal } from '@/components/warehouse/asset-catalog/AssetDetailModal'
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader'
import { WarehouseMobileMenu } from '@/components/warehouse/WarehouseMobileMenu'

interface WarehouseEventDetailPageProps {
  event: PortalEvent
  onBack: () => void
  onOpenModule: (id: WarehouseModuleId) => void
}

let batchSeq = 0

export function WarehouseEventDetailPage({ event, onBack, onOpenModule }: WarehouseEventDetailPageProps) {
  const { events, staff, procurement } = usePortal()
  const { hasFullWarehouseAccess, isManningOfficer, isProductionManager } = useAuth()
  // Full crew detail is granted to the full-access Warehouse Ops Manager
  // super-account AND the Manning Officer WOM sub-role (Modify on Manpower &
  // Crew per the RBAC screen) — not the coarse account type, which every WOM
  // sub-role satisfies. Other sub-roles (e.g. Purchasing Officer) get the
  // muted restricted state.
  const canViewFullCrewDetail = hasFullWarehouseAccess || isManningOfficer
  const snapshot = useMemo(() => getEventDetailSnapshot(event, staff, procurement), [event, staff, procurement])

  const [crew, setCrew] = useState<EventCrewAssignment[]>(snapshot.crew)
  const dispatchStore = useDispatchStore(events, staff, procurement)
  const batches = dispatchStore.get(event.id) ?? snapshot.dispatch.batches
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [crewModalOpen, setCrewModalOpen] = useState(false)
  const [selectedAssetItem, setSelectedAssetItem] = useState<EventAllocatedItem | null>(null)
  const [selectedCrewMember, setSelectedCrewMember] = useState<EventCrewAssignment | null>(null)
  const [changesModalOpen, setChangesModalOpen] = useState(false)
  const [zoom, setZoom] = useState(100)

  const fieldCrew = useMemo(() => staff.filter((member) => member.role === 'Field & Production Crew'), [staff])

  const activeIndex = batches.findIndex((batch) => batch.id === activeBatchId)
  const activeBatch = activeIndex >= 0 ? batches[activeIndex] : null

  const handleNewBatch = () => {
    batchSeq += 1
    const newBatch = addNewBatch(event.id, 'outbound', procurement)
    setActiveBatchId(newBatch.id)
  }

  const handleJustificationChange = (batchId: string, rowId: string, value: string) => {
    updateReconciliationRow(event.id, batchId, rowId, { justification: value })
  }

  const handleHandoffNoteChange = (batchId: string, value: string) => {
    updateBatchHandoffNote(event.id, batchId, value)
  }

  const handleAdvanceStage = (batchId: string) => {
    advanceBatchStage(event.id, batchId)
  }

  return (
    <div className="min-h-screen bg-background max-md:static max-md:inset-auto max-md:h-auto max-md:min-h-[100dvh] max-md:overflow-visible">
      <WarehouseHeader topBarOnly mobileLeading={<WarehouseMobileMenu />} searchQuery="" onSearchChange={() => {}} />
      <main className="mx-auto flex w-full max-w-[78rem] flex-col px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-8 sm:py-10">
        <div className="mx-auto mb-4 flex w-full max-w-[54rem] items-center justify-end gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground print:hidden">
          <span className="mr-auto text-[0.58rem] tracking-[0.16em]">Document view</span>
          <button type="button" onClick={() => setZoom((value) => Math.max(75, value - 5))} className="rounded border border-border px-2 py-1.5 transition-colors hover:bg-muted" aria-label="Zoom out">−</button>
          <span className="min-w-12 text-center tabular-nums">{zoom}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(125, value + 5))} className="rounded border border-border px-2 py-1.5 transition-colors hover:bg-muted" aria-label="Zoom in">+</button>
          <button type="button" onClick={() => window.print()} className="ml-2 rounded border border-border px-3 py-1.5 transition-colors hover:bg-muted">Print</button>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-[54rem] origin-top transition-transform duration-200" style={{ transform: `scale(${zoom / 100})`, marginBottom: `${(zoom - 100) * 7}px` }}>
            <div className="document-paper flex flex-col gap-7 border border-border/80 bg-card px-6 py-8 shadow-[0_18px_50px_rgba(52,42,32,0.12)] sm:px-12 sm:py-12">

        <EventDetailHeader
          event={event}
          overallStatus={snapshot.overallStatus}
          changedSinceLastView={snapshot.changedSinceLastView}
          onBack={onBack}
          onOpenChanges={() => setChangesModalOpen(true)}
        />

        <CrewPanel
          crew={crew}
          onManage={() => setCrewModalOpen(true)}
          onSelect={setSelectedCrewMember}
        />

        <ItemsPanel
          items={snapshot.items}
          onViewAllocation={() => onOpenModule('assets')}
          onOpenItem={setSelectedAssetItem}
        />

        <ReplenishmentPanel
          summary={snapshot.replenishment}
          onViewDeficits={() => onOpenModule('replenishment')}
        />

        <DispatchPanel
          banner={dispatchBannerFor(batches)}
          batches={batches}
          onNewBatch={handleNewBatch}
          onOpenBatch={setActiveBatchId}
        />
            </div>
          </div>
        </div>
      </main>

      {activeBatch && (
        <BatchDetailView
          batch={activeBatch}
          hasPrevious={activeIndex > 0}
          hasNext={activeIndex < batches.length - 1}
          onPrevious={() => setActiveBatchId(batches[activeIndex - 1]?.id ?? null)}
          onNext={() => setActiveBatchId(batches[activeIndex + 1]?.id ?? null)}
          onClose={() => setActiveBatchId(null)}
          onJustificationChange={(rowId, value) => handleJustificationChange(activeBatch.id, rowId, value)}
          onHandoffNoteChange={(value) => handleHandoffNoteChange(activeBatch.id, value)}
          onAdvanceStage={() => handleAdvanceStage(activeBatch.id)}
          onStall={(reason) => markBatchStalled(event.id, activeBatch.id, reason)}
          onResume={() => resolveBatchStall(event.id, activeBatch.id)}
        />
      )}

      {crewModalOpen && (
        <AssignCrewModal
          availableStaff={fieldCrew}
          assigned={crew}
          onClose={() => setCrewModalOpen(false)}
          onSave={(nextCrew) => {
            setCrew(nextCrew)
            setCrewModalOpen(false)
          }}
        />
      )}

      {selectedAssetItem && (
        <AssetDetailModal
          asset={resolveCatalogAssetForItem(selectedAssetItem)}
          onClose={() => setSelectedAssetItem(null)}
        />
      )}

      {selectedCrewMember && (
        <CrewInfoModal
          member={selectedCrewMember}
          staff={staff.find((member) => member.id === selectedCrewMember.id) ?? null}
          canViewFullDetail={canViewFullCrewDetail}
          onClose={() => setSelectedCrewMember(null)}
        />
      )}

      {changesModalOpen && (
        <EventChangesModal
          eventTitle={event.title}
          editedFields={snapshot.editedFields}
          onClose={() => setChangesModalOpen(false)}
        />
      )}
    </div>
  )
}

export default WarehouseEventDetailPage
