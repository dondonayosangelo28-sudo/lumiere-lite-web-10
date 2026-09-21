import jsPDF from 'jspdf'
import type { PortalEvent } from '@/lib/types'

const SPEC = {
  page: { w: 612, h: 792, left: 55, right: 557, top: 57.5, bottom: 742 },
  ink: '#2B211A', muted: '#6E6153', accent: '#8B6F47', border: '#D9CBAE', panel: '#F7F0E6',
  green: '#3F6B44', amber: '#9A6B12', red: '#9A3324', white: '#FFFFFF',
} as const

type AssetRow = { asset: string; className: string; planned: number; deployed: number; returned: number; damaged: number; lost: number }
type ReportEvent = PortalEvent & { expectedGuests?: number | string; coordinator?: string; venueContact?: string; createdAt?: string; updatedAt?: string; overview?: string; assets?: AssetRow[]; crew?: Record<string, string>; audit?: Record<string, string> }

function rgb(hex: string): [number, number, number] { const n = Number.parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function safeReference(ref: string) { return ref.replace(/[^A-Za-z0-9_-]/g, '_') || 'event' }
function formatDate(value?: string) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date) }
function formatGeneratedAt() { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()) }
function text(doc: jsPDF, value: string, x: number, y: number, size: number, color = SPEC.ink, font = 'helvetica', style = 'normal', align: 'left' | 'center' | 'right' = 'left') { doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...rgb(color)); doc.text(value, x, y, { align }) }
function box(doc: jsPDF, x: number, y: number, w: number, h: number, fill = SPEC.panel) { doc.setFillColor(...rgb(fill)); doc.setDrawColor(...rgb(SPEC.border)); doc.setLineWidth(.45); doc.rect(x, y, w, h, 'FD') }
function heading(doc: jsPDF, label: string, y: number) { text(doc, label, SPEC.page.left, y, 10, SPEC.accent, 'helvetica', 'bold'); doc.setDrawColor(...rgb(SPEC.border)); doc.setLineWidth(.55); doc.line(SPEC.page.left, y + 4, SPEC.page.right, y + 4) }
function field(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) { box(doc, x, y, w, h); text(doc, label, x + 7, y + 12, 6.5, SPEC.muted, 'helvetica', 'bold'); const lines = doc.splitTextToSize(value || '-', w - 14); text(doc, lines[0] || '-', x + 7, y + 27, 8, SPEC.ink, 'helvetica', 'bold') }
function status(row: AssetRow) { if (row.returned < row.deployed || row.lost > 0) return ['DEFICIT', SPEC.red] as const; if (row.damaged > 0) return ['REVIEW', SPEC.amber] as const; return ['COMPLETE', SPEC.green] as const }
function footer(doc: jsPDF, ref: string) { const y = SPEC.page.bottom; doc.setDrawColor(...rgb(SPEC.border)); doc.setLineWidth(.55); doc.line(55, y - 9, 557, y - 9); text(doc, `LUMIÈRE · Event Asset & Logistics Report · Event Reference: ${ref}`, 55, y + 5, 7, SPEC.muted); text(doc, `PAGE ${doc.getNumberOfPages()} / {total_pages_count_string}`, 557, y + 5, 7, SPEC.muted, 'helvetica', 'normal', 'right') }
function pageHeader(doc: jsPDF, ref: string) { text(doc, 'LUMIÈRE', 306, 30, 13, SPEC.ink, 'times', 'bold', 'center'); text(doc, 'EVENT ASSET & LOGISTICS REPORT', 306, 43, 7, SPEC.accent, 'helvetica', 'bold', 'center'); text(doc, ref, 557, 30, 6.5, SPEC.muted, 'helvetica', 'normal', 'right') }
function newPage(doc: jsPDF, ref: string) { footer(doc, ref); doc.addPage(); pageHeader(doc, ref); return SPEC.page.top }
function stat(doc: jsPDF, x: number, y: number, label: string, value: number) { box(doc, x, y, 83.666, 42); text(doc, String(value), x + 41.833, y + 22, 17, SPEC.ink, 'times', 'bold', 'center'); text(doc, label, x + 41.833, y + 34, 5.8, SPEC.ink, 'helvetica', 'bold', 'center') }
function tableHeader(doc: jsPDF, y: number, cols: Array<[string, number]>) { let x = 55; doc.setFillColor(...rgb(SPEC.accent)); doc.rect(55, y, 502, 21, 'F'); cols.forEach(([label, w], i) => { text(doc, label, i > 1 ? x + w / 2 : x + 6, y + 14, 6, SPEC.white, 'helvetica', 'bold', i > 1 ? 'center' : 'left'); x += w }) }
function tableRow(doc: jsPDF, y: number, values: string[], cols: Array<[string, number]>, colors?: Array<string | undefined>) { let x = 55; values.forEach((value, i) => { const w = cols[i][1]; text(doc, value, i > 1 ? x + w / 2 : x + 6, y + 16, 7, colors?.[i] || SPEC.ink, 'helvetica', i === values.length - 1 ? 'bold' : 'normal', i > 1 ? 'center' : 'left'); x += w }); doc.setDrawColor(...rgb(SPEC.border)); doc.line(55, y + 25, 557, y + 25) }
function grid(doc: jsPDF, y: number, fields: Array<[string, string]>) { fields.forEach(([label, value], i) => field(doc, 55 + (i % 4) * 125.5, y + Math.floor(i / 4) * 39, 125.5, 39, label, value)) }

export async function exportEventAssetLogisticsReport(event: PortalEvent, isExecutive: boolean): Promise<void> {
  if (!isExecutive) return
  const source = event as ReportEvent
  const rows = (source.assets || []).map((row) => ({ ...row, planned: Number(row.planned) || 0, deployed: Number(row.deployed) || 0, returned: Number(row.returned) || 0, damaged: Number(row.damaged) || 0, lost: Number(row.lost) || 0 }))
  const totals = rows.reduce((sum, row) => ({ planned: sum.planned + row.planned, deployed: sum.deployed + row.deployed, returned: sum.returned + row.returned, damaged: sum.damaged + row.damaged, lost: sum.lost + row.lost }), { planned: 0, deployed: 0, returned: 0, damaged: 0, lost: 0 })
  const pending = Math.max(totals.planned - totals.deployed, 0)
  const ref = event.refId || event.id
  const generated = formatGeneratedAt()
  const overview = source.overview || event.moodPlan || 'A corporate appreciation event featuring stage styling, guest tables, decorative displays, lighting elements, and customized event installations.'
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })

  // Page 1: the DOCX opening hierarchy.
  pageHeader(doc, ref); let y = 57.5
  text(doc, 'SAMPLE LAYOUT - NOT REAL DATA', 306, y + 8, 6.5, SPEC.muted, 'helvetica', 'italic', 'center')
  ;[['EVENT REFERENCE', ref], ['GENERATED', generated], ['STATUS', String(event.status)]].forEach(([label, value], i) => field(doc, 55 + i * 167.333, y + 20, 167.333, 42, label, value)); y += 82
  heading(doc, '1. EVENT INFORMATION', y); y += 9
  grid(doc, y, [['EVENT NAME', event.title], ['CLIENT', event.client], ['VENUE', event.venue], ['EVENT TYPE', event.tier], ['EVENT DATE', formatDate(event.targetDate)], ['EVENT TIME', `${event.installationStart || '-'} - ${event.installationEnd || '-'}`], ['EXPECTED GUESTS', String(source.expectedGuests ?? '-')], ['EVENT STATUS', String(event.status)], ['EVENT COORDINATOR', source.coordinator || '-'], ['VENUE CONTACT', source.venueContact || '-'], ['CREATED', formatDate(source.createdAt)], ['LAST UPDATED', formatDate(source.updatedAt)] ]); y += 134
  heading(doc, '2. EVENT OVERVIEW', y); y += 15; const overviewLines = doc.splitTextToSize(overview, 502); text(doc, overviewLines.join('\n'), 55, y, 8.5, SPEC.ink, 'helvetica', 'italic'); y += overviewLines.length * 11 + 17
  heading(doc, '3. ASSET SUMMARY', y); y += 9
  ;[['PLANNED', totals.planned], ['DEPLOYED', totals.deployed], ['RETURNED', totals.returned], ['DAMAGED', totals.damaged], ['MISSING / LOST', totals.lost], ['PENDING', pending]].forEach(([label, value], i) => stat(doc, 55 + i * 83.666, y, String(label), Number(value))); footer(doc, ref)

  // Page 2: deployed ledger and transport lifecycle.
  y = newPage(doc, ref); heading(doc, '4. ASSETS DEPLOYED', y); y += 10
  const cols: Array<[string, number]> = [['ASSET', 103], ['CLASS', 70], ['PLANNED', 45], ['DEPLOYED', 50], ['RETURNED', 50], ['DAMAGED', 48], ['LOST', 38], ['STATUS', 98]]; tableHeader(doc, y, cols); y += 21
  rows.forEach((row) => { const [label, color] = status(row); tableRow(doc, y, [row.asset, row.className, `${row.planned}`, `${row.deployed}`, `${row.returned}`, `${row.damaged}`, `${row.lost}`, label], cols, [undefined, undefined, undefined, undefined, undefined, undefined, undefined, color]); y += 25 }); y += 18
  heading(doc, '5. LOGISTICS INFORMATION', y); y += 15
  const steps = [['DISPATCH', event.ingressTime || '-', 'Warehouse release and loading'], ['TRANSIT', '-', 'Assets in transit'], ['INGRESS', event.ingressTime || '-', 'Venue access and receiving'], ['SETUP', event.installationStart || '-', 'Installation and styling'], ['EVENT', event.targetDate || '-', 'Event live period'], ['EGRESS', event.fullStop || '-', 'Strike and load-out'], ['RETURN', event.installationEnd || '-', 'Assets returned']] as const
  steps.forEach((step, i) => { text(doc, step[0], 70, y, 7.5, SPEC.ink, 'helvetica', 'bold'); text(doc, step[1], 150, y, 7.5); text(doc, step[2], 290, y, 7.5, SPEC.muted, 'helvetica', 'italic'); if (i < steps.length - 1) { doc.setDrawColor(...rgb(SPEC.accent)); doc.line(60, y + 3, 60, y + 20); doc.line(60, y + 20, 57, y + 16); doc.line(60, y + 20, 63, y + 16) } y += 24 }); y += 8
  heading(doc, '6. TRANSPORT INFORMATION', y); y += 9; grid(doc, y, [['VEHICLE', source.crew?.Vehicle || '-'], ['DRIVER', source.crew?.Driver || '-'], ['DISPATCH', event.ingressTime || '-'], ['VENUE ARRIVAL', event.ingressTime || '-'], ['RETURN', event.installationEnd || '-'], ['CREW', source.crew?.Crew || '-']])

  // Page 3: operational handoff sections.
  y = newPage(doc, ref); heading(doc, '6. INGRESS', y); y += 9; grid(doc, y, [['DISPATCH LOADING STATUS', 'Confirmed'], ['ITEMS DISPATCHED', String(totals.deployed)], ['ITEMS RECEIVED', String(totals.deployed)], ['VENUE ARRIVAL', event.ingressTime || '-'], ['RECEIVING STATUS', 'Complete'], ['SETUP HANDOFF', 'Confirmed'], ['EXCEPTIONS', '-']]); y += 91
  heading(doc, '7. ON-SITE / SETUP', y); y += 9; grid(doc, y, [['SETUP START', event.installationStart || '-'], ['SETUP COMPLETION', event.installationEnd || '-'], ['CREW', source.crew?.Crew || '-'], ['ASSETS STAGED', String(totals.deployed)], ['EXCEPTIONS', '-'], ['ON-SITE STATUS', 'Complete']]); y += 91
  heading(doc, '8. EGRESS & RETURN', y); y += 9; grid(doc, y, [['POST-EVENT INSPECTION', 'Complete'], ['EXPECTED RETURN QTY', String(totals.deployed)], ['ACTUAL RETURN QTY', String(totals.returned)], ['DAMAGED', String(totals.damaged)], ['MISSING / LOST', String(totals.lost)], ['EGRESS TIMESTAMP', event.fullStop || '-'], ['RETURN TIMESTAMP', event.installationEnd || '-'], ['RETURN STATUS', totals.lost ? 'Investigation Required' : 'Complete']]); footer(doc, ref)

  // Page 4: reconciliation, exceptions, responsibility, verification.
  y = newPage(doc, ref); heading(doc, '9. ASSET RECONCILIATION', y); y += 9
  const metrics: Array<[string, string]> = [['METRIC', 'QUANTITY'], ['Planned', `${totals.planned}`], ['Deployed', `${totals.deployed}`], ['Returned', `${totals.returned}`], ['Damaged', `${totals.damaged}`], ['Lost / Missing', `${totals.lost}`], ['Pending Verification', `${pending}`]]; metrics.forEach((row, i) => { field(doc, 55, y + i * 19, 251, 19, row[0], row[1]); field(doc, 306, y + i * 19, 251, 19, i ? row[1] : 'VALUE', '') }); y += 155
  heading(doc, '10. DEFICIT / EXCEPTIONS', y); y += 9
  const deficits = rows.filter((row) => row.returned < row.deployed || row.damaged > 0 || row.lost > 0); const deficit = deficits[0]
  grid(doc, y, [['ASSET', deficit?.asset || '-'], ['EXPECTED', String(deficit?.deployed ?? '-')], ['RETURNED', String(deficit?.returned ?? '-')], ['DEFICIT', String(deficit ? Math.max(deficit.deployed - deficit.returned, 0) : 0)], ['STATUS', deficit ? 'Investigation Required' : 'Clear']]); y += 52
  heading(doc, '11. CREW & RESPONSIBILITY', y); y += 9; grid(doc, y, [['EVENT COORDINATOR', source.crew?.['Event Coordinator'] || source.coordinator || '-'], ['CREW LEAD', source.crew?.['Crew Lead'] || '-'], ['DISPATCH CREW', source.crew?.['Dispatch Crew'] || '-'], ['SETUP CREW', source.crew?.['Setup Crew'] || '-'], ['EGRESS CREW', source.crew?.['Egress Crew'] || '-'], ['DRIVER', source.crew?.Driver || '-'], ['VENUE CONTACT', source.venueContact || '-'], ['VEHICLE', source.crew?.Vehicle || '-']]); y += 91
  heading(doc, '12. AUDIT & VERIFICATION', y); y += 9; grid(doc, y, [['EVENT REFERENCE ID', ref], ['REPORT REFERENCE', `RPT-${ref}`], ['GENERATED BY', 'Lumière'], ['GENERATED TIMESTAMP', generated], ['LAST SYNCHRONIZATION', formatDate(source.updatedAt)], ['LAST MODIFIED', formatDate(source.updatedAt)], ['VERIFIED BY', source.audit?.['Verified By'] || '-'], ['VERIFICATION STATUS', source.audit?.['Verification Status'] || 'Pending']]); y += 91
  box(doc, 55, y, 70, 70); text(doc, 'QR', 90, y + 40, 18, SPEC.ink, 'times', 'bold', 'center'); text(doc, 'SCAN TO VERIFY EVENT RECORD', 140, y + 28, 8, SPEC.ink, 'helvetica', 'bold'); text(doc, `Ref: ${ref}`, 140, y + 42, 8, SPEC.muted); text(doc, 'This report is generated from the Lumière event record and is intended for operational verification.', 55, y + 87, 8.5, SPEC.ink, 'helvetica', 'italic'); footer(doc, ref); doc.putTotalPages('{total_pages_count_string}'); doc.save(`Lumiere_Event_Asset_Logistics_Report_${safeReference(ref)}.pdf`)
}

export { SPEC as DOCX_SPEC }
