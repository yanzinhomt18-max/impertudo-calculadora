import { useMemo, useState } from 'react'
import { applicationAreas, categories, productDatabase, systems } from './db'
import ReservoirCalculator from './features/reservoir/ReservoirCalculator'
import './styles.css'

const statusLabel: Record<string, string> = {
  pending: 'Pendente de ficha',
  official_partial: 'Oficial parcial',
  verified_mixed: 'Verificado',
  previous_technical_pending_revalidation: 'Revalidar ficha'
}

type View = 'reservoir' | 'catalog'

export default function App() {
  const [view, setView] = useState<View>('reservoir')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return productDatabase.products.filter((product) => {
      const matchesQuery = !q || `${product.name} ${product.categoryId}`.toLocaleLowerCase('pt-BR').includes(q)
      const matchesStatus = status === 'all' || product.technicalStatus === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const product of productDatabase.products) {
      map.set(product.technicalStatus, (map.get(product.technicalStatus) ?? 0) + 1)
    }
    return map
  }, [])

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">IMPERTUDO • NOVA ARQUITETURA</div>
        <h1>Calculadora Técnica V9.0</h1>
        <p>
          Banco rastreável, motor matemático independente e cálculo guiado por sistema.
          O primeiro módulo funcional é o pré-dimensionamento de reservatórios.
        </p>
        <div className="heroBadges">
          <span>{productDatabase.meta.productCount} produtos</span>
          <span>{categories.length} categorias</span>
          <span>{applicationAreas.length} ambientes</span>
          <span>{systems.length} sistemas iniciais</span>
        </div>
      </section>

      <section className="metrics">
        <article><strong>{counts.get('verified_mixed') ?? 0}</strong><span>verificados/mistos</span></article>
        <article><strong>{counts.get('official_partial') ?? 0}</strong><span>oficiais parciais</span></article>
        <article><strong>{counts.get('previous_technical_pending_revalidation') ?? 0}</strong><span>a revalidar</span></article>
        <article><strong>{counts.get('pending') ?? 0}</strong><span>pendentes de ficha</span></article>
      </section>

      <nav className="appNav" aria-label="Módulos da calculadora">
        <button className={view === 'reservoir' ? 'active' : ''} onClick={() => setView('reservoir')}>
          Reservatórios
          <small>primeiro módulo</small>
        </button>
        <button className={view === 'catalog' ? 'active' : ''} onClick={() => setView('catalog')}>
          Banco técnico
          <small>auditoria dos produtos</small>
        </button>
      </nav>

      {view === 'reservoir' ? (
        <ReservoirCalculator />
      ) : (
        <section className="panel">
          <div className="panelHead">
            <div>
              <div className="eyebrow dark">BANCO V9</div>
              <h2>Catálogo mestre</h2>
            </div>
            <div className="filters">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar produto..."
                aria-label="Buscar produto"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Todos os status</option>
                <option value="verified_mixed">Verificados</option>
                <option value="official_partial">Oficiais parciais</option>
                <option value="previous_technical_pending_revalidation">Revalidar ficha</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>

          <div className="productGrid">
            {products.map((product) => (
              <article className="productCard" key={product.id}>
                <div className={`status status-${product.technicalStatus}`}>
                  {statusLabel[product.technicalStatus]}
                </div>
                <h3>{product.name}</h3>
                <p>{product.packageLabel}</p>
                <div className="productMeta">
                  <span>{product.calculationModel}</span>
                  <span>{product.categoryId}</span>
                </div>
                <a href={product.officialUrl} target="_blank" rel="noreferrer">Página oficial ↗</a>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
