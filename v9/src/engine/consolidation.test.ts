import { describe, expect, it } from 'vitest'
import { calculateQuoteTotals, consolidateCalculations } from './consolidation'
import type { ProjectCalculation } from '../project/types'

function calc(id: string, min: number, max: number): ProjectCalculation {
  return {
    id,
    kind: 'product',
    title: 'Teste',
    createdAt: '2026-08-19T00:00:00Z',
    metrics: [],
    notes: [],
    materials: [{
      productId: 'impertudo-top',
      productName: 'IMPERTUDO TOP',
      minQuantity: min,
      maxQuantity: max,
      unit: 'kg'
    }]
  }
}

function telaCalc(id: string, variantKey: string, packageTypeConstraint: string, unit: 'm' | 'm2', quantity: number): ProjectCalculation {
  return {
    id,
    kind: 'product',
    title: 'Tela',
    createdAt: '2026-08-19T00:00:00Z',
    metrics: [],
    notes: [],
    materials: [{
      productId: 'impertudo-tela-de-poliester',
      productName: 'IMPERTUDO TELA DE POLIÉSTER',
      minQuantity: quantity,
      maxQuantity: quantity,
      unit,
      variantKey,
      variantLabel: variantKey,
      packageTypeConstraint
    }]
  }
}

describe('consolidação do projeto', () => {
  it('soma a necessidade antes de arredondar embalagens', () => {
    const result = consolidateCalculations([calc('a', 10, 10), calc('b', 10, 10)])
    expect(result).toHaveLength(1)
    expect(result[0].maxQuantity).toBe(20)
    expect(result[0].recommendedMix?.purchased).toBe(36)
  })

  it('não mistura variantes comerciais do mesmo produto', () => {
    const result = consolidateCalculations([
      telaCalc('a', 'linear-10cm', 'roll-10cm', 'm', 40),
      telaCalc('b', 'linear-20cm', 'roll-20cm', 'm', 40)
    ])
    expect(result).toHaveLength(2)
    expect(result.map((item) => item.packageTypeConstraint).sort()).toEqual(['roll-10cm', 'roll-20cm'])
    expect(result.every((item) => item.recommendedMix?.items.length === 1)).toBe(true)
  })

  it('separa famílias de unidade do mesmo produto', () => {
    const result = consolidateCalculations([
      telaCalc('a', 'area', 'roll-1m', 'm2', 40),
      telaCalc('b', 'linear-10cm', 'roll-10cm', 'm', 40)
    ])
    expect(result).toHaveLength(2)
    expect(new Set(result.map((item) => item.unit))).toEqual(new Set(['m2', 'm']))
  })

  it('separa desconto comercial do desconto à vista', () => {
    const totals = calculateQuoteTotals([
      {
        key: 'x', productId: 'x', productName: 'X', package: null,
        packageLabel: 'un', count: 2, unitPrice: 100,
        discountType: 'pct', discountValue: 10,
        gross: 200, discount: 20, net: 180
      }
    ], 5, 'pix')
    expect(totals.netBase).toBe(180)
    expect(totals.cashDiscount).toBe(9)
    expect(totals.cashTotal).toBe(171)
    expect(totals.cardTotal).toBe(180)
  })
})
