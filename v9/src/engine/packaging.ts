import type { PackageOption } from '../db/types'
import { assertCompatibleUnit, fromBaseQuantity, toBaseQuantity, type QuantityUnit, roundQuantity } from './units'

export interface PackageCountResult {
  package: PackageOption
  minCount: number
  maxCount: number
  minPurchased: number
  maxPurchased: number
  minSurplus: number
  maxSurplus: number
  unit: QuantityUnit
}

export interface PackageMixItem {
  package: PackageOption
  count: number
  purchased: number
}

export interface PackageMixResult {
  items: PackageMixItem[]
  requirement: number
  purchased: number
  surplus: number
  unit: QuantityUnit
}

function compatiblePackages(packages: PackageOption[], requiredUnit: QuantityUnit): PackageOption[] {
  return packages.filter((option) => {
    try {
      assertCompatibleUnit(option.unit, requiredUnit)
      return option.quantity > 0
    } catch {
      return false
    }
  })
}

function ceilCommercial(requiredBase: number, packageBase: number): number {
  if (requiredBase <= 0) return 0
  return Math.ceil(requiredBase / packageBase - 1e-12)
}

export function calculatePackageRange(
  minRequirement: number,
  maxRequirement: number,
  unit: QuantityUnit,
  packages: PackageOption[]
): PackageCountResult[] {
  if (minRequirement < 0 || maxRequirement <= 0 || maxRequirement < minRequirement) {
    throw new Error('Necessidade mínima/máxima inválida.')
  }

  const requiredMinBase = toBaseQuantity(minRequirement, unit)
  const requiredMaxBase = toBaseQuantity(maxRequirement, unit)

  return compatiblePackages(packages, unit).map((option) => {
    const packageBase = toBaseQuantity(option.quantity, option.unit)
    const minCount = ceilCommercial(requiredMinBase.value, packageBase.value)
    const maxCount = ceilCommercial(requiredMaxBase.value, packageBase.value)
    const minPurchasedBase = minCount * packageBase.value
    const maxPurchasedBase = maxCount * packageBase.value

    return {
      package: option,
      minCount,
      maxCount,
      minPurchased: roundQuantity(fromBaseQuantity(minPurchasedBase, unit), 4),
      maxPurchased: roundQuantity(fromBaseQuantity(maxPurchasedBase, unit), 4),
      minSurplus: roundQuantity(fromBaseQuantity(minPurchasedBase - requiredMinBase.value, unit), 4),
      maxSurplus: roundQuantity(fromBaseQuantity(maxPurchasedBase - requiredMaxBase.value, unit), 4),
      unit
    }
  })
}

export function optimizePackageMix(
  requirement: number,
  unit: QuantityUnit,
  packages: PackageOption[]
): PackageMixResult | null {
  if (!Number.isFinite(requirement) || requirement <= 0) return null

  const options = compatiblePackages(packages, unit)
    .map((option) => ({ option, base: toBaseQuantity(option.quantity, option.unit).value }))
    .sort((a, b) => b.base - a.base)

  if (!options.length) return null

  const requiredBase = toBaseQuantity(requirement, unit).value
  const smallest = options[options.length - 1]
  let bestTotal = ceilCommercial(requiredBase, smallest.base) * smallest.base
  let bestCounts = options.map((item) => item === smallest ? ceilCommercial(requiredBase, smallest.base) : 0)
  let bestUnitCount = bestCounts.reduce((sum, count) => sum + count, 0)

  const counts = new Array(options.length).fill(0)

  function consider(total: number) {
    if (total < requiredBase) return
    const unitCount = counts.reduce((sum, count) => sum + count, 0)
    if (total < bestTotal || (total === bestTotal && unitCount < bestUnitCount)) {
      bestTotal = total
      bestUnitCount = unitCount
      bestCounts = [...counts]
    }
  }

  function walk(index: number, currentTotal: number) {
    if (index === options.length - 1) {
      const option = options[index]
      counts[index] = ceilCommercial(Math.max(0, requiredBase - currentTotal), option.base)
      consider(currentTotal + counts[index] * option.base)
      counts[index] = 0
      return
    }

    const option = options[index]
    const maxCount = Math.min(
      ceilCommercial(bestTotal, option.base),
      ceilCommercial(requiredBase, option.base) + 1
    )

    for (let count = 0; count <= maxCount; count += 1) {
      const total = currentTotal + count * option.base
      if (total > bestTotal) break
      counts[index] = count
      walk(index + 1, total)
    }
    counts[index] = 0
  }

  walk(0, 0)

  const items = options
    .map((entry, index) => ({ entry, count: bestCounts[index] }))
    .filter(({ count }) => count > 0)
    .map(({ entry, count }) => ({
      package: entry.option,
      count,
      purchased: roundQuantity(fromBaseQuantity(entry.base * count, unit), 4)
    }))

  return {
    items,
    requirement: roundQuantity(requirement, 4),
    purchased: roundQuantity(fromBaseQuantity(bestTotal, unit), 4),
    surplus: roundQuantity(fromBaseQuantity(bestTotal - requiredBase, unit), 4),
    unit
  }
}
