import type { ProductRecord } from '../db/types'
import type { QuantityUnit } from './units'
import { roundQuantity } from './units'

export interface ConsumptionRule {
  id: string
  label?: string
  min: number
  max: number
  unit: string
  coatsMin?: number
  coatsMax?: number
  sourceRef?: string
}

export interface ConsumptionRangeResult {
  areaM2: number
  rule: ConsumptionRule
  materialUnit: QuantityUnit
  minQuantity: number
  maxQuantity: number
}

export function parseConsumptionUnit(unit: string): QuantityUnit {
  const normalized = unit.toLowerCase().replace(/²/g, '2').replace(/\s/g, '')
  if (normalized.startsWith('kg/')) return 'kg'
  if (normalized.startsWith('g/')) return 'g'
  if (normalized.startsWith('l/')) return 'L'
  throw new Error(`Unidade de consumo ainda não suportada: ${unit}`)
}

export function calculateConsumptionRange(areaM2: number, rule: ConsumptionRule): ConsumptionRangeResult {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) throw new Error('Área de cálculo inválida.')
  if (!Number.isFinite(rule.min) || !Number.isFinite(rule.max) || rule.min < 0 || rule.max <= 0 || rule.max < rule.min) {
    throw new Error('Faixa de consumo inválida.')
  }

  const materialUnit = parseConsumptionUnit(rule.unit)
  return {
    areaM2: roundQuantity(areaM2, 4),
    rule,
    materialUnit,
    minQuantity: roundQuantity(areaM2 * rule.min, 4),
    maxQuantity: roundQuantity(areaM2 * rule.max, 4)
  }
}

export function getConsumptionRules(product: ProductRecord): ConsumptionRule[] {
  const technical = product.technical as { consumptionRules?: unknown }
  if (!Array.isArray(technical.consumptionRules)) return []

  return technical.consumptionRules.filter((item): item is ConsumptionRule => {
    if (!item || typeof item !== 'object') return false
    const rule = item as Partial<ConsumptionRule>
    return typeof rule.id === 'string'
      && typeof rule.min === 'number'
      && typeof rule.max === 'number'
      && typeof rule.unit === 'string'
  })
}

export function getConsumptionRule(product: ProductRecord, ruleId: string): ConsumptionRule {
  const rule = getConsumptionRules(product).find((item) => item.id === ruleId)
  if (!rule) throw new Error(`Regra técnica ${ruleId} não encontrada para ${product.name}.`)
  return rule
}
