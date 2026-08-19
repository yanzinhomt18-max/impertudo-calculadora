import { productsById, productDatabase } from '../db'
import type { PackageOption, ProductRecord } from '../db/types'
import { applyWaste } from './geometry'
import { calculatePackageRange, optimizePackageMix, type PackageCountResult, type PackageMixResult } from './packaging'
import { parseConsumptionUnit } from './consumption'
import { roundQuantity, type QuantityUnit } from './units'

interface RangeRule {
  id: string
  label?: string
  min: number
  max: number
  consumption?: number
  unit: string
  coats?: number
  coatsMin?: number
  coatsMax?: number
}

interface JointReference {
  widthMm: number
  depthMm: number
  consumption: number
  unit: string
}

interface ModeRule {
  id: string
  label?: string
  kind?: 'coverage_area' | 'coverage_linear' | 'concrete' | 'consumption'
  consumption?: number
  min?: number
  max?: number
  unit: string
  jointWidthMm?: number
  jointDepthMm?: number
  packageType?: string
}

export interface ProductOption {
  id: string
  label: string
  type: 'consumption' | 'yield' | 'profile' | 'mode'
}

export interface ProductCalculationInput {
  productId: string
  areaM2?: number
  wastePercent?: number
  optionId?: string
  coats?: number
  jointLengthM?: number
  jointWidthMm?: number
  jointDepthMm?: number
  concreteVolumeM3?: number
  linearLengthM?: number
}

export interface ProductCalculationResult {
  productId: string
  productName: string
  optionId?: string
  optionLabel: string
  calculationModel: string
  rawAreaM2?: number
  areaWithWasteM2?: number
  wastePercent?: number
  concreteVolumeM3?: number
  linearLengthM?: number
  linearWithWasteM?: number
  minQuantity: number
  maxQuantity: number
  unit: QuantityUnit
  basisLabel: string
  packages: PackageCountResult[]
  recommendedMix: PackageMixResult | null
  notes: string[]
  variantKey?: string
  variantLabel?: string
  packageTypeConstraint?: string
}

function technicalOf(product: ProductRecord): Record<string, unknown> {
  return product.technical && typeof product.technical === 'object'
    ? product.technical as Record<string, unknown>
    : {}
}

function rangeRules(product: ProductRecord, key: 'consumptionRules' | 'yieldRules' | 'applicationProfiles'): RangeRule[] {
  const value = technicalOf(product)[key]
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const rule = item as Partial<RangeRule>
    const min = typeof rule.min === 'number' ? rule.min : rule.consumption
    const max = typeof rule.max === 'number' ? rule.max : rule.consumption
    if (typeof rule.id !== 'string' || typeof min !== 'number' || typeof max !== 'number' || typeof rule.unit !== 'string') return []
    return [{ ...rule, id: rule.id, min, max, unit: rule.unit } as RangeRule]
  })
}

function jointReference(product: ProductRecord): JointReference | null {
  const value = technicalOf(product).jointReference
  if (!value || typeof value !== 'object') return null
  const ref = value as Partial<JointReference>
  if (typeof ref.widthMm !== 'number' || typeof ref.depthMm !== 'number' || typeof ref.consumption !== 'number' || typeof ref.unit !== 'string') return null
  return ref as JointReference
}

function modes(product: ProductRecord): ModeRule[] {
  const value = technicalOf(product).modes
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ModeRule => {
    if (!item || typeof item !== 'object') return false
    const mode = item as Partial<ModeRule>
    return typeof mode.id === 'string' && typeof mode.unit === 'string'
  })
}

function isReleasedStatus(product: ProductRecord): boolean {
  return product.technicalStatus === 'verified_mixed' || product.technicalStatus === 'official_partial'
}

export function getProductOptions(product: ProductRecord): ProductOption[] {
  if (product.calculationModel === 'area_yield') {
    return rangeRules(product, 'yieldRules').map((rule) => ({ id: rule.id, label: rule.label ?? rule.id, type: 'yield' }))
  }
  if (product.calculationModel === 'application_profile') {
    const profiles = rangeRules(product, 'applicationProfiles')
    const rules = profiles.length ? profiles : rangeRules(product, 'consumptionRules')
    return rules.map((rule) => ({ id: rule.id, label: rule.label ?? rule.id, type: 'profile' }))
  }
  if (product.calculationModel === 'multi_mode') {
    return modes(product).map((rule) => ({
      id: rule.id,
      label: rule.label ?? (rule.id === 'area' ? 'Por área' : rule.id === 'joint' ? 'Por junta' : rule.id === 'concrete' ? 'Por volume de concreto' : rule.id),
      type: 'mode'
    }))
  }
  if (product.calculationModel === 'area_consumption' || product.calculationModel === 'area_consumption_range') {
    return rangeRules(product, 'consumptionRules').map((rule) => ({ id: rule.id, label: rule.label ?? rule.id, type: 'consumption' }))
  }
  return []
}

function supportedMode(mode: ModeRule): boolean {
  if (mode.kind === 'coverage_area') return mode.unit === 'm2' && Boolean(mode.packageType)
  if (mode.kind === 'coverage_linear') return mode.unit === 'm' && Boolean(mode.packageType)
  if (mode.kind === 'concrete' || mode.id === 'concrete') return typeof mode.consumption === 'number' || typeof mode.min === 'number'
  if (mode.id === 'joint') return typeof mode.consumption === 'number' && typeof mode.jointWidthMm === 'number' && typeof mode.jointDepthMm === 'number'
  if (mode.id === 'area') return typeof mode.consumption === 'number' || typeof mode.min === 'number'
  return false
}

export function isProductAutoCalculable(product: ProductRecord): boolean {
  if (!isReleasedStatus(product)) return false
  switch (product.calculationModel) {
    case 'area_consumption':
    case 'area_consumption_range':
      return rangeRules(product, 'consumptionRules').length > 0
    case 'area_yield':
      return rangeRules(product, 'yieldRules').length > 0
    case 'application_profile':
      return getProductOptions(product).length > 0
    case 'roll':
      return typeof technicalOf(product).nominalRollAreaM2 === 'number' && product.packages.length > 0
    case 'joint_volume':
      return jointReference(product) !== null && product.packages.length > 0
    case 'multi_mode':
      return modes(product).some(supportedMode) && product.packages.length > 0
    default:
      return false
  }
}

export const autoCalculableProducts = productDatabase.products.filter(isProductAutoCalculable)

function requirePositive(value: number | undefined, label: string): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) throw new Error(`${label} deve ser maior que zero.`)
  return value as number
}

function normalizedWaste(value: number | undefined, defaultValue = 5): number {
  const waste = Number.isFinite(value) ? Number(value) : defaultValue
  if (waste < 0 || waste > 50) throw new Error('A margem de perda deve ficar entre 0% e 50%.')
  return waste
}

function areaValues(input: ProductCalculationInput): { raw: number; waste: number; withWaste: number } {
  const raw = requirePositive(input.areaM2, 'Área')
  const waste = normalizedWaste(input.wastePercent)
  return { raw, waste, withWaste: applyWaste(raw, waste) }
}

function selectedRange(product: ProductRecord, keys: Array<'consumptionRules' | 'applicationProfiles'>, optionId?: string): RangeRule {
  const all = keys.flatMap((key) => rangeRules(product, key))
  const selected = optionId ? all.find((item) => item.id === optionId) : all[0]
  if (!selected) throw new Error(`Não há regra técnica liberada para ${product.name}.`)
  return selected
}

function allowedPackages(product: ProductRecord, packageType?: string): PackageOption[] {
  return packageType ? product.packages.filter((pack) => pack.packageType === packageType) : product.packages
}

function packageResult(product: ProductRecord, minQuantity: number, maxQuantity: number, unit: QuantityUnit, packageType?: string) {
  const packages = allowedPackages(product, packageType)
  return {
    packages: calculatePackageRange(minQuantity, maxQuantity, unit, packages),
    recommendedMix: optimizePackageMix(maxQuantity, unit, packages)
  }
}

function consumptionByArea(product: ProductRecord, input: ProductCalculationInput, rule: RangeRule): ProductCalculationResult {
  const area = areaValues(input)
  const technical = technicalOf(product)
  const basis = technical.consumptionBasis === 'perCoat' ? 'perCoat' : 'system'
  const configuredMin = typeof technical.coatsMin === 'number' ? technical.coatsMin : 1
  const configuredMax = typeof technical.coatsMax === 'number' ? technical.coatsMax : configuredMin
  const coats = basis === 'perCoat'
    ? Math.max(configuredMin, Math.min(configuredMax, Math.round(input.coats ?? configuredMin)))
    : 1
  const unit = parseConsumptionUnit(rule.unit)
  const minQuantity = roundQuantity(area.withWaste * rule.min * coats, 4)
  const maxQuantity = roundQuantity(area.withWaste * rule.max * coats, 4)
  const packs = packageResult(product, minQuantity, maxQuantity, unit)
  const range = rule.min === rule.max ? `${rule.max} ${rule.unit}` : `${rule.min} a ${rule.max} ${rule.unit}`
  return {
    productId: product.id,
    productName: product.name,
    optionId: rule.id,
    optionLabel: rule.label ?? rule.id,
    calculationModel: product.calculationModel,
    rawAreaM2: area.raw,
    areaWithWasteM2: area.withWaste,
    wastePercent: area.waste,
    minQuantity,
    maxQuantity,
    unit,
    basisLabel: basis === 'perCoat' ? `${range} × ${coats} demão(ões)` : range,
    ...packs,
    notes: basis === 'perCoat' ? [`Consumo cadastrado por demão. Cálculo realizado com ${coats} demão(ões).`] : ['Consumo cadastrado para o sistema completo.']
  }
}

function yieldByArea(product: ProductRecord, input: ProductCalculationInput): ProductCalculationResult {
  const area = areaValues(input)
  const rules = rangeRules(product, 'yieldRules')
  const rule = input.optionId ? rules.find((item) => item.id === input.optionId) : rules[0]
  if (!rule || rule.min <= 0 || rule.max <= 0) throw new Error(`Rendimento não encontrado para ${product.name}.`)
  const normalized = rule.unit.toLowerCase().replace(/²/g, '2').replace(/\s/g, '')
  if (!normalized.includes('m2/l')) throw new Error(`Unidade de rendimento ainda não suportada: ${rule.unit}`)
  const minQuantity = roundQuantity(area.withWaste / rule.max, 4)
  const maxQuantity = roundQuantity(area.withWaste / rule.min, 4)
  const packs = packageResult(product, minQuantity, maxQuantity, 'L')
  return {
    productId: product.id,
    productName: product.name,
    optionId: rule.id,
    optionLabel: rule.label ?? rule.id,
    calculationModel: product.calculationModel,
    rawAreaM2: area.raw,
    areaWithWasteM2: area.withWaste,
    wastePercent: area.waste,
    minQuantity,
    maxQuantity,
    unit: 'L',
    basisLabel: rule.min === rule.max ? `${rule.max} ${rule.unit}` : `${rule.min} a ${rule.max} ${rule.unit}`,
    ...packs,
    notes: ['Em rendimento m²/L, o maior rendimento gera a menor necessidade de produto e vice-versa.']
  }
}

function rollByArea(product: ProductRecord, input: ProductCalculationInput): ProductCalculationResult {
  const area = areaValues(input)
  const rollArea = technicalOf(product).nominalRollAreaM2
  if (typeof rollArea !== 'number' || rollArea <= 0) throw new Error(`Área nominal do rolo não cadastrada para ${product.name}.`)
  const packs = packageResult(product, area.withWaste, area.withWaste, 'm2')
  return {
    productId: product.id,
    productName: product.name,
    optionLabel: 'Área nominal do rolo',
    calculationModel: product.calculationModel,
    rawAreaM2: area.raw,
    areaWithWasteM2: area.withWaste,
    wastePercent: area.waste,
    minQuantity: area.withWaste,
    maxQuantity: area.withWaste,
    unit: 'm2',
    basisLabel: `${rollArea} m² nominais por rolo`,
    ...packs,
    notes: ['A margem informada deve contemplar sobreposições, recortes e particularidades da paginação da manta.']
  }
}

function jointByReference(product: ProductRecord, input: ProductCalculationInput, ref = jointReference(product)): ProductCalculationResult {
  if (!ref) throw new Error(`Referência de junta não cadastrada para ${product.name}.`)
  const length = requirePositive(input.jointLengthM, 'Comprimento da junta')
  const width = requirePositive(input.jointWidthMm ?? ref.widthMm, 'Largura da junta')
  const depth = requirePositive(input.jointDepthMm ?? ref.depthMm, 'Profundidade da junta')
  const ratio = (width * depth) / (ref.widthMm * ref.depthMm)
  const normalized = ref.unit.toLowerCase().replace(/\s/g, '')
  const unit: QuantityUnit = normalized.startsWith('kg/') ? 'kg' : normalized.startsWith('g/') ? 'g' : normalized.startsWith('l/') ? 'L' : 'g'
  const quantity = roundQuantity(length * ref.consumption * ratio, 4)
  const packs = packageResult(product, quantity, quantity, unit)
  return {
    productId: product.id,
    productName: product.name,
    optionLabel: 'Junta',
    calculationModel: product.calculationModel,
    minQuantity: quantity,
    maxQuantity: quantity,
    unit,
    basisLabel: `${ref.consumption} ${ref.unit} na junta de referência ${ref.widthMm} × ${ref.depthMm} mm`,
    ...packs,
    notes: [`Geometria calculada proporcionalmente à seção da junta: ${width} × ${depth} mm em ${length} m.`]
  }
}

function concreteByDose(product: ProductRecord, input: ProductCalculationInput, mode: ModeRule): ProductCalculationResult {
  const volume = requirePositive(input.concreteVolumeM3, 'Volume de concreto')
  const min = typeof mode.min === 'number' ? mode.min : mode.consumption
  const max = typeof mode.max === 'number' ? mode.max : mode.consumption
  if (typeof min !== 'number' || typeof max !== 'number' || min <= 0 || max <= 0 || max < min) throw new Error(`Dosagem por m³ não cadastrada corretamente para ${product.name}.`)
  const normalized = mode.unit.toLowerCase().replace(/³/g, '3').replace(/\s/g, '')
  if (!normalized.includes('/m3')) throw new Error(`Unidade de dosagem ainda não suportada: ${mode.unit}`)
  const unit = parseConsumptionUnit(mode.unit)
  const minQuantity = roundQuantity(volume * min, 4)
  const maxQuantity = roundQuantity(volume * max, 4)
  const packs = packageResult(product, minQuantity, maxQuantity, unit, mode.packageType)
  const range = min === max ? `${max} ${mode.unit}` : `${min} a ${max} ${mode.unit}`
  return {
    productId: product.id,
    productName: product.name,
    optionId: mode.id,
    optionLabel: mode.label ?? 'Por volume de concreto',
    calculationModel: product.calculationModel,
    concreteVolumeM3: volume,
    minQuantity,
    maxQuantity,
    unit,
    basisLabel: range,
    ...packs,
    notes: [`Dosagem aplicada a ${volume} m³ de concreto. Conferir resistência, traço e especificação do projeto.`],
    variantKey: mode.id,
    variantLabel: mode.label,
    packageTypeConstraint: mode.packageType
  }
}

function coverageByArea(product: ProductRecord, input: ProductCalculationInput, mode: ModeRule): ProductCalculationResult {
  const area = areaValues(input)
  if (!mode.packageType) throw new Error('Variante comercial não cadastrada para cobertura por área.')
  const packs = packageResult(product, area.withWaste, area.withWaste, 'm2', mode.packageType)
  if (!packs.recommendedMix) throw new Error(`Embalagem por área não encontrada para ${product.name}.`)
  return {
    productId: product.id,
    productName: product.name,
    optionId: mode.id,
    optionLabel: mode.label ?? 'Cobertura por área',
    calculationModel: product.calculationModel,
    rawAreaM2: area.raw,
    areaWithWasteM2: area.withWaste,
    wastePercent: area.waste,
    minQuantity: area.withWaste,
    maxQuantity: area.withWaste,
    unit: 'm2',
    basisLabel: 'Cobertura nominal em m²',
    ...packs,
    notes: ['A margem deve contemplar recortes e sobreposições exigidas pelo sistema.'],
    variantKey: mode.id,
    variantLabel: mode.label,
    packageTypeConstraint: mode.packageType
  }
}

function coverageByLinear(product: ProductRecord, input: ProductCalculationInput, mode: ModeRule): ProductCalculationResult {
  const length = requirePositive(input.linearLengthM, 'Comprimento linear')
  const waste = normalizedWaste(input.wastePercent)
  const withWaste = applyWaste(length, waste)
  if (!mode.packageType) throw new Error('Variante comercial não cadastrada para cobertura linear.')
  const packs = packageResult(product, withWaste, withWaste, 'm', mode.packageType)
  if (!packs.recommendedMix) throw new Error(`Embalagem linear não encontrada para ${product.name}.`)
  return {
    productId: product.id,
    productName: product.name,
    optionId: mode.id,
    optionLabel: mode.label ?? 'Cobertura linear',
    calculationModel: product.calculationModel,
    linearLengthM: length,
    linearWithWasteM: withWaste,
    wastePercent: waste,
    minQuantity: withWaste,
    maxQuantity: withWaste,
    unit: 'm',
    basisLabel: 'Comprimento linear do reforço',
    ...packs,
    notes: ['A margem deve contemplar emendas, recortes e perdas de instalação.'],
    variantKey: mode.id,
    variantLabel: mode.label,
    packageTypeConstraint: mode.packageType
  }
}

function multiMode(product: ProductRecord, input: ProductCalculationInput): ProductCalculationResult {
  const all = modes(product)
  const mode = input.optionId ? all.find((item) => item.id === input.optionId) : all[0]
  if (!mode) throw new Error(`Modo de cálculo não encontrado para ${product.name}.`)
  if (mode.kind === 'coverage_area') return coverageByArea(product, input, mode)
  if (mode.kind === 'coverage_linear') return coverageByLinear(product, input, mode)
  if (mode.kind === 'concrete' || mode.id === 'concrete') return concreteByDose(product, input, mode)
  if (mode.id === 'area') {
    const min = typeof mode.min === 'number' ? mode.min : mode.consumption
    const max = typeof mode.max === 'number' ? mode.max : mode.consumption
    if (typeof min !== 'number' || typeof max !== 'number') throw new Error('Consumo por área não cadastrado.')
    const result = consumptionByArea(product, input, { id: mode.id, label: mode.label ?? 'Por área', min, max, unit: mode.unit })
    return { ...result, variantKey: mode.id, variantLabel: mode.label, packageTypeConstraint: mode.packageType }
  }
  if (mode.id === 'joint') {
    const consumption = typeof mode.consumption === 'number' ? mode.consumption : mode.max
    if (typeof consumption !== 'number' || typeof mode.jointWidthMm !== 'number' || typeof mode.jointDepthMm !== 'number') throw new Error('Referência da junta não cadastrada.')
    const result = jointByReference(product, input, {
      widthMm: mode.jointWidthMm,
      depthMm: mode.jointDepthMm,
      consumption,
      unit: mode.unit
    })
    return { ...result, optionId: mode.id, optionLabel: mode.label ?? 'Por junta', variantKey: mode.id, variantLabel: mode.label, packageTypeConstraint: mode.packageType }
  }
  throw new Error(`Modo ${mode.id} ainda não suportado.`)
}

export function calculateProduct(input: ProductCalculationInput): ProductCalculationResult {
  const product = productsById.get(input.productId)
  if (!product) throw new Error('Produto não encontrado no banco V9.')
  if (!isProductAutoCalculable(product)) throw new Error(`${product.name} ainda não está liberado para cálculo automático na V9.`)

  switch (product.calculationModel) {
    case 'area_consumption':
    case 'area_consumption_range':
      return consumptionByArea(product, input, selectedRange(product, ['consumptionRules'], input.optionId))
    case 'application_profile':
      return consumptionByArea(product, input, selectedRange(product, ['applicationProfiles', 'consumptionRules'], input.optionId))
    case 'area_yield':
      return yieldByArea(product, input)
    case 'roll':
      return rollByArea(product, input)
    case 'joint_volume':
      return jointByReference(product, input)
    case 'multi_mode':
      return multiMode(product, input)
    default:
      throw new Error(`Modelo ${product.calculationModel} ainda não suportado no motor genérico.`)
  }
}
