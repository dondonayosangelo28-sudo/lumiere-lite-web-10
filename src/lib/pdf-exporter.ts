import jsPDF from 'jspdf'
import type { EventDispatchSummary } from '@/lib/warehouse-dispatch'
import type { DeficitLine } from '@/lib/warehouse-replenishment'
import type { ProcurementItem } from '@/lib/types'

// ─── Authoritative Brand Theme Tokens (from src/index.css) ───
const BRAND = {
  PRIMARY: [155, 107, 63] as [number, number, number],        // #9B6B3F (Lumière Gold / Bronze)
  FOREGROUND: [39, 37, 34] as [number, number, number],      // #272522 (Warm Charcoal)
  MUTED: [117, 111, 103] as [number, number, number],         // #756F67 (Warm Gray)
  CARD_BG: [251, 248, 242] as [number, number, number],       // #FBF8F2 (Warm Cream Header Fill)
  BORDER: [216, 206, 192] as [number, number, number],        // #D8CEC0 (Warm Border)
  ZEBRA_BG: [253, 251, 247] as [number, number, number],      // #FDFBF7 (Subtle Warm Cream)
  WHITE: [255, 255, 255] as [number, number, number],
  SUCCESS: [5, 150, 105] as [number, number, number],        // #059669 (Emerald Green)
  WARNING: [180, 83, 9] as [number, number, number],          // #B45309 (Amber Gold)
  DANGER: [168, 77, 59] as [number, number, number],          // #A84D3B (Terracotta Red)
}

interface ColumnDef {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

class PdfReportBuilder {
  doc: jsPDF
  margin = 34
  pageWidth = 595.28
  pageHeight = 841.89
  printableWidth = this.pageWidth - this.margin * 2
  y = 50
  currentPage = 1

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
  }

  // Draw standardized brand header banner
  drawHeader(title: string, subheaderLines: string[]) {
    const { doc, margin, pageWidth } = this
    this.y = 50

    doc.setDrawColor(...BRAND.BORDER)
    doc.setLineWidth(0.7)
    doc.roundedRect(22, 28, pageWidth - 44, this.pageHeight - 56, 5, 5, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text(`LUMIÈRE  /  ${title.toUpperCase()}`, margin, 26)
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, 32, pageWidth - margin, 32)

    doc.setFillColor(...BRAND.PRIMARY)
    doc.rect(margin, this.y, 4, 72, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.PRIMARY)
    doc.text('LUMIÈRE', margin + 14, this.y + 15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('EVENT OPERATIONS & ASSET MANAGEMENT', margin + 14, this.y + 28)
    doc.setFont('times', 'bold')
    doc.setFontSize(19)
    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(title.toUpperCase(), margin + 14, this.y + 54, { maxWidth: this.printableWidth - 150 })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('ISSUED / GENERATED', pageWidth - margin - 112, this.y + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, this.y + 29, { align: 'right' })

    this.y += 84

    // Metadata Subheader Box if provided
    if (subheaderLines.length > 0) {
      this.y += 6
      const boxHeight = 14 + subheaderLines.length * 13
      doc.setFillColor(...BRAND.CARD_BG)
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.75)
      doc.roundedRect(margin, this.y, this.printableWidth, boxHeight, 4, 4, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...BRAND.FOREGROUND)
      let lineY = this.y + 14
      subheaderLines.forEach((line) => {
        doc.text(line, margin + 10, lineY)
        lineY += 13
      })
      this.y += boxHeight + 10
    } else {
      this.y += 10
    }

    // Divider Line
    doc.setLineWidth(0.5)
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, this.y, pageWidth - margin, this.y)
    this.y += 15
  }

  // Draw structured table header
  drawTableHeader(columns: ColumnDef[]) {
    const { doc, margin } = this

    doc.setFillColor(...BRAND.CARD_BG)
    doc.rect(margin, this.y, this.printableWidth, 20, 'F')

    doc.setDrawColor(...BRAND.BORDER)
    doc.setLineWidth(0.75)
    doc.line(margin, this.y + 20, margin + this.printableWidth, this.y + 20)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.PRIMARY)

    let currentX = margin
    columns.forEach((col) => {
      const textX = col.align === 'center' ? currentX + col.width / 2 : col.align === 'right' ? currentX + col.width - 6 : currentX + 6
      doc.text(col.header.toUpperCase(), textX, this.y + 13, { align: col.align || 'left' })
      currentX += col.width
    })

    this.y += 24
  }

  // Check page bottom overflow and add new page if needed
  checkPageBreak(requiredHeight = 22, columns?: ColumnDef[]) {
    if (this.y + requiredHeight > this.pageHeight - 50) {
      this.doc.addPage()
      this.currentPage += 1
      this.y = 50
      this.doc.setDrawColor(...BRAND.BORDER)
      this.doc.setLineWidth(0.7)
      this.doc.roundedRect(22, 28, this.pageWidth - 44, this.pageHeight - 56, 5, 5, 'S')
      if (columns) {
        this.drawTableHeader(columns)
      }
    }
  }

  // Add standard footer with page numbers
  addFooters() {
    const totalPages = (this.doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(7.5)
      this.doc.setTextColor(...BRAND.MUTED)
      this.doc.setLineWidth(0.5)
      this.doc.setDrawColor(...BRAND.BORDER)
      this.doc.line(this.margin, this.pageHeight - 35, this.pageWidth - this.margin, this.pageHeight - 35)

      this.doc.text('Lumière Management System · Confidential Operations Report', this.margin, this.pageHeight - 22)
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 22, { align: 'right' })
    }
  }

  save(filename: string) {
    this.addFooters()
    this.doc.save(filename)
  }
}

// Helper to color-code status strings
function getStatusRGB(statusStr?: string): [number, number, number] {
  if (!statusStr) return BRAND.FOREGROUND
  const lower = statusStr.toLowerCase()
  if (lower.includes('delivered') || lower.includes('confirmed') || lower.includes('active') || lower.includes('present') || lower.includes('available') || lower.includes('success')) {
    return BRAND.SUCCESS
  }
  if (lower.includes('pending') || lower.includes('flagged') || lower.includes('draft') || lower.includes('reorder') || lower.includes('warning')) {
    return BRAND.WARNING
  }
  if (lower.includes('critical') || lower.includes('deficit') || lower.includes('no_show') || lower.includes('denied') || lower.includes('unavailable') || lower.includes('out_of_stock')) {
    return BRAND.DANGER
  }
  return BRAND.FOREGROUND
}

// ─── 1. Security & System Audit Logs PDF Exporter ───
export function exportEventAssetLogisticsPdf({
  event,
  materials,
  checklist,
  logistics,
  generatedBy,
  filename,
}: {
  event: {
    title: string
    client: string
    venue: string
    galaDate: string
    date: string
    recordId: string
    status: string
    tier: string
    attendance: string
    footprint: string
    phase?: string
    pipelineStage?: string
  }
  materials: Array<{ name: string; category: string; quantity: number; sku: string; image?: string }>
  checklist: Array<{ name: string; quantity: number }>
  logistics?: {
    batches: Array<{
      vehicleType: string
      plateNumber: string
      driverName?: string
      direction: string
      stage: string
      crew: string[]
      handoffNote?: string
      reconciliation: Array<{ itemName: string; expected: number; actual: number; status: string }>
    }>
    handshakePercent: number
  }
  generatedBy?: string
  filename: string
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const frameX = 22
  const frameY = 28
  const frameW = pageWidth - 44
  const frameH = pageHeight - 56
  const width = pageWidth - margin * 2
  let y = 50

  const section = (number: number, title: string, description?: string) => {
    ensure(description ? 46 : 34)
    doc.setFillColor(...BRAND.PRIMARY)
    doc.rect(margin, y, 3, 15, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BRAND.PRIMARY)
    doc.text(`${number}. ${title.toUpperCase()}`, margin + 10, y + 11)
    y += 25
    if (description) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(...BRAND.MUTED)
      doc.text(description, margin + 10, y - 5, { maxWidth: width - 20 })
      y += 12
    }
  }
  const kpiCards = (cards: Array<{ label: string; value: string; sublabel?: string }>) => {
    const cardW = width / cards.length
    const cardH = 56
    ensure(cardH + 10)
    cards.forEach((card, index) => {
      const x = margin + index * cardW + (index > 0 ? 6 : 0)
      const w = cardW - (index > 0 && index < cards.length - 1 ? 6 : index > 0 ? 0 : 6)
      doc.setFillColor(...BRAND.CARD_BG)
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.75)
      doc.roundedRect(x, y, w, cardH, 4, 4, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...BRAND.MUTED)
      doc.text(card.label.toUpperCase(), x + 10, y + 15, { maxWidth: w - 20 })
      doc.setFont('times', 'bold')
      doc.setFontSize(19)
      doc.setTextColor(...BRAND.PRIMARY)
      doc.text(card.value, x + 10, y + 38)
      if (card.sublabel) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...BRAND.FOREGROUND)
        doc.text(card.sublabel, x + 10, y + 49, { maxWidth: w - 20 })
      }
    })
    y += cardH + 12
  }
  const ensure = (height: number) => {
    if (y + height > pageHeight - 76) {
      doc.addPage()
      y = 50
      drawRunningHeader()
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.7)
      doc.roundedRect(frameX, frameY, frameW, frameH, 5, 5, 'S')
    }
  }
  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('LUMIÈRE  /  EVENT ASSET & LOGISTICS REPORT', margin, 26)
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, 32, pageWidth - margin, 32)
  }
  const fieldGrid = (fields: Array<[string, string | undefined]>) => {
    const cols = 3
    const cellW = width / cols
    const rows = Math.ceil(fields.length / cols)
    const rowH = 29
    ensure(rows * rowH + 8)
    fields.forEach(([label, value], index) => {
      const x = margin + (index % cols) * cellW
      const row = Math.floor(index / cols)
      const cellY = y + row * rowH
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...BRAND.MUTED)
      doc.text(label.toUpperCase(), x + 8, cellY + 11)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...BRAND.FOREGROUND)
      doc.text(value || '—', x + 8, cellY + 25, { maxWidth: cellW - 16 })
      doc.setDrawColor(...BRAND.BORDER)
      doc.line(x, cellY + rowH, x + cellW, cellY + rowH)
    })
    y += rows * rowH + 10
  }
  const table = (headers: string[], rows: Array<Array<string | undefined>>, widths: number[]) => {
    const headerH = 25
    const fontSize = widths.length > 6 ? 7 : 7.5
    const lineH = fontSize + 2
    const wrap = (value: string | undefined, maxWidth: number) => {
      doc.setFontSize(fontSize)
      return doc.splitTextToSize(value || '—', Math.max(18, maxWidth))
    }
    ensure(headerH + 8)
    let x = margin
    doc.setFillColor(...BRAND.CARD_BG)
    doc.rect(margin, y, width, headerH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.PRIMARY)
    headers.forEach((header, i) => {
      doc.text(doc.splitTextToSize(header.toUpperCase(), Math.max(18, widths[i] - 12)), x + 6, y + 10, { maxWidth: widths[i] - 12 })
      x += widths[i]
    })
    doc.setDrawColor(...BRAND.BORDER); doc.line(margin, y + headerH, margin + width, y + headerH)
    y += headerH
    rows.forEach((row, index) => {
      const lines = row.map((value, i) => wrap(String(value ?? '—'), widths[i] - 12))
      const rowH = Math.max(25, Math.min(58, Math.max(...lines.map((cell) => cell.length)) * lineH + 10))
      ensure(rowH)
      let rowX = margin
      if (index % 2 === 1) { doc.setFillColor(...BRAND.ZEBRA_BG); doc.rect(margin, y, width, rowH, 'F') }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(fontSize); doc.setTextColor(...BRAND.FOREGROUND)
      lines.forEach((cell, i) => { doc.text(cell, rowX + 6, y + 12, { maxWidth: widths[i] - 12, lineHeightFactor: 1.15 }); rowX += widths[i] })
      doc.setDrawColor(...BRAND.BORDER); doc.line(margin, y + rowH, margin + width, y + rowH)
      y += rowH
    })
    y += 12
  }

  doc.setDrawColor(...BRAND.BORDER); doc.setLineWidth(0.7); doc.roundedRect(frameX, frameY, frameW, frameH, 5, 5, 'S')
  doc.setFillColor(...BRAND.PRIMARY); doc.rect(margin, y, 4, 82, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...BRAND.PRIMARY); doc.text('LUMIÈRE', margin + 14, y + 14)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND.MUTED); doc.text('EVENT OPERATIONS & ASSET MANAGEMENT', margin + 14, y + 27)
  doc.setFont('times', 'bold'); doc.setFontSize(20); doc.setTextColor(...BRAND.FOREGROUND); doc.text('EVENT ASSET & LOGISTICS REPORT', margin + 14, y + 53)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND.MUTED); doc.text('EVENT REFERENCE', pageWidth - margin - 112, y + 13)
  doc.setFontSize(9); doc.setTextColor(...BRAND.FOREGROUND); doc.text(event.recordId, pageWidth - margin, y + 26, { align: 'right' })
  doc.setFontSize(7); doc.setTextColor(...BRAND.MUTED); doc.text('ISSUED / GENERATED', pageWidth - margin - 112, y + 42)
  doc.setFontSize(8); doc.setTextColor(...BRAND.FOREGROUND); doc.text(new Date().toLocaleDateString(), pageWidth - margin, y + 54, { align: 'right' })
  const statusLabel = event.status || 'STATUS NOT RECORDED'
  doc.setFillColor(...getStatusRGB(statusLabel)); doc.roundedRect(pageWidth - margin - 100, y + 63, 100, 14, 3, 3, 'F')
  doc.setFontSize(6.5); doc.setTextColor(...BRAND.WHITE); doc.text(statusLabel.toUpperCase(), pageWidth - margin - 50, y + 72.5, { align: 'center', maxWidth: 92 })
  y += 96
  doc.setDrawColor(...BRAND.BORDER); doc.line(margin, y - 10, pageWidth - margin, y - 10)

  const totalPlanned = (materials.length ? materials : checklist).reduce((sum, item) => sum + item.quantity, 0)
  const totalReconciled = logistics?.batches.flatMap((batch) => batch.reconciliation) ?? []
  const totalActual = totalReconciled.reduce((sum, row) => sum + row.actual, 0)
  kpiCards([
    { label: 'Assets Planned', value: String(totalPlanned), sublabel: `${materials.length ? materials.length : checklist.length} line item${(materials.length || checklist.length) === 1 ? '' : 's'}` },
    { label: 'Dispatch Batches', value: String(logistics?.batches.length ?? 0), sublabel: logistics ? `${logistics.handshakePercent}% handshake rate` : 'No dispatch record' },
    { label: 'Reconciled Qty', value: String(totalActual), sublabel: totalReconciled.length ? `${totalReconciled.length} reconciliation entries` : 'Pending reconciliation' },
  ])

  section(1, 'Event Information', 'Core identification, scheduling, and classification details for this event record.')
  fieldGrid([
    ['Event name', event.title], ['Client', event.client], ['Venue', event.venue], ['Event date', event.galaDate || event.date],
    ['Event status', event.status], ['Event reference', event.recordId], ['Experience tier', event.tier], ['Attendance', event.attendance], ['Footprint', event.footprint],
  ])
  section(2, 'Event Overview', 'Current planning phase and pipeline placement within the Lumière production workflow.')
  fieldGrid([['Planning phase', event.phase], ['Pipeline stage', event.pipelineStage], ['Installation window', event.date]])
  section(3, 'Assets Deployed', 'Material and equipment requirements assigned to this event, by classification.')
  const assetRows = (materials.length ? materials : checklist).map((item, index) => [
    `${index + 1}. ${item.name}`, materials.length ? materials[index]?.category : undefined, String(item.quantity), undefined, undefined, undefined, undefined, 'Planned',
  ])
  table(['Asset', 'Classification', 'Planned', 'Deployed', 'Returned', 'Damaged', 'Lost', 'Status'], assetRows, [155, 86, 42, 46, 46, 46, 38, 55])
  section(4, 'Asset Summary', 'Aggregate planned quantity across all assigned materials and checklist items.')
  fieldGrid([['Total planned', String(totalPlanned)]])
  if (logistics?.batches.length) {
    section(5, 'Logistics & Reconciliation', 'Dispatch batches, assigned crew, and expected-versus-actual asset reconciliation.')
    const logisticsRows = logistics.batches.map((batch) => [
      batch.direction, batch.vehicleType, batch.plateNumber, batch.driverName, batch.stage, batch.crew.join(', '), batch.handoffNote,
    ])
    table(['Direction', 'Vehicle', 'Plate', 'Driver', 'Stage', 'Crew', 'Handoff note'], logisticsRows, [64, 70, 62, 72, 68, 95, 83])
    logistics.batches.flatMap((batch) => batch.reconciliation).length && table(
      ['Asset', 'Expected', 'Actual', 'Reconciliation'],
      logistics.batches.flatMap((batch) => batch.reconciliation).map((row) => [row.itemName, String(row.expected), String(row.actual), row.status]),
      [200, 80, 80, 224],
    )
    fieldGrid([['Handshake rate', `${logistics.handshakePercent}%`]])
  }
  section(logistics?.batches.length ? 6 : 5, 'Audit & Verification', 'Record provenance and generation metadata for this exported report.')
  fieldGrid([['Event reference', event.recordId], ['Generated by', generatedBy], ['Generated timestamp', new Date().toLocaleString()], ['Source', 'Selected event record'], ['Verification status', logistics ? `${logistics.handshakePercent}% handshake recorded` : undefined]])
  ensure(96)
  doc.setDrawColor(...BRAND.BORDER); doc.line(margin, y, pageWidth - margin, y); y += 14
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...BRAND.FOREGROUND)
  const attestation = doc.splitTextToSize(
    '"I hereby certify that the event details, asset assignments, and logistics records presented in this report have been extracted directly from the verified operations records of the Lumière event management system."',
    width - 20,
  )
  doc.text(attestation, margin, y, { maxWidth: width - 20 })
  y += attestation.length * 10 + 12
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BRAND.PRIMARY); doc.text('OFFICIAL EVENT RECORD', margin, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...BRAND.MUTED); doc.text('Lumière management system · scan or retain with the event record', margin, y + 12)
  doc.setDrawColor(...BRAND.PRIMARY); doc.setLineWidth(1); doc.circle(pageWidth / 2, y + 14, 22, 'S')
  doc.setFont('times', 'bold'); doc.setFontSize(8); doc.setTextColor(...BRAND.PRIMARY); doc.text('LUMIÈRE', pageWidth / 2, y + 11, { align: 'center' }); doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.text('VERIFIED', pageWidth / 2, y + 20, { align: 'center' })
  doc.setDrawColor(...BRAND.BORDER); doc.line(pageWidth - margin - 145, y + 18, pageWidth - margin, y + 18)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BRAND.MUTED); doc.text('AUTHORIZED EVENT COORDINATOR', pageWidth - margin - 145, y + 30)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BRAND.FOREGROUND); doc.text(generatedBy || '—', pageWidth - margin - 145, y + 43)

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawRunningHeader()
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...BRAND.MUTED)
    doc.line(margin, pageHeight - 39, pageWidth - margin, pageHeight - 39)
    doc.text('Lumière · Event Asset & Logistics Report', margin, pageHeight - 25)
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 25, { align: 'right' })
  }
  doc.save(filename)
}

export function exportSecurityAuditPdf(
  title: string,
  logs: Array<{
    timestamp: string
    date?: string
    logId: string
    account?: string
    employeeId?: string
    role: string
    action: string
    status?: string
    ip?: string
    terminal?: string
  }>,
  filename: string,
) {
  const builder = new PdfReportBuilder()
  builder.drawHeader(title, [
    `Total Logs Rendered: ${logs.length} entries`,
    `Scope: Filtered System Security & Audit Log Record`,
  ])

  const cols: ColumnDef[] = [
    { header: 'Timestamp', width: 90 },
    { header: 'Log ID / User', width: 100 },
    { header: 'Role', width: 80 },
    { header: 'Action Event', width: 172 },
    { header: 'Status', width: 50, align: 'center' },
    { header: 'IP Address', width: 40, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  logs.forEach((log, idx) => {
    builder.checkPageBreak(18, cols)
    const { doc, margin } = builder

    if (idx % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    const ts = log.timestamp || log.date || 'N/A'
    const userStr = log.employeeId || log.account || log.logId
    const roleStr = log.role || 'System'
    const statusText = log.status || 'INFO'

    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(ts.slice(0, 18), margin + 6, builder.y)
    doc.text(userStr.slice(0, 18), margin + 96, builder.y)
    doc.text(roleStr.slice(0, 15), margin + 196, builder.y)
    doc.text(log.action.slice(0, 32), margin + 276, builder.y)

    // Status Badge
    const statusColor = getStatusRGB(statusText)
    doc.setTextColor(...statusColor)
    doc.setFont('helvetica', 'bold')
    doc.text(statusText.toUpperCase().slice(0, 8), margin + 448 + 25, builder.y, { align: 'center' })

    // IP
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.MUTED)
    doc.text((log.ip || '-').slice(0, 12), margin + 498 + 34, builder.y, { align: 'right' })

    builder.y += 16
  })

  builder.save(filename)
}

// ─── 2. Warehouse Operations Activity Logs PDF Exporter ───
export function exportWarehouseLogsPdf(
  logs: Array<{
    timestamp: string
    logId: string
    assetId: string
    assetName: string
    transaction: string
    qty: number | string
    handledBy: string
    notes: string
  }>,
  filename: string,
) {
  const builder = new PdfReportBuilder()
  builder.drawHeader('WAREHOUSE ACTIVITY & INVENTORY LOGS', [
    `Total Log Entries: ${logs.length} movement records`,
    'Scope: Warehouse Logistics Movement & Handover Log',
  ])

  const cols: ColumnDef[] = [
    { header: 'Timestamp', width: 90 },
    { header: 'Log ID', width: 65 },
    { header: 'Asset / Item Name', width: 157 },
    { header: 'Transaction', width: 85 },
    { header: 'Qty', width: 35, align: 'center' },
    { header: 'Handled By', width: 100, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  logs.forEach((l, idx) => {
    builder.checkPageBreak(18, cols)
    const { doc, margin } = builder

    if (idx % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.FOREGROUND)

    doc.text(l.timestamp.slice(0, 18), margin + 6, builder.y)
    doc.text(l.logId, margin + 96, builder.y)
    doc.text(l.assetName.slice(0, 26), margin + 161, builder.y)

    const txColor = getStatusRGB(l.transaction)
    doc.setTextColor(...txColor)
    doc.setFont('helvetica', 'bold')
    doc.text(l.transaction.slice(0, 14), margin + 318, builder.y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(String(l.qty), margin + 403 + 17, builder.y, { align: 'center' })

    doc.setTextColor(...BRAND.MUTED)
    doc.text(l.handledBy.slice(0, 18), margin + 438 + 94, builder.y, { align: 'right' })

    builder.y += 16
  })

  builder.save(filename)
}

// ─── 3. Dispatch Manifest Event PDF Exporter ───
export function exportDispatchEventPdf(summary: EventDispatchSummary) {
  const builder = new PdfReportBuilder()
  builder.drawHeader('DISPATCH MANIFEST (EVENT SCOPE)', [
    `Event: ${summary.eventTitle.toUpperCase()}`,
    `Venue: ${summary.venue}   |   Target Date: ${summary.targetDate}`,
    `Total Batches: ${summary.batches.length}   |   Handshake Rate: ${summary.handshakePercent}%`,
  ])

  const cols: ColumnDef[] = [
    { header: 'Batch ID', width: 65 },
    { header: 'Vehicle / Plate', width: 110 },
    { header: 'Dir / Stage', width: 90 },
    { header: 'Item Name', width: 147 },
    { header: 'Plan/Act', width: 50, align: 'center' },
    { header: 'Status', width: 70, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  let rowIdx = 0
  summary.batches.forEach((batch) => {
    batch.reconciliation.forEach((item) => {
      builder.checkPageBreak(18, cols)
      const { doc, margin } = builder

      if (rowIdx % 2 === 1) {
        doc.setFillColor(...BRAND.ZEBRA_BG)
        doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...BRAND.FOREGROUND)

      doc.text(batch.id.slice(-8), margin + 6, builder.y)
      doc.text(`${batch.vehicleType} (${batch.plateNumber})`.slice(0, 20), margin + 71, builder.y)
      doc.text(`${batch.direction.toUpperCase()} · ${batch.stage}`.slice(0, 16), margin + 181, builder.y)
      doc.text(item.itemName.slice(0, 24), margin + 271, builder.y)

      doc.text(`${item.planned}/${item.actual}`, margin + 418 + 25, builder.y, { align: 'center' })

      const statusColor = getStatusRGB(item.status)
      doc.setTextColor(...statusColor)
      doc.setFont('helvetica', 'bold')
      doc.text(item.status, margin + 468 + 64, builder.y, { align: 'right' })

      rowIdx++
      builder.y += 16
    })
  })

  const slug = summary.eventTitle.toLowerCase().replace(/\s+/g, '-')
  builder.save(`dispatch-manifest-${slug}.pdf`)
}

// ─── 4. Dispatch Consolidated Manifest PDF Exporter ───
export function exportDispatchConsolidatedPdf(summaries: EventDispatchSummary[]) {
  const builder = new PdfReportBuilder()
  const totalBatches = summaries.reduce((acc, s) => acc + s.batches.length, 0)
  builder.drawHeader('CONSOLIDATED DISPATCH MANIFEST', [
    `Total Events: ${summaries.length}   |   Total Batches: ${totalBatches}`,
    'Scope: Global Consolidated Warehouse Dispatch & Logistics Manifest',
  ])

  const cols: ColumnDef[] = [
    { header: 'Event Title', width: 110 },
    { header: 'Vehicle / Plate', width: 100 },
    { header: 'Dir / Stage', width: 85 },
    { header: 'Item Name', width: 132 },
    { header: 'Plan/Act', width: 45, align: 'center' },
    { header: 'Status', width: 60, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  let rowIdx = 0
  summaries.forEach((summary) => {
    summary.batches.forEach((batch) => {
      batch.reconciliation.forEach((item) => {
        builder.checkPageBreak(18, cols)
        const { doc, margin } = builder

        if (rowIdx % 2 === 1) {
          doc.setFillColor(...BRAND.ZEBRA_BG)
          doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
        }

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...BRAND.FOREGROUND)

        doc.text(summary.eventTitle.slice(0, 18), margin + 6, builder.y)
        doc.text(`${batch.vehicleType} (${batch.plateNumber})`.slice(0, 18), margin + 116, builder.y)
        doc.text(`${batch.direction.toUpperCase()} · ${batch.stage}`.slice(0, 15), margin + 216, builder.y)
        doc.text(item.itemName.slice(0, 22), margin + 301, builder.y)

        doc.text(`${item.planned}/${item.actual}`, margin + 433 + 22, builder.y, { align: 'center' })

        const statusColor = getStatusRGB(item.status)
        doc.setTextColor(...statusColor)
        doc.setFont('helvetica', 'bold')
        doc.text(item.status, margin + 478 + 54, builder.y, { align: 'right' })

        rowIdx++
        builder.y += 16
      })
    })
  })

  builder.save('dispatch-manifest-consolidated.pdf')
}

// ─── 5. Replenishment Deficit Report PDF Exporter ───
export function exportReplenishmentDeficitPdf(lines: DeficitLine[], reportTitle?: string) {
  const builder = new PdfReportBuilder()
  const activeLines = lines.filter((l) => l.status !== 'Received')
  const totalEstimatedCost = activeLines.reduce((sum, l) => {
    const required = l.quantityNeeded ?? Math.max(0, l.threshold - l.currentStock)
    const unitPrice = l.costPerUnit ?? (l.category === 'Drapery & Fabrics' ? 350 : 180)
    return sum + required * unitPrice
  }, 0)

  builder.drawHeader(reportTitle ? reportTitle.toUpperCase() : 'REPLENISHMENT & DEFICIT REPORT', [
    `Deficit Lines Flagged: ${lines.length} items`,
    `Total Estimated Procurement Cost: PHP ${totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    'Scope: Active Deficit & Automated Procurement Candidates',
  ])

  const cols: ColumnDef[] = [
    { header: 'Item Name', width: 125 },
    { header: 'Event / Source', width: 110 },
    { header: 'Stock/Thresh', width: 75, align: 'center' },
    { header: 'Est. Cost', width: 70, align: 'right' },
    { header: 'Priority', width: 65, align: 'center' },
    { header: 'Status', width: 87, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  lines.forEach((l, idx) => {
    builder.checkPageBreak(18, cols)
    const { doc, margin } = builder

    if (idx % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
    }

    const unitPrice = l.costPerUnit ?? (l.category === 'Drapery & Fabrics' ? 350 : 180)
    const required = l.quantityNeeded ?? Math.max(0, l.threshold - l.currentStock)
    const lineCost = required * unitPrice

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.FOREGROUND)

    doc.text(l.itemName.slice(0, 20), margin + 6, builder.y)
    doc.text((l.eventTitle || l.triggerSource).slice(0, 18), margin + 131, builder.y)

    doc.text(`${l.currentStock} / ${l.threshold}`, margin + 241 + 37, builder.y, { align: 'center' })
    doc.text(`₱${lineCost.toLocaleString()}`, margin + 316 + 64, builder.y, { align: 'right' })

    // Priority Badge
    const prioColor = l.priority === 'Critical' || l.priority === 'High' ? BRAND.DANGER : l.priority === 'Medium' ? BRAND.WARNING : BRAND.MUTED
    doc.setTextColor(...prioColor)
    doc.setFont('helvetica', 'bold')
    doc.text(l.priority.slice(0, 10), margin + 386 + 32, builder.y, { align: 'center' })

    // Status Badge
    const statusColor = getStatusRGB(l.status)
    doc.setTextColor(...statusColor)
    doc.text(l.status.slice(0, 14), margin + 451 + 81, builder.y, { align: 'right' })

    builder.y += 16
  })

  builder.save('replenishment-deficit-report.pdf')
}

// ─── 6. Replenishment Procurement Register PDF Exporter ───
export function exportReplenishmentProcurementPdf(items: ProcurementItem[]) {
  const builder = new PdfReportBuilder()
  builder.drawHeader('PROCUREMENT REGISTER & STOCK AUDIT', [
    `Total Register Items: ${items.length} inventory lines`,
    'Scope: Master Procurement & Low-Stock Threshold Register',
  ])

  const cols: ColumnDef[] = [
    { header: 'Asset ID', width: 75 },
    { header: 'Item Name', width: 147 },
    { header: 'Category', width: 110 },
    { header: 'Stock/Thresh', width: 70, align: 'center' },
    { header: 'Stock %', width: 50, align: 'center' },
    { header: 'Status', width: 80, align: 'right' },
  ]

  builder.drawTableHeader(cols)

  items.forEach((p, idx) => {
    builder.checkPageBreak(18, cols)
    const { doc, margin } = builder

    if (idx % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
    }

    const pct = p.threshold > 0 ? Math.round((p.currentStock / p.threshold) * 100) : 100

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.FOREGROUND)

    doc.text(p.assetId, margin + 6, builder.y)
    doc.text(p.name.slice(0, 24), margin + 81, builder.y)
    doc.text(p.category.slice(0, 18), margin + 228, builder.y)
    doc.text(`${p.currentStock} / ${p.threshold}`, margin + 338 + 35, builder.y, { align: 'center' })
    doc.text(`${pct}%`, margin + 408 + 25, builder.y, { align: 'center' })

    const statusColor = getStatusRGB(p.status)
    doc.setTextColor(...statusColor)
    doc.setFont('helvetica', 'bold')
    doc.text(p.status.slice(0, 15), margin + 458 + 74, builder.y, { align: 'right' })

    builder.y += 16
  })

  builder.save('lumiere-procurement-register.pdf')
}

// ─── 7. New Manning Delegation / Crew Roster PDF Exporter ───
export interface CrewRosterExportMember {
  name: string
  role: string
  department: 'Field' | 'Warehouse' | 'Production'
  isTeamLead: boolean
  assignmentDate?: string
  dutyCategory?: string
  status?: string
}

export function exportCrewRosterPdf(
  eventInfo: {
    eventTitle: string
    venue: string
    targetDate: string
  },
  crewList: CrewRosterExportMember[],
) {
  const builder = new PdfReportBuilder()
  const leadsCount = crewList.filter((c) => c.isTeamLead).length

  builder.drawHeader('EVENT CREW ROSTER & MANNING DELEGATION', [
    `EVENT: ${eventInfo.eventTitle.toUpperCase()}`,
    `Venue: ${eventInfo.venue}   |   Target Date: ${eventInfo.targetDate}`,
    `Total Crew Allocated: ${crewList.length} staff (${leadsCount} Team Lead${leadsCount === 1 ? '' : 's'})`,
  ])

  const cols: ColumnDef[] = [
    { header: 'Staff Name', width: 110 },
    { header: 'Role / Designation', width: 115 },
    { header: 'Department / Zone', width: 105 },
    { header: 'Lead Status', width: 70, align: 'center' },
    { header: 'Duty / Date', width: 72 },
    { header: 'Ground Sign-Off', width: 60, align: 'center' },
  ]

  // Group crew members by department
  const departments: Array<'Field' | 'Warehouse' | 'Production'> = ['Field', 'Warehouse', 'Production']

  departments.forEach((dept) => {
    const deptMembers = crewList.filter((c) => c.department === dept)
    if (deptMembers.length === 0) return

    builder.checkPageBreak(35, cols)
    const { doc, margin } = builder

    // Department Sub-Section Header
    doc.setFillColor(...BRAND.PRIMARY)
    doc.rect(margin, builder.y, 3, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(`${dept.toUpperCase()} DEPARTMENT CREW (${deptMembers.length})`, margin + 8, builder.y + 11)
    builder.y += 18

    builder.drawTableHeader(cols)

    deptMembers.forEach((member, idx) => {
      builder.checkPageBreak(18, cols)

      if (idx % 2 === 1) {
        doc.setFillColor(...BRAND.ZEBRA_BG)
        doc.rect(margin, builder.y - 10, builder.printableWidth, 16, 'F')
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...BRAND.FOREGROUND)

      doc.text(member.name.slice(0, 18), margin + 6, builder.y)
      doc.text(member.role.slice(0, 20), margin + 116, builder.y)
      doc.text(`${member.department} ${member.dutyCategory ? `· ${member.dutyCategory}` : ''}`.slice(0, 18), margin + 231, builder.y)

      // Team Lead Status Badge
      if (member.isTeamLead) {
        doc.setFillColor(...BRAND.PRIMARY)
        doc.roundedRect(margin + 336 + 8, builder.y - 8, 54, 12, 3, 3, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...BRAND.WHITE)
        doc.text('TEAM LEAD', margin + 336 + 35, builder.y, { align: 'center' })
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...BRAND.MUTED)
        doc.text('Crew', margin + 336 + 35, builder.y, { align: 'center' })
      }

      // Duty / Date
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...BRAND.FOREGROUND)
      doc.text(member.assignmentDate || eventInfo.targetDate, margin + 406 + 6, builder.y)

      // Sign-off Checkbox Line
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.75)
      doc.rect(margin + 478 + 24, builder.y - 7, 10, 10)

      builder.y += 16
    })

    builder.y += 10
  })

  const filename = `crew-roster-${eventInfo.eventTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
  builder.save(filename)
}
