import { jsPDF } from 'jspdf'
import type { CommercialLine, ConsolidatedMaterial, QuoteTotals } from '../../engine/consolidation'
import type { ProjectState } from '../../project/types'

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const qty = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)

export function generateProjectPdf(project: ProjectState, materials: ConsolidatedMaterial[], lines: CommercialLine[], totals: QuoteTotals): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const green: [number, number, number] = [8, 117, 72]
  const dark: [number, number, number] = [24, 50, 41]
  const muted: [number, number, number] = [91, 111, 102]
  const pageW = 210
  const margin = 14
  const contentW = pageW - margin * 2
  let y = 15

  function ensure(height = 16) {
    if (y + height > 282) {
      doc.addPage()
      y = 15
    }
  }

  function text(value: string, x: number, yy: number, size = 9, bold = false, color = dark, maxWidth?: number) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    if (maxWidth) doc.text(String(value), x, yy, { maxWidth })
    else doc.text(String(value), x, yy)
  }

  function line(yy: number) {
    doc.setDrawColor(220, 231, 225)
    doc.line(margin, yy, pageW - margin, yy)
  }

  text('IMPERTUDO', margin, y + 5, 20, true, green)
  text('PROPOSTA / RESUMO DE MATERIAIS • V9.0', margin, y + 12, 9, true, dark)
  text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, pageW - margin - 52, y + 5, 7, false, muted)
  y += 20
  line(y)
  y += 7

  const projectName = project.projectName || 'Obra não informada'
  text(projectName, margin, y, 14, true, dark, contentW)
  y += 6
  const meta = [
    project.client && `Cliente: ${project.client}`,
    project.location && `Local: ${project.location}`,
    project.consultant && `Responsável: ${project.consultant}`,
    `Validade: ${project.validityDays} dia(s)`
  ].filter(Boolean).join(' • ')
  text(meta, margin, y, 8, false, muted, contentW)
  y += 10

  text('QUANTITATIVO CONSOLIDADO', margin, y, 10, true, green)
  y += 6
  for (const material of materials) {
    ensure(18)
    doc.setFillColor(244, 249, 246)
    doc.roundedRect(margin, y - 3, contentW, 14, 2, 2, 'F')
    text(material.productName, margin + 3, y + 1, 9, true, dark, 92)
    const technical = material.minQuantity === material.maxQuantity
      ? `${qty(material.maxQuantity)} ${material.unit}`
      : `${qty(material.minQuantity)} a ${qty(material.maxQuantity)} ${material.unit}`
    text(`Necessidade: ${technical}`, 108, y + 1, 7, false, muted)
    const mix = material.recommendedMix?.items.map((item) => `${item.count} × ${item.package.quantity} ${item.package.unit}`).join(' + ')
    text(mix ? `Compra recomendada: ${mix}` : 'Embalagem comercial ainda não definida.', 108, y + 6, 7, true, dark, 84)
    y += 18
  }

  ensure(18)
  text('CONDIÇÕES COMERCIAIS', margin, y, 10, true, green)
  y += 7

  if (lines.length) {
    for (const row of lines) {
      ensure(14)
      text(row.productName, margin, y, 8, true, dark, 77)
      text(`${row.count} × ${row.packageLabel}`, 92, y, 7, false, muted, 55)
      text(money(row.unitPrice), 151, y, 7, false, dark)
      text(money(row.net), pageW - margin, y, 8, true, dark)
      doc.text('', 0, 0)
      line(y + 3)
      y += 8
    }
  } else {
    text('Nenhum item comercial consolidado.', margin, y, 8, false, muted)
    y += 8
  }

  ensure(55)
  const rows: Array<[string, number, boolean]> = [
    ['Total de tabela', totals.gross, false],
    ['Descontos comerciais dos itens', totals.itemDiscount, false],
    ['Base após descontos dos itens', totals.netBase, true],
    [`Desconto adicional PIX/Dinheiro (${qty(totals.cashDiscountPct)}%)`, totals.cashDiscount, false],
    ['PIX / Dinheiro', totals.cashTotal, true],
    ['Cartão (sem desconto adicional à vista)', totals.cardTotal, true]
  ]
  for (const [label, value, bold] of rows) {
    text(label, margin, y, 8, bold, bold ? dark : muted)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 10 : 8)
    doc.setTextColor(...(bold ? green : dark))
    doc.text(money(value), pageW - margin, y, { align: 'right' })
    y += 7
  }

  y += 2
  text(`Forma selecionada: ${project.paymentMethod === 'cartao' ? 'Cartão' : project.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'PIX'} — ${money(totals.selectedTotal)}`, margin, y, 10, true, green)
  y += 9

  if (project.notes) {
    ensure(20)
    text('Observações comerciais', margin, y, 8, true, dark)
    y += 5
    const noteLines = doc.splitTextToSize(project.notes, contentW)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4 + 4
  }

  ensure(20)
  line(y)
  y += 6
  text('Pré-dimensionamento técnico. Conferir ficha técnica vigente, projeto, condições reais da obra e medidas in loco antes da compra e execução.', margin, y, 7, false, muted, contentW)

  const safe = projectName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
  doc.save(`impertudo-v9-${safe || 'projeto'}.pdf`)
}
