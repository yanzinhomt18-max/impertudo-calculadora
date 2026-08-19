import { createEmptyProject, type ProjectState } from './types'

const STORAGE_KEY = 'impertudo-v9-project-v1'

function isProjectState(value: unknown): value is ProjectState {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  return project.version === 1
    && typeof project.id === 'string'
    && Array.isArray(project.calculations)
    && typeof project.pricing === 'object'
}

export function loadProject(): ProjectState {
  if (typeof localStorage === 'undefined') return createEmptyProject()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProject()
    const parsed: unknown = JSON.parse(raw)
    return isProjectState(parsed) ? parsed : createEmptyProject()
  } catch {
    return createEmptyProject()
  }
}

export function saveProject(project: ProjectState): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export function clearStoredProject(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
