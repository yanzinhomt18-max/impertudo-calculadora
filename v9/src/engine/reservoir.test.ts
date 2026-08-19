import { describe, expect, it } from 'vitest'
import { calculateReservoir } from './reservoir'

const geometry = {
  shape: 'rectangular' as const,
  structure: 'buried' as const,
  lengthM: 4,
  widthM: 3,
  heightM: 2,
  includeFloor: true,
  includeWalls: true,
  includeCeiling: false,
  wastePercent: 5
}

describe('motor de reservatórios', () => {
  it('calcula sistema enterrado TOP + TOP FLEX FIBRAS', () => {
    const result = calculateReservoir({ ...geometry, solutionMode: 'topflex-system' })
    expect(result.geometry.areaWithWasteM2).toBe(42)
    expect(result.layers).toHaveLength(2)

    const top = result.layers.find((layer) => layer.productId === 'impertudo-top')
    const topFlex = result.layers.find((layer) => layer.productId === 'impertudo-top-flex-fibras')

    expect(top?.maxQuantity).toBe(84)
    expect(top?.packages[0].maxCount).toBe(5)
    expect(topFlex?.maxQuantity).toBe(189)
    expect(topFlex?.packages[0].maxCount).toBe(11)
  })

  it('calcula TOP direto sob pressão negativa usando faixa de 4 a 5 kg/m²', () => {
    const result = calculateReservoir({
      ...geometry,
      solutionMode: 'top-direct',
      topRuleId: 'negative-10mca'
    })

    const layer = result.layers[0]
    expect(layer.minQuantity).toBe(168)
    expect(layer.maxQuantity).toBe(210)
    expect(layer.packages[0].minCount).toBe(10)
    expect(layer.packages[0].maxCount).toBe(12)
  })
})
