import { describe, expect, it } from 'vitest'
import { calculateProduct, isProductAutoCalculable } from './product'
import { productsById } from '../db'

describe('fase 5 — referências técnicas internas IMPERTUDO', () => {
  it('calcula GRAUTE FLUIDO a 2.200 kg/m³ e converte para sacos de 25 kg', () => {
    const result = calculateProduct({
      productId: 'impertudo-graute-fluido',
      optionId: 'concrete-graute',
      concreteVolumeM3: 1
    })
    expect(result.minQuantity).toBe(2200)
    expect(result.maxQuantity).toBe(2200)
    expect(result.unit).toBe('kg')
    expect(result.recommendedMix?.purchased).toBe(2200)
    expect(result.recommendedMix?.items[0].count).toBe(88)
  })

  it('calcula MEMBRANA ALUMÍNIO pelo consumo total de 3 kg/m²', () => {
    const result = calculateProduct({
      productId: 'impertudo-membrana-aluminio',
      areaM2: 10,
      wastePercent: 0,
      optionId: 'system'
    })
    expect(result.minQuantity).toBe(30)
    expect(result.maxQuantity).toBe(30)
    expect(result.unit).toBe('kg')
    expect(result.recommendedMix?.purchased).toBe(30)
  })

  it('calcula PU 40 a 150 g/m para junta de 10 × 10 mm', () => {
    const result = calculateProduct({
      productId: 'impertudo-pu-40',
      jointLengthM: 10,
      jointWidthMm: 10,
      jointDepthMm: 10
    })
    expect(result.minQuantity).toBe(1500)
    expect(result.maxQuantity).toBe(1500)
    expect(result.unit).toBe('g')
    expect(result.recommendedMix?.purchased).toBe(1600)
  })

  it('calcula FITA HIDROEXPANSIVA 2520 em rolos de 5 m', () => {
    const result = calculateProduct({
      productId: 'impertudo-fita-hidroexpansiva-2520',
      optionId: 'linear-roll',
      linearLengthM: 12,
      wastePercent: 0
    })
    expect(result.minQuantity).toBe(12)
    expect(result.unit).toBe('m')
    expect(result.recommendedMix?.items[0].count).toBe(3)
    expect(result.recommendedMix?.items[0].package.packageType).toBe('roll-5m')
  })

  it('mantém MACROFIBRA como faixa de projeto de 2 a 8 kg/m³', () => {
    const result = calculateProduct({
      productId: 'macrofibra-sintetica-polipropileno',
      optionId: 'concrete',
      concreteVolumeM3: 10
    })
    expect(result.minQuantity).toBe(20)
    expect(result.maxQuantity).toBe(80)
    expect(result.unit).toBe('kg')
    expect(result.recommendedMix?.purchased).toBe(84)
  })

  it('mantém HIDROFUGANTE bloqueado até confirmar a embalagem do rendimento de 90 m²', () => {
    const product = productsById.get('impertudo-hidrofugante')
    expect(product).toBeDefined()
    expect(isProductAutoCalculable(product!)).toBe(false)
  })

  it('mantém IMPERTUDO 01 bloqueado até confirmar a base dos 500 ml no concreto', () => {
    const product = productsById.get('impertudo-01')
    expect(product).toBeDefined()
    expect(isProductAutoCalculable(product!)).toBe(false)
  })
})
