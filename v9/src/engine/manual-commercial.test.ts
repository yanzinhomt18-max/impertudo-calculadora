import { describe, expect, it } from 'vitest'
import { buildManualCommercialLines, calculateQuoteTotals } from './consolidation'
import type { ManualQuoteItem } from '../project/types'

const base: ManualQuoteItem = {
  id: 'service-1',
  category: 'service',
  description: 'Aplicação de impermeabilização',
  quantity: 100,
  unitLabel: 'm²',
  unitPrice: 40,
  discountType: 'pct',
  discountValue: 10
}

describe('itens comerciais manuais', () => {
  it('calcula mão de obra com quantidade, preço e desconto', () => {
    const [line] = buildManualCommercialLines([base])
    expect(line.source).toBe('manual')
    expect(line.gross).toBe(4000)
    expect(line.discount).toBe(400)
    expect(line.net).toBe(3600)
  })

  it('aceita desconto fixo limitado ao total do item', () => {
    const [line] = buildManualCommercialLines([{ ...base, quantity: 1, unitPrice: 100, discountType: 'value', discountValue: 150 }])
    expect(line.discount).toBe(100)
    expect(line.net).toBe(0)
  })

  it('soma materiais e serviços no mesmo totalizador', () => {
    const manual = buildManualCommercialLines([{ ...base, quantity: 1, unitPrice: 500, discountValue: 0 }])
    const totals = calculateQuoteTotals([
      ...manual,
      {
        key: 'material', productId: 'p', productName: 'Produto', package: null,
        packageLabel: 'Caixa', count: 2, unitPrice: 100,
        discountType: 'pct', discountValue: 0,
        gross: 200, discount: 0, net: 200, source: 'material'
      }
    ], 5, 'pix')
    expect(totals.netBase).toBe(700)
    expect(totals.cashTotal).toBe(665)
  })
})
