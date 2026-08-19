import { describe, expect, it } from 'vitest'
import { calculateProduct, isProductAutoCalculable } from './product'
import { productsById } from '../db'

describe('motor genérico por produto', () => {
  it('calcula IMPERTUDO TOP por faixa técnica', () => {
    const result = calculateProduct({
      productId: 'impertudo-top',
      areaM2: 20,
      wastePercent: 0,
      optionId: 'negative-10mca'
    })
    expect(result.minQuantity).toBe(80)
    expect(result.maxQuantity).toBe(100)
    expect(result.recommendedMix?.purchased).toBe(108)
  })

  it('inverte corretamente faixa de rendimento m²/L', () => {
    const result = calculateProduct({
      productId: 'impertudo-resina-acrilica',
      areaM2: 100,
      wastePercent: 0,
      optionId: 'tiles-bricks'
    })
    expect(result.minQuantity).toBe(10)
    expect(result.maxQuantity).toBe(12.5)
  })

  it('calcula rolos pela área nominal e margem', () => {
    const result = calculateProduct({
      productId: 'impertudo-manta-asfaltica-iii-b-poliester',
      areaM2: 21,
      wastePercent: 0
    })
    expect(result.recommendedMix?.items[0].count).toBe(3)
  })

  it('bloqueia produto apenas herdado e ainda não revalidado', () => {
    const product = productsById.get('impertudo-pu-40-flex')
    expect(product).toBeDefined()
    expect(isProductAutoCalculable(product!)).toBe(false)
  })
})
