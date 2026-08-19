import { productsById } from '../db'
import type { PackageOption } from '../db/types'
import type { PricingRecord, ProjectCalculation, ProjectState } from '../project/types'
import { calculatePackageRange, optimizePackageMix, type PackageCountResult, type PackageMixResult } from './packaging'
import { assertCompatibleUnit, fromBaseQuantity, toBaseQuantity, type QuantityUnit } from './units'

export interface ConsolidatedMaterial {
  productId: string
  productName: string
  minQuantity: number
  maxQuantity: number
  unit: QuantityUnit
  calculationIds: string[]
  packages: PackageCountResult[]
  recommendedMix: PackageMixResult | null
}

export interface CommercialLine {
  key: string
  productId: string
  productName: string
  package: PackageOption | null
  packageLabel: string
  count: number
  unitPrice: number
  discountType: 'pct' | 'value'
  discountValue: number
  gross: number
  discount: number
  net: number
}

export interface QuoteTotals {
  gross: number
  itemDiscount: number
  netBase: number
  cashDiscountPct: number
  cashDiscount: number
  cashTotal: number
  cardTotal: number
  selectedTotal: number
}

function targetUnitForProduct(productId: string, sourceUnit: QuantityUnit): QuantityUnit {
  const product = productsById.get(productId)
  const compatible = product?.packages.find((pack) => {
    try {
      assertCompatibleUnit(pack.unit, sourceUnit)
      return true
    } catch {
      return false
    }
  })
  return compatible?.unit ?? sourceUnit
}

export function consolidateCalculations(calculations: ProjectCalculation[]): ConsolidatedMaterial[] {
  const groups = new Map<string, {
    productName: string
    sourceUnit: QuantityUnit
    minBase: number
    maxBase: number
    family: string
    calculationIds: Set<string>
  }>()

  for (const calculation of calculations) {
    for (const material of calculation.materials) {
      const minBase = toBaseQuantity(material.minQuantity, material.unit)
      const maxBase = toBaseQuantity(material.maxQuantity, material.unit)
      const existing = groups.get(material.productId)
      if (existing && existing.family !== minBase.family) {
        throw new Error(`O produto ${material.productName} apareceu com unidades incompatíveis no projeto.`)
      }
      if (existing) {
        existing.minBase += minBase.value
        existing.maxBase += maxBase.value
        existing.calculationIds.add(calculation.id)
      } else {
        groups.set(material.productId, {
          productName: material.productName,
          sourceUnit: material.unit,
          minBase: minBase.value,
          maxBase: maxBase.value,
          family: minBase.family,
          calculationIds: new Set([calculation.id])
        })
      }
    }
  }

  return [...groups.entries()].map(([productId, group]) => {
    const product = productsById.get(productId)
    const unit = targetUnitForProduct(productId, group.sourceUnit)
    const minQuantity = fromBaseQuantity(group.minBase, unit)
    const maxQuantity = fromBaseQuantity(group.maxBase, unit)
    const packages = product
      ? calculatePackageRange(minQuantity, maxQuantity, unit, product.packages)
      : []
    const recommendedMix = product
      ? optimizePackageMix(maxQuantity, unit, product.packages)
      : null

    return {
      productId,
      productName: group.productName,
      minQuantity,
      maxQuantity,
      unit,
      calculationIds: [...group.calculationIds],
      packages,
      recommendedMix
    }
  }).sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR'))
}

export function packageLabel(option: PackageOption | null, unit?: QuantityUnit): string {
  if (!option) return `Unidade técnica (${unit ?? ''})`.trim()
  const labels: Record<string, string> = {
    box: 'Caixa', bucket: 'Balde', drum: 'Tambor', gallon: 'Galão',
    can: 'Lata/Pote', roll: 'Rolo', cartridge: 'Cartucho', sausage: 'Sachê'
  }
  const type = option.packageType ? labels[option.packageType] ?? option.packageType : 'Embalagem'
  return `${type} ${option.quantity} ${option.unit}`
}

export function pricingKey(productId: string, option: PackageOption | null, unit?: QuantityUnit): string {
  if (!option) return `${productId}|technical|${unit ?? ''}`
  return `${productId}|${option.quantity}|${option.unit}|${option.packageType ?? ''}`
}

function safePricing(pricing: PricingRecord | undefined): PricingRecord {
  return {
    unitPrice: Math.max(0, Number(pricing?.unitPrice) || 0),
    discountType: pricing?.discountType === 'value' ? 'value' : 'pct',
    discountValue: Math.max(0, Number(pricing?.discountValue) || 0)
  }
}

export function buildCommercialLines(materials: ConsolidatedMaterial[], pricing: ProjectState['pricing']): CommercialLine[] {
  const lines: CommercialLine[] = []
  for (const material of materials) {
    if (material.recommendedMix?.items.length) {
      for (const item of material.recommendedMix.items) {
        const key = pricingKey(material.productId, item.package)
        const values = safePricing(pricing[key])
        const gross = item.count * values.unitPrice
        const discount = Math.min(gross, values.discountType === 'pct'
          ? gross * Math.min(100, values.discountValue) / 100
          : values.discountValue)
        lines.push({
          key,
          productId: material.productId,
          productName: material.productName,
          package: item.package,
          packageLabel: packageLabel(item.package),
          count: item.count,
          ...values,
          gross,
          discount,
          net: Math.max(0, gross - discount)
        })
      }
      continue
    }

    const preferred = material.packages[0]
    if (preferred) {
      const key = pricingKey(material.productId, preferred.package)
      const values = safePricing(pricing[key])
      const gross = preferred.maxCount * values.unitPrice
      const discount = Math.min(gross, values.discountType === 'pct'
        ? gross * Math.min(100, values.discountValue) / 100
        : values.discountValue)
      lines.push({
        key,
        productId: material.productId,
        productName: material.productName,
        package: preferred.package,
        packageLabel: packageLabel(preferred.package),
        count: preferred.maxCount,
        ...values,
        gross,
        discount,
        net: Math.max(0, gross - discount)
      })
      continue
    }

    const key = pricingKey(material.productId, null, material.unit)
    const values = safePricing(pricing[key])
    const gross = material.maxQuantity * values.unitPrice
    const discount = Math.min(gross, values.discountType === 'pct'
      ? gross * Math.min(100, values.discountValue) / 100
      : values.discountValue)
    lines.push({
      key,
      productId: material.productId,
      productName: material.productName,
      package: null,
      packageLabel: `Quantidade técnica em ${material.unit}`,
      count: material.maxQuantity,
      ...values,
      gross,
      discount,
      net: Math.max(0, gross - discount)
    })
  }
  return lines
}

export function calculateQuoteTotals(lines: CommercialLine[], cashDiscountPct: number, paymentMethod: ProjectState['paymentMethod']): QuoteTotals {
  const gross = lines.reduce((sum, line) => sum + line.gross, 0)
  const itemDiscount = lines.reduce((sum, line) => sum + line.discount, 0)
  const netBase = Math.max(0, gross - itemDiscount)
  const safePct = Math.max(0, Math.min(100, Number(cashDiscountPct) || 0))
  const cashDiscount = netBase * safePct / 100
  const cashTotal = Math.max(0, netBase - cashDiscount)
  const cardTotal = netBase
  return {
    gross,
    itemDiscount,
    netBase,
    cashDiscountPct: safePct,
    cashDiscount,
    cashTotal,
    cardTotal,
    selectedTotal: paymentMethod === 'cartao' ? cardTotal : cashTotal
  }
}
