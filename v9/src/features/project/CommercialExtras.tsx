import { buildManualCommercialLines } from '../../engine/consolidation'
import { useProject } from '../../project/ProjectContext'
import type { ManualQuoteCategory } from '../../project/types'
import './commercialExtras.css'

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const categoryLabel: Record<ManualQuoteCategory, string> = { service: 'Serviço', freight: 'Frete', other: 'Outro' }

export default function CommercialExtras() {
  const { project, addManualItem, updateManualItem, removeManualItem } = useProject()
  const manualLines = buildManualCommercialLines(project.manualItems)
  const lineById = new Map(manualLines.map((line) => [line.manualItemId, line]))

  return (
    <section className="projectMetaCard extrasCard">
      <div className="extrasHead">
        <div><div className="eyebrow dark">ITENS COMERCIAIS</div><h3>Serviços, mão de obra e adicionais</h3><p>Estes itens entram no total da proposta, mas não alteram o quantitativo técnico de materiais.</p></div>
        <div className="extrasActions"><button onClick={() => addManualItem('service')}>+ Serviço</button><button onClick={() => addManualItem('freight')}>+ Frete</button><button onClick={() => addManualItem('other')}>+ Outro</button></div>
      </div>

      {project.manualItems.length === 0 ? <div className="emptyState small">Nenhum serviço ou item adicional incluído.</div> : <div className="extrasList">
        {project.manualItems.map((item) => {
          const line = lineById.get(item.id)
          return <article className="extraRow" key={item.id}>
            <label className="extraCategory"><span>Tipo</span><select value={item.category} onChange={(event) => updateManualItem(item.id, { category: event.target.value as ManualQuoteCategory })}><option value="service">Serviço</option><option value="freight">Frete</option><option value="other">Outro</option></select></label>
            <label className="extraDescription"><span>Descrição</span><input value={item.description} onChange={(event) => updateManualItem(item.id, { description: event.target.value })} placeholder="Descrição do serviço/item" /></label>
            <label><span>Qtd.</span><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateManualItem(item.id, { quantity: Math.max(0.01, Number(event.target.value) || 1) })} /></label>
            <label><span>Unidade</span><input value={item.unitLabel} onChange={(event) => updateManualItem(item.id, { unitLabel: event.target.value })} placeholder="serviço" /></label>
            <label><span>Preço unit. (R$)</span><input type="number" min="0" step="0.01" value={item.unitPrice || ''} placeholder="0,00" onChange={(event) => updateManualItem(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} /></label>
            <label><span>Desconto</span><div className="extraDiscount"><select value={item.discountType} onChange={(event) => updateManualItem(item.id, { discountType: event.target.value === 'value' ? 'value' : 'pct', discountValue: 0 })}><option value="pct">%</option><option value="value">R$</option></select><input type="number" min="0" step="0.01" value={item.discountValue || ''} placeholder="0" onChange={(event) => updateManualItem(item.id, { discountValue: Math.max(0, Number(event.target.value) || 0) })} /></div></label>
            <div className="extraTotal"><span>{categoryLabel[item.category]}</span><strong>{money(line?.net ?? 0)}</strong>{(line?.discount ?? 0) > 0 && <small>- {money(line?.discount ?? 0)}</small>}</div>
            <button className="extraRemove" onClick={() => removeManualItem(item.id)}>Remover</button>
          </article>
        })}
      </div>}
    </section>
  )
}
