import meta from '../data/catalog-meta.json'
import chunk1 from '../data/products-1.json'
import chunk2 from '../data/products-2.json'
import chunk3 from '../data/products-3.json'
import chunk4 from '../data/products-4.json'
import chunk5 from '../data/products-5.json'
import rawCategories from '../data/categories.json'
import rawAreas from '../data/application-areas.json'
import rawSystems from '../data/systems.json'
import { productDatabaseSchema } from './schema'
import type { ProductDatabase } from './types'

const rawDatabase = {
  ...meta,
  products: [
    ...chunk1.products,
    ...chunk2.products,
    ...chunk3.products,
    ...chunk4.products,
    ...chunk5.products
  ]
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
