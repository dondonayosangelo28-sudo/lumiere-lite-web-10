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

export function downloadPdfReport({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: {
  filename: string
  title: string
  subtitle: string
  columns: string[]
  rows: PdfRow[]
}) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 34
  const frameX = 22
  const frameY = 28
  const frameW = pageWidth - 44
  const frameH = pageHeight - 56
  const width = pageWidth - margin * 2
  const rowHeight = columns.length > 8 ? 30 : 25
  const weights = columns.map((_, index) => (index === 0 ? 1.35 : index === columns.length - 1 ? 1.2 : 1))
  const weightTotal = weights.reduce((sum, value) => sum + value, 0)
  const widths = weights.map((value) => (value / weightTotal) * width)
  let y = 42

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('LUMIÈRE  /  OPERATIONS REPORT', margin, 26)
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, 32, pageWidth - margin, 32)
  }

  const drawFooter = (page: number, totalPages: number) => {
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, pageHeight - 39, pageWidth - margin, pageHeight - 39)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...BRAND.MUTED)
    doc.text('Lumière Management System · Confidential Operations Report', margin, pageHeight - 25)
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 25, { align: 'right' })
  }

  const drawTableHeader = () => {
    doc.setFillColor(...BRAND.CARD_BG)
    doc.rect(margin, y, width, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(columns.length > 8 ? 6.5 : 7)
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

  const drawRow = (row: PdfRow, index: number) => {
    if (index % 2 === 1) {
      doc.setFillColor(...BRAND.ZEBRA_BG)
      doc.rect(margin, y, width, rowHeight, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(columns.length > 8 ? 6.5 : 7.5)
    doc.setTextColor(...BRAND.FOREGROUND)
    let x = margin
    row.forEach((value, cellIndex) => {
      doc.text(String(value ?? '—'), x + 6, y + rowHeight - 9, { maxWidth: widths[cellIndex] - 12 })
      x += widths[cellIndex]
    })
    doc.setDrawColor(...BRAND.BORDER)
    doc.line(margin, y + rowHeight, margin + width, y + rowHeight)
    y += rowHeight
  }

  doc.setDrawColor(...BRAND.BORDER)
  doc.setLineWidth(0.7)
  doc.roundedRect(frameX, frameY, frameW, frameH, 5, 5, 'S')
  doc.setFillColor(...BRAND.PRIMARY)
  doc.rect(margin, y, 4, 70, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.PRIMARY)
  doc.text('LUMIÈRE', margin + 14, y + 15)
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...BRAND.FOREGROUND)
  doc.text(title.toUpperCase(), margin + 14, y + 39, { maxWidth: width - 28 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.MUTED)
  doc.text(subtitle, margin + 14, y + 57, { maxWidth: width - 28 })
  y += 92
  doc.setFontSize(7.5)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
  y += 18
  drawTableHeader()

  rows.forEach((row, index) => {
    if (y + rowHeight > pageHeight - 55) {
      doc.addPage()
      y = 42
      drawRunningHeader()
      y += 20
      drawTableHeader()
    }
    drawRow(row, index)
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
