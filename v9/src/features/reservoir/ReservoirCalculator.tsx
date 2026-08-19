import { useMemo, useState } from 'react'
import { calculateReservoir, packageDisplay, type ReservoirCalculationResult, type ReservoirSolutionMode, type TopRuleId } from '../../engine/reservoir'
import type { ReservoirShape, ReservoirStructure } from '../../engine/geometry'
import { useProject } from '../../project/ProjectContext'

const roleLabels: Record<string, string> = {
  negative_pressure_barrier: 'Barreira inicial / pressão negativa',
  main_waterproofing: 'Impermeabilização principal'
}

const format = (value: number, decimals = 2) => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: decimals
}).format(value)

export default function ReservoirCalculator() {
  const { addCalculation } = useProject()
  const [shape, setShape] = useState<ReservoirShape>('rectangular')
  const [structure, setStructure] = useState<ReservoirStructure>('buried')
  const [lengthM, setLengthM] = useState(4)
  const [widthM, setWidthM] = useState(3)
  const [diameterM, setDiameterM] = useState(4)
  const [heightM, setHeightM] = useState(2)
  const [wastePercent, setWastePercent] = useState(5)
  const [includeCeiling, setIncludeCeiling] = useState(false)
  const [solutionMode, setSolutionMode] = useState<ReservoirSolutionMode>('topflex-system')
  const [topRuleId, setTopRuleId] = useState<TopRuleId>('negative-10mca')
  const [result, setResult] = useState<ReservoirCalculationResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const structureHint = useMemo(() => {
    if (structure === 'buried') return 'Estrutura em contato com o solo. O sistema TOP FLEX cadastrado inclui a preparação específica do banco V9.'
    if (structure === 'elevated') return 'Reservatório elevado, sem contato direto com o solo.'
    return 'Reservatório apoiado sobre estrutura/base.'
  }, [structure])

  function handleCalculate() {
    setError('')
    setSaved(false)
    try {
      const next = calculateReservoir({
        shape,
        structure,
        lengthM: shape === 'rectangular' ? lengthM : undefined,
        widthM: shape === 'rectangular' ? widthM : undefined,
        diameterM: shape === 'cylindrical' ? diameterM : undefined,
        heightM,
        includeFloor: true,
        includeWalls: true,
        includeCeiling,
        wastePercent,
        solutionMode,
        topRuleId: solutionMode === 'top-direct' ? topRuleId : undefined
      })
      setResult(next)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Não foi possível calcular.')
    }
  }

  function handleAddToProject() {
    if (!result) return
    addCalculation({
      kind: 'reservoir',
      title: result.systemName,
      subtitle: `${structure === 'buried' ? 'Enterrado' : structure === 'elevated' ? 'Elevado' : 'Apoiado'} • ${shape === 'rectangular' ? 'Retangular' : 'Redondo'}`,
      areaId: 'reservatorios',
      metrics: [
        { label: 'Área interna', value: `${format(result.geometry.internalAreaM2)} m²` },
        { label: 'Área com perda', value: `${format(result.geometry.areaWithWasteM2)} m²` },
        { label: 'Volume', value: `${format(result.geometry.volumeM3)} m³` },
        { label: 'Capacidade', value: `${format(result.geometry.capacityLiters, 0)} L` }
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

  return (
    <section className="calculatorShell">
      <div className="stepHeader">
        <div>
          <div className="eyebrow dark">MÓDULO 01 • RESERVATÓRIOS</div>
          <h2>Pré-dimensionamento guiado</h2>
          <p>Geometria → condição → sistema → consumo → embalagens.</p>
        </div>
        <span className="alphaBadge">V9 alpha</span>
      </div>

      <div className="stepGrid">
        <article className="stepCard">
          <span className="stepNumber">1</span>
          <h3>Geometria</h3>
          <label>Formato</label>
          <div className="segmented">
            <button className={shape === 'rectangular' ? 'active' : ''} onClick={() => setShape('rectangular')}>Retangular</button>
            <button className={shape === 'cylindrical' ? 'active' : ''} onClick={() => setShape('cylindrical')}>Redondo</button>
          </div>

          {shape === 'rectangular' ? (
            <div className="fieldGrid three">
              <label><span>Comprimento (m)</span><input type="number" min="0" step="0.01" value={lengthM} onChange={(e) => setLengthM(Number(e.target.value))} /></label>
              <label><span>Largura (m)</span><input type="number" min="0" step="0.01" value={widthM} onChange={(e) => setWidthM(Number(e.target.value))} /></label>
              <label><span>Altura (m)</span><input type="number" min="0" step="0.01" value={heightM} onChange={(e) => setHeightM(Number(e.target.value))} /></label>
            </div>
          ) : (
            <div className="fieldGrid two">
              <label><span>Diâmetro interno (m)</span><input type="number" min="0" step="0.01" value={diameterM} onChange={(e) => setDiameterM(Number(e.target.value))} /></label>
              <label><span>Altura (m)</span><input type="number" min="0" step="0.01" value={heightM} onChange={(e) => setHeightM(Number(e.target.value))} /></label>
            </div>
          )}

          <div className="fieldGrid two compactFields">
            <label><span>Margem de perda (%)</span><input type="number" min="0" max="50" step="1" value={wastePercent} onChange={(e) => setWastePercent(Number(e.target.value))} /></label>
            <label className="checkField"><input type="checkbox" checked={includeCeiling} onChange={(e) => setIncludeCeiling(e.target.checked)} /><span>Incluir teto na impermeabilização</span></label>
          </div>
        </article>

        <article className="stepCard">
          <span className="stepNumber">2</span>
          <h3>Condição da estrutura</h3>
          <label>O reservatório é:</label>
          <select value={structure} onChange={(e) => setStructure(e.target.value as ReservoirStructure)}>
            <option value="buried">Enterrado</option>
            <option value="elevated">Elevado</option>
            <option value="supported">Apoiado</option>
          </select>
          <div className="contextNote">{structureHint}</div>
        </article>

        <article className="stepCard">
          <span className="stepNumber">3</span>
          <h3>Solução técnica</h3>
          <label>Calcular por:</label>
          <select value={solutionMode} onChange={(e) => setSolutionMode(e.target.value as ReservoirSolutionMode)}>
            <option value="topflex-system">Sistema com IMPERTUDO TOP FLEX FIBRAS</option>
            <option value="top-direct">IMPERTUDO TOP como sistema principal</option>
          </select>

          {solutionMode === 'top-direct' && (
            <label className="stackField">
              <span>Condição para o IMPERTUDO TOP</span>
              <select value={topRuleId} onChange={(e) => setTopRuleId(e.target.value as TopRuleId)}>
                <option value="soil-moisture">Umidade de solo / percolação</option>
                <option value="positive-25mca">Pressão positiva até 25 m.c.a.</option>
                <option value="negative-10mca">Pressão negativa até 10 m.c.a.</option>
              </select>
            </label>
          )}

          <button className="primaryButton" onClick={handleCalculate}>Calcular materiais</button>
          {error && <div className="errorBox">{error}</div>}
        </article>
      </div>

      {result && (
        <section className="resultPanel">
          <div className="resultHead">
            <div>
              <div className="eyebrow dark">RESULTADO V9</div>
              <h2>{result.systemName}</h2>
            </div>
            <div className="resultActions">
              <span className="verifiedPill">dados rastreáveis</span>
              <button className="secondaryButton" onClick={handleAddToProject}>{saved ? 'Adicionado ✓' : 'Adicionar ao Projeto/Obra'}</button>
            </div>
          </div>

          <div className="resultMetrics">
            <article><strong>{format(result.geometry.internalAreaM2)} m²</strong><span>Área interna</span></article>
            <article><strong>{format(result.geometry.areaWithWasteM2)} m²</strong><span>Área com {format(result.geometry.wastePercent, 0)}% de perda</span></article>
            <article><strong>{format(result.geometry.volumeM3)} m³</strong><span>Volume</span></article>
            <article><strong>{format(result.geometry.capacityLiters, 0)} L</strong><span>Capacidade</span></article>
          </div>

          <div className="layerList">
            {result.layers.map((layer, index) => (
              <article className="layerCard" key={`${layer.productId}-${index}`}>
                <div className="layerTitle">
                  <span>{index + 1}</span>
                  <div><small>{roleLabels[layer.role] ?? layer.role}</small><h3>{layer.productName}</h3></div>
                </div>

                <div className="layerMetrics">
                  <div><span>Consumo</span><strong>{layer.consumptionLabel}</strong></div>
                  <div><span>Necessidade técnica</span><strong>{layer.minQuantity === layer.maxQuantity ? `${format(layer.maxQuantity)} ${layer.unit}` : `${format(layer.minQuantity)} a ${format(layer.maxQuantity)} ${layer.unit}`}</strong></div>
                </div>

                <div className="packageTable">
                  {layer.packages.map((item, packIndex) => (
                    <div className="packageRow" key={packIndex}>
                      <div><span>Embalagem</span><strong>{packageDisplay(item.package)}</strong></div>
                      <div><span>Compra mínima</span><strong>{item.minCount} un.</strong></div>
                      <div className="recommended"><span>Compra recomendada</span><strong>{item.maxCount} un.</strong></div>
                      <div><span>Sobra no máximo</span><strong>{format(item.maxSurplus)} {item.unit}</strong></div>
                    </div>
                  ))}
                </div>

                {layer.recommendedMix && layer.recommendedMix.items.length > 1 && (
                  <div className="mixBox">
                    <strong>Combinação com menor sobra</strong>
                    <span>{layer.recommendedMix.items.map((item) => `${item.count} × ${packageDisplay(item.package)}`).join(' + ')}</span>
                    <small>Compra: {format(layer.recommendedMix.purchased)} {layer.unit} • sobra: {format(layer.recommendedMix.surplus)} {layer.unit}</small>
                  </div>
                )}
              </article>
            ))}
          </div>

          {result.notes.length > 0 && (
            <div className="technicalNotes">
              <strong>Observações técnicas do sistema</strong>
              {result.notes.map((note, index) => <p key={index}>{note}</p>)}
            </div>
          )}
          <p className="disclaimer">Pré-dimensionamento. Conferir ficha técnica vigente, projeto, condições do substrato e medidas in loco antes da compra e execução.</p>
        </section>
      )}
    </section>
  )
}
