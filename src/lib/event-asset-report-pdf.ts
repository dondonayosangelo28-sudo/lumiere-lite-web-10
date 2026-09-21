import jsPDF from 'jspdf'
import type { PortalEvent } from '@/lib/types'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const LEFT = 55
const RIGHT = 55
const TOP = 57.5
const BOTTOM = 57.5

function safeReference(ref: string) {
  return ref.replace(/[^A-Za-z0-9_-]/g, '_') || 'event'
}

function formatGeneratedAt(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export async function exportEventAssetLogisticsReport(
  event: PortalEvent,
  isExecutive: boolean,
): Promise<void> {
  if (!isExecutive) return

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' })
  const brown: [number, number, number] = [43, 33, 26]
  const bronze: [number, number, number] = [139, 111, 71]
  const muted: [number, number, number] = [110, 97, 83]
  const beige: [number, number, number] = [217, 203, 174]

  doc.setTextColor(...brown)
  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.text('LUMIÈRE', LEFT, TOP + 28)

  doc.setTextColor(...bronze)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('EVENT ASSET & LOGISTICS REPORT', LEFT, TOP + 58)

  doc.setTextColor(...muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Event Reference: ${event.refId}`, LEFT, TOP + 100)
  doc.text(`Event Title: ${event.title}`, LEFT, TOP + 118)
  doc.text(`Generated: ${formatGeneratedAt()}`, LEFT, TOP + 136)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.text('Layout coming in the next step.', LEFT, TOP + 178)

  doc.setDrawColor(...beige)
  doc.setLineWidth(0.5)
  doc.line(LEFT, PAGE_HEIGHT - BOTTOM - 18, PAGE_WIDTH - RIGHT, PAGE_HEIGHT - BOTTOM - 18)
  doc.setTextColor(...muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('PAGE 1 / 1', PAGE_WIDTH - RIGHT, PAGE_HEIGHT - BOTTOM, { align: 'right' })

  doc.save(`Lumiere_Event_Asset_Logistics_Report_${safeReference(event.refId)}.pdf`)
}

