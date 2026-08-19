import { useMemo, useState } from 'react'
import { applicationAreas, categories, productDatabase, systems } from './db'
import ReservoirCalculator from './features/reservoir/ReservoirCalculator'
import ProductCalculator from './features/product/ProductCalculator'
import SystemCalculator from './features/system/SystemCalculator'
import TechnicalAssistant from './features/assistant/TechnicalAssistant'
import ProjectDashboard from './features/project/ProjectDashboard'
import InstallAppButton from './features/pwa/InstallAppButton'
import { useProject } from './project/ProjectContext'
import './styles.css'

const statusLabel: Record<string, string> = { pending: 'Pendente de ficha', official_partial: 'Oficial parcial', verified_mixed: 'Verificado', previous_technical_pending_revalidation: 'Revalidar ficha' }
type View = 'assistant' | 'reservoir' | 'product' | 'system' | 'project' | 'catalog'

export default function App() {
  const { project } = useProject()
  const [view, setView] = useState<View>('assistant')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const products = useMemo(() => { const q = query.trim().toLocaleLowerCase('pt-BR'); return productDatabase.products.filter((product) => (!q || `${product.name} ${product.categoryId}`.toLocaleLowerCase('pt-BR').includes(q)) && (status === 'all' || product.technicalStatus === status)) }, [query, status])
  const counts = useMemo(() => { const map = new Map<string, number>(); for (const product of productDatabase.products) map.set(product.technicalStatus, (map.get(product.technicalStatus) ?? 0) + 1); return map }, [])

  return <main>
    <header className="hero"><div className="heroInner"><div className="brandBox"><img className="heroLogo" src="/logo-impertudo.svg" alt="IMPERTUDO Químicos para Construção" /></div><div className="heroCopy"><div className="eyebrow">IMPERTUDO • PLATAFORMA TÉCNICA</div><h1>Calculadora Técnica V9.0</h1><p>Do diagnóstico ao quantitativo comercial: banco rastreável, cálculo por produto e sistema, Projeto/Obra, proposta e funcionamento offline.</p><div className="heroBadges"><span>{productDatabase.meta.productCount} produtos</span><span>{categories.length} categorias</span><span>{applicationAreas.length} ambientes</span><span>{systems.length} sistemas iniciais</span></div></div><InstallAppButton /></div></header>
    <section className="metrics"><article><strong>{counts.get('verified_mixed') ?? 0}</strong><span>verificados/mistos</span></article><article><strong>{counts.get('official_partial') ?? 0}</strong><span>oficiais parciais</span></article><article><strong>{counts.get('previous_technical_pending_revalidation') ?? 0}</strong><span>a revalidar</span></article><article><strong>{counts.get('pending') ?? 0}</strong><span>pendentes de ficha</span></article></section>
    <nav className="appNav" aria-label="Módulos da calculadora">
      <button className={view === 'assistant' ? 'active' : ''} onClick={() => setView('assistant')}><b>Me ajude a escolher</b><small>ambiente e condição</small></button>
      <button className={view === 'reservoir' ? 'active' : ''} onClick={() => setView('reservoir')}><b>Reservatórios</b><small>módulo guiado</small></button>
      <button className={view === 'product' ? 'active' : ''} onClick={() => setView('product')}><b>Por produto</b><small>motor genérico</small></button>
      <button className={view === 'system' ? 'active' : ''} onClick={() => setView('system')}><b>Por sistema</b><small>composição completa</small></button>
      <button className={view === 'project' ? 'active' : ''} onClick={() => setView('project')}><b>Projeto / Obra {project.calculations.length > 0 && <em>{project.calculations.length}</em>}</b><small>materiais e proposta</small></button>
      <button className={view === 'catalog' ? 'active' : ''} onClick={() => setView('catalog')}><b>Banco técnico</b><small>auditoria</small></button>
    </nav>
    {view === 'assistant' && <TechnicalAssistant onOpenProduct={() => setView('product')} onOpenReservoir={() => setView('reservoir')} onOpenSystem={() => setView('system')} />}
    {view === 'reservoir' && <ReservoirCalculator />}
    {view === 'product' && <ProductCalculator />}
    {view === 'system' && <SystemCalculator />}
    {view === 'project' && <ProjectDashboard />}
    {view === 'catalog' && <section className="panel"><div className="panelHead"><div><div className="eyebrow dark">BANCO V9</div><h2>Catálogo mestre</h2><p>Produtos sem fonte técnica suficiente permanecem bloqueados para cálculo automático.</p></div><div className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." aria-label="Buscar produto" /><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos os status</option><option value="verified_mixed">Verificados</option><option value="official_partial">Oficiais parciais</option><option value="previous_technical_pending_revalidation">Revalidar ficha</option><option value="pending">Pendentes</option></select></div></div><div className="productGrid">{products.map((product) => <article className="productCard" key={product.id}><div className={`status status-${product.technicalStatus}`}>{statusLabel[product.technicalStatus]}</div><h3>{product.name}</h3><p>{product.packageLabel}</p><div className="productMeta"><span>{product.calculationModel}</span><span>{product.categoryId}</span></div><a href={product.officialUrl} target="_blank" rel="noreferrer">Página oficial ↗</a></article>)}</div></section>}
    <footer className="appFooter"><strong>IMPERTUDO • Calculadora Técnica V9.0</strong><span>Pré-dimensionamento. Verifique ficha técnica vigente, projeto, condições da obra e medidas in loco.</span></footer>
  </main>
}
