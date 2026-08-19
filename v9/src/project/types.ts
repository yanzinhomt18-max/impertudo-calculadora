import type { QuantityUnit } from '../engine/units'

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao'
export type DiscountType = 'pct' | 'value'

export interface ProjectMaterial {
  productId: string
  productName: string
  role?: string
  minQuantity: number
  maxQuantity: number
  unit: QuantityUnit
  notes?: string[]
  variantKey?: string
  variantLabel?: string
  packageTypeConstraint?: string
}
export interface ProjectMetric { label: string; value: string }
export interface ProjectCalculation {
  id: string
  kind: 'reservoir' | 'product' | 'system'
  title: string
  subtitle?: string
  areaId?: string
  createdAt: string
  metrics: ProjectMetric[]
  materials: ProjectMaterial[]
  notes: string[]
}
export interface PricingRecord { unitPrice: number; discountType: DiscountType; discountValue: number }

export interface ProjectState {
  version: 1
  id: string
  client: string
  projectName: string
  location: string
  consultant: string
  validityDays: number
  notes: string
  createdAt: string
  updatedAt: string
  calculations: ProjectCalculation[]
  pricing: Record<string, PricingRecord>
  cashDiscountPct: number
  paymentMethod: PaymentMethod
  checklist: Record<string, boolean>
}

export function createId(prefix = 'item'): string {
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${value}`
}

export function createEmptyProject(): ProjectState {
  const now = new Date().toISOString()
  return {
    version: 1, id: createId('project'), client: '', projectName: '', location: '', consultant: '', validityDays: 7, notes: '',
    createdAt: now, updatedAt: now, calculations: [], pricing: {}, cashDiscountPct: 0, paymentMethod: 'pix', checklist: {}
  }
}
