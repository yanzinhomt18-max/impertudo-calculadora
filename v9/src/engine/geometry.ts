import { roundQuantity } from './units'

export type AreaMode = 'direct' | 'rectangle' | 'perimeter-height'

export interface AreaInput {
  mode: AreaMode
  directAreaM2?: number
  lengthM?: number
  widthM?: number
  perimeterM?: number
  heightM?: number
  wastePercent?: number
}

export interface AreaResult {
  rawAreaM2: number
  wastePercent: number
  areaWithWasteM2: number
}

export type ReservoirShape = 'rectangular' | 'cylindrical'
export type ReservoirStructure = 'buried' | 'elevated' | 'supported'

export interface ReservoirGeometryInput {
  shape: ReservoirShape
  structure: ReservoirStructure
  lengthM?: number
  widthM?: number
  diameterM?: number
  heightM: number
  includeFloor?: boolean
  includeWalls?: boolean
  includeCeiling?: boolean
  wastePercent?: number
}

export interface ReservoirGeometryResult extends AreaResult {
  shape: ReservoirShape
  structure: ReservoirStructure
  floorAreaM2: number
  wallAreaM2: number
  ceilingAreaM2: number
  internalAreaM2: number
  volumeM3: number
  capacityLiters: number
}

function requirePositive(value: number | undefined, field: string): number {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    throw new Error(`${field} deve ser maior que zero.`)
  }
  return value as number
}

function normalizedWaste(value = 5): number {
  if (!Number.isFinite(value) || value < 0 || value > 50) {
    throw new Error('A margem de perda deve ficar entre 0% e 50%.')
  }
  return value
}

export function applyWaste(value: number, wastePercent = 5): number {
  const waste = normalizedWaste(wastePercent)
  return roundQuantity(value * (1 + waste / 100), 4)
}

export function calculateArea(input: AreaInput): AreaResult {
  let rawAreaM2 = 0

  if (input.mode === 'direct') {
    rawAreaM2 = requirePositive(input.directAreaM2, 'Área')
  } else if (input.mode === 'rectangle') {
    rawAreaM2 = requirePositive(input.lengthM, 'Comprimento') * requirePositive(input.widthM, 'Largura')
  } else {
    rawAreaM2 = requirePositive(input.perimeterM, 'Perímetro') * requirePositive(input.heightM, 'Altura')
  }

  const wastePercent = normalizedWaste(input.wastePercent)
  return {
    rawAreaM2: roundQuantity(rawAreaM2, 4),
    wastePercent,
    areaWithWasteM2: applyWaste(rawAreaM2, wastePercent)
  }
}

export function calculateReservoirGeometry(input: ReservoirGeometryInput): ReservoirGeometryResult {
  const height = requirePositive(input.heightM, 'Altura')
  const includeFloor = input.includeFloor !== false
  const includeWalls = input.includeWalls !== false
  const includeCeiling = input.includeCeiling === true
  const wastePercent = normalizedWaste(input.wastePercent)

  let floorAreaM2 = 0
  let wallAreaM2 = 0
  let volumeM3 = 0

  if (input.shape === 'rectangular') {
    const length = requirePositive(input.lengthM, 'Comprimento')
    const width = requirePositive(input.widthM, 'Largura')
    floorAreaM2 = length * width
    wallAreaM2 = 2 * length * height + 2 * width * height
    volumeM3 = length * width * height
  } else {
    const diameter = requirePositive(input.diameterM, 'Diâmetro')
    const radius = diameter / 2
    floorAreaM2 = Math.PI * radius * radius
    wallAreaM2 = Math.PI * diameter * height
    volumeM3 = floorAreaM2 * height
  }

  const ceilingAreaM2 = includeCeiling ? floorAreaM2 : 0
  const internalAreaM2 = (includeFloor ? floorAreaM2 : 0) + (includeWalls ? wallAreaM2 : 0) + ceilingAreaM2

  if (internalAreaM2 <= 0) throw new Error('Selecione ao menos uma superfície para impermeabilizar.')

  return {
    shape: input.shape,
    structure: input.structure,
    floorAreaM2: roundQuantity(floorAreaM2, 4),
    wallAreaM2: roundQuantity(wallAreaM2, 4),
    ceilingAreaM2: roundQuantity(ceilingAreaM2, 4),
    internalAreaM2: roundQuantity(internalAreaM2, 4),
    rawAreaM2: roundQuantity(internalAreaM2, 4),
    wastePercent,
    areaWithWasteM2: applyWaste(internalAreaM2, wastePercent),
    volumeM3: roundQuantity(volumeM3, 4),
    capacityLiters: roundQuantity(volumeM3 * 1000, 0)
  }
}
