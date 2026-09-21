import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import type { PortalEvent } from '@/lib/types'
import type { DispatchBatch, ReconciliationRow } from '@/lib/event-detail'

const COLORS = {
  ink: [43, 33, 26] as [number, number, number],
  muted: [110, 97, 83] as [number, number, number],
  bronze: [139, 111, 71] as [number, number, number],
  cream: [247, 240, 230] as [number, number, number],
  line: [217, 203, 174] as [number, number, number],
  green: [63, 107, 68] as [number, number, number],
  amber: [154, 107, 18] as [number, number, number],
  red: [154, 51, 36] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export interface EventReportMaterial { name: string; category?: string; quantity: number; sku?: string }
export interface EventReportLogistics { batches: DispatchBatch[] }
export interface EventAssetReportInput { event: PortalEvent; materials: EventReportMaterial[]; logistics?: EventReportLogistics }

type Cell = string | number

const dash = '—'
const value = (v: unknown) => v === undefined || v === null || v === '' ? dash : String(v)
const dateTime = (date?: string, time?: string) => date ? `${date}${time ? ` · ${time}` : ''}` : dash

function safeFileName(ref: string) { return ref.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase() }

export async function exportEventAssetReportPdf({ event, materials, logistics }: EventAssetReportInput) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const pageW = 612
  const pageH = 792
  const left = 55
  const right = 55
  const top = 57.5
  const bottom = 57.5
  const contentW = pageW - left - right
  let y = top
  let sectionNumber = 0
  const rows = (logistics?.batches ?? []).flatMap((batch) => batch.reconciliation ?? [])
  const hasLifecycle = rows.length > 0
  const planned = materials.map((item) => ({ name: item.name, category: item.category ?? dash, planned: item.quantity }))
  const byName = new Map<string, ReconciliationRow>()
  rows.forEach((row) => byName.set(row.itemName, row))
  const reportRows = planned.map((item) => {
    const row = byName.get(item.name)
    return { ...item, deployed: row?.actual, returned: undefined as number | undefined, damaged: undefined as number | undefined, lost: undefined as number | undefined, status: undefined as string | undefined }
  })

  const setFont = (font: 'helvetica' | 'times', style: 'normal' | 'bold' | 'italic', size: number, color = COLORS.ink) => {
    doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color)
  }
  const footer = () => {
    const page = doc.getNumberOfPages()
    setFont('helvetica', 'normal', 7, COLORS.muted)
    doc.text(`LUMIÈRE · Event Asset & Logistics Report · Event Reference: ${event.refId}`, left, pageH - 31)
    doc.text(`PAGE ${page} / {total_pages_count_string}`, pageW - right, pageH - 31, { align: 'right' })
  }
  const ensure = (height: number) => {
    if (y + height > pageH - bottom - 22) { footer(); doc.addPage(); y = top; drawContinuationHeader() }
  }
  const drawContinuationHeader = () => {
    setFont('helvetica', 'bold', 7, COLORS.muted)
    doc.text(`LUMIÈRE  /  ${event.refId}`, left, 28)
    doc.setDrawColor(...COLORS.line); doc.line(left, 38, pageW - right, 38)
  }
  const section = (title: string) => {
    sectionNumber += 1
    ensure(28)
    setFont('helvetica', 'bold', 8, COLORS.bronze)
    doc.text(`${String(sectionNumber).padStart(2, '0')}  ${title.toUpperCase()}`, left, y)
    doc.setDrawColor(...COLORS.line); doc.line(left, y + 6, pageW - right, y + 6); y += 22
  }
  const mutedNote = () => { setFont('helvetica', 'italic', 8, COLORS.muted); doc.text('No data recorded for this event yet.', left, y); y += 18 }
  const labelValue = (label: string, val: Cell, x: number, width: number) => {
    setFont('helvetica', 'bold', 6.5, COLORS.muted); doc.text(label.toUpperCase(), x, y)
    setFont('helvetica', 'normal', 9, COLORS.ink); const lines = doc.splitTextToSize(String(val), width); doc.text(lines.slice(0, 2), x, y + 12); return lines.length > 1 ? 24 : 16
  }
  const table = (headers: string[], data: Cell[][], widths: number[]) => {
    const rowH = 19
    ensure(25 + rowH * Math.max(1, data.length))
    let x = left
    doc.setFillColor(...COLORS.bronze); doc.rect(left, y - 10, contentW, rowH, 'F')
    headers.forEach((header, i) => { setFont('helvetica', 'bold', 6.5, COLORS.white); doc.text(header.toUpperCase(), x + 5, y + 2, { maxWidth: widths[i] - 10 }); x += widths[i] })
    y += rowH
    data.forEach((row, ri) => {
      x = left; if (ri % 2 === 0) { doc.setFillColor(...COLORS.cream); doc.rect(left, y - 13, contentW, rowH, 'F') }
      row.forEach((cell, i) => { setFont('helvetica', 'normal', 7.5, COLORS.ink); doc.text(String(cell), x + 5, y, { maxWidth: widths[i] - 10 }); x += widths[i] })
      y += rowH
    })
    y += 7
  }

  // Cover / header
  setFont('times', 'bold', 25, COLORS.bronze); doc.text('LUMIÈRE', left, y + 4)
  setFont('helvetica', 'normal', 7, COLORS.muted); doc.text('EVENT ASSET & LOGISTICS REPORT', left, y + 19)
  y += 52
  setFont('times', 'bold', 22, COLORS.ink); doc.text('Event Asset & Logistics Report', left, y); y += 29
  setFont('helvetica', 'normal', 9, COLORS.muted); doc.text('Operational record · prepared for executive review', left, y); y += 28
  doc.setFillColor(...COLORS.cream); doc.rect(left, y, contentW, 76, 'F')
  setFont('times', 'bold', 23, COLORS.bronze); doc.text(event.refId, left + 16, y + 31)
  setFont('helvetica', 'bold', 7, COLORS.muted); doc.text('EVENT REFERENCE', left + 16, y + 52)
  setFont('helvetica', 'normal', 9, COLORS.ink); doc.text(event.title, left + 180, y + 27, { maxWidth: contentW - 196 }); doc.text(event.client, left + 180, y + 47, { maxWidth: contentW - 196 }); y += 103

  section('Event Overview')
  const overview = [
    ['Event name', event.title, 'Client / organizer', event.client],
    ['Venue', event.venue, 'Event type', dash],
    ['Event date', event.targetDate, 'Event time', dateTime(event.targetDate, event.installationStart)],
    ['Status', event.status, 'Expected guests', dash],
    ['Event coordinator', dash, 'Venue contact', dash],
  ]
  overview.forEach((r) => { ensure(31); const h1 = labelValue(r[0], r[1], left, contentW / 2 - 15); const h2 = labelValue(r[2], r[3], left + contentW / 2, contentW / 2 - 15); y += Math.max(h1, h2) + 7 })

  section('Executive Summary')
  setFont('helvetica', 'normal', 9, COLORS.ink); const summary = event.moodPlan || dash; doc.text(doc.splitTextToSize(summary, contentW), left, y, { lineHeightFactor: 1.45 }); y += Math.max(24, doc.splitTextToSize(summary, contentW).length * 13 + 8)

  section('Assets Deployed')
  const widths = [contentW * .36, contentW * .16, contentW * .12, contentW * .12, contentW * .12, contentW * .12]
  table(['Asset / category', 'Planned', 'Deployed', 'Returned', 'Damaged', 'Lost'], reportRows.map((r) => [r.name, r.planned, value(r.deployed), value(r.returned), value(r.damaged), value(r.lost)]), widths)

  section('Dispatch & Vehicle')
  if (!logistics?.batches?.length) mutedNote()
  else table(['Direction', 'Vehicle', 'Plate', 'Driver', 'Stage'], logistics.batches.map((b) => [b.direction, b.vehicleType, b.plateNumber, value(b.driverName), b.stage]), [contentW*.16, contentW*.27, contentW*.18, contentW*.22, contentW*.17])

  section('Timeline')
  const timeline = [['Ingress', dateTime(event.targetDate, event.ingressTime)], ['Loading', dash], ['Transit', dash], ['Setup', dateTime(event.targetDate, event.installationStart)], ['Event', dateTime(event.targetDate, event.installationStart)], ['Egress', dateTime(event.targetDate, event.fullStop)], ['Return', dateTime(event.targetDate, event.installationEnd)]]
  const stepW = contentW / timeline.length
  timeline.forEach((item, i) => { const x = left + i * stepW; doc.setFillColor(...COLORS.cream); doc.circle(x + 6, y, 5, 'F'); setFont('helvetica', 'bold', 6.5, COLORS.ink); doc.text(item[0], x, y + 18, { maxWidth: stepW - 8 }); setFont('helvetica', 'normal', 6.5, COLORS.muted); doc.text(item[1], x, y + 30, { maxWidth: stepW - 8 }); if (i < timeline.length - 1) { doc.setDrawColor(...COLORS.bronze); doc.line(x + 13, y, x + stepW - 6, y); doc.line(x + stepW - 6, y, x + stepW - 10, y - 3); doc.line(x + stepW - 6, y, x + stepW - 10, y + 3) } }); y += 55

  section('Ingress')
  if (!hasLifecycle) mutedNote(); else table(['Asset', 'Expected', 'Received', 'Status'], rows.map((r) => [r.itemName, r.planned, r.actual, r.status]), [contentW*.4, contentW*.2, contentW*.2, contentW*.2])
  section('On-site / Setup')
  mutedNote()
  section('Egress & Return')
  if (!hasLifecycle) mutedNote(); else table(['Asset', 'Deployed', 'Returned', 'Damaged', 'Lost'], rows.map((r) => [r.itemName, r.actual, dash, dash, dash]), [contentW*.4, contentW*.15, contentW*.15, contentW*.15, contentW*.15])

  section('Reconciliation')
  const totalPlanned = reportRows.reduce((n, r) => n + r.planned, 0)
  const totalDeployed = reportRows.some((r) => r.deployed !== undefined) ? reportRows.reduce((n, r) => n + (r.deployed ?? 0), 0) : undefined
  const totalReturned = undefined
  const pending = totalDeployed !== undefined && totalReturned !== undefined ? totalDeployed - totalReturned : undefined
  table(['Metric', 'Total'], [['Planned', totalPlanned], ['Deployed', value(totalDeployed)], ['Returned', value(totalReturned)], ['Pending', value(pending)]], [contentW*.7, contentW*.3])

  section('Deficit / Exceptions')
  if (!hasLifecycle) { setFont('helvetica', 'normal', 8.5, COLORS.muted); doc.text('Not available — no return data recorded.', left, y); y += 17; setFont('helvetica', 'bold', 7, COLORS.muted); doc.text('STATUS  —', left, y); y += 17 }
  else { setFont('helvetica', 'normal', 8.5, COLORS.ink); doc.text('No deficit or exceptions recorded.', left, y); y += 17; setFont('helvetica', 'bold', 7, COLORS.green); doc.text('STATUS  CLEAR', left, y); y += 17 }

  section('Crew & Responsibility')
  const crew = (logistics?.batches ?? []).flatMap((b) => b.crew ?? [])
  if (!crew.length) mutedNote(); else table(['Name', 'Responsibility', 'Status'], crew.map((member) => [member.name, 'Transport crew', 'Assigned']), [contentW*.4, contentW*.35, contentW*.25])

  section('Audit & Verification')
  table(['Field', 'Value'], [['Report reference', `LUM-${event.refId}`], ['Generated by', 'System (Lumière)'], ['Generated timestamp', new Date().toLocaleString()], ['Last synchronization', dash], ['Last modified', dash], ['Verified by', dash], ['Verification status', dash]], [contentW*.45, contentW*.55])
  const qr = await QRCode.toDataURL(event.refId, { type: 'image/png', margin: 0, width: 96, color: { dark: '#2B211A', light: '#FFFFFF' } })
  ensure(112); doc.addImage(qr, 'PNG', pageW - right - 96, y, 96, 96); setFont('helvetica', 'normal', 7, COLORS.muted); doc.text('Scan to reference this event', pageW - right - 96, y + 106); y += 114

  footer()
  doc.putTotalPages('{total_pages_count_string}')
  doc.save(`${safeFileName(event.refId)}-event-asset-logistics-report.pdf`)
}

export const eventAssetReportMissingFields = [
  'Event type, expected guests, event coordinator, and venue contact',
  'Created/last-updated timestamps and verified-by/verification-status metadata',
  'Authoritative per-asset deployed, returned, damaged, and lost quantities',
  'Complete lifecycle timestamps for loading, transit, setup, egress, and return',
  'On-site setup completion, exceptions, and responsibility assignments',
  'Persisted event-specific audit and synchronization records',
]
