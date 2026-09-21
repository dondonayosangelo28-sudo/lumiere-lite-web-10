import jsPDF from 'jspdf'
import type { PortalEvent } from '@/lib/types'

const DOCX_SPEC = {
  page: { width: 612, height: 792, margins: { top: 57.5, right: 55, bottom: 57.5, left: 55 }, headerFooterDistance: 35.4 },
  colors: { ink: '#2B211A', muted: '#6E6153', accent: '#8B6F47', border: '#D9CBAE', panel: '#F7F0E6', green: '#3F6B44', amber: '#9A6B12', red: '#9A3324', white: '#FFFFFF' },
  fonts: { title: { family: 'times', size: 28, bold: true }, body: { family: 'helvetica', size: 8 }, label: { family: 'helvetica', size: 6.5, bold: true }, heading: { family: 'helvetica', size: 10, bold: true }, stat: { family: 'times', size: 17, bold: true }, footer: { family: 'helvetica', size: 7 } },
  titleBlock: { before: 0, after: 0, alignment: 'center', stripCellWidth: 167.333, stripCellHeight: 42, cellMargins: 7, shading: '#F7F0E6', borderColor: '#D9CBAE', borderWidth: 0.45 },
  headings: { before: 19.5, after: 6, bottomBorderColor: '#D9CBAE', bottomBorderWidth: 0.55 },
  infoGrid: { columns: [125.5, 125.5, 125.5, 125.5], rowHeight: 39, cellMargins: 7, shading: '#F7F0E6', borderColor: '#D9CBAE', borderWidth: 0.45, labelSize: 6.5, valueSize: 8 },
  stats: { columns: [83.666, 83.666, 83.666, 83.666, 83.666, 83.666], height: 42, numberSize: 17, labelSize: 5.8, shading: '#F7F0E6', borderColor: '#D9CBAE', borderWidth: 0.45 },
  assets: { columns: [103, 70, 45, 50, 50, 48, 38, 98], headerHeight: 21, rowHeight: 25, headerFill: '#8B6F47', headerSize: 6, bodySize: 7, cellMargins: 6, borderColor: '#D9CBAE', borderWidth: 0.45, statusSize: 7 },
  overview: { size: 8.5, color: '#2B211A', lineSpacing: 11, italic: true },
  footer: { size: 7, color: '#6E6153', hairlineWidth: 0.55, tabPosition: 502 },
} as const

type AssetRow = { asset: string; className: string; planned: number; deployed: number; returned: number; damaged: number; lost: number }
type ReportData = { reference: string; title: string; generated: string; status: string; client: string; venue: string; eventType: string; eventDate: string; eventTime: string; expectedGuests: string; coordinator: string; venueContact: string; created: string; lastUpdated: string; overview: string; rows: AssetRow[] }

const SAMPLE_REPORT_DATA: ReportData = {
  reference: 'EVT-2026-00072', title: 'Annual Corporate Gala 2026', generated: '', status: 'Completed', client: 'ABC Corporation', venue: 'Grand Ballroom', eventType: 'Corporate', eventDate: 'September 20, 2026', eventTime: '6:00 PM - 11:00 PM', expectedGuests: '250', coordinator: '-', venueContact: '-', created: 'August 4, 2026', lastUpdated: 'September 21, 2026', overview: 'A corporate appreciation event featuring stage styling, guest tables, decorative displays, lighting elements, and customized event installations.',
  rows: [
    { asset: 'Aurora Lighting Kit', className: 'Lighting', planned: 6, deployed: 6, returned: 6, damaged: 0, lost: 0 },
    { asset: 'Marlow Lounge Chair', className: 'Furniture', planned: 8, deployed: 8, returned: 8, damaged: 1, lost: 0 },
    { asset: 'Oak Plinth Set', className: 'Display', planned: 16, deployed: 16, returned: 15, damaged: 1, lost: 0 },
    { asset: 'Signature Drape Panel', className: 'Decor', planned: 12, deployed: 12, returned: 12, damaged: 0, lost: 0 },
  ],
}

function rgb(hex: string): [number, number, number] { const n = Number.parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function safeReference(ref: string) { return ref.replace(/[^A-Za-z0-9_-]/g, '_') || 'event' }
function formatGeneratedAt(date = new Date()) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date) }
function text(doc: jsPDF, value: string, x: number, y: number, size: number, color: string, font = 'helvetica', style = 'normal', align: 'left' | 'center' | 'right' = 'left') { doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...rgb(color)); doc.text(value, x, y, { align }) }
function heading(doc: jsPDF, label: string, y: number) { text(doc, label, 55, y, DOCX_SPEC.fonts.heading.size, DOCX_SPEC.colors.accent, 'helvetica', 'bold'); doc.setDrawColor(...rgb(DOCX_SPEC.headings.bottomBorderColor)); doc.setLineWidth(DOCX_SPEC.headings.bottomBorderWidth); doc.line(173, y - 3, 557, y - 3) }
function statusFor(row: AssetRow) { if (row.returned < row.deployed) return { label: 'DEFICIT', color: DOCX_SPEC.colors.red }; if (row.damaged || row.lost) return { label: 'REVIEW', color: DOCX_SPEC.colors.amber }; return { label: 'COMPLETE', color: DOCX_SPEC.colors.green } }
function cell(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) { doc.setFillColor(...rgb(DOCX_SPEC.colors.panel)); doc.setDrawColor(...rgb(DOCX_SPEC.colors.border)); doc.setLineWidth(DOCX_SPEC.titleBlock.borderWidth); doc.rect(x, y, w, h, 'FD'); text(doc, label, x + 7, y + 12, DOCX_SPEC.fonts.label.size, DOCX_SPEC.colors.muted, 'helvetica', 'bold'); const lines = doc.splitTextToSize(value, w - 14).slice(0, 2); text(doc, lines.join('\n'), x + 7, y + 27, DOCX_SPEC.infoGrid.valueSize, DOCX_SPEC.colors.ink, 'helvetica', 'bold') }
function footer(doc: jsPDF, ref: string) { const y = 722; doc.setDrawColor(...rgb(DOCX_SPEC.colors.border)); doc.setLineWidth(DOCX_SPEC.footer.hairlineWidth); doc.line(55, y - 9, 557, y - 9); text(doc, `LUMIÈRE · Event Asset & Logistics Report · Event Reference: ${ref}`, 55, y + 5, DOCX_SPEC.footer.size, DOCX_SPEC.footer.color); text(doc, `PAGE 1 / {total_pages_count_string}`, 557, y + 5, DOCX_SPEC.footer.size, DOCX_SPEC.footer.color, 'helvetica', 'normal', 'right') }

export async function exportEventAssetLogisticsReport(event: PortalEvent, isExecutive: boolean): Promise<void> {
  if (!isExecutive) return
  const data: ReportData = { ...SAMPLE_REPORT_DATA, reference: event.refId || SAMPLE_REPORT_DATA.reference, title: event.title || SAMPLE_REPORT_DATA.title, generated: formatGeneratedAt() }
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' }); const planned = data.rows.reduce((a, r) => a + r.planned, 0); const deployed = data.rows.reduce((a, r) => a + r.deployed, 0); const returned = data.rows.reduce((a, r) => a + r.returned, 0); const damaged = data.rows.reduce((a, r) => a + r.damaged, 0); const lost = data.rows.reduce((a, r) => a + r.lost, 0); const pending = Math.max(planned - deployed, 0); let y = 57.5
  text(doc, 'LUMIÈRE', 306, y + 22, DOCX_SPEC.fonts.title.size, DOCX_SPEC.colors.ink, 'times', 'bold', 'center'); text(doc, 'EVENT ASSET & LOGISTICS REPORT', 306, y + 43, 10, DOCX_SPEC.colors.accent, 'helvetica', 'bold', 'center'); text(doc, 'SAMPLE LAYOUT - NOT REAL DATA', 306, y + 56, 6.5, DOCX_SPEC.colors.muted, 'helvetica', 'italic', 'center'); y += 68
  const stripW = DOCX_SPEC.titleBlock.stripCellWidth; [['EVENT REFERENCE', data.reference], ['GENERATED', data.generated], ['STATUS', data.status]].forEach(([l, v], i) => cell(doc, 55 + i * stripW, y, stripW, DOCX_SPEC.titleBlock.stripCellHeight, l, v)); y += 60
  heading(doc, '1. EVENT INFORMATION', y); y += 9
  const info = [['EVENT NAME', data.title], ['CLIENT', data.client], ['VENUE', data.venue], ['EVENT TYPE', data.eventType], ['EVENT DATE', data.eventDate], ['EVENT TIME', data.eventTime], ['EXPECTED GUESTS', data.expectedGuests], ['EVENT STATUS', data.status], ['EVENT COORDINATOR', data.coordinator], ['VENUE CONTACT', data.venueContact], ['CREATED', data.created], ['LAST UPDATED', data.lastUpdated]]; const colW = DOCX_SPEC.infoGrid.columns[0]
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const pair = info[r * 4 + c]; cell(doc, 55 + c * colW, y + r * DOCX_SPEC.infoGrid.rowHeight, colW, DOCX_SPEC.infoGrid.rowHeight, pair[0], pair[1]) } y += 134
  heading(doc, '2. EVENT OVERVIEW', y); y += 14; const overview = doc.splitTextToSize(data.overview, 502); text(doc, overview.join('\n'), 55, y, DOCX_SPEC.overview.size, DOCX_SPEC.overview.color, 'helvetica', 'italic'); y += overview.length * DOCX_SPEC.overview.lineSpacing + 17
  heading(doc, '3. ASSET SUMMARY', y); y += 9; const stats = [['PLANNED', planned], ['DEPLOYED', deployed], ['RETURNED', returned], ['DAMAGED', damaged], ['MISSING / LOST', lost], ['PENDING', pending]] as const; stats.forEach(([l, v], i) => { const x = 55 + i * DOCX_SPEC.stats.columns[0]; doc.setFillColor(...rgb(DOCX_SPEC.stats.shading)); doc.setDrawColor(...rgb(DOCX_SPEC.stats.borderColor)); doc.setLineWidth(DOCX_SPEC.stats.borderWidth); doc.rect(x, y, DOCX_SPEC.stats.columns[0], DOCX_SPEC.stats.height, 'FD'); doc.setTextColor(...rgb(DOCX_SPEC.colors.ink)); text(doc, String(v), x + DOCX_SPEC.stats.columns[0] / 2, y + 22, DOCX_SPEC.stats.numberSize, DOCX_SPEC.colors.ink, 'times', 'bold', 'center'); doc.setTextColor(...rgb(DOCX_SPEC.colors.ink)); text(doc, l, x + DOCX_SPEC.stats.columns[0] / 2, y + 34, DOCX_SPEC.stats.labelSize, DOCX_SPEC.colors.ink, 'helvetica', 'bold', 'center') }); y += 61
  heading(doc, '4. ASSETS DEPLOYED', y); y += 10; const columns = [['ASSET', 103], ['CLASS', 70], ['PLANNED', 45], ['DEPLOYED', 50], ['RETURNED', 50], ['DAMAGED', 48], ['LOST', 38], ['STATUS', 98]] as const; doc.setFillColor(...rgb(DOCX_SPEC.assets.headerFill)); doc.rect(55, y, 502, DOCX_SPEC.assets.headerHeight, 'F'); let x = 55; columns.forEach(([label, w], i) => { text(doc, label, i >= 2 ? x + w / 2 : x + 6, y + 14, DOCX_SPEC.assets.headerSize, DOCX_SPEC.colors.white, 'helvetica', 'bold', i >= 2 ? 'center' : 'left'); x += w }); y += DOCX_SPEC.assets.headerHeight
  data.rows.forEach(row => { x = 55; doc.setDrawColor(...rgb(DOCX_SPEC.assets.borderColor)); doc.setLineWidth(DOCX_SPEC.assets.borderWidth); doc.line(55, y + DOCX_SPEC.assets.rowHeight, 557, y + DOCX_SPEC.assets.rowHeight); const values = [row.asset, row.className, `${row.planned}`, `${row.deployed}`, `${row.returned}`, `${row.damaged}`, `${row.lost}`, statusFor(row).label]; values.forEach((v, i) => { const w = columns[i][1]; const center = i >= 2; text(doc, v, center ? x + w / 2 : x + 6, y + 16, i === 7 ? DOCX_SPEC.assets.statusSize : DOCX_SPEC.assets.bodySize, i === 7 ? statusFor(row).color : DOCX_SPEC.colors.ink, 'helvetica', i === 7 ? 'bold' : 'normal', center ? 'center' : 'left'); x += w }); y += DOCX_SPEC.assets.rowHeight })
  footer(doc, data.reference); doc.putTotalPages('{total_pages_count_string}'); doc.save(`Lumiere_Event_Asset_Logistics_Report_${safeReference(data.reference)}.pdf`)
}

export { DOCX_SPEC }
// DOCX_SPEC defaults: unspecified run properties inherit Calibri 10.5 pt and #2B211A from styles.xml docDefaults; explicit report values above override those defaults.
// STYLE SPEC: Letter 612x792 pt; margins 57.5/55/57.5/55; header/footer 35.4; title 28 pt Times bold centered; strip 167.333x42 pt, 7 pt margins, #F7F0E6 fill, #D9CBAE 0.45 pt borders; headings 10 pt Helvetica bold #8B6F47 with #D9CBAE 0.55 pt bottom hairline; info 4x3 at 125.5x39 pt, 7 pt margins, 6.5 pt labels/#6E6153 and 8 pt values; stats 6x42 at 83.666 pt, 17 pt Times numbers, 5.8 pt labels; assets widths 103/70/45/50/50/48/38/98, 21 pt header, 25 pt rows, 6/7 pt text, centered numeric columns; overview 8.5 pt italic #2B211A, 11 pt leading; footer 7 pt #6E6153 with 0.55 pt hairline and right tab at 502 pt.
// The DOCX's four summary values (42/42/40/1/1/0) differ from the row-derived values; this export intentionally uses computed totals 42/42/41/2/1/0.
// DOCX footer uses PAGE n / N; jsPDF replaces the total-page token at save time.
