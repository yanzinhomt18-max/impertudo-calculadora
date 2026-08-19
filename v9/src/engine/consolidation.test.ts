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

describe('consolidação do projeto', () => {
  it('soma a necessidade antes de arredondar embalagens', () => {
    const result = consolidateCalculations([calc('a', 10, 10), calc('b', 10, 10)])
    expect(result).toHaveLength(1)
    expect(result[0].maxQuantity).toBe(20)
    expect(result[0].recommendedMix?.purchased).toBe(36)
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
