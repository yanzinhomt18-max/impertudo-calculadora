export type TechnicalStatus =
  | 'pending'
  | 'official_partial'
  | 'verified_mixed'
  | 'previous_technical_pending_revalidation'

export type CalculationModel =
  | 'manual'
  | 'area_consumption'
  | 'area_consumption_range'
  | 'area_yield'
  | 'joint_volume'
  | 'roll'
  | 'linear_yield'
  | 'linear_or_area'
  | 'concrete_dose'
  | 'cement_percent'
  | 'cement_dose'
  | 'dilution'
  | 'volume'
  | 'application_profile'
  | 'multi_mode'

export interface PackageOption {
  quantity: number
  unit: 'kg' | 'g' | 'L' | 'm2' | 'm'
  packageType?: string | null
  dimensions?: { widthM?: number; lengthM?: number }
}

export interface SourceReference {
  type: string
  url?: string
  label?: string
  verifiedOn?: string
}

export interface ProductRecord {
  id: string
  name: string
  slug: string
  categoryId: string
  officialUrl: string
  catalogStatus: 'official'
  technicalStatus: TechnicalStatus
  calculationModel: CalculationModel
  legacyCalculationModel: string
  packageLabel: string
  packages: PackageOption[]
  applicationAreaIds: string[]
  tags: string[]
  technical: Record<string, unknown>
  sources: SourceReference[]
}

export interface ProductDatabase {
  meta: {
    databaseVersion: string
    generatedOn: string
    officialCatalogUrl: string
    productCount: number
    policy: string
  }
  products: ProductRecord[]
}
