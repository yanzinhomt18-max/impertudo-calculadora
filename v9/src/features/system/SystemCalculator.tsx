import { useEffect, useMemo, useState } from 'react'
import { applicationAreas } from '../../db'
import { calculateSystem, systemDefinitions, type SystemCalculationResult } from '../../engine/system'
import { packageLabel } from '../../engine/consolidation'
import AreaEditor, { defaultAreaEditorState, resolveAreaEditor, type AreaEditorState } from '../shared/AreaEditor'
import { useProject } from '../../project/ProjectContext'

const format = (value: number, decimals = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value)
const roleLabels: Record<string, string> = {
  negative_pressure_barrier: 'Barreira inicial / pressão negativa',
  main_waterproofing: 'Impermeabilização principal'
}

export default function SystemCalculator({ preferredSystemId }: { preferredSystemId?: string }) {
  const { addCalculation } = useProject()
  const initialId = preferredSystemId && systemDefinitions.some((item) => item.id === preferredSystemId)
    ? preferredSystemId
    : systemDefinitions[0]?.id ?? ''
  const [systemId, setSystemId] = useState(initialId)
  const [area, setArea] = useState<AreaEditorState>(defaultAreaEditorState)
  const [result, setResult] = useState<SystemCalculationResult | null>(null)
  const [resolvedArea, setResolvedArea] = useState<{ raw: number; withWaste: number } | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (preferredSystemId && systemDefinitions.some((item) => item.id === preferredSystemId)) {
      setSystemId(preferredSystemId)
      setResult(null)
      setSaved(false)
    }
  }, [preferredSystemId])

  const system = useMemo(() => systemDefinitions.find((item) => item.id === systemId) ?? systemDefinitions[0], [systemId])
  const areaNames = (system?.areaIds ?? []).map((id) => applicationAreas.find((areaItem) => areaItem.id === id)?.name ?? id)

  function handleCalculate() {
    setError('')
    setSaved(false)
    try {
      const geometry = resolveAreaEditor(area)
      const next = calculateSystem(system.id, geometry.areaWithWasteM2)
      setResolvedArea({ raw: geometry.rawAreaM2, withWaste: geometry.areaWithWasteM2 })
      setResult(next)
    } catch (err) {
      setResolvedArea(null)
      setResult(null)
      setError(err instanceof Error ? err.message : 'Não foi possível calcular o sistema.')
    }
  }

  function addToProject() {
    if (!result || !resolvedArea) return
    addCalculation({
      kind: 'system',
      title: result.systemName,
      subtitle: areaNames.join(', '),
      areaId: system.areaIds?.[0],
      metrics: [
        { label: 'Área base', value: `${format(resolvedArea.raw)} m²` },
        { label: 'Área com perda', value: `${format(resolvedArea.withWaste)} m²` }
      ],
      materials: result.layers.map((layer) => ({
        productId: layer.productId,
        productName: layer.productName,
        role: roleLabels[layer.role] ?? layer.role,
        minQuantity: layer.minQuantity,
        maxQuantity: layer.maxQuantity,
        unit: layer.unit
      })),
      notes: result.notes
    })
    setSaved(true)
  }

  if (!system) return <section className="calculatorShell"><div className="emptyState">Nenhum sistema cadastrado.</div></section>

  return (
    <section className="calculatorShell">
      <div className="stepHeader">
        <div><div className="eyebrow dark">MÓDULO 03 • POR SISTEMA</div><h2>Composição completa de materiais</h2><p>O motor lê as camadas cadastradas no banco e calcula todos os produtos do sistema de uma vez.</p></div>
        <span className="verifiedPill">{systemDefinitions.length} sistemas cadastrados</span>
      </div>

      <div className="productCalcGrid">
        <article className="stepCard">
          <span className="stepNumber">1</span><h3>Sistema</h3>
          <label className="stackField"><span>Solução cadastrada</span><select value={system.id} onChange={(e) => { setSystemId(e.target.value); setResult(null); setSaved(false) }}>{systemDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="sourceCard"><strong>Aplicações cadastradas</strong><span>{areaNames.length ? areaNames.join(' • ') : 'Sem ambiente vinculado'}</span><span>Status: {system.status.replaceAll('_', ' ')}</span></div>
        </article>
        <article className="stepCard">
          <span className="stepNumber">2</span><h3>Área do sistema</h3>
          <AreaEditor value={area} onChange={(next) => { setArea(next); setResult(null); setSaved(false) }} />
          <button className="primaryButton" onClick={handleCalculate}>Calcular sistema</button>
          {error && <div className="errorBox">{error}</div>}
        </article>
      </div>

      {result && resolvedArea && (
        <section className="resultPanel">
          <div className="resultHead">
            <div><div className="eyebrow dark">RESULTADO DO SISTEMA</div><h2>{result.systemName}</h2><p>{format(resolvedArea.raw)} m² base → {format(resolvedArea.withWaste)} m² com margem.</p></div>
            <button className="secondaryButton" onClick={addToProject}>{saved ? 'Adicionado ✓' : 'Adicionar ao Projeto/Obra'}</button>
          </div>

          <div className="layerList">
            {result.layers.map((layer, index) => (
              <article className="layerCard" key={`${layer.productId}-${index}`}>
                <div className="layerTitle"><span>{index + 1}</span><div><small>{roleLabels[layer.role] ?? layer.role}</small><h3>{layer.productName}</h3></div></div>
                <div className="layerMetrics"><div><span>Consumo</span><strong>{layer.consumptionLabel}</strong></div><div><span>Necessidade</span><strong>{layer.minQuantity === layer.maxQuantity ? `${format(layer.maxQuantity)} ${layer.unit}` : `${format(layer.minQuantity)} a ${format(layer.maxQuantity)} ${layer.unit}`}</strong></div></div>
                {layer.recommendedMix?.items.length ? <div className="mixBox"><strong>Compra recomendada</strong><span>{layer.recommendedMix.items.map((item) => `${item.count} × ${packageLabel(item.package)}`).join(' + ')}</span><small>Sobra: {format(layer.recommendedMix.surplus)} {layer.unit}</small></div> : <div className="contextNote">Embalagem comercial ainda não definida.</div>}
              </article>
            ))}
          </div>
          {result.notes.length > 0 && <div className="technicalNotes"><strong>Observações técnicas</strong>{result.notes.map((note, index) => <p key={index}>{note}</p>)}</div>}
          <p className="disclaimer">Sistema calculado somente com camadas e consumos cadastrados no banco V9. Conferir ficha técnica vigente e detalhes de projeto.</p>
        </section>
      )}
    </section>
  )
}
