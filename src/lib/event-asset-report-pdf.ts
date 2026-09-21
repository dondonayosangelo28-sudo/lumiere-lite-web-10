import jsPDF from 'jspdf'
import type { PortalEvent } from '@/lib/types'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const LEFT = 55
const RIGHT = 55
const TOP = 57.5
const BOTTOM = 57.5
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT
const TOTAL_PAGES = '{total_pages_count_string}'

type AssetRow = {
  asset: string
  className: string
  planned: number
  deployed: number
  returned: number
  damaged: number
  lost: number
}

type ReportData = {
  reference: string
  title: string
  generated: string
  status: string
  client: string
  venue: string
  eventType: string
  eventDate: string
  eventTime: string
  expectedGuests: string
  coordinator: string
  venueContact: string
  created: string
  lastUpdated: string
  overview: string
  rows: AssetRow[]
}

// layout check only, replaced in step 3
const SAMPLE_REPORT_DATA: ReportData = {
  reference: 'EVT-2026-0142',
  title: 'Lumière Winter Gala',
  generated: 'September 21, 2026 at 10:30 AM',
  status: 'CONFIRMED',
  client: 'Northstar Foundation',
  venue: 'The Glasshouse, New York',
  eventType: 'Gala Dinner',
  eventDate: 'October 18, 2026',
  eventTime: '6:00 PM - 11:30 PM',
  expectedGuests: '420',
  coordinator: 'Avery Morgan',
  venueContact: 'Jordan Lee',
  created: 'September 2, 2026',
  lastUpdated: 'September 19, 2026',
  overview: 'A formal winter gala with plated dining, stage programming, and a branded reception area. The logistics plan prioritizes complete return reconciliation and immediate review of any damaged or missing assets.',
  rows: [
    { asset: 'Banquet Chair', className: 'Furniture', planned: 420, deployed: 420, returned: 420, damaged: 0, lost: 0 },
    { asset: 'Dinner Table', className: 'Furniture', planned: 52, deployed: 52, returned: 51, damaged: 0, lost: 1 },
    { asset: 'Stage Uplight', className: 'Lighting', planned: 36, deployed: 36, returned: 34, damaged: 2, lost: 0 },
    { asset: 'Glass Charger', className: 'Tabletop', planned: 450, deployed: 448, returned: 448, damaged: 0, lost: 0 },
  ],
}

const colors = {
  ink: [43, 33, 26] as [number, number, number],
  muted: [110, 97, 83] as [number, number, number],
  accent: [139, 111, 71] as [number, number, number],
  border: [217, 203, 174] as [number, number, number],
  panel: [247, 240, 230] as [number, number, number],
  green: [63, 107, 68] as [number, number, number],
  amber: [154, 107, 18] as [number, number, number],
  red: [154, 51, 36] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

function safeReference(ref: string) {
  return ref.replace(/[^A-Za-z0-9_-]/g, '_') || 'event'
}

function formatGeneratedAt(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function text(doc: jsPDF, value: string, x: number, y: number, size = 8, color = colors.ink, font = 'helvetica', style = 'normal') {
  doc.setFont(font, style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
  doc.text(value, x, y)
}

function wrapped(doc: jsPDF, value: string, width: number) {
  return doc.splitTextToSize(value, width)
}

function heading(doc: jsPDF, label: string, y: number) {
  text(doc, label, LEFT, y, 10, colors.accent, 'helvetica', 'bold')
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.55)
  doc.line(LEFT + 118, y - 3, PAGE_WIDTH - RIGHT, y - 3)
}

function statusFor(row: AssetRow) {
  if (row.returned < row.deployed) return { label: 'DEFICIT', color: colors.red }
  if (row.damaged > 0 || row.lost > 0) return { label: 'REVIEW', color: colors.amber }
  return { label: 'COMPLETE', color: colors.green }
}

function drawFooter(doc: jsPDF, reference: string, page: number) {
  const y = PAGE_HEIGHT - BOTTOM - 12
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.55)
  doc.line(LEFT, y - 9, PAGE_WIDTH - RIGHT, y - 9)
  text(doc, `LUMIERE - Event Asset & Logistics Report - Event Reference: ${reference}`, LEFT, y + 5, 7, colors.muted)
  text(doc, `PAGE ${page} / ${TOTAL_PAGES}`, PAGE_WIDTH - RIGHT, y + 5, 7, colors.muted, 'helvetica', 'normal')
}

function drawCell(doc: jsPDF, x: number, y: number, width: number, height: number, label: string, value: string) {
  doc.setFillColor(...colors.panel)
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.45)
  doc.rect(x, y, width, height, 'FD')
  text(doc, label, x + 7, y + 12, 6.5, colors.muted, 'helvetica', 'bold')
  const lines = doc.splitTextToSize(value, width - 14).slice(0, 2)
  text(doc, lines.join('\n'), x + 7, y + 27, 8, colors.ink, 'helvetica', 'bold')
}

export async function exportEventAssetLogisticsReport(event: PortalEvent, isExecutive: boolean): Promise<void> {
  if (!isExecutive) return

  const data: ReportData = {
    ...SAMPLE_REPORT_DATA,
    reference: event.refId || SAMPLE_REPORT_DATA.reference,
    title: event.title || SAMPLE_REPORT_DATA.title,
    generated: formatGeneratedAt(),
  }
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })
  const planned = data.rows.reduce((sum, row) => sum + row.planned, 0)
  const deployed = data.rows.reduce((sum, row) => sum + row.deployed, 0)
  const returned = data.rows.reduce((sum, row) => sum + row.returned, 0)
  const damaged = data.rows.reduce((sum, row) => sum + row.damaged, 0)
  const lost = data.rows.reduce((sum, row) => sum + row.lost, 0)
  const pending = Math.max(planned - deployed, 0)
  let y = TOP

  text(doc, 'LUMIERE', PAGE_WIDTH / 2 - 42, y + 22, 27, colors.ink, 'times', 'bold')
  text(doc, 'EVENT ASSET & LOGISTICS REPORT', PAGE_WIDTH / 2 - 109, y + 43, 10, colors.accent, 'helvetica', 'bold')
  text(doc, 'SAMPLE LAYOUT - NOT REAL DATA', PAGE_WIDTH / 2 - 55, y + 56, 6.5, colors.muted, 'helvetica', 'italic')
  y += 68

  const stripW = CONTENT_WIDTH / 3
  ;[
    ['EVENT REFERENCE', data.reference],
    ['GENERATED', data.generated],
    ['STATUS', data.status],
  ].forEach(([label, value], index) => drawCell(doc, LEFT + index * stripW, y, stripW, 42, label, value))
  y += 60

  heading(doc, '1. EVENT INFORMATION', y)
  y += 9
  const info = [
    ['EVENT NAME', data.title], ['CLIENT', data.client], ['VENUE', data.venue],
    ['EVENT TYPE', data.eventType], ['EVENT DATE', data.eventDate], ['EVENT TIME', data.eventTime],
    ['EXPECTED GUESTS', data.expectedGuests], ['EVENT STATUS', data.status], ['EVENT COORDINATOR', data.coordinator],
    ['VENUE CONTACT', data.venueContact], ['CREATED', data.created], ['LAST UPDATED', data.lastUpdated],
  ]
  const colW = CONTENT_WIDTH / 4
  for (let row = 0; row < 3; row += 1) {
    const rowY = y + row * 39
    for (let col = 0; col < 4; col += 1) {
      const pair = info[row * 4 + col]
      drawCell(doc, LEFT + col * colW, rowY, colW, 39, pair[0], pair[1])
    }
  }
  y += 134

  heading(doc, '2. EVENT OVERVIEW', y)
  y += 14
  const overviewLines = wrapped(doc, data.overview, CONTENT_WIDTH)
  text(doc, overviewLines.join('\n'), LEFT, y, 8.5, colors.ink, 'helvetica', 'italic')
  y += overviewLines.length * 11 + 17

  heading(doc, '3. ASSET SUMMARY', y)
  y += 9
  const stats = [['PLANNED', planned], ['DEPLOYED', deployed], ['RETURNED', returned], ['DAMAGED', damaged], ['MISSING / LOST', lost], ['PENDING', pending]]
  const statW = CONTENT_WIDTH / 6
  stats.forEach(([label, value], index) => {
    const x = LEFT + index * statW
    doc.setFillColor(...colors.panel)
    doc.setDrawColor(...colors.border)
    doc.rect(x, y, statW, 42, 'FD')
    text(doc, String(value), x + statW / 2, y + 22, 17, colors.ink, 'times', 'bold')
    text(doc, String(label), x + statW / 2, y + 34, 5.8, colors.muted, 'helvetica', 'bold')
  })
  y += 61

  heading(doc, '4. ASSETS DEPLOYED', y)
  y += 10
  const columns = [
    ['ASSET', 103], ['CLASS', 70], ['PLANNED', 45], ['DEPLOYED', 50], ['RETURNED', 50], ['DAMAGED', 48], ['LOST', 38], ['STATUS', 98],
  ] as const
  const headerH = 21
  let x = LEFT
  doc.setFillColor(...colors.accent)
  doc.setDrawColor(...colors.accent)
  doc.rect(LEFT, y, CONTENT_WIDTH, headerH, 'F')
  columns.forEach(([label, width]) => {
    text(doc, label, x + (width > 60 ? 6 : width / 2), y + 14, 6, colors.white, 'helvetica', 'bold')
    x += width
  })
  y += headerH
  data.rows.forEach((row) => {
    const rowH = 25
    x = LEFT
    doc.setDrawColor(...colors.border)
    doc.line(LEFT, y + rowH, PAGE_WIDTH - RIGHT, y + rowH)
    const values = [row.asset, row.className, String(row.planned), String(row.deployed), String(row.returned), String(row.damaged), String(row.lost), statusFor(row).label]
    values.forEach((value, index) => {
      const width = columns[index][1]
      const centered = index >= 2
      const color = index === 7 ? statusFor(row).color : colors.ink
      text(doc, value, centered ? x + width / 2 : x + 6, y + 16, 7, color, 'helvetica', index === 7 ? 'bold' : 'normal')
      x += width
    })
    y += rowH
  })

  drawFooter(doc, data.reference, 1)
  doc.putTotalPages(TOTAL_PAGES)
  doc.save(`Lumiere_Event_Asset_Logistics_Report_${safeReference(data.reference)}.pdf`)
}
