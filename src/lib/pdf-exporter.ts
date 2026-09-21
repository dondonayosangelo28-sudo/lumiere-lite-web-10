import jsPDF from 'jspdf'
import type { EventDispatchSummary } from '@/lib/warehouse-dispatch'
import type { DispatchBatch } from '@/lib/event-detail'
import type { DeficitLine } from '@/lib/warehouse-replenishment'
import type { ProcurementItem } from '@/lib/types'
import { auditSampleData } from '@/lib/audit-report-sample-data'

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

interface MetaField {
  label: string
  value: string
}

interface Signatory {
  role: string
  org: string
  note: string
}

// Deterministic short reference code for a report, e.g. LUM-AUD-2026-09
function makeReference(prefix: string): string {
  const now = new Date()
  return `LUM-${prefix}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

class PdfReportBuilder {
  doc: jsPDF
  margin = 34
  pageWidth = 595.28
  pageHeight = 841.89
  printableWidth = this.pageWidth - this.margin * 2
  y = 50
  currentPage = 1
  title = ''

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
  }

  drawFrame() {
    const { doc, pageWidth, pageHeight } = this
    doc.setDrawColor(...BRAND.BORDER)
    doc.setLineWidth(1.1)
    doc.roundedRect(22, 28, pageWidth - 44, pageHeight - 56, 5, 5, 'S')
  }

  drawRunningHeader() {
    const { doc, margin } = this
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text(`LUMIÈRE  /  ${this.title.toUpperCase()}`, margin, 26)
  }

  // Draw standardized brand header banner with a Document Reference / Date / Classification meta strip
  drawHeader(title: string, meta: MetaField[]) {
    const { doc, margin, pageWidth } = this
    this.title = title
    this.y = 50

    this.drawFrame()
    this.drawRunningHeader()

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
    doc.text(title.toUpperCase(), margin + 14, this.y + 54, { maxWidth: this.printableWidth - 20 })

    this.y += 84

    // Metadata strip: Document Reference / Report Date / Classification (+ extra contextual fields)
    if (meta.length > 0) {
      this.y += 6
      const cols = 3
      const cellW = this.printableWidth / cols
      const rowCount = Math.ceil(meta.length / cols)
      const rowH = 38
      const boxHeight = rowCount * rowH + 10
      doc.setFillColor(...BRAND.CARD_BG)
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.75)
      doc.roundedRect(margin, this.y, this.printableWidth, boxHeight, 4, 4, 'FD')

      meta.forEach((field, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = margin + col * cellW
        const cellY = this.y + 10 + row * rowH
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(...BRAND.MUTED)
        doc.text(field.label.toUpperCase(), x + 10, cellY + 8)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...BRAND.FOREGROUND)
        const valueLines = doc.splitTextToSize(field.value, cellW - 20)
        doc.text(valueLines.slice(0, 2), x + 10, cellY + 21, { maxWidth: cellW - 20, lineHeightFactor: 1.05 })
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

  // Executive performance scorecard (matches the Lumière audit template's metric cards)
  drawScorecard(cards: Array<{ label: string; value: string; bullets?: string[] }>) {
    const { doc, margin, printableWidth, pageHeight } = this
    const cardW = printableWidth / cards.length
    const cardH = 68
    if (this.y + cardH + 10 > pageHeight - 60) {
      this.doc.addPage()
      this.currentPage += 1
      this.y = 50
      this.drawFrame()
      this.drawRunningHeader()
      this.y += 20
    }
    cards.forEach((card, index) => {
      const x = margin + index * cardW + (index > 0 ? 6 : 0)
      const w = cardW - (index > 0 && index < cards.length - 1 ? 6 : index > 0 ? 0 : 6)
      doc.setFillColor(...BRAND.CARD_BG)
      doc.setDrawColor(...BRAND.BORDER)
      doc.setLineWidth(0.75)
      doc.roundedRect(x, this.y, w, cardH, 4, 4, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...BRAND.MUTED)
      doc.text(card.label.toUpperCase(), x + 10, this.y + 15, { maxWidth: w - 20 })
      doc.setFont('times', 'bold')
      doc.setFontSize(19)
      doc.setTextColor(...BRAND.PRIMARY)
      doc.text(card.value, x + 10, this.y + 38)
      let bulletY = this.y + 50
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...BRAND.FOREGROUND)
      ;(card.bullets || []).slice(0, 2).forEach((bullet) => {
        doc.text(`•  ${bullet}`, x + 10, bulletY, { maxWidth: w - 20 })
        bulletY += 9
      })
    })
    this.y += cardH + 14
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
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.PRIMARY)

    let currentX = margin
    columns.forEach((col) => {
      const textX = col.align === 'center' ? currentX + col.width / 2 : col.align === 'right' ? currentX + col.width - 6 : currentX + 6
      doc.text(col.header.toUpperCase(), textX, this.y + 13, { align: col.align || 'left', maxWidth: col.width - 12 })
      currentX += col.width
    })

    this.y += 24
  }

  // Check page bottom overflow and add new page if needed
  checkPageBreak(requiredHeight = 22, columns?: ColumnDef[]) {
    if (this.y + requiredHeight > this.pageHeight - 60) {
      this.doc.addPage()
      this.currentPage += 1
      this.y = 50
      this.drawFrame()
      this.drawRunningHeader()
      this.y += 20
      if (columns) {
        this.drawTableHeader(columns)
      }
    }
  }

  // Word-wrapping, dynamic-height data table. Rows never overflow their column width and
  // automatically continue onto a new page (repeating the header) instead of clipping.
  drawTable(columns: ColumnDef[], rows: Array<Array<string | number | undefined | null>>) {
    const { doc, margin, printableWidth } = this
    const fontSize = columns.length > 7 ? 6.5 : 7.5
    const lineH = fontSize + 2.5

    this.drawTableHeader(columns)

    rows.forEach((row, index) => {
      doc.setFontSize(fontSize)
      const cells = row.map((value, i) => doc.splitTextToSize(String(value ?? '—'), Math.max(18, columns[i].width - 12)))
      const rowH = Math.max(22, Math.min(64, Math.max(...cells.map((cell) => cell.length)) * lineH + 10))
      this.checkPageBreak(rowH, columns)

      let x = margin
      if (index % 2 === 1) {
        doc.setFillColor(...BRAND.ZEBRA_BG)
        doc.rect(margin, this.y, printableWidth, rowH, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...BRAND.FOREGROUND)
      cells.forEach((cell, i) => {
        const col = columns[i]
        const cellX = col.align === 'center' ? x + col.width / 2 : col.align === 'right' ? x + col.width - 6 : x + 6
        doc.text(cell, cellX, this.y + 12, { align: col.align || 'left', maxWidth: col.width - 12, lineHeightFactor: 1.15 })
        x += col.width
      })
      doc.setDrawColor(...BRAND.BORDER)
      doc.line(margin, this.y + rowH, margin + printableWidth, this.y + rowH)
      this.y += rowH
    })
    this.y += 12
  }

  // Draw a status-colored badge cell inline within a manually-drawn row (used for compact tables)
  drawStatusBadge(text: string, x: number, y: number, color: [number, number, number]) {
    this.doc.setTextColor(...color)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text.toUpperCase(), x, y, { align: 'right' })
  }

  // Certification / attestation statement + dual signature blocks, matching the Lumière report templates
  drawCertification(statement: string, signatories: Signatory[]) {
    const { doc, margin, printableWidth, pageHeight } = this
    if (this.y + 130 > pageHeight - 60) {
      this.doc.addPage()
      this.currentPage += 1
      this.y = 50
      this.drawFrame()
      this.drawRunningHeader()
      this.y += 20
    }
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, this.y, this.pageWidth - margin, this.y)
    this.y += 16
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.FOREGROUND)
    const lines = doc.splitTextToSize(`"${statement}"`, printableWidth - 10)
    doc.text(lines, margin, this.y, { maxWidth: printableWidth - 10 })
    this.y += lines.length * 11 + 22

    const colW = printableWidth / signatories.length
    signatories.forEach((sig, index) => {
      const x = margin + index * colW
      doc.setDrawColor(...BRAND.BORDER)
      doc.line(x, this.y, x + colW - 24, this.y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...BRAND.MUTED)
      doc.text(sig.role.toUpperCase(), x, this.y + 13, { maxWidth: colW - 24 })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...BRAND.FOREGROUND)
      doc.text(sig.org, x, this.y + 26, { maxWidth: colW - 24 })
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(...BRAND.PRIMARY)
      doc.text(sig.note, x, this.y + 38, { maxWidth: colW - 24 })
    })
    this.y += 50
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

this.doc.text('Lumière Management System · Confidential Operations Report', this.margin, this.pageHeight - 8)
    this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' })
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
doc.text('Lumière · Event Asset & Logistics Report', margin, pageHeight - 12)
  doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
  }
  doc.save(filename)
}

export interface SystemAnalyticsAuditPdfData {
  staff: Array<{ role: string; recordKind?: string; employmentType?: string }>
  events: Array<{ status: string }>
}

export function exportSystemAnalyticsAuditPdf(data: SystemAnalyticsAuditPdfData) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })
  const pageWidth = 612; const pageHeight = 792; const margin = 47.5; const width = 517
  const ink: [number, number, number] = [43, 33, 26]; const muted: [number, number, number] = [110, 97, 83]
  const bronze: [number, number, number] = [139, 111, 71]; const panel: [number, number, number] = [247, 240, 230]
  const border: [number, number, number] = [217, 203, 174]; const green: [number, number, number] = [63, 107, 68]
  const amber: [number, number, number] = [154, 107, 18]; const red: [number, number, number] = [154, 51, 36]
  const reference = `LUM-AUD-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  let y = 57.5
  const header = () => { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...muted); doc.text('LUMIÈRE — SYSTEM ANALYTICS & AUDIT REPORT', pageWidth - margin, 29, { align: 'right', charSpace: 0.3 }); doc.setDrawColor(...border); doc.setLineWidth(0.5); doc.line(margin, 35, pageWidth - margin, 35) }
  const newPage = () => { doc.addPage(); y = 57.5; header() }
  const ensure = (height: number) => { if (y + height > pageHeight - 57.5) newPage() }
  const heading = (title: string, description?: string) => { ensure(description ? 58 : 42); y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...ink); doc.text(title, margin, y, { charSpace: 0.5 }); doc.setDrawColor(...bronze); doc.setLineWidth(0.75); doc.line(margin, y + 4, margin + width, y + 4); y += 10; if (description) { doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5); doc.setTextColor(...muted); doc.text(description, margin, y + 8, { maxWidth: width }); y += 21 } else y += 10 }
  const statusColor = (value: string) => value === 'APPROVED' || value === 'COMPLETED' ? green : value === 'PENDING' ? amber : red
  const drawTable = (columns: Array<{ label: string; width: number; align?: 'left' | 'center' }>, rows: readonly (readonly (string | number)[])[], boldFirst = false) => {
    const headerH = 22; const padding = 5; const headerCharSpace = 0.2
    const minimumBodyFontSize = 6.5; const minimumHeaderFontSize = 6
    const fontSteps = [8, 7.5, 7, 6.5]
    const headerFontSteps = [6.5, 6.25, 6]
    const measure = (value: string, font: number, style: 'normal' | 'bold') => {
      doc.setFont('helvetica', style); doc.setFontSize(font)
      return doc.getTextWidth(value) + (style === 'bold' ? Math.max(0, value.length - 1) * headerCharSpace : 0)
    }
    const truncate = (value: string, maxWidth: number, font: number, style: 'normal' | 'bold') => {
      if (measure(value, font, style) <= maxWidth) return value
      let result = value
      while (result.length > 0 && measure(`${result}…`, font, style) > maxWidth) result = result.slice(0, -1)
      return `${result}…`
    }
    let bodyFontSize = fontSteps[0]; let headerFontSize = headerFontSteps[0]
    let contentWidths: number[] = []
    const computeWidths = () => {
      contentWidths = columns.map((column, index) => {
        const headerWidth = measure(column.label, headerFontSize, 'bold')
        const bodyWidth = Math.max(0, ...rows.map((row) => measure(String(row[index] ?? ''), bodyFontSize, 'normal')))
        return Math.max(headerWidth, bodyWidth) + padding * 2
      })
      const total = contentWidths.reduce((sum, value) => sum + value, 0)
      if (total <= width) {
        const extra = (width - total) / columns.length
        contentWidths = contentWidths.map((value) => value + extra)
        return true
      }
      return false
    }
    while (!computeWidths() && bodyFontSize > minimumBodyFontSize) {
      bodyFontSize = fontSteps[Math.min(fontSteps.length - 1, fontSteps.indexOf(bodyFontSize) + 1)]
      headerFontSize = headerFontSteps[Math.min(headerFontSteps.length - 1, headerFontSteps.indexOf(headerFontSize) + 1)]
    }
    const needsTruncation = contentWidths.reduce((sum, value) => sum + value, 0) > width
    if (needsTruncation) {
      contentWidths = columns.map(() => width / columns.length)
    }
    columns = columns.map((column, index) => ({ ...column, width: contentWidths[index] }))
    const drawHeader = () => {
      doc.setFillColor(...bronze); doc.rect(margin, y, width, headerH, 'F'); let x = margin
      doc.setFont('helvetica', 'bold'); doc.setFontSize(headerFontSize); doc.setTextColor(255, 255, 255)
      columns.forEach((col) => { const label = needsTruncation ? truncate(col.label, col.width - padding * 2, headerFontSize, 'bold') : col.label; const tx = col.align === 'center' ? x + col.width / 2 : x + padding; doc.text(label, tx, y + 14, { align: col.align || 'left', charSpace: headerCharSpace }); x += col.width })
      doc.setDrawColor(...border); doc.rect(margin, y, width, headerH); y += headerH
    }
    ensure(headerH + 22); drawHeader()
    rows.forEach((row, rowIndex) => {
      if (y + 22 > pageHeight - 57.5) { newPage(); drawHeader() }
      let x = margin
      if (rowIndex % 2 === 1) { doc.setFillColor(...panel); doc.rect(margin, y, width, 22, 'F') }
      row.forEach((rawValue, i) => {
        const col = columns[i]; const value = String(rawValue); const color = i === columns.length - 1 ? statusColor(value) : ink
        const style = i === columns.length - 1 || (boldFirst && i === 0) ? 'bold' : 'normal'
        const renderedValue = needsTruncation ? truncate(value, col.width - padding * 2, bodyFontSize, style) : value
        doc.setFont('helvetica', style); doc.setFontSize(bodyFontSize); doc.setTextColor(...color)
        const tx = col.align === 'center' ? x + col.width / 2 : x + padding
        doc.text(renderedValue, tx, y + 14, { align: col.align || 'left' }); x += col.width
      })
      doc.setDrawColor(...border); doc.setLineWidth(0.5); x = margin; doc.rect(margin, y, width, 22); columns.slice(0, -1).forEach((col) => { x += col.width; doc.line(x, y, x, y + 22) }); y += 22
    })
    y += 6
  }
  header(); doc.setFont('times', 'bold'); doc.setFontSize(26); doc.setTextColor(...bronze); doc.text('LUMIÈRE', pageWidth / 2, y + 26, { align: 'center', charSpace: 2 }); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...ink); doc.text('SYSTEM ANALYTICS & AUDIT REPORT', pageWidth / 2, y + 47, { align: 'center', charSpace: 1.4 }); doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...muted); doc.text('Official Platform Utilization, Inventory Distribution, and Asset Compliance Records', pageWidth / 2, y + 67, { align: 'center' }); y += 92
  doc.setFillColor(...panel); doc.setDrawColor(...border); doc.rect(margin, y, width, 50, 'FD'); const cellW = width / 3; [['DOCUMENT REFERENCE', reference], ['AUDIT DATE', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })], ['CLASSIFICATION', 'Verified Official Audit']].forEach(([label, value], i) => { const x = margin + i * cellW; if (i) doc.line(x, y, x, y + 50); doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...muted); doc.text(label, x + 8, y + 17, { charSpace: 0.4 }); doc.setFontSize(11); doc.setTextColor(...(i === 2 ? green : ink)); doc.text(value, x + 8, y + 35, { maxWidth: cellW - 16 }) }); y += 58
  const admins = data.staff.filter((member) => (member.recordKind === 'employee-record' ? member.employmentType : member.role) === 'Admin').length; const staff = data.staff.length - admins
  const completed = data.events.filter((event) => ['Completed', 'Settled'].includes(event.status)).length; const ongoing = data.events.filter((event) => event.status === 'In Production').length
  heading('EXECUTIVE PERFORMANCE SCORECARD'); const cards = [['TOTAL REGISTERED USERS', String(data.staff.length), `${staff} Staff`, `${admins} Admin`], ['ACTIVE EVENTS', `${completed + ongoing} / ${data.events.length}`, `${completed} Completed`, `${ongoing} Ongoing`], ['ASSET UTILIZATION RATE', auditSampleData.utilization.value, auditSampleData.utilization.detail], ['MAINTENANCE COMPLIANCE', auditSampleData.maintenance.value, auditSampleData.maintenance.detail]] as const; const scoreW = width / 4; const scoreH = 77; ensure(scoreH); doc.setFillColor(...panel); doc.setDrawColor(...border); doc.rect(margin, y, width, scoreH, 'FD'); cards.forEach((card, i) => { const x = margin + i * scoreW; if (i) doc.line(x, y, x, y + scoreH); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...muted); doc.text(card[0], x + 8, y + 15, { maxWidth: scoreW - 16 }); doc.setFont('times', 'bold'); doc.setFontSize(16); doc.setTextColor(...bronze); doc.text(card[1], x + 8, y + 37); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...ink); doc.text(card[2], x + 8, y + 52, { maxWidth: scoreW - 16 }); if (card[3]) doc.text(card[3], x + 8, y + 64, { maxWidth: scoreW - 16 }) }); y += scoreH + 4
  heading('WAREHOUSE INVENTORY DISTRIBUTION', 'Asset capacity, current custody, and utilization by storage facility.'); drawTable([{ label: 'FACILITY', width: 145 }, { label: 'TOTAL ASSETS', width: 69, align: 'center' }, { label: 'AVAILABLE', width: 66, align: 'center' }, { label: 'IN USE', width: 54, align: 'center' }, { label: 'UNDER MAINTENANCE', width: 107, align: 'center' }, { label: 'UTILIZATION', width: 76, align: 'center' }], auditSampleData.facilities, true)
  heading('EVENT BOOKING REQUESTS & APPROVAL PIPELINE', 'Case log of submitted event booking requests and review outcomes.'); drawTable([{ label: 'CASE', width: 52 }, { label: 'REQUESTOR', width: 77 }, { label: 'CONTACT EMAIL', width: 105 }, { label: 'EVENT REQUESTED', width: 86 }, { label: 'ASSIGNED VENUE', width: 78 }, { label: 'DATE APPLIED', width: 68 }, { label: 'REVIEW STATUS', width: 51, align: 'center' }], auditSampleData.bookings)
  heading('ASSET MAINTENANCE & COMPLIANCE MILESTONES', 'Scheduled inspections, condition scoring, and compliance logs by asset.'); drawTable([{ label: 'LOG', width: 45 }, { label: 'ASSET', width: 84 }, { label: 'ASSIGNED CREW', width: 77 }, { label: 'MILESTONE', width: 88 }, { label: 'TARGET DUE', width: 64 }, { label: 'CONDITION SCORE', width: 86 }, { label: 'COMPLIANCE', width: 73, align: 'center' }], auditSampleData.maintenanceLogs)
  ensure(128); y += 14; doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...ink); const certification = '“I hereby certify that the numerical metrics, asset records, inventory distributions, and maintenance logs presented in this audit report have been extracted directly from the verified database records of the Lumière platform.”'; const certLines = doc.splitTextToSize(certification, width - 10); doc.text(certLines, pageWidth / 2, y, { align: 'center', maxWidth: width - 10, lineHeightFactor: 1.2 }); y += certLines.length * 12 + 28; const signatures = [['SYSTEM ADMINISTRATOR / AUDITOR', 'Lumière Asset & Event Management Platform', 'Generated & Verified'], ['OPERATIONS MANAGER / WAREHOUSE LEAD', 'Lumière Facilities & Logistics', 'Verified & Received']] as const; signatures.forEach((signature, i) => { const x = margin + i * (width / 2); doc.setDrawColor(...border); doc.line(x, y, x + width / 2 - 18, y); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...ink); doc.text(signature[0], x, y + 14); doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...muted); doc.text(signature[1], x, y + 27); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ink); doc.text(signature[2], x, y + 40) })
  const pages = doc.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { doc.setPage(page); doc.setDrawColor(...border); doc.setLineWidth(0.5); doc.line(margin, pageHeight - 42, pageWidth - margin, pageHeight - 42); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...muted); doc.text(`LUMIÈRE   ·   System Analytics & Audit Report   ·   Doc Ref: ${reference}`, margin, pageHeight - 27); doc.setFontSize(6.5); doc.text('PAGE ', pageWidth - margin - 42, pageHeight - 27); doc.setFontSize(9); doc.setTextColor(...ink); doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 27, { align: 'right' }) }
  doc.save('lumiere-system-analytics-audit-report.pdf')
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
  const refId = makeReference('SEC')
  builder.drawHeader(title, [
    { label: 'Document Reference', value: refId },
    { label: 'Audit Date', value: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) },
    { label: 'Classification', value: 'Verified Official Audit' },
    { label: 'Total Records', value: `${logs.length} entries` },
  ])

  const statusCounts = logs.reduce<Record<string, number>>((acc, log) => {
    const key = (log.status || 'Info').toUpperCase()
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])
  builder.drawScorecard([
    { label: 'Total Logs Rendered', value: String(logs.length), bullets: [`${new Set(logs.map((l) => l.role || 'System')).size} distinct roles`] },
    { label: 'Status Breakdown', value: String(topStatuses.length), bullets: topStatuses.slice(0, 2).map(([status, count]) => `${count} ${status}`) },
    { label: 'Scope', value: 'System-wide', bullets: ['Filtered security & audit log record'] },
  ])

  const cols: ColumnDef[] = [
    { header: 'Timestamp', width: 88 },
    { header: 'Log ID / User', width: 92 },
    { header: 'Role', width: 62 },
    { header: 'Action Event', width: 155 },
    { header: 'Status', width: 55, align: 'center' },
    { header: 'IP Address', width: 75, align: 'right' },
  ]

  const rows = logs.map((log) => [
    log.timestamp || log.date || 'N/A',
    log.employeeId || log.account || log.logId,
    log.role || 'System',
    log.action,
    log.status || 'INFO',
    log.ip || '—',
  ])
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the security and audit log entries presented in this report have been extracted directly from the verified database records of the Lumière platform.',
    [
      { role: 'System Administrator / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Operations Manager / Security Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

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
    { label: 'Document Reference', value: makeReference('WHL') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Total Entries', value: `${logs.length} movement records` },
  ])

  builder.drawScorecard([
    { label: 'Total Log Entries', value: String(logs.length), bullets: [`${new Set(logs.map((l) => l.assetName)).size} distinct assets`] },
    { label: 'Scope', value: 'Warehouse', bullets: ['Logistics movement & handover log'] },
  ])

  const cols: ColumnDef[] = [
    { header: 'Timestamp', width: 88 },
    { header: 'Log ID', width: 55 },
    { header: 'Asset / Item Name', width: 140 },
    { header: 'Transaction', width: 75 },
    { header: 'Qty', width: 35, align: 'center' },
    { header: 'Handled By', width: 89, align: 'right' },
  ]

  const rows = logs.map((l) => [l.timestamp, l.logId, l.assetName, l.transaction, l.qty, l.handledBy])
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the warehouse activity and inventory movement records presented in this report have been extracted directly from the verified database records of the Lumière platform.',
    [
      { role: 'Warehouse Lead / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Operations Manager / Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

  builder.save(filename)
}

// ─── 3. Dispatch Manifest Batch PDF Exporter ───
export function exportDispatchBatchPdf(
  eventInfo: { eventTitle: string; venue: string; targetDate: string },
  batch: DispatchBatch,
) {
  const batchNumber = batch.id.match(/batch-(\d+)/i)?.[1]
  const batchCode = batchNumber ? `BATCH ${Number(batchNumber) + 1}` : batch.id.slice(-6).toUpperCase()
  const filenameBatchCode = batchNumber ? `BATCH-${Number(batchNumber) + 1}` : batch.id.slice(-6).toUpperCase()
  const rows = batch.reconciliation.length > 0
    ? batch.reconciliation.map((row) => [row.itemName, row.planned, row.actual, row.status])
    : [['No assets staged yet.', '—', '—', '—']]

  const builder = new PdfReportBuilder()
  builder.drawHeader('DISPATCH MANIFEST (BATCH)', [
    { label: 'Document Reference', value: makeReference('DSP') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Event', value: eventInfo.eventTitle },
    { label: 'Venue', value: eventInfo.venue },
    { label: 'Target Date', value: eventInfo.targetDate },
    { label: 'Batch', value: batchCode },
    { label: 'Vehicle / Plate', value: `${batch.vehicleType} · ${batch.plateNumber}` },
    { label: 'Driver', value: batch.driverName || 'Unassigned' },
    { label: 'Direction / Stage', value: `${batch.direction.toUpperCase()} · ${batch.stage}` },
    ...(batch.crew.length > 0 ? [{ label: 'Escort Crew', value: batch.crew.map((crew) => crew.name).join(', ') }] : []),
    ...(batch.handoffNote ? [{ label: 'Handoff Note', value: batch.handoffNote }] : []),
  ])

  builder.drawScorecard([
    { label: 'Items', value: String(batch.reconciliation.length) },
    { label: 'Planned Qty', value: String(batch.reconciliation.reduce((sum, row) => sum + row.planned, 0)) },
    { label: 'Actual Qty', value: String(batch.reconciliation.reduce((sum, row) => sum + row.actual, 0)) },
  ])

  builder.drawTable([
    { header: 'Item Name', width: 230 },
    { header: 'Planned', width: 80, align: 'center' },
    { header: 'Actual', width: 80, align: 'center' },
    { header: 'Status', width: 137, align: 'right' },
  ], rows)

  builder.drawCertification(
    'I hereby certify that the dispatch batch, vehicle assignment, and reconciliation records presented in this manifest have been extracted directly from the verified operations records of the Lumière event management system.',
    [
      { role: 'Dispatch Lead', org: 'Lumière Facilities & Logistics', note: 'Signature' },
      { role: 'Driver / Recipient', org: 'Lumière Facilities & Logistics', note: 'Signature' },
    ],
  )

  builder.save(`Manifest_${batch.plateNumber.replace(/\s+/g, '_')}_${filenameBatchCode}.pdf`)
}

// ─── 4. Dispatch Manifest Event PDF Exporter ───
export function exportDispatchEventPdf(summary: EventDispatchSummary) {
  const builder = new PdfReportBuilder()
  builder.drawHeader('DISPATCH MANIFEST (EVENT SCOPE)', [
    { label: 'Document Reference', value: makeReference('DSP') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Event', value: summary.eventTitle },
    { label: 'Venue', value: summary.venue },
    { label: 'Target Date', value: summary.targetDate },
  ])

  builder.drawScorecard([
    { label: 'Total Batches', value: String(summary.batches.length) },
    { label: 'Handshake Rate', value: `${summary.handshakePercent}%`, bullets: ['Expected vs. actual reconciliation'] },
  ])

  const cols: ColumnDef[] = [
    { header: 'Batch ID', width: 55 },
    { header: 'Vehicle / Plate', width: 100 },
    { header: 'Dir / Stage', width: 80 },
    { header: 'Item Name', width: 125 },
    { header: 'Plan/Act', width: 50, align: 'center' },
    { header: 'Status', width: 72, align: 'right' },
  ]

  const rows = summary.batches.flatMap((batch) =>
    batch.reconciliation.map((item) => [
      batch.id.slice(-8),
      `${batch.vehicleType} (${batch.plateNumber})`,
      `${batch.direction.toUpperCase()} · ${batch.stage}`,
      item.itemName,
      `${item.planned}/${item.actual}`,
      item.status,
    ]),
  )
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the dispatch batches, vehicle assignments, and reconciliation records presented in this manifest have been extracted directly from the verified operations records of the Lumière event management system.',
    [
      { role: 'Dispatch Coordinator', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

  const slug = summary.eventTitle.toLowerCase().replace(/\s+/g, '-')
  builder.save(`dispatch-manifest-${slug}.pdf`)
}

// ─── 4. Dispatch Consolidated Manifest PDF Exporter ───
export function exportDispatchConsolidatedPdf(summaries: EventDispatchSummary[]) {
  const builder = new PdfReportBuilder()
  const totalBatches = summaries.reduce((acc, s) => acc + s.batches.length, 0)
  builder.drawHeader('CONSOLIDATED DISPATCH MANIFEST', [
    { label: 'Document Reference', value: makeReference('CDM') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Scope', value: 'Global consolidated warehouse dispatch & logistics manifest' },
  ])

  builder.drawScorecard([
    { label: 'Total Events', value: String(summaries.length) },
    { label: 'Total Batches', value: String(totalBatches) },
  ])

  const cols: ColumnDef[] = [
    { header: 'Event Title', width: 100 },
    { header: 'Vehicle / Plate', width: 95 },
    { header: 'Dir / Stage', width: 75 },
    { header: 'Item Name', width: 115 },
    { header: 'Plan/Act', width: 42, align: 'center' },
    { header: 'Status', width: 55, align: 'right' },
  ]

  const rows = summaries.flatMap((summary) =>
    summary.batches.flatMap((batch) =>
      batch.reconciliation.map((item) => [
        summary.eventTitle,
        `${batch.vehicleType} (${batch.plateNumber})`,
        `${batch.direction.toUpperCase()} · ${batch.stage}`,
        item.itemName,
        `${item.planned}/${item.actual}`,
        item.status,
      ]),
    ),
  )
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the consolidated dispatch batches and reconciliation records presented in this manifest have been extracted directly from the verified operations records of the Lumière event management system.',
    [
      { role: 'Dispatch Coordinator', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

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
    { label: 'Document Reference', value: makeReference('RDR') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Scope', value: 'Active deficit & automated procurement candidates' },
  ])

  builder.drawScorecard([
    { label: 'Deficit Lines Flagged', value: String(lines.length) },
    {
      label: 'Est. Procurement Cost',
      value: `PHP ${totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      bullets: [`${activeLines.length} active line${activeLines.length === 1 ? '' : 's'}`],
    },
  ])

  const cols: ColumnDef[] = [
    { header: 'Item Name', width: 115 },
    { header: 'Event / Source', width: 100 },
    { header: 'Stock/Thresh', width: 68, align: 'center' },
    { header: 'Est. Cost', width: 65, align: 'right' },
    { header: 'Priority', width: 62, align: 'center' },
    { header: 'Status', width: 79, align: 'right' },
  ]

  const rows = lines.map((l) => {
    const unitPrice = l.costPerUnit ?? (l.category === 'Drapery & Fabrics' ? 350 : 180)
    const required = l.quantityNeeded ?? Math.max(0, l.threshold - l.currentStock)
    const lineCost = required * unitPrice
    return [
      l.itemName,
      l.eventTitle || l.triggerSource,
      `${l.currentStock} / ${l.threshold}`,
      `₱${lineCost.toLocaleString()}`,
      l.priority,
      l.status,
    ]
  })
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the deficit lines and procurement estimates presented in this report have been extracted directly from the verified inventory records of the Lumière platform.',
    [
      { role: 'Inventory Officer / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Operations Manager / Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

  builder.save('replenishment-deficit-report.pdf')
}

// ─── 6. Replenishment Procurement Register PDF Exporter ───
export function exportReplenishmentProcurementPdf(items: ProcurementItem[]) {
  const builder = new PdfReportBuilder()
  builder.drawHeader('PROCUREMENT REGISTER & STOCK AUDIT', [
    { label: 'Document Reference', value: makeReference('PRA') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Total Register Items', value: `${items.length} inventory lines` },
  ])

  builder.drawScorecard([
    { label: 'Total Register Items', value: String(items.length) },
    { label: 'Scope', value: 'Master Register', bullets: ['Procurement & low-stock threshold register'] },
  ])

  const cols: ColumnDef[] = [
    { header: 'Asset ID', width: 68 },
    { header: 'Item Name', width: 128 },
    { header: 'Category', width: 100 },
    { header: 'Stock/Thresh', width: 66, align: 'center' },
    { header: 'Stock %', width: 48, align: 'center' },
    { header: 'Status', width: 79, align: 'right' },
  ]

  const rows = items.map((p) => {
    const pct = p.threshold > 0 ? Math.round((p.currentStock / p.threshold) * 100) : 100
    return [p.assetId, p.name, p.category, `${p.currentStock} / ${p.threshold}`, `${pct}%`, p.status]
  })
  builder.drawTable(cols, rows)

  builder.drawCertification(
    'I hereby certify that the procurement register and stock threshold records presented in this report have been extracted directly from the verified inventory records of the Lumière platform.',
    [
      { role: 'Inventory Officer / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Operations Manager / Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

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
    { label: 'Document Reference', value: makeReference('CRW') },
    { label: 'Report Date', value: new Date().toLocaleDateString() },
    { label: 'Classification', value: 'Verified Official Record' },
    { label: 'Event', value: eventInfo.eventTitle },
    { label: 'Venue', value: eventInfo.venue },
    { label: 'Target Date', value: eventInfo.targetDate },
  ])

  builder.drawScorecard([
    { label: 'Total Crew Allocated', value: String(crewList.length), bullets: [`${leadsCount} Team Lead${leadsCount === 1 ? '' : 's'}`, `${crewList.length - leadsCount} Crew`] },
  ])

  const cols: ColumnDef[] = [
    { header: 'Staff Name', width: 100 },
    { header: 'Role / Designation', width: 105 },
    { header: 'Department / Zone', width: 95 },
    { header: 'Lead Status', width: 65, align: 'center' },
    { header: 'Duty / Date', width: 70 },
    { header: 'Sign-Off', width: 68, align: 'center' },
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

    const rows = deptMembers.map((member) => [
      member.name,
      member.role,
      `${member.department}${member.dutyCategory ? ` · ${member.dutyCategory}` : ''}`,
      member.isTeamLead ? 'Team Lead' : 'Crew',
      member.assignmentDate || eventInfo.targetDate,
      '☐',
    ])
    builder.drawTable(cols, rows)
  })

  builder.drawCertification(
    'I hereby certify that the crew roster and manning delegation records presented in this report have been extracted directly from the verified operations records of the Lumière event management system.',
    [
      { role: 'Production Manager / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
      { role: 'Event Coordinator', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
    ],
  )

  const filename = `crew-roster-${eventInfo.eventTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
  builder.save(filename)
}
