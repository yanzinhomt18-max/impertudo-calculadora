import type { PackageOption } from '../db/types'

export type QuantityUnit = PackageOption['unit']
export type UnitFamily = 'mass' | 'volume' | 'linear' | 'area'

export interface BaseQuantity {
  family: UnitFamily
  value: number
}

export function toBaseQuantity(quantity: number, unit: QuantityUnit): BaseQuantity {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Quantidade inválida.')
  }

  switch (unit) {
    case 'kg': return { family: 'mass', value: Math.round(quantity * 1000) }
    case 'g': return { family: 'mass', value: Math.round(quantity) }
    case 'L': return { family: 'volume', value: Math.round(quantity * 1000) }
    case 'm': return { family: 'linear', value: Math.round(quantity * 1000) }
    case 'm2': return { family: 'area', value: Math.round(quantity * 1_000_000) }
  }
}

export function fromBaseQuantity(value: number, unit: QuantityUnit): number {
  switch (unit) {
    case 'kg': return value / 1000
    case 'g': return value
    case 'L': return value / 1000
    case 'm': return value / 1000
    case 'm2': return value / 1_000_000
  }
}

export function assertCompatibleUnit(a: QuantityUnit, b: QuantityUnit): void {
  const fa = toBaseQuantity(0, a).family
  const fb = toBaseQuantity(0, b).family
  if (fa !== fb) throw new Error(`Unidades incompatíveis: ${a} e ${b}.`)
}

export function roundQuantity(value: number, decimals = 3): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}
