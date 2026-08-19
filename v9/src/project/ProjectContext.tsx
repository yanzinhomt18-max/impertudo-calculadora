import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  clearStoredProject,
  loadProject,
  loadProjectLibrary,
  parseProjectBackup,
  removeProject,
  saveProject,
  saveProjectLibrary,
  serializeProjectBackup,
  upsertProject
} from './storage'
import { createEmptyProject, createId, type PaymentMethod, type PricingRecord, type ProjectCalculation, type ProjectState } from './types'

interface ProjectContextValue {
  project: ProjectState
  savedProjects: ProjectState[]
  isCurrentSaved: boolean
  storageOk: boolean
  updateMeta: (patch: Partial<Pick<ProjectState, 'client' | 'projectName' | 'location' | 'consultant' | 'validityDays' | 'notes'>>) => void
  addCalculation: (calculation: Omit<ProjectCalculation, 'id' | 'createdAt'>) => string
  removeCalculation: (id: string) => void
  updatePricing: (key: string, patch: Partial<PricingRecord>) => void
  setCashDiscountPct: (value: number) => void
  setPaymentMethod: (value: PaymentMethod) => void
  setChecklistItem: (key: string, checked: boolean) => void
  saveCurrentToLibrary: () => void
  openSavedProject: (id: string) => void
  duplicateCurrentProject: () => void
  deleteSavedProject: (id: string) => void
  exportBackup: () => string
  importBackup: (text: string) => number
  resetProject: () => void
}

const ProjectContext = createContext<ProjectContextValue | null>(null)
const touch = (project: ProjectState): ProjectState => ({ ...project, updatedAt: new Date().toISOString() })

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ProjectState>(() => loadProject())
  const [savedProjects, setSavedProjects] = useState<ProjectState[]>(() => loadProjectLibrary())
  const [storageOk, setStorageOk] = useState(true)

  function persistLibrary(projects: ProjectState[]): ProjectState[] {
    if (!saveProjectLibrary(projects)) setStorageOk(false)
    return projects
  }

  useEffect(() => {
    if (!saveProject(project)) setStorageOk(false)
    setSavedProjects((current) => {
      if (!current.some((item) => item.id === project.id)) return current
      return persistLibrary(upsertProject(current, project))
    })
  }, [project])

  const isCurrentSaved = savedProjects.some((item) => item.id === project.id)

  const value = useMemo<ProjectContextValue>(() => ({
    project,
    savedProjects,
    isCurrentSaved,
    storageOk,
    updateMeta(patch) { setProject((current) => touch({ ...current, ...patch })) },
    addCalculation(calculation) {
      const id = createId('calc')
      const entry: ProjectCalculation = { ...calculation, id, createdAt: new Date().toISOString() }
      setProject((current) => touch({ ...current, calculations: [...current.calculations, entry] }))
      return id
    },
    removeCalculation(id) { setProject((current) => touch({ ...current, calculations: current.calculations.filter((item) => item.id !== id) })) },
    updatePricing(key, patch) {
      setProject((current) => {
        const previous = current.pricing[key] ?? { unitPrice: 0, discountType: 'pct' as const, discountValue: 0 }
        return touch({ ...current, pricing: { ...current.pricing, [key]: { ...previous, ...patch } } })
      })
    },
    setCashDiscountPct(value) {
      const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
      setProject((current) => touch({ ...current, cashDiscountPct: safe }))
    },
    setPaymentMethod(value) { setProject((current) => touch({ ...current, paymentMethod: value })) },
    setChecklistItem(key, checked) { setProject((current) => touch({ ...current, checklist: { ...current.checklist, [key]: checked } })) },
    saveCurrentToLibrary() {
      setSavedProjects((current) => persistLibrary(upsertProject(current, project)))
    },
    openSavedProject(id) {
      const found = savedProjects.find((item) => item.id === id)
      if (found) setProject(found)
    },
    duplicateCurrentProject() {
      const now = new Date().toISOString()
      const duplicate: ProjectState = {
        ...project,
        id: createId('project'),
        projectName: project.projectName ? `${project.projectName} — cópia` : 'Nova obra — cópia',
        createdAt: now,
        updatedAt: now,
        calculations: project.calculations.map((calculation) => ({ ...calculation, id: createId('calc'), createdAt: now })),
        pricing: { ...project.pricing },
        checklist: { ...project.checklist }
      }
      setSavedProjects((current) => persistLibrary(upsertProject(current, duplicate)))
      setProject(duplicate)
    },
    deleteSavedProject(id) {
      setSavedProjects((current) => persistLibrary(removeProject(current, id)))
    },
    exportBackup() { return serializeProjectBackup(project, savedProjects) },
    importBackup(text) {
      const backup = parseProjectBackup(text)
      setSavedProjects((current) => {
        let next = current
        for (const item of backup.projects) next = upsertProject(next, item)
        return persistLibrary(next)
      })
      setProject(backup.activeProject)
      return backup.projects.length
    },
    resetProject() {
      if (!clearStoredProject()) setStorageOk(false)
      setProject(createEmptyProject())
    }
  }), [project, savedProjects, isCurrentSaved, storageOk])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject precisa estar dentro de ProjectProvider.')
  return context
}
