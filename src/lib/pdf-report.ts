import jsPDF from 'jspdf'

type PdfRow = Array<string | number>

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
  const margin = 42
  const usableWidth = pageWidth - margin * 2
  const headerHeight = 86
  const rowHeight = 22
  const columnWidths = columns.map((_, index) => {
    const weight = index === 0 ? 1.35 : index === columns.length - 1 ? 1.2 : 1
    return weight
  })
  const widthTotal = columnWidths.reduce((sum, value) => sum + value, 0)
  const widths = columnWidths.map((value) => (value / widthTotal) * usableWidth)

  const drawHeader = () => {
    doc.setFillColor(25, 24, 22)
    doc.rect(0, 0, pageWidth, headerHeight, 'F')
    doc.setTextColor(245, 241, 233)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text(title, margin, 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(190, 182, 171)
    doc.text(subtitle, margin, 56)
    doc.text(`Generated ${new Date().toLocaleString()}`, margin, 71)
  }

  const drawTableHeader = (y: number) => {
    doc.setFillColor(221, 184, 132)
    doc.rect(margin, y, usableWidth, rowHeight, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(36, 31, 26)
    let x = margin
    columns.forEach((column, index) => {
      doc.text(column, x + 6, y + 14, { maxWidth: widths[index] - 12 })
      x += widths[index]
    })
  }

  const drawRow = (row: PdfRow, y: number, index: number) => {
    doc.setFillColor(index % 2 === 0 ? 250 : 243, index % 2 === 0 ? 248 : 239, index % 2 === 0 ? 244 : 232)
    doc.rect(margin, y, usableWidth, rowHeight, 'F')
    doc.setDrawColor(224, 218, 208)
    doc.line(margin, y + rowHeight, margin + usableWidth, y + rowHeight)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(55, 51, 46)
    let x = margin
    row.forEach((value, cellIndex) => {
      doc.text(String(value ?? '—'), x + 6, y + 14, { maxWidth: widths[cellIndex] - 12 })
      x += widths[cellIndex]
    })
  }

  drawHeader()
  let y = headerHeight + 24
  drawTableHeader(y)
  y += rowHeight
  rows.forEach((row, index) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage()
      drawHeader()
      y = headerHeight + 24
      drawTableHeader(y)
      y += rowHeight
    }
    drawRow(row, y, index)
    y += rowHeight
  })

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(125, 117, 106)
    doc.text(`Lumiere · Page ${page} of ${totalPages}`, margin, pageHeight - 18)
  }
  doc.save(filename)
}
