import type { QuantityUnit } from '../engine/units'

export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao'
export type DiscountType = 'pct' | 'value'
export type ManualQuoteCategory = 'service' | 'freight' | 'other'

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

export interface ManualQuoteItem {
  id: string
  category: ManualQuoteCategory
  description: string
  quantity: number
  unitLabel: string
  unitPrice: number
  discountType: DiscountType
  discountValue: number
}

export interface ProjectState {
  version: 1
  id: string
  client: string
  projectName: string
  location: string
  consultant: string
  proposalNumber: string
  proposalDate: string
  validityDays: number
  notes: string
  createdAt: string
  updatedAt: string
  calculations: ProjectCalculation[]
  pricing: Record<string, PricingRecord>
  manualItems: ManualQuoteItem[]
  cashDiscountPct: number
  paymentMethod: PaymentMethod
  checklist: Record<string, boolean>
}

export function createId(prefix = 'item'): string {
  const value = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${value}`
}

export function createProposalNumber(projectId: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '')
  const suffix = projectId.replace(/[^a-z0-9]/gi, '').slice(-5).toUpperCase() || '00000'
  return `IMP-${day}-${suffix}`
}

export function createManualQuoteItem(category: ManualQuoteCategory = 'service'): ManualQuoteItem {
  return {
    id: createId('manual'),
    category,
    description: category === 'freight' ? 'Frete / entrega' : category === 'service' ? 'Mão de obra / serviço' : 'Item adicional',
    quantity: 1,
    unitLabel: category === 'freight' ? 'frete' : category === 'service' ? 'serviço' : 'un.',
    unitPrice: 0,
    discountType: 'pct',
    discountValue: 0
  }
}

export function createEmptyProject(): ProjectState {
  const now = new Date().toISOString()
  const id = createId('project')
  return {
    version: 1,
    id,
    client: '',
    projectName: '',
    location: '',
    consultant: '',
    proposalNumber: createProposalNumber(id, new Date(now)),
    proposalDate: now.slice(0, 10),
    validityDays: 7,
    notes: '',
    createdAt: now,
    updatedAt: now,
    calculations: [],
    pricing: {},
    manualItems: [],
    cashDiscountPct: 0,
    paymentMethod: 'pix',
    checklist: {}
  }
}
