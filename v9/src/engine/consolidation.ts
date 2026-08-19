import { productsById } from '../db'
import type { PackageOption } from '../db/types'
import type { ManualQuoteItem, PricingRecord, ProjectCalculation, ProjectState } from '../project/types'
import { calculatePackageRange, optimizePackageMix, type PackageCountResult, type PackageMixResult } from './packaging'
import { assertCompatibleUnit, fromBaseQuantity, toBaseQuantity, type QuantityUnit } from './units'

export interface ConsolidatedMaterial {
  key: string
  productId: string
  productName: string
  variantLabel?: string
  packageTypeConstraint?: string
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
  source?: 'material' | 'manual'
  manualItemId?: string
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

function filterPackages(productId: string, packageTypeConstraint?: string): PackageOption[] {
  const packages = productsById.get(productId)?.packages ?? []
  return packageTypeConstraint
    ? packages.filter((pack) => pack.packageType === packageTypeConstraint)
    : packages
}

function targetUnitForProduct(productId: string, sourceUnit: QuantityUnit, packageTypeConstraint?: string): QuantityUnit {
  const compatible = filterPackages(productId, packageTypeConstraint).find((pack) => {
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
    productId: string
    productName: string
    variantLabel?: string
    packageTypeConstraint?: string
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
      const variant = material.variantKey ?? material.packageTypeConstraint ?? ''
      const groupKey = `${material.productId}|${minBase.family}|${variant}`
      const existing = groups.get(groupKey)
      if (existing) {
        existing.minBase += minBase.value
        existing.maxBase += maxBase.value
        existing.calculationIds.add(calculation.id)
      } else {
        groups.set(groupKey, {
          productId: material.productId,
          productName: material.productName,
          variantLabel: material.variantLabel,
          packageTypeConstraint: material.packageTypeConstraint,
          sourceUnit: material.unit,
          minBase: minBase.value,
          maxBase: maxBase.value,
          family: minBase.family,
          calculationIds: new Set([calculation.id])
        })
      }
    }
  }

  return [...groups.entries()].map(([key, group]) => {
    const unit = targetUnitForProduct(group.productId, group.sourceUnit, group.packageTypeConstraint)
    const minQuantity = fromBaseQuantity(group.minBase, unit)
    const maxQuantity = fromBaseQuantity(group.maxBase, unit)
    const allowedPackages = filterPackages(group.productId, group.packageTypeConstraint)
    const packages = calculatePackageRange(minQuantity, maxQuantity, unit, allowedPackages)
    const recommendedMix = optimizePackageMix(maxQuantity, unit, allowedPackages)
    const displayName = group.variantLabel ? `${group.productName} — ${group.variantLabel}` : group.productName

    return {
      key,
      productId: group.productId,
      productName: displayName,
      variantLabel: group.variantLabel,
      packageTypeConstraint: group.packageTypeConstraint,
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
  if (option.dimensions?.lengthM && option.dimensions?.widthM) {
    const width = option.dimensions.widthM < 1
      ? `${Math.round(option.dimensions.widthM * 100)} cm`
      : `${option.dimensions.widthM} m`
    return `Rolo ${width} × ${option.dimensions.lengthM} m`
  }
  const labels: Record<string, string> = {
    box: 'Caixa', bucket: 'Balde', drum: 'Tambor', gallon: 'Galão',
    can: 'Lata/Pote', roll: 'Rolo', cartridge: 'Cartucho', sausage: 'Sachê',
    bag: 'Saco', pail: 'Balde'
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

function discountFor(gross: number, type: 'pct' | 'value', value: number): number {
  return Math.min(gross, type === 'pct'
    ? gross * Math.min(100, Math.max(0, value)) / 100
    : Math.max(0, value))
}

export function buildCommercialLines(materials: ConsolidatedMaterial[], pricing: ProjectState['pricing']): CommercialLine[] {
  const lines: CommercialLine[] = []
  for (const material of materials) {
    if (material.recommendedMix?.items.length) {
      for (const item of material.recommendedMix.items) {
        const key = pricingKey(material.productId, item.package)
        const values = safePricing(pricing[key])
        const gross = item.count * values.unitPrice
        const discount = discountFor(gross, values.discountType, values.discountValue)
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
          net: Math.max(0, gross - discount),
          source: 'material'
        })
      }
      continue
    }

    const preferred = material.packages[0]
    if (preferred) {
      const key = pricingKey(material.productId, preferred.package)
      const values = safePricing(pricing[key])
      const gross = preferred.maxCount * values.unitPrice
      const discount = discountFor(gross, values.discountType, values.discountValue)
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
        net: Math.max(0, gross - discount),
        source: 'material'
      })
      continue
    }

    const key = pricingKey(material.productId, null, material.unit)
    const values = safePricing(pricing[key])
    const gross = material.maxQuantity * values.unitPrice
    const discount = discountFor(gross, values.discountType, values.discountValue)
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
      net: Math.max(0, gross - discount),
      source: 'material'
    })
  }
  return lines
}

export function buildManualCommercialLines(items: ManualQuoteItem[]): CommercialLine[] {
  return items.flatMap((item) => {
    const description = item.description.trim()
    if (!description) return []
    const count = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0)
    const discountType = item.discountType === 'value' ? 'value' as const : 'pct' as const
    const discountValue = Math.max(0, Number(item.discountValue) || 0)
    const gross = count * unitPrice
    const discount = discountFor(gross, discountType, discountValue)
    return [{
      key: `manual|${item.id}`,
      productId: `manual:${item.id}`,
      productName: description,
      package: null,
      packageLabel: item.unitLabel || 'un.',
      count,
      unitPrice,
      discountType,
      discountValue,
      gross,
      discount,
      net: Math.max(0, gross - discount),
      source: 'manual' as const,
      manualItemId: item.id
    }]
  })
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
