import { z } from 'zod'

export const packageSchema = z.object({
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'g', 'L', 'm2', 'm']),
  packageType: z.string().nullable().optional(),
  dimensions: z.object({
    widthM: z.number().positive().optional(),
    lengthM: z.number().positive().optional()
  }).optional()
})

export const sourceSchema = z.object({
  type: z.string().min(1),
  url: z.string().url().optional(),
  label: z.string().optional(),
  verifiedOn: z.string().optional()
})

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  officialUrl: z.string().url(),
  catalogStatus: z.literal('official'),
  technicalStatus: z.enum([
    'pending',
    'official_partial',
    'verified_mixed',
    'previous_technical_pending_revalidation'
  ]),
  calculationModel: z.enum([
    'manual',
    'area_consumption',
    'area_consumption_range',
    'area_yield',
    'joint_volume',
    'roll',
    'linear_yield',
    'linear_or_area',
    'concrete_dose',
    'cement_percent',
    'cement_dose',
    'dilution',
    'volume',
    'application_profile',
    'multi_mode'
  ]),
  legacyCalculationModel: z.string(),
  packageLabel: z.string(),
  packages: z.array(packageSchema),
  applicationAreaIds: z.array(z.string()),
  tags: z.array(z.string()),
  technical: z.record(z.string(), z.unknown()),
  sources: z.array(sourceSchema).min(1)
})

export const productDatabaseSchema = z.object({
  meta: z.object({
    databaseVersion: z.string(),
    generatedOn: z.string(),
    officialCatalogUrl: z.string().url(),
    productCount: z.number().int().positive(),
    policy: z.string()
  }),
  products: z.array(productSchema)
})
