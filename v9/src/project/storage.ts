import { createEmptyProject, type ProjectState } from './types'

const STORAGE_KEY = 'impertudo-v9-project-v1'
const LIBRARY_KEY = 'impertudo-v9-project-library-v1'

export interface ProjectBackup {
  backupVersion: 1
  exportedAt: string
  activeProject: ProjectState
  projects: ProjectState[]
}

export function normalizeProjectState(value: unknown): ProjectState | null {
  if (!value || typeof value !== 'object') return null
  const project = value as Partial<ProjectState>
  if (project.version !== 1 || typeof project.id !== 'string' || !Array.isArray(project.calculations) || !project.pricing || typeof project.pricing !== 'object') return null
  const base = createEmptyProject()
  return {
    ...base,
    ...project,
    version: 1,
    id: project.id,
    calculations: project.calculations,
    pricing: project.pricing,
    checklist: project.checklist && typeof project.checklist === 'object' ? project.checklist : {}
  }
}

export function loadProject(): ProjectState {
  if (typeof localStorage === 'undefined') return createEmptyProject()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProject()
    return normalizeProjectState(JSON.parse(raw)) ?? createEmptyProject()
  } catch {
    return createEmptyProject()
  }
}

export function saveProject(project: ProjectState): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
    return true
  } catch {
    return false
  }
}

export function clearStoredProject(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function normalizeLibrary(values: unknown): ProjectState[] {
  if (!Array.isArray(values)) return []
  const byId = new Map<string, ProjectState>()
  for (const value of values) {
    const project = normalizeProjectState(value)
    if (!project) continue
    const existing = byId.get(project.id)
    if (!existing || project.updatedAt >= existing.updatedAt) byId.set(project.id, project)
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function loadProjectLibrary(): ProjectState[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    return raw ? normalizeLibrary(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function saveProjectLibrary(projects: ProjectState[]): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(normalizeLibrary(projects)))
    return true
  } catch {
    return false
  }
}

export function upsertProject(projects: ProjectState[], project: ProjectState): ProjectState[] {
  return normalizeLibrary([...projects.filter((item) => item.id !== project.id), project])
}

export function removeProject(projects: ProjectState[], id: string): ProjectState[] {
  return projects.filter((item) => item.id !== id)
}

export function serializeProjectBackup(activeProject: ProjectState, projects: ProjectState[]): string {
  const backup: ProjectBackup = {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    activeProject,
    projects: upsertProject(projects, activeProject)
  }
  return JSON.stringify(backup, null, 2)
}

export function parseProjectBackup(text: string): ProjectBackup {
  const parsed: unknown = JSON.parse(text)
  if (parsed && typeof parsed === 'object' && (parsed as { backupVersion?: unknown }).backupVersion === 1) {
    const raw = parsed as { activeProject?: unknown; projects?: unknown; exportedAt?: unknown }
    const projects = normalizeLibrary(raw.projects)
    const activeProject = normalizeProjectState(raw.activeProject) ?? projects[0]
    if (!activeProject) throw new Error('O backup não possui um projeto válido.')
    return {
      backupVersion: 1,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
      activeProject,
      projects: upsertProject(projects, activeProject)
    }
  }

  const single = normalizeProjectState(parsed)
  if (single) return { backupVersion: 1, exportedAt: new Date().toISOString(), activeProject: single, projects: [single] }
  throw new Error('Arquivo de backup inválido ou incompatível com a V9.')
}
