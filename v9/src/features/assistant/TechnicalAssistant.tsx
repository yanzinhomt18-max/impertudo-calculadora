import { useMemo, useState } from 'react'
import { applicationAreas, productDatabase, systems } from '../../db'
import { isProductAutoCalculable } from '../../engine/product'

type Goal = 'all' | 'automatic' | 'negative' | 'uv' | 'potable'

const statusLabel: Record<string, string> = {
  pending: 'Pendente de ficha',
  official_partial: 'Oficial parcial',
  verified_mixed: 'Verificado',
  previous_technical_pending_revalidation: 'Revalidar ficha'
}

function matchesGoal(product: (typeof productDatabase.products)[number], goal: Goal): boolean {
  if (goal === 'all') return true
  if (goal === 'automatic') return isProductAutoCalculable(product)
  const technical = product.technical as Record<string, unknown>
  if (goal === 'negative') return technical.pressureNegative === true || product.tags.includes('pressao-negativa')
  if (goal === 'uv') return technical.uvResistant === true || product.tags.includes('uv')
  if (goal === 'potable') return technical.potableWater === true || product.tags.includes('agua-potavel')
  return true
}

export default function TechnicalAssistant({ onOpenProduct, onOpenReservoir }: { onOpenProduct: () => void; onOpenReservoir: () => void }) {
  const [areaId, setAreaId] = useState('reservatorios')
  const [goal, setGoal] = useState<Goal>('all')

  const area = applicationAreas.find((item) => item.id === areaId)
  const candidates = useMemo(() => productDatabase.products
    .filter((product) => product.applicationAreaIds.includes(areaId))
    .filter((product) => matchesGoal(product, goal))
    .sort((a, b) => {
      const autoDiff = Number(isProductAutoCalculable(b)) - Number(isProductAutoCalculable(a))
      return autoDiff || a.name.localeCompare(b.name, 'pt-BR')
    }), [areaId, goal])

  const matchingSystems = useMemo(() => (systems as Array<{ id: string; name: string; status: string; areaIds?: string[]; notes?: string[] }>)
    .filter((system) => system.areaIds?.includes(areaId)), [areaId])

  return (
    <section className="calculatorShell">
      <div className="stepHeader">
        <div>
          <div className="eyebrow dark">ASSISTENTE TÉCNICO</div>
          <h2>Comece pelo ambiente</h2>
          <p>O assistente não inventa solução: ele filtra apenas aplicações e sistemas cadastrados no banco V9.</p>
        </div>
        <span className="verifiedPill">filtro rastreável</span>
      </div>

      <div className="assistantControls">
        <label className="stackField">
          <span>Onde será o serviço?</span>
          <select value={areaId} onChange={(event) => setAreaId(event.target.value)}>
            {applicationAreas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="stackField">
          <span>O que deseja priorizar?</span>
          <select value={goal} onChange={(event) => setGoal(event.target.value as Goal)}>
            <option value="all">Todas as opções cadastradas</option>
            <option value="automatic">Já liberadas para cálculo automático</option>
            <option value="negative">Pressão negativa</option>
            <option value="uv">Exposição UV</option>
            <option value="potable">Contato com água potável</option>
          </select>
        </label>
      </div>

      {areaId === 'reservatorios' && (
        <div className="assistantHeroCard">
          <div><strong>Módulo guiado disponível</strong><span>Reservatórios já possuem geometria e sistemas próprios na V9.</span></div>
          <button className="secondaryButton" onClick={onOpenReservoir}>Abrir Reservatórios</button>
        </div>
      )}

      <div className="assistantColumns">
        <section>
          <div className="sectionMiniHead"><h3>Sistemas cadastrados</h3><span>{matchingSystems.length}</span></div>
          {matchingSystems.length ? matchingSystems.map((system) => (
            <article className="assistantCard" key={system.id}>
              <div className="status status-verified_mixed">{system.status.replaceAll('_', ' ')}</div>
              <h4>{system.name}</h4>
              {system.notes?.map((note, index) => <p key={index}>{note}</p>)}
            </article>
          )) : <div className="emptyState small">Ainda não existe um sistema completo cadastrado para {area?.name ?? 'este ambiente'}.</div>}
        </section>

        <section>
          <div className="sectionMiniHead"><h3>Produtos compatíveis no banco</h3><span>{candidates.length}</span></div>
          <div className="assistantProductList">
            {candidates.map((product) => {
              const auto = isProductAutoCalculable(product)
              return (
                <article className="assistantCard" key={product.id}>
                  <div className={`status status-${product.technicalStatus}`}>{statusLabel[product.technicalStatus]}</div>
                  <h4>{product.name}</h4>
                  <p>{product.packageLabel}</p>
                  <div className="assistantCardActions">
                    <a href={product.officialUrl} target="_blank" rel="noreferrer">Página oficial ↗</a>
                    {auto && <button onClick={onOpenProduct}>Calcular</button>}
                  </div>
                </article>
              )
            })}
          </div>
          {!candidates.length && <div className="emptyState small">Nenhum produto do banco atende aos filtros selecionados.</div>}
        </section>
      </div>

      <p className="disclaimer">O assistente serve como triagem do banco cadastrado. A definição final do sistema deve considerar projeto, substrato, exposição, pressão, movimentação, detalhes construtivos e ficha técnica vigente.</p>
    </section>
  )
}
