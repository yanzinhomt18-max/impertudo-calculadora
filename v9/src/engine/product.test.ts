import { describe, expect, it } from 'vitest'
import { calculateProduct, isProductAutoCalculable } from './product'
import { productsById } from '../db'

describe('motor genérico por produto', () => {
  it('calcula IMPERTUDO TOP por faixa técnica', () => {
    const result = calculateProduct({ productId: 'impertudo-top', areaM2: 20, wastePercent: 0, optionId: 'negative-10mca' })
    expect(result.minQuantity).toBe(80)
    expect(result.maxQuantity).toBe(100)
    expect(result.recommendedMix?.purchased).toBe(108)
  })

  it('inverte corretamente faixa de rendimento m²/L', () => {
    const result = calculateProduct({ productId: 'impertudo-resina-acrilica', areaM2: 100, wastePercent: 0, optionId: 'tiles-bricks' })
    expect(result.minQuantity).toBe(10)
    expect(result.maxQuantity).toBe(12.5)
  })

  it('calcula rolos pela área nominal e margem', () => {
    const result = calculateProduct({ productId: 'impertudo-manta-asfaltica-iii-b-poliester', areaM2: 21, wastePercent: 0 })
    expect(result.recommendedMix?.items[0].count).toBe(3)
  })

  it('libera LAJE PRETO após revisão oficial e usa consumo mínimo de 3 kg/m²', () => {
    const result = calculateProduct({ productId: 'impertudo-laje-preto', areaM2: 20, wastePercent: 0 })
    expect(result.minQuantity).toBe(60)
    expect(result.maxQuantity).toBe(60)
    expect(result.recommendedMix?.purchased).toBe(72)
  })

  it('libera MANTA IV B POLIÉSTER como rolo 1 x 10 m', () => {
    const result = calculateProduct({ productId: 'impertudo-manta-asfaltica-iv-b-poliester', areaM2: 21, wastePercent: 0 })
    expect(result.recommendedMix?.items[0].count).toBe(3)
  })

  it('calcula ADMIX CRISTAL C por volume de concreto', () => {
    const result = calculateProduct({ productId: 'impertudo-admix-cristal-c', optionId: 'concrete', concreteVolumeM3: 10 })
    expect(result.minQuantity).toBe(8000)
    expect(result.maxQuantity).toBe(8000)
    expect(result.unit).toBe('g')
    expect(result.recommendedMix?.items[0].count).toBe(10)
  })

  it('calcula ADMIX CRISTAL C em pintura a 80 g/m²', () => {
    const result = calculateProduct({ productId: 'impertudo-admix-cristal-c', optionId: 'area', areaM2: 20, wastePercent: 0 })
    expect(result.minQuantity).toBe(1600)
    expect(result.maxQuantity).toBe(1600)
    expect(result.recommendedMix?.items[0].count).toBe(2)
  })

  it('calcula CHAPISCO CONCENTRADO por perfil oficial', () => {
    const result = calculateProduct({ productId: 'impertudo-chapisco-concentrado', optionId: 'conventional', areaM2: 100, wastePercent: 0 })
    expect(result.minQuantity).toBe(20)
    expect(result.maxQuantity).toBe(30)
    expect(result.recommendedMix?.purchased).toBe(50)
  })

  it('mantém PU 40 bloqueado até haver referência numérica de junta', () => {
    const product = productsById.get('impertudo-pu-40')
    expect(product?.technicalStatus).toBe('official_partial')
    expect(isProductAutoCalculable(product!)).toBe(false)
  })

  it('bloqueia produto apenas herdado e ainda não revalidado', () => {
    const product = productsById.get('impertudo-pu-40-flex')
    expect(product).toBeDefined()
    expect(isProductAutoCalculable(product!)).toBe(false)
  })
})
