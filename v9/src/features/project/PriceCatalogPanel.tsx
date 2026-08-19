import { useMemo, useRef, useState } from 'react'
import { productDatabase } from '../../db'
import { packageLabel, pricingKey } from '../../engine/consolidation'
import { useProject } from '../../project/ProjectContext'
import './priceCatalog.css'

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const dateLabel = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) || date.getTime() === 0 ? '—' : new Intl.DateTimeFormat('pt-BR').format(date)
}

interface CatalogRow {
  key: string
  productId: string
  productName: string
  packageLabel: string
  search: string
}

export default function PriceCatalogPanel() {
  const { priceCatalog, updateCatalogPrice, clearCatalogPrice, exportPriceCatalog, importPriceCatalog } = useProject()
  const [query, setQuery] = useState('')
  const [onlyPriced, setOnlyPriced] = useState(false)
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const rows = useMemo<CatalogRow[]>(() => productDatabase.products.flatMap((product) => product.packages.map((pack) => {
    const label = packageLabel(pack)
    return {
      key: pricingKey(product.id, pack),
      productId: product.id,
      productName: product.name,
      packageLabel: label,
      search: `${product.name} ${label}`.toLocaleLowerCase('pt-BR')
    }
  })).sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR') || a.packageLabel.localeCompare(b.packageLabel, 'pt-BR')), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return rows.filter((row) => (!q || row.search.includes(q)) && (!onlyPriced || (priceCatalog.entries[row.key]?.unitPrice ?? 0) > 0))
  }, [rows, query, onlyPriced, priceCatalog])

  const configured = rows.filter((row) => (priceCatalog.entries[row.key]?.unitPrice ?? 0) > 0).length

  function downloadCatalog() {
    const blob = new Blob([exportPriceCatalog()], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `impertudo-tabela-precos-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Tabela exportada ✓')
  }

  async function importFile(file?: File) {
    if (!file) return
    try {
      const text = await file.text()
      const count = importPriceCatalog(text)
      setStatus(`${count} preço(s) importado(s) ✓`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível importar a tabela.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="priceCatalogPanel">
      <div className="priceCatalogHead">
        <div>
          <div className="eyebrow dark">FASE 6 • TABELA CENTRAL</div>
          <h2>Preços-base por embalagem</h2>
          <p>O preço central alimenta obras novas. Propostas já precificadas preservam o valor histórico até uma atualização manual.</p>
        </div>
        <div className="priceCatalogSummary"><strong>{configured}</strong><span>de {rows.length} embalagens com preço</span></div>
      </div>

      <div className="priceCatalogToolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto ou embalagem..." aria-label="Buscar na tabela de preços" />
        <label className="priceToggle"><input type="checkbox" checked={onlyPriced} onChange={(event) => setOnlyPriced(event.target.checked)} /><span>Somente com preço</span></label>
        <button className="secondaryButton" onClick={downloadCatalog}>Exportar tabela</button>
        <button className="secondaryButton" onClick={() => fileRef.current?.click()}>Importar tabela</button>
        <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
      </div>

      {status && <div className="catalogStatus">{status}</div>}

      <div className="priceTable" role="table" aria-label="Tabela central de preços IMPERTUDO">
        <div className="priceTableHeader" role="row"><span>Produto</span><span>Embalagem</span><span>Preço-base</span><span>Atualização</span><span></span></div>
        {filtered.map((row) => {
          const entry = priceCatalog.entries[row.key]
          const value = entry?.unitPrice ?? 0
          return <div className="priceTableRow" role="row" key={row.key}>
            <strong>{row.productName}</strong>
            <span>{row.packageLabel}</span>
            <label><span className="mobileFieldLabel">Preço-base</span><input type="number" min="0" step="0.01" value={value || ''} placeholder="0,00" onChange={(event) => updateCatalogPrice(row, Math.max(0, Number(event.target.value) || 0))} /></label>
            <small>{entry ? `${dateLabel(entry.updatedAt)} • ${money(value)}` : '—'}</small>
            <button disabled={!entry} onClick={() => clearCatalogPrice(row.key)}>Limpar</button>
          </div>
        })}
      </div>
      {!filtered.length && <div className="emptyState small">Nenhuma embalagem corresponde ao filtro atual.</div>}
      <p className="disclaimer">A tabela central armazena preço-base comercial. Descontos percentuais ou em R$ continuam específicos de cada proposta.</p>
    </section>
  )
}
