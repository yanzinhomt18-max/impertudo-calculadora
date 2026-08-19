import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearStoredProject, loadProject, saveProject } from './storage'
import { createEmptyProject, createId, type PaymentMethod, type PricingRecord, type ProjectCalculation, type ProjectState } from './types'

interface ProjectContextValue {
  project: ProjectState
  updateMeta: (patch: Partial<Pick<ProjectState, 'client' | 'projectName' | 'location' | 'consultant' | 'validityDays' | 'notes'>>) => void
  addCalculation: (calculation: Omit<ProjectCalculation, 'id' | 'createdAt'>) => string
  removeCalculation: (id: string) => void
  updatePricing: (key: string, patch: Partial<PricingRecord>) => void
  setCashDiscountPct: (value: number) => void
  setPaymentMethod: (value: PaymentMethod) => void
  resetProject: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

function touch(project: ProjectState): ProjectState {
  return { ...project, updatedAt: new Date().toISOString() }
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectState>(() => loadProject())

  useEffect(() => {
    saveProject(project)
  }, [project])

  const value = useMemo<ProjectContextValue>(() => ({
    project,
    updateMeta(patch) {
      setProject((current) => touch({ ...current, ...patch }))
    },
    addCalculation(calculation) {
      const id = createId('calc')
      const entry: ProjectCalculation = {
        ...calculation,
        id,
        createdAt: new Date().toISOString()
      }
      setProject((current) => touch({ ...current, calculations: [...current.calculations, entry] }))
      return id
    },
    removeCalculation(id) {
      setProject((current) => touch({ ...current, calculations: current.calculations.filter((item) => item.id !== id) }))
    },
    updatePricing(key, patch) {
      setProject((current) => {
        const previous = current.pricing[key] ?? { unitPrice: 0, discountType: 'pct' as const, discountValue: 0 }
        return touch({
          ...current,
          pricing: {
            ...current.pricing,
            [key]: { ...previous, ...patch }
          }
        })
      })
    },
    setCashDiscountPct(value) {
      const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
      setProject((current) => touch({ ...current, cashDiscountPct: safe }))
    },
    setPaymentMethod(value) {
      setProject((current) => touch({ ...current, paymentMethod: value }))
    },
    resetProject() {
      clearStoredProject()
      setProject(createEmptyProject())
    }
  }), [project])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject precisa estar dentro de ProjectProvider.')
  return context
}
