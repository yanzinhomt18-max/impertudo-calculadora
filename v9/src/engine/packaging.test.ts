import { describe, expect, it } from 'vitest'
import { calculatePackageRange, optimizePackageMix } from './packaging'

const box18 = { quantity: 18, unit: 'kg' as const, packageType: 'box' }
const gallon36 = { quantity: 3.6, unit: 'kg' as const, packageType: 'gallon' }

describe('motor de embalagens', () => {
  it('arredonda mínimo e máximo para embalagem comercial inteira', () => {
    const [result] = calculatePackageRange(60, 100, 'kg', [box18])
    expect(result.minCount).toBe(4)
    expect(result.maxCount).toBe(6)
    expect(result.minPurchased).toBe(72)
    expect(result.maxPurchased).toBe(108)
    expect(result.maxSurplus).toBe(8)
  })

  it('encontra combinação de embalagens com menor sobra', () => {
    const result = optimizePackageMix(100, 'kg', [box18, gallon36])
    expect(result).not.toBeNull()
    expect(result?.purchased).toBe(100.8)
    expect(result?.surplus).toBe(0.8)
    expect(result?.items.reduce((sum, item) => sum + item.count, 0)).toBe(8)
  })

  it('ignora embalagens de unidade incompatível', () => {
    const result = optimizePackageMix(20, 'kg', [box18, { quantity: 5, unit: 'L' }])
    expect(result?.items).toHaveLength(1)
    expect(result?.items[0].package.unit).toBe('kg')
  })
})
