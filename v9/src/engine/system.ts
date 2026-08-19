import { productsById, systems } from '../db'
import type { ProductRecord } from '../db/types'
import { calculateConsumptionRange, type ConsumptionRule } from './consumption'
import { calculatePackageRange, optimizePackageMix, type PackageCountResult, type PackageMixResult } from './packaging'
import type { QuantityUnit } from './units'

interface SystemLayerDefinition {
  order: number
  productId: string
  role: string
  calculation: {
    type: 'area_consumption'
    min: number
    max: number
    unit: string
  }
}

export interface SystemDefinition {
  id: string
  name: string
  status: string
  areaIds?: string[]
  conditions?: Record<string, unknown>
  layers: SystemLayerDefinition[]
  notes?: string[]
}

export interface SystemLayerResult {
  productId: string
  productName: string
  role: string
  minQuantity: number
  maxQuantity: number
  unit: QuantityUnit
  consumptionLabel: string
  packages: PackageCountResult[]
  recommendedMix: PackageMixResult | null
}

export interface SystemCalculationResult {
  systemId: string
  systemName: string
  areaM2: number
  layers: SystemLayerResult[]
  notes: string[]
}

export const systemDefinitions = systems as unknown as SystemDefinition[]

function productOrThrow(productId: string): ProductRecord {
  const product = productsById.get(productId)
  if (!product) throw new Error(`Produto ${productId} não encontrado no banco V9.`)
  if (product.technicalStatus !== 'verified_mixed' && product.technicalStatus !== 'official_partial') {
    throw new Error(`${product.name} ainda não está liberado para cálculo automático na V9.`)
  }
  return product
}

export function calculateSystem(systemId: string, areaM2: number): SystemCalculationResult {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) throw new Error('Área de cálculo inválida.')
  const system = systemDefinitions.find((item) => item.id === systemId)
  if (!system) throw new Error('Sistema não encontrado no banco V9.')

  const layers = [...system.layers]
    .sort((a, b) => a.order - b.order)
    .map((layer): SystemLayerResult => {
      if (layer.calculation.type !== 'area_consumption') {
        throw new Error(`O sistema ${system.name} possui uma camada ainda não suportada pelo motor genérico.`)
      }
      const product = productOrThrow(layer.productId)
      const rule: ConsumptionRule = {
        id: `${system.id}-${layer.productId}-${layer.order}`,
        label: layer.role,
        min: layer.calculation.min,
        max: layer.calculation.max,
        unit: layer.calculation.unit
      }
      const consumption = calculateConsumptionRange(areaM2, rule)
      return {
        productId: product.id,
        productName: product.name,
        role: layer.role,
        minQuantity: consumption.minQuantity,
        maxQuantity: consumption.maxQuantity,
        unit: consumption.materialUnit,
        consumptionLabel: rule.min === rule.max ? `${rule.max} ${rule.unit}` : `${rule.min} a ${rule.max} ${rule.unit}`,
        packages: calculatePackageRange(consumption.minQuantity, consumption.maxQuantity, consumption.materialUnit, product.packages),
        recommendedMix: optimizePackageMix(consumption.maxQuantity, consumption.materialUnit, product.packages)
      }
    })

  return {
    systemId: system.id,
    systemName: system.name,
    areaM2,
    layers,
    notes: system.notes ?? []
  }
}
