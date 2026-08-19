import meta from '../data/catalog-meta.json'
import chunk1 from '../data/products-1.json'
import chunk2 from '../data/products-2.json'
import chunk3 from '../data/products-3.json'
import chunk4 from '../data/products-4.json'
import chunk5 from '../data/products-5.json'
import phase2Overrides from '../data/verified-overrides.json'
import phase3Overrides from '../data/verified-overrides-phase3.json'
import rawCategories from '../data/categories.json'
import rawAreas from '../data/application-areas.json'
import rawSystems from '../data/systems.json'
import { productDatabaseSchema } from './schema'
import type { ProductDatabase } from './types'

const baseProducts = [
  ...chunk1.products,
  ...chunk2.products,
  ...chunk3.products,
  ...chunk4.products,
  ...chunk5.products
]

const overrideById = new Map<string, Record<string, unknown> & { id: string }>()
for (const file of [phase2Overrides, phase3Overrides]) {
  for (const override of file.overrides as Array<Record<string, unknown> & { id: string }>) {
    overrideById.set(override.id, override)
  }
}

const mergedProducts = baseProducts.map((product) => {
  const override = overrideById.get(product.id)
  if (!override) return product
  return { ...product, ...override, id: product.id }
})

const rawDatabase = {
  ...meta,
  products: mergedProducts
}

export const productDatabase: ProductDatabase = productDatabaseSchema.parse(rawDatabase)
export const categories = rawCategories.categories
export const applicationAreas = rawAreas.areas
export const systems = rawSystems.systems

export const productsById = new Map(
  productDatabase.products.map((product) => [product.id, product])
)

export const verifiedProducts = productDatabase.products.filter(
  (product) => product.technicalStatus !== 'pending'
)
