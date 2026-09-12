import * as XLSX from 'xlsx'

// ---------- Excel: a full multi-sheet workbook built from whatever
// tables/summary/raw-data you hand it. Nothing here is hardcoded to a
// specific chart, so the dashboard can add more tables later without
// touching this file.
export function exportStatsExcel({ filename, filtersApplied, kpis, tables, rawSheets }) {
  const wb = XLSX.utils.book_new()

  const summaryRows = [
    { Section: 'Filters applied' },
    ...filtersApplied.map((f) => ({ Section: f })),
    {},
    { Section: 'Key figures' },
    ...kpis.map((k) => ({ Section: k.label, Value: k.value })),
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows, { skipHeader: true }), 'Summary')

  tables.forEach(({ name, rows }) => {
    if (!rows.length) return
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name.slice(0, 31))
  })

  rawSheets.forEach(({ name, rows }) => {
    if (!rows.length) return
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name.slice(0, 31))
  })

  XLSX.writeFile(wb, filename)
}

// ---------- PDF: snapshots a DOM node (the printable report) into a
// multi-page, properly paginated PDF, with a coloured cover/header and a
// footer naming the filters + generation date on every page.
export async function exportStatsPdf({ node, title, subtitle, filtersApplied }) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 28
  const headerH = 74
  const footerH = 24
  const usableW = pageW - margin * 2
  const usableH = pageH - headerH - footerH - margin

  const imgW = usableW
  const imgH = (canvas.height * imgW) / canvas.width
  const pxPerPt = canvas.width / imgW // canvas px per output pt
  const pageSlicePx = usableH * pxPerPt

  const totalPages = Math.max(1, Math.ceil(canvas.height / pageSlicePx))
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) pdf.addPage()

    // header band
    pdf.setFillColor(20, 82, 74) // --teal
    pdf.rect(0, 0, pageW, headerH, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(17)
    pdf.text(title, margin, 34)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(subtitle, margin, 52)
    pdf.setFontSize(9)
    pdf.text(`Page ${p + 1} of ${totalPages}`, pageW - margin, 34, { align: 'right' })

    // slice of the canvas for this page
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    const remainingPx = canvas.height - p * pageSlicePx
    const thisSlicePx = Math.min(pageSlicePx, remainingPx)
    sliceCanvas.height = thisSlicePx
    const ctx = sliceCanvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
    ctx.drawImage(canvas, 0, p * pageSlicePx, canvas.width, thisSlicePx, 0, 0, canvas.width, thisSlicePx)
    const sliceImg = sliceCanvas.toDataURL('image/png')
    const sliceH = (thisSlicePx * imgW) / canvas.width

    pdf.addImage(sliceImg, 'PNG', margin, headerH + margin / 2, imgW, sliceH, undefined, 'FAST')

    // footer
    pdf.setTextColor(90, 95, 90)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const footerText = `Generated ${now} · ${filtersApplied.join(' · ')}`
    pdf.text(footerText, margin, pageH - 10)
  }

  pdf.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
