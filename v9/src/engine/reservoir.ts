import { productsById, systems } from '../db'
import type { PackageOption, ProductRecord } from '../db/types'
import { calculateConsumptionRange, getConsumptionRule, type ConsumptionRule } from './consumption'
import { calculatePackageRange, optimizePackageMix, type PackageCountResult, type PackageMixResult } from './packaging'
import { calculateReservoirGeometry, type ReservoirGeometryInput, type ReservoirGeometryResult, type ReservoirStructure } from './geometry'
import type { QuantityUnit } from './units'

export type ReservoirSolutionMode = 'topflex-system' | 'top-direct'
export type TopRuleId = 'soil-moisture' | 'positive-25mca' | 'negative-10mca'

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

interface SystemDefinition {
  id: string
  name: string
  status: string
  conditions?: Record<string, unknown>
  layers: SystemLayerDefinition[]
  notes?: string[]
}

export interface ReservoirCalculationInput extends ReservoirGeometryInput {
  solutionMode: ReservoirSolutionMode
  topRuleId?: TopRuleId
}

export interface ReservoirLayerResult {
  productId: string
  productName: string
  role: string
  consumptionLabel: string
  minQuantity: number
  maxQuantity: number
  unit: QuantityUnit
  packages: PackageCountResult[]
  recommendedMix: PackageMixResult | null
}

export interface ReservoirCalculationResult {
  geometry: ReservoirGeometryResult
  solutionMode: ReservoirSolutionMode
  systemId?: string
  systemName: string
  layers: ReservoirLayerResult[]
  notes: string[]
}

function typedSystems(): SystemDefinition[] {
  return systems as unknown as SystemDefinition[]
}

function productOrThrow(productId: string): ProductRecord {
  const product = productsById.get(productId)
  if (!product) throw new Error(`Produto ${productId} não encontrado no banco V9.`)
  if (product.technicalStatus === 'pending') throw new Error(`${product.name} ainda não possui dados técnicos liberados para cálculo automático.`)
  return product
}

function layerFromRule(product: ProductRecord, role: string, areaM2: number, rule: ConsumptionRule): ReservoirLayerResult {
  const consumption = calculateConsumptionRange(areaM2, rule)
  const packages = calculatePackageRange(
    consumption.minQuantity,
    consumption.maxQuantity,
    consumption.materialUnit,
    product.packages
  )
  const recommendedMix = optimizePackageMix(consumption.maxQuantity, consumption.materialUnit, product.packages)

  return {
    productId: product.id,
    productName: product.name,
    role,
    consumptionLabel: rule.min === rule.max
      ? `${rule.max} ${rule.unit}`
      : `${rule.min} a ${rule.max} ${rule.unit}`,
    minQuantity: consumption.minQuantity,
    maxQuantity: consumption.maxQuantity,
    unit: consumption.materialUnit,
    packages,
    recommendedMix
  }
}

function findTopFlexSystem(structure: ReservoirStructure): SystemDefinition {
  const id = structure === 'buried'
    ? 'reservoir-buried-topflex'
    : 'reservoir-elevated-topflex'
  const system = typedSystems().find((item) => item.id === id)
  if (!system) throw new Error(`Sistema ${id} não encontrado.`)
  return system
}

function calculateSystemLayers(system: SystemDefinition, areaM2: number): ReservoirLayerResult[] {
  return [...system.layers]
    .sort((a, b) => a.order - b.order)
    .map((layer) => {
      if (layer.calculation.type !== 'area_consumption') {
        throw new Error(`Tipo de cálculo ${layer.calculation.type} ainda não suportado em sistemas de reservatório.`)
      }
      const product = productOrThrow(layer.productId)
      return layerFromRule(product, layer.role, areaM2, {
        id: `${system.id}-${layer.productId}`,
        label: layer.role,
        min: layer.calculation.min,
        max: layer.calculation.max,
        unit: layer.calculation.unit
      })
    })
}

export function calculateReservoir(input: ReservoirCalculationInput): ReservoirCalculationResult {
  const geometry = calculateReservoirGeometry(input)

  if (input.solutionMode === 'topflex-system') {
    const system = findTopFlexSystem(input.structure)
    return {
      geometry,
      solutionMode: input.solutionMode,
      systemId: system.id,
      systemName: system.name,
      layers: calculateSystemLayers(system, geometry.areaWithWasteM2),
      notes: system.notes ?? []
    }
  }

  const top = productOrThrow('impertudo-top')
  const ruleId: TopRuleId = input.topRuleId ?? (input.structure === 'buried' ? 'negative-10mca' : 'positive-25mca')
  const rule = getConsumptionRule(top, ruleId)

  return {
    geometry,
    solutionMode: input.solutionMode,
    systemName: `IMPERTUDO TOP — ${rule.label ?? rule.id}`,
    layers: [layerFromRule(top, 'main_waterproofing', geometry.areaWithWasteM2, rule)],
    notes: [
      'O consumo é calculado pela condição técnica selecionada para o IMPERTUDO TOP.',
      'A calculadora utiliza o limite máximo da faixa como referência para compra quando houver consumo mínimo e máximo.'
    ]
  }
}

export function packageDisplay(option: PackageOption): string {
  const type = option.packageType ? ` • ${option.packageType}` : ''
  return `${option.quantity} ${option.unit}${type}`
}
