import { describe, expect, it } from 'vitest'
import { calculateArea, calculateReservoirGeometry } from './geometry'

describe('motor geométrico', () => {
  it('calcula área retangular com perda', () => {
    const result = calculateArea({ mode: 'rectangle', lengthM: 10, widthM: 5, wastePercent: 10 })
    expect(result.rawAreaM2).toBe(50)
    expect(result.areaWithWasteM2).toBe(55)
  })

  it('calcula reservatório retangular com piso e paredes', () => {
    const result = calculateReservoirGeometry({
      shape: 'rectangular',
      structure: 'buried',
      lengthM: 4,
      widthM: 3,
      heightM: 2,
      includeFloor: true,
      includeWalls: true,
      includeCeiling: false,
      wastePercent: 5
    })

    expect(result.floorAreaM2).toBe(12)
    expect(result.wallAreaM2).toBe(28)
    expect(result.internalAreaM2).toBe(40)
    expect(result.areaWithWasteM2).toBe(42)
    expect(result.volumeM3).toBe(24)
    expect(result.capacityLiters).toBe(24000)
  })

  it('calcula reservatório cilíndrico sem perder precisão relevante', () => {
    const result = calculateReservoirGeometry({
      shape: 'cylindrical',
      structure: 'elevated',
      diameterM: 4,
      heightM: 2,
      wastePercent: 0
    })

    expect(result.floorAreaM2).toBeCloseTo(12.5664, 4)
    expect(result.wallAreaM2).toBeCloseTo(25.1327, 4)
    expect(result.internalAreaM2).toBeCloseTo(37.6991, 4)
    expect(result.volumeM3).toBeCloseTo(25.1327, 4)
  })
})
