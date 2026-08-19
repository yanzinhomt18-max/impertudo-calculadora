import type { PricingRecord } from '../project/types'

const STORAGE_KEY = 'impertudo-v9-price-catalog-v1'

export interface PriceCatalogEntry {
  key: string
  productId: string
  productName: string
  packageLabel: string
  unitPrice: number
  updatedAt: string
}

export interface PriceCatalog {
  version: 1
  updatedAt: string
  entries: Record<string, PriceCatalogEntry>
}

export interface PriceCatalogEntryMeta {
  key: string
  productId: string
  productName: string
  packageLabel: string
}

export function createEmptyPriceCatalog(): PriceCatalog {
  return { version: 1, updatedAt: new Date(0).toISOString(), entries: {} }
}

function safePrice(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function normalizePriceCatalog(value: unknown): PriceCatalog {
  const empty = createEmptyPriceCatalog()
  if (!value || typeof value !== 'object') return empty
  const raw = value as { version?: unknown; updatedAt?: unknown; entries?: unknown }
  if (raw.version !== 1 || !raw.entries || typeof raw.entries !== 'object') return empty

  const entries: Record<string, PriceCatalogEntry> = {}
  for (const [key, candidate] of Object.entries(raw.entries as Record<string, unknown>)) {
    if (!candidate || typeof candidate !== 'object') continue
    const item = candidate as Partial<PriceCatalogEntry>
    const finalKey = typeof item.key === 'string' && item.key ? item.key : key
    if (!finalKey) continue
    entries[finalKey] = {
      key: finalKey,
      productId: typeof item.productId === 'string' ? item.productId : '',
      productName: typeof item.productName === 'string' ? item.productName : finalKey,
      packageLabel: typeof item.packageLabel === 'string' ? item.packageLabel : '',
      unitPrice: safePrice(item.unitPrice),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date(0).toISOString()
    }
  }

  const updatedAt = typeof raw.updatedAt === 'string'
    ? raw.updatedAt
    : Object.values(entries).map((item) => item.updatedAt).sort().at(-1) ?? new Date(0).toISOString()
  return { version: 1, updatedAt, entries }
}

export function upsertCatalogPrice(catalog: PriceCatalog, meta: PriceCatalogEntryMeta, unitPrice: number): PriceCatalog {
  const now = new Date().toISOString()
  const entry: PriceCatalogEntry = {
    ...meta,
    unitPrice: safePrice(unitPrice),
    updatedAt: now
  }
  return {
    version: 1,
    updatedAt: now,
    entries: { ...catalog.entries, [meta.key]: entry }
  }
}

export function removeCatalogPrice(catalog: PriceCatalog, key: string): PriceCatalog {
  if (!(key in catalog.entries)) return catalog
  const entries = { ...catalog.entries }
  delete entries[key]
  return { version: 1, updatedAt: new Date().toISOString(), entries }
}

export function mergePricingWithCatalog(pricing: Record<string, PricingRecord>, catalog: PriceCatalog): Record<string, PricingRecord> {
  const merged: Record<string, PricingRecord> = {}
  for (const [key, entry] of Object.entries(catalog.entries)) {
    if (entry.unitPrice > 0) merged[key] = { unitPrice: entry.unitPrice, discountType: 'pct', discountValue: 0 }
  }
  for (const [key, item] of Object.entries(pricing)) {
    const catalogPrice = merged[key]?.unitPrice ?? 0
    merged[key] = {
      unitPrice: item.unitPrice > 0 ? item.unitPrice : catalogPrice,
      discountType: item.discountType === 'value' ? 'value' : 'pct',
      discountValue: Math.max(0, Number(item.discountValue) || 0)
    }
  }
  return merged
}

export function applyCatalogToPricing(
  pricing: Record<string, PricingRecord>,
  catalog: PriceCatalog,
  keys?: string[],
  onlyMissing = false
): { pricing: Record<string, PricingRecord>; applied: number } {
  const targetKeys = keys?.length ? [...new Set(keys)] : Object.keys(catalog.entries)
  let applied = 0
  const next = { ...pricing }
  for (const key of targetKeys) {
    const catalogEntry = catalog.entries[key]
    if (!catalogEntry || catalogEntry.unitPrice <= 0) continue
    const existing = next[key]
    if (onlyMissing && existing?.unitPrice && existing.unitPrice > 0) continue
    next[key] = {
      unitPrice: catalogEntry.unitPrice,
      discountType: existing?.discountType === 'value' ? 'value' : 'pct',
      discountValue: Math.max(0, Number(existing?.discountValue) || 0)
    }
    applied += 1
  }
  return { pricing: next, applied }
}

export function serializePriceCatalog(catalog: PriceCatalog): string {
  return JSON.stringify({ ...catalog, exportedAt: new Date().toISOString() }, null, 2)
}

export function parsePriceCatalog(text: string): PriceCatalog {
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new Error('Arquivo de tabela de preços inválido.') }
  const normalized = normalizePriceCatalog(parsed)
  if (!Object.keys(normalized.entries).length && (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1)) {
    throw new Error('Arquivo de tabela de preços incompatível com a V9.')
  }
  return normalized
}

export function loadPriceCatalog(): PriceCatalog {
  if (typeof localStorage === 'undefined') return createEmptyPriceCatalog()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizePriceCatalog(JSON.parse(raw)) : createEmptyPriceCatalog()
  } catch {
    return createEmptyPriceCatalog()
  }
}

export function savePriceCatalog(catalog: PriceCatalog): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
    return true
  } catch {
    return false
  }
}
