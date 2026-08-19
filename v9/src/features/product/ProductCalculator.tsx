import { useEffect, useMemo, useState } from 'react'
import { autoCalculableProducts, calculateProduct, getProductOptions, type ProductCalculationResult } from '../../engine/product'
import { packageLabel } from '../../engine/consolidation'
import { useProject } from '../../project/ProjectContext'
import AreaEditor, { defaultAreaEditorState, resolveAreaEditor, type AreaEditorState } from '../shared/AreaEditor'

const format = (value: number, decimals = 2) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value)

function isAreaModel(model: string, optionId?: string): boolean {
  if (model === 'multi_mode') return optionId !== 'joint'
  return ['area_consumption', 'area_consumption_range', 'area_yield', 'application_profile', 'roll'].includes(model)
}
function isJointModel(model: string, optionId?: string): boolean {
  return model === 'joint_volume' || (model === 'multi_mode' && optionId === 'joint')
}

export default function ProductCalculator({ preferredProductId }: { preferredProductId?: string }) {
  const { addCalculation } = useProject()
  const initialId = preferredProductId && autoCalculableProducts.some((item) => item.id === preferredProductId)
    ? preferredProductId
    : autoCalculableProducts[0]?.id ?? ''
  const [productId, setProductId] = useState(initialId)
  const product = useMemo(() => autoCalculableProducts.find((item) => item.id === productId) ?? autoCalculableProducts[0], [productId])
  const options = useMemo(() => product ? getProductOptions(product) : [], [product])
  const [optionId, setOptionId] = useState('')
  const [area, setArea] = useState<AreaEditorState>(defaultAreaEditorState)
  const [coats, setCoats] = useState(1)
  const [jointLengthM, setJointLengthM] = useState(10)
  const [jointWidthMm, setJointWidthMm] = useState(10)
  const [jointDepthMm, setJointDepthMm] = useState(10)
  const [result, setResult] = useState<ProductCalculationResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (preferredProductId && autoCalculableProducts.some((item) => item.id === preferredProductId)) {
      setProductId(preferredProductId)
    }
  }, [preferredProductId])

  useEffect(() => {
    setOptionId(options[0]?.id ?? '')
    setResult(null); setError(''); setSaved(false)
    const technical = product?.technical as { coatsMin?: number } | undefined
    setCoats(technical?.coatsMin ?? 1)
  }, [productId, product, options])

  if (!product) return <section className="calculatorShell"><div className="emptyState">Nenhum produto está liberado para cálculo automático.</div></section>

  const areaMode = isAreaModel(product.calculationModel, optionId)
  const jointMode = isJointModel(product.calculationModel, optionId)
  const technical = product.technical as { consumptionBasis?: string; coatsMin?: number; coatsMax?: number } | undefined
  const perCoat = technical?.consumptionBasis === 'perCoat'
  const coatsMin = technical?.coatsMin ?? 1
  const coatsMax = technical?.coatsMax ?? coatsMin

  function handleCalculate() {
    setSaved(false); setError('')
    try {
      const resolved = areaMode ? resolveAreaEditor(area) : null
      const next = calculateProduct({
        productId: product.id,
        areaM2: resolved?.rawAreaM2,
        wastePercent: resolved?.wastePercent,
        optionId: optionId || undefined,
        coats: perCoat ? coats : undefined,
        jointLengthM: jointMode ? jointLengthM : undefined,
        jointWidthMm: jointMode ? jointWidthMm : undefined,
        jointDepthMm: jointMode ? jointDepthMm : undefined
      })
      setResult(next)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Não foi possível calcular o produto.')
    }
  }

  function handleAddToProject() {
    if (!result) return
    addCalculation({
      kind: 'product', title: result.productName, subtitle: result.optionLabel,
      areaId: product.applicationAreaIds[0],
      metrics: [
        ...(result.rawAreaM2 ? [{ label: 'Área', value: `${format(result.rawAreaM2)} m²` }] : []),
        ...(result.areaWithWasteM2 ? [{ label: 'Área com perda', value: `${format(result.areaWithWasteM2)} m²` }] : []),
        { label: 'Base técnica', value: result.basisLabel },
        { label: 'Necessidade', value: result.minQuantity === result.maxQuantity ? `${format(result.maxQuantity)} ${result.unit}` : `${format(result.minQuantity)} a ${format(result.maxQuantity)} ${result.unit}` }
      ],
      materials: [{ productId: result.productId, productName: result.productName, minQuantity: result.minQuantity, maxQuantity: result.maxQuantity, unit: result.unit, notes: result.notes }],
      notes: result.notes
    })
    setSaved(true)
  }

  return (
    <section className="calculatorShell">
      <div className="stepHeader"><div><div className="eyebrow dark">MÓDULO 02 • POR PRODUTO</div><h2>Cálculo técnico genérico</h2><p>Somente produtos com dados liberados no banco V9 aparecem para cálculo automático.</p></div><span className="verifiedPill">{autoCalculableProducts.length} produtos liberados</span></div>
      <div className="productCalcGrid">
        <article className="stepCard"><span className="stepNumber">1</span><h3>Produto e aplicação</h3>
          <label className="stackField"><span>Produto</span><select value={product.id} onChange={(e) => setProductId(e.target.value)}>{autoCalculableProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {options.length > 0 && <label className="stackField"><span>Condição / perfil</span><select value={optionId} onChange={(e) => { setOptionId(e.target.value); setResult(null); setSaved(false) }}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>}
          <div className="sourceCard"><strong>{product.packageLabel}</strong><span>Status técnico: {product.technicalStatus === 'verified_mixed' ? 'verificado/misto' : 'oficial parcial'}</span><a href={product.officialUrl} target="_blank" rel="noreferrer">Abrir página oficial ↗</a></div>
        </article>
        <article className="stepCard"><span className="stepNumber">2</span><h3>Dados do cálculo</h3>
          {areaMode && <AreaEditor value={area} onChange={(next) => { setArea(next); setResult(null); setSaved(false) }} />}
          {perCoat && <label className="stackField"><span>Demãos ({coatsMin} a {coatsMax})</span><input type="number" min={coatsMin} max={coatsMax} step="1" value={coats} onChange={(e) => setCoats(Number(e.target.value))} /></label>}
          {jointMode && <div className="fieldGrid three"><label><span>Comprimento (m)</span><input type="number" min="0" step="0.01" value={jointLengthM} onChange={(e) => setJointLengthM(Number(e.target.value))} /></label><label><span>Largura (mm)</span><input type="number" min="0" step="0.1" value={jointWidthMm} onChange={(e) => setJointWidthMm(Number(e.target.value))} /></label><label><span>Profundidade (mm)</span><input type="number" min="0" step="0.1" value={jointDepthMm} onChange={(e) => setJointDepthMm(Number(e.target.value))} /></label></div>}
          <button className="primaryButton" onClick={handleCalculate}>Calcular produto</button>{error && <div className="errorBox">{error}</div>}
        </article>
      </div>
      {result && <section className="resultPanel compactResult">
        <div className="resultHead"><div><div className="eyebrow dark">RESULTADO</div><h2>{result.productName}</h2><p>{result.optionLabel} • {result.basisLabel}</p></div><button className="secondaryButton" onClick={handleAddToProject}>{saved ? 'Adicionado ✓' : 'Adicionar ao Projeto/Obra'}</button></div>
        <div className="resultMetrics threeMetrics">{result.areaWithWasteM2 && <article><strong>{format(result.areaWithWasteM2)} m²</strong><span>Área considerada</span></article>}<article><strong>{format(result.minQuantity)} {result.unit}</strong><span>Necessidade mínima</span></article><article><strong>{format(result.maxQuantity)} {result.unit}</strong><span>Referência máxima</span></article></div>
        {result.packages.length > 0 && <div className="packageTable">{result.packages.map((item, index) => <div className="packageRow" key={index}><div><span>Embalagem</span><strong>{packageLabel(item.package)}</strong></div><div><span>Compra mínima</span><strong>{item.minCount} un.</strong></div><div className="recommended"><span>Compra recomendada</span><strong>{item.maxCount} un.</strong></div><div><span>Sobra</span><strong>{format(item.maxSurplus)} {item.unit}</strong></div></div>)}</div>}
        {result.recommendedMix && result.recommendedMix.items.length > 1 && <div className="mixBox"><strong>Combinação com menor sobra</strong><span>{result.recommendedMix.items.map((item) => `${item.count} × ${packageLabel(item.package)}`).join(' + ')}</span><small>Sobra estimada: {format(result.recommendedMix.surplus)} {result.unit}</small></div>}
        <p className="disclaimer">Pré-dimensionamento. Conferir ficha técnica vigente, projeto e condições reais da obra.</p>
      </section>}
    </section>
  )
}
