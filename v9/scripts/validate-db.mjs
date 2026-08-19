import fs from 'node:fs'

const read = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'))
const meta = read('../src/data/catalog-meta.json')
const chunks = [1,2,3,4,5].map((n) => read(`../src/data/products-${n}.json`).products)
const baseProducts = chunks.flat()
const overridesFile = read('../src/data/verified-overrides.json')
const categories = read('../src/data/categories.json')
const areas = read('../src/data/application-areas.json')
const systems = read('../src/data/systems.json')

const errors = []
const baseIds = new Set(baseProducts.map((x) => x.id))
const overrideIds = new Set()
const overrides = new Map()

for (const override of overridesFile.overrides ?? []) {
  if (!override?.id) {
    errors.push('Override sem id.')
    continue
  }
  if (overrideIds.has(override.id)) errors.push(`Override duplicado: ${override.id}`)
  overrideIds.add(override.id)
  if (!baseIds.has(override.id)) errors.push(`Override aponta para produto inexistente: ${override.id}`)
  overrides.set(override.id, override)
}

const merged = baseProducts.map((product) => ({ ...product, ...(overrides.get(product.id) ?? {}), id: product.id }))
const products = { ...meta, products: merged }
const ids = new Set()
const categoryIds = new Set(categories.categories.map((x) => x.id))
const areaIds = new Set(areas.areas.map((x) => x.id))
const productIds = new Set(products.products.map((x) => x.id))

if (products.products.length !== products.meta.productCount) {
  errors.push(`productCount=${products.meta.productCount}, real=${products.products.length}`)
}

for (const product of products.products) {
  if (ids.has(product.id)) errors.push(`ID duplicado: ${product.id}`)
  ids.add(product.id)
  if (!categoryIds.has(product.categoryId)) errors.push(`Categoria inexistente: ${product.name} -> ${product.categoryId}`)
  for (const areaId of product.applicationAreaIds ?? []) {
    if (!areaIds.has(areaId)) errors.push(`Área inexistente: ${product.name} -> ${areaId}`)
  }
  if (!String(product.officialUrl).startsWith('https://impertudo.com.br/')) {
    errors.push(`URL não oficial: ${product.name}`)
  }
  if (product.technicalStatus === 'pending' && Object.keys(product.technical ?? {}).length) {
    errors.push(`Produto pending com regra técnica ativa: ${product.name}`)
  }
}

for (const system of systems.systems) {
  for (const layer of system.layers ?? []) {
    if (!productIds.has(layer.productId)) errors.push(`Sistema ${system.id} aponta para produto inexistente: ${layer.productId}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Banco V9 válido: ${products.products.length} produtos, ${categoryIds.size} categorias, ${areaIds.size} ambientes, ${systems.systems.length} sistemas, ${overrideIds.size} revisões oficiais.`)
