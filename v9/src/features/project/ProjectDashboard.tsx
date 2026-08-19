import { useEffect, useMemo, useState } from 'react'
import { buildCommercialLines, calculateQuoteTotals, consolidateCalculations, packageLabel } from '../../engine/consolidation'
import { mergePricingWithCatalog } from '../../pricing/catalog'
import { useProject } from '../../project/ProjectContext'
import { generateProjectPdf } from './pdf'

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const qty = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
const checklistItems = [
  ['base-clean', 'Base limpa e sem material solto'],
  ['substrate-integrity', 'Substrato íntegro e falhas relevantes avaliadas'],
  ['cracks-treated', 'Fissuras, juntas e passagens verificadas'],
  ['regularization', 'Regularização e caimentos conferidos quando aplicável'],
  ['details', 'Ralos, tubos, rodapés e encontros detalhados'],
  ['measurements', 'Medidas revisadas in loco']
] as const

export default function ProjectDashboard() {
  const {
    project,
    priceCatalog,
    updateMeta,
    removeCalculation,
    updatePricing,
    updateCatalogPrice,
    applyCatalogToCurrentProject,
    setCashDiscountPct,
    setPaymentMethod,
    setChecklistItem,
    resetProject
  } = useProject()
  const [copyStatus, setCopyStatus] = useState('')
  const [priceStatus, setPriceStatus] = useState('')
  const materials = useMemo(() => consolidateCalculations(project.calculations), [project.calculations])
  const effectivePricing = useMemo(() => mergePricingWithCatalog(project.pricing, priceCatalog), [project.pricing, priceCatalog])
  const lines = useMemo(() => buildCommercialLines(materials, effectivePricing), [materials, effectivePricing])
  const totals = useMemo(() => calculateQuoteTotals(lines, project.cashDiscountPct, project.paymentMethod), [lines, project.cashDiscountPct, project.paymentMethod])
  const checklistDone = checklistItems.filter(([key]) => project.checklist[key]).length

  useEffect(() => {
    const missing = lines
      .filter((line) => line.unitPrice > 0 && !(project.pricing[line.key]?.unitPrice > 0))
      .map((line) => line.key)
    if (missing.length) applyCatalogToCurrentProject(missing, true)
  }, [lines, project.pricing, applyCatalogToCurrentProject])

  function proposalText() {
    const heading = `IMPERTUDO - PROPOSTA / RESUMO DE MATERIAIS\n${project.projectName || 'Obra não informada'}`
    const meta = [project.client && `Cliente: ${project.client}`, project.location && `Local: ${project.location}`, project.consultant && `Responsável: ${project.consultant}`].filter(Boolean).join('\n')
    const itemText = lines.map((line, index) => `${index + 1}. ${line.productName}\n${line.count} × ${line.packageLabel} × ${money(line.unitPrice)} = ${money(line.net)}`).join('\n\n')
    const commercial = `Total de tabela: ${money(totals.gross)}\nDescontos dos itens: ${money(totals.itemDiscount)}\nBase: ${money(totals.netBase)}\nPIX/Dinheiro: ${money(totals.cashTotal)}\nCartão: ${money(totals.cardTotal)}\nForma selecionada: ${project.paymentMethod === 'cartao' ? 'Cartão' : project.paymentMethod === 'dinheiro' ? 'Dinheiro' : 'PIX'} - ${money(totals.selectedTotal)}`
    return `${heading}\n${meta ? `\n${meta}\n` : '\n'}\n${itemText}\n\n${commercial}${project.notes ? `\n\nObservação: ${project.notes}` : ''}\n\nPré-dimensionamento: conferir ficha técnica vigente, projeto e condições reais da obra.`
  }

  async function copyProposal() {
    try { await navigator.clipboard.writeText(proposalText()); setCopyStatus('Copiado ✓'); window.setTimeout(() => setCopyStatus(''), 1800) }
    catch { setCopyStatus('Não foi possível copiar') }
  }

  function openWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(proposalText())}`, '_blank', 'noopener,noreferrer') }

  function refreshPrices() {
    const applied = applyCatalogToCurrentProject(lines.map((line) => line.key))
    setPriceStatus(applied ? `${applied} preço(s) atualizado(s) ✓` : 'Nenhum preço central disponível para atualizar')
    window.setTimeout(() => setPriceStatus(''), 2200)
  }

  return <section className="calculatorShell projectShell">
    <div className="stepHeader"><div><div className="eyebrow dark">MODO PROJETO / OBRA</div><h2>Do cálculo à proposta</h2><p>Todos os módulos alimentam a mesma obra. O arredondamento comercial é feito depois da consolidação.</p></div><span className="verifiedPill">salvo neste dispositivo</span></div>

    <section className="projectMetaCard">
      <div className="fieldGrid three"><label><span>Cliente</span><input value={project.client} onChange={(e) => updateMeta({ client: e.target.value })} placeholder="Nome do cliente" /></label><label><span>Obra / projeto</span><input value={project.projectName} onChange={(e) => updateMeta({ projectName: e.target.value })} placeholder="Ex.: Reservatório Bloco A" /></label><label><span>Local</span><input value={project.location} onChange={(e) => updateMeta({ location: e.target.value })} placeholder="Cidade / endereço" /></label></div>
      <div className="fieldGrid three"><label><span>Responsável / consultor</span><input value={project.consultant} onChange={(e) => updateMeta({ consultant: e.target.value })} placeholder="Nome" /></label><label><span>Validade da proposta (dias)</span><input type="number" min="1" max="365" value={project.validityDays} onChange={(e) => updateMeta({ validityDays: Math.max(1, Number(e.target.value) || 1) })} /></label><label><span>Desconto adicional PIX/Dinheiro (%)</span><input type="number" min="0" max="100" step="0.1" value={project.cashDiscountPct} onChange={(e) => setCashDiscountPct(Number(e.target.value))} /></label></div>
    </section>

    <section className="projectMetaCard checklistCard">
      <div className="sectionMiniHead"><h3>Checagem prévia da obra</h3><span>{checklistDone}/{checklistItems.length}</span></div>
      <p className="checklistIntro">Não bloqueia o cálculo. Serve para registrar verificações básicas antes da especificação/execução.</p>
      <div className="workChecklist">{checklistItems.map(([key, label]) => <label key={key} className={project.checklist[key] ? 'checked' : ''}><input type="checkbox" checked={Boolean(project.checklist[key])} onChange={(e) => setChecklistItem(key, e.target.checked)} /><span>{label}</span></label>)}</div>
      {checklistDone < checklistItems.length && <div className="contextNote">{checklistItems.length - checklistDone} verificação(ões) ainda pendente(s).</div>}
    </section>

    <div className="projectColumns">
      <section className="projectBlock"><div className="sectionMiniHead"><h3>Cálculos da obra</h3><span>{project.calculations.length}</span></div>{project.calculations.length === 0 ? <div className="emptyState">Faça um cálculo em Reservatórios, Por Produto ou Por Sistema e adicione ao Projeto/Obra.</div> : project.calculations.map((calculation) => <article className="calculationCard" key={calculation.id}><div className="calculationHead"><div><small>{calculation.kind}</small><h4>{calculation.title}</h4>{calculation.subtitle && <p>{calculation.subtitle}</p>}</div><button onClick={() => removeCalculation(calculation.id)}>Remover</button></div><div className="calculationMetrics">{calculation.metrics.map((metric, index) => <span key={index}><b>{metric.value}</b>{metric.label}</span>)}</div></article>)}</section>
      <section className="projectBlock"><div className="sectionMiniHead"><h3>Materiais consolidados</h3><span>{materials.length}</span></div>{materials.length === 0 ? <div className="emptyState">O quantitativo consolidado aparecerá aqui.</div> : materials.map((material) => <article className="materialCard" key={material.key}><h4>{material.productName}</h4><p>Necessidade técnica: <b>{material.minQuantity === material.maxQuantity ? `${qty(material.maxQuantity)} ${material.unit}` : `${qty(material.minQuantity)} a ${qty(material.maxQuantity)} ${material.unit}`}</b></p>{material.recommendedMix?.items.length ? <div className="materialBuy"><span>Compra recomendada</span><strong>{material.recommendedMix.items.map((item) => `${item.count} × ${packageLabel(item.package)}`).join(' + ')}</strong><small>Sobra consolidada: {qty(material.recommendedMix.surplus)} {material.unit}</small></div> : <div className="contextNote">Embalagem comercial ainda não definida no banco.</div>}</article>)}</section>
    </div>

    <section className="proposalPanel"><div className="sectionMiniHead"><h3>Orçamento / proposta</h3><span>{lines.length} linha(s)</span></div>
      <div className="proposalPriceTools"><div><strong>Tabela central de preços</strong><span>Preços novos são gravados como base; descontos permanecem nesta obra.</span></div><button className="secondaryButton" disabled={!lines.length} onClick={refreshPrices}>Atualizar esta obra com a tabela atual</button>{priceStatus && <small>{priceStatus}</small>}</div>
      {lines.length === 0 ? <div className="emptyState">Adicione cálculos para habilitar a proposta comercial.</div> : <div className="commercialTable">{lines.map((line) => <article className="commercialRow" key={line.key}><div className="commercialName"><strong>{line.productName}</strong><span>{line.count} × {line.packageLabel}</span></div><label><span>Preço unit. (R$)</span><input type="number" min="0" step="0.01" value={line.unitPrice || ''} placeholder="0,00" onChange={(e) => { const unitPrice = Math.max(0, Number(e.target.value) || 0); updatePricing(line.key, { unitPrice }); if (line.package) updateCatalogPrice({ key: line.key, productId: line.productId, productName: line.productName, packageLabel: line.packageLabel }, unitPrice) }} /></label><label><span>Tipo desconto</span><select value={line.discountType} onChange={(e) => updatePricing(line.key, { discountType: e.target.value === 'value' ? 'value' : 'pct', discountValue: 0 })}><option value="pct">%</option><option value="value">R$</option></select></label><label><span>Desconto</span><input type="number" min="0" step="0.01" value={line.discountValue || ''} placeholder="0" onChange={(e) => updatePricing(line.key, { discountValue: Math.max(0, Number(e.target.value) || 0) })} /></label><div className="commercialTotal"><span>Total líquido</span><strong>{money(line.net)}</strong>{line.discount > 0 && <small>- {money(line.discount)}</small>}</div></article>)}</div>}
      <div className="proposalTotals"><div><span>Total de tabela</span><strong>{money(totals.gross)}</strong></div><div><span>Descontos dos itens</span><strong>{money(totals.itemDiscount)}</strong></div><div><span>Base após itens</span><strong>{money(totals.netBase)}</strong></div><div className="cash"><span>PIX / Dinheiro</span><strong>{money(totals.cashTotal)}</strong><small>{qty(totals.cashDiscountPct)}% adicional à vista</small></div><div><span>Cartão</span><strong>{money(totals.cardTotal)}</strong><small>sem desconto adicional à vista</small></div></div>
      <div className="paymentBar"><span>Forma selecionada</span><div className="segmented"><button className={project.paymentMethod === 'pix' ? 'active' : ''} onClick={() => setPaymentMethod('pix')}>PIX</button><button className={project.paymentMethod === 'dinheiro' ? 'active' : ''} onClick={() => setPaymentMethod('dinheiro')}>Dinheiro</button><button className={project.paymentMethod === 'cartao' ? 'active' : ''} onClick={() => setPaymentMethod('cartao')}>Cartão</button></div><strong>{money(totals.selectedTotal)}</strong></div>
      <label className="stackField proposalNote"><span>Observações comerciais</span><textarea rows={3} value={project.notes} onChange={(e) => updateMeta({ notes: e.target.value })} placeholder="Prazo, frete, condição de pagamento, observações..." /></label>
      <div className="proposalActions"><button className="primaryButton" disabled={!lines.length} onClick={() => void generateProjectPdf(project, materials, lines, totals)}>Gerar PDF</button><button className="secondaryButton" disabled={!lines.length} onClick={copyProposal}>{copyStatus || 'Copiar resumo'}</button><button className="secondaryButton" disabled={!lines.length} onClick={openWhatsApp}>Abrir WhatsApp</button><button className="dangerButton" onClick={() => { if (window.confirm('Limpar todos os dados desta obra?')) resetProject() }}>Nova obra / limpar</button></div>
    </section>
  </section>
}
