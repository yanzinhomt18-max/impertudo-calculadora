import { describe, expect, it } from 'vitest'
import { calculateSystem } from './system'

describe('motor genérico por sistema', () => {
  it('calcula sistema enterrado em camadas', () => {
    const result = calculateSystem('reservoir-buried-topflex', 10)
    expect(result.layers).toHaveLength(2)
    expect(result.layers[0].productId).toBe('impertudo-top')
    expect(result.layers[0].maxQuantity).toBe(20)
    expect(result.layers[1].productId).toBe('impertudo-top-flex-fibras')
    expect(result.layers[1].maxQuantity).toBe(45)
  })

  it('calcula sistema de área molhada', () => {
    const result = calculateSystem('wet-area-topflex', 12)
    expect(result.layers).toHaveLength(1)
    expect(result.layers[0].maxQuantity).toBe(36)
    expect(result.layers[0].recommendedMix?.purchased).toBe(36)
  })
})
