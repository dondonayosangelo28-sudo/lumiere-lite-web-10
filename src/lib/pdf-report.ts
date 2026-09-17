import jsPDF from 'jspdf'

type PdfRow = Array<string | number | null | undefined>

const BRAND = {
  PRIMARY: [155, 107, 63] as [number, number, number],
  FOREGROUND: [39, 37, 34] as [number, number, number],
  MUTED: [117, 111, 103] as [number, number, number],
  CARD_BG: [251, 248, 242] as [number, number, number],
  BORDER: [216, 206, 192] as [number, number, number],
  ZEBRA_BG: [253, 251, 247] as [number, number, number],
}

// Deterministic short reference code for a report, e.g. LUM-RPT-2026-09
function makeReference(title: string): string {
  const now = new Date()
  const initials = title
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  return `LUM-${initials || 'RPT'}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function downloadPdfReport({
  filename,
  title,
  subtitle,
  columns,
  rows,
  signatories,
}: {
  filename: string
  title: string
  subtitle: string
  columns: string[]
  rows: PdfRow[]
  signatories?: Array<{ role: string; org: string; note: string }>
}) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const width = pageWidth - margin * 2
  const rowHeight = columns.length > 8 ? 30 : 25
  const weights = columns.map((_, index) => (index === 0 ? 1.35 : index === columns.length - 1 ? 1.2 : 1))
  const weightTotal = weights.reduce((sum, value) => sum + value, 0)
  const widths = weights.map((value) => (value / weightTotal) * width)
  let y = 50

  const drawFrame = () => {
    doc.setDrawColor(...BRAND.BORDER)
    doc.setLineWidth(1.1)
    doc.roundedRect(22, 28, pageWidth - 44, pageHeight - 56, 5, 5, 'S')
  }

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text(`LUMIÈRE  /  ${title.toUpperCase()}`, margin, 26)
  }

  const drawFooter = (page: number, totalPages: number) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('Lumière Management System · Confidential Operations Report', margin, pageHeight - 12)
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' })
  }

  const drawTableHeader = () => {
    doc.setFillColor(...BRAND.CARD_BG)
    doc.rect(margin, y, width, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.PRIMARY)
    let x = margin
    columns.forEach((column, index) => {
      doc.text(column.toUpperCase(), x + 6, y + rowHeight - 9, { maxWidth: widths[index] - 12 })
      x += widths[index]
    })
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, y + rowHeight, margin + width, y + rowHeight)
    y += rowHeight
  }

  const ensureSpace = (height: number, continueTable = true) => {
    if (y + height > pageHeight - 76) {
      doc.addPage()
      drawFrame()
      y = 50
      drawRunningHeader()
      y += 20
      if (continueTable) drawTableHeader()
    }
  }

  const drawRow = (row: PdfRow, index: number) => {
    const fontSize = columns.length > 8 ? 6.5 : 7.5
    const lineH = fontSize + 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    const cells = row.map((value, cellIndex) => doc.splitTextToSize(String(value ?? '—'), Math.max(18, widths[cellIndex] - 12)))
    const height = Math.max(rowHeight, Math.min(58, Math.max(...cells.map((cell) => cell.length)) * lineH + 10))
    ensureSpace(height)
    if (index % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, y, width, height, 'F')
    }
    doc.setTextColor(...BRAND.FOREGROUND)
    let x = margin
    cells.forEach((cell, cellIndex) => {
      doc.text(cell, x + 6, y + 12, { maxWidth: widths[cellIndex] - 12, lineHeightFactor: 1.15 })
      x += widths[cellIndex]
    })
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, y + height, margin + width, y + height)
    y += height
  }

  drawFrame()
  doc.setFillColor(...BRAND.PRIMARY)
  doc.rect(margin, y, 4, 70, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.PRIMARY)
  doc.text('LUMIÈRE', margin + 14, y + 15)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...BRAND.MUTED)
  doc.text('EVENT OPERATIONS & ASSET MANAGEMENT', margin + 14, y + 28)
  doc.setFont('times', 'bold')
  doc.setFontSize(19)
  doc.setTextColor(...BRAND.FOREGROUND)
  doc.text(title.toUpperCase(), margin + 14, y + 54, { maxWidth: width - 28 })
  y += 84

  // Metadata strip: Document Reference / Report Date / Classification, matching the Lumière report templates
  y += 6
  const metaFields = [
    { label: 'Document Reference', value: makeReference(title) },
    { label: 'Report Date', value: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }) },
    { label: 'Classification', value: 'Verified Official Record' },
  ]
  const metaCellW = width / metaFields.length
  const metaBoxHeight = 42
  doc.setFillColor(...BRAND.CARD_BG)
  doc.setDrawColor(...BRAND.BORDER)
  doc.setLineWidth(0.75)
  doc.roundedRect(margin, y, width, metaBoxHeight, 4, 4, 'FD')
  metaFields.forEach((field, index) => {
    const x = margin + index * metaCellW
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...BRAND.MUTED)
    doc.text(field.label.toUpperCase(), x + 10, y + 15, { maxWidth: metaCellW - 20 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.FOREGROUND)
    const valueLines = doc.splitTextToSize(field.value, metaCellW - 20)
    doc.text(valueLines.slice(0, 2), x + 10, y + 30, { maxWidth: metaCellW - 20, lineHeightFactor: 1.05 })
  })
  y += metaBoxHeight + 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.MUTED)
  const subtitleLines = doc.splitTextToSize(subtitle, width - 12)
  doc.text(subtitleLines, margin + 6, y, { maxWidth: width - 12, lineHeightFactor: 1.15 })
  y += subtitleLines.length * 9 + 4
  doc.setDrawColor(...BRAND.BORDER)
  doc.line(margin, y, pageWidth - margin, y)
  y += 15

  drawTableHeader()

  rows.forEach((row, index) => {
    drawRow(row, index)
  })

  // Certification / attestation statement + dual signature blocks, matching the Lumière report templates
  const finalSignatories = signatories ?? [
    { role: 'System Administrator / Auditor', org: 'Lumière Asset & Event Management Platform', note: 'Generated & Verified' },
    { role: 'Operations Manager / Warehouse Lead', org: 'Lumière Facilities & Logistics', note: 'Verified & Received' },
  ]
  ensureSpace(130, false)
  doc.setDrawColor(...BRAND.BORDER)
  doc.line(margin, y, pageWidth - margin, y)
  y += 16
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.FOREGROUND)
  const attestation = doc.splitTextToSize(
    `"I hereby certify that the numerical metrics, records, and log entries presented in this ${title.toLowerCase()} have been extracted directly from the verified database records of the Lumière platform."`,
    width - 10,
  )
  doc.text(attestation, margin, y, { maxWidth: width - 10 })
  y += attestation.length * 11 + 22

  const sigColW = width / finalSignatories.length
  finalSignatories.forEach((sig, index) => {
    const x = margin + index * sigColW
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(x, y, x + sigColW - 24, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text(sig.role.toUpperCase(), x, y + 13, { maxWidth: sigColW - 24 })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND.FOREGROUND)
    doc.text(sig.org, x, y + 26, { maxWidth: sigColW - 24 })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.PRIMARY)
    doc.text(sig.note, x, y + 38, { maxWidth: sigColW - 24 })
  })

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawRunningHeader()
    drawFooter(page, totalPages)
  }
  doc.save(filename)
}

export type { PdfRow }

export default downloadPdfReport
