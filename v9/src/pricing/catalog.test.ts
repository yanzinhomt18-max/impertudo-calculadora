import { describe, expect, it } from 'vitest'
import {
  applyCatalogToPricing,
  createEmptyPriceCatalog,
  mergePricingWithCatalog,
  normalizePriceCatalog,
  parsePriceCatalog,
  serializePriceCatalog,
  upsertCatalogPrice
} from './catalog'

describe('tabela central de preços', () => {
  it('normaliza entradas inválidas sem quebrar o catálogo', () => {
    const catalog = normalizePriceCatalog({ version: 1, entries: { a: { key: 'a', unitPrice: '12.5', productName: 'A' } } })
    expect(catalog.entries.a.unitPrice).toBe(12.5)
    expect(catalog.entries.a.productName).toBe('A')
  })

  it('usa o preço central quando a obra ainda não possui preço próprio', () => {
    let catalog = createEmptyPriceCatalog()
    catalog = upsertCatalogPrice(catalog, { key: 'p|18|kg|bucket', productId: 'p', productName: 'Produto', packageLabel: 'Balde 18 kg' }, 99.9)
    const merged = mergePricingWithCatalog({}, catalog)
    expect(merged['p|18|kg|bucket'].unitPrice).toBe(99.9)
  })

  it('preserva o preço histórico já gravado na obra', () => {
    let catalog = createEmptyPriceCatalog()
    catalog = upsertCatalogPrice(catalog, { key: 'x', productId: 'x', productName: 'X', packageLabel: 'Unidade' }, 150)
    const merged = mergePricingWithCatalog({ x: { unitPrice: 120, discountType: 'pct', discountValue: 5 } }, catalog)
    expect(merged.x.unitPrice).toBe(120)
    expect(merged.x.discountValue).toBe(5)
  })

  it('atualiza uma obra pela tabela atual sem apagar descontos', () => {
    let catalog = createEmptyPriceCatalog()
    catalog = upsertCatalogPrice(catalog, { key: 'x', productId: 'x', productName: 'X', packageLabel: 'Unidade' }, 200)
    const result = applyCatalogToPricing({ x: { unitPrice: 120, discountType: 'value', discountValue: 15 } }, catalog, ['x'])
    expect(result.applied).toBe(1)
    expect(result.pricing.x.unitPrice).toBe(200)
    expect(result.pricing.x.discountType).toBe('value')
    expect(result.pricing.x.discountValue).toBe(15)
  })

  it('faz snapshot apenas de preços ausentes quando solicitado', () => {
    let catalog = createEmptyPriceCatalog()
    catalog = upsertCatalogPrice(catalog, { key: 'a', productId: 'a', productName: 'A', packageLabel: 'A' }, 10)
    catalog = upsertCatalogPrice(catalog, { key: 'b', productId: 'b', productName: 'B', packageLabel: 'B' }, 20)
    const result = applyCatalogToPricing({ a: { unitPrice: 7, discountType: 'pct', discountValue: 0 } }, catalog, ['a', 'b'], true)
    expect(result.pricing.a.unitPrice).toBe(7)
    expect(result.pricing.b.unitPrice).toBe(20)
    expect(result.applied).toBe(1)
  })

  it('exporta e importa a tabela sem perder os preços', () => {
    let catalog = createEmptyPriceCatalog()
    catalog = upsertCatalogPrice(catalog, { key: 'x', productId: 'x', productName: 'X', packageLabel: 'Caixa' }, 33.45)
    const restored = parsePriceCatalog(serializePriceCatalog(catalog))
    expect(restored.entries.x.unitPrice).toBe(33.45)
  })
})
