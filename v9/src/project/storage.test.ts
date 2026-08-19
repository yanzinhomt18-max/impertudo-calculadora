import { describe, expect, it } from 'vitest'
import { createEmptyProject } from './types'
import { normalizeLibrary, normalizeProjectState, parseProjectBackup, serializeProjectBackup, upsertProject } from './storage'

function project(id: string, name: string, updatedAt: string) {
  return { ...createEmptyProject(), id, projectName: name, updatedAt }
}

describe('biblioteca de obras', () => {
  it('normaliza projeto antigo sem checklist', () => {
    const raw = { ...project('a', 'Obra A', '2026-08-19T00:00:00Z') } as Record<string, unknown>
    delete raw.checklist
    const normalized = normalizeProjectState(raw)
    expect(normalized?.id).toBe('a')
    expect(normalized?.checklist).toEqual({})
  })

  it('deduplica projetos pelo id mantendo a versão mais recente', () => {
    const older = project('a', 'Antiga', '2026-08-18T10:00:00Z')
    const newer = project('a', 'Nova', '2026-08-19T10:00:00Z')
    const result = normalizeLibrary([older, newer])
    expect(result).toHaveLength(1)
    expect(result[0].projectName).toBe('Nova')
  })

  it('faz upsert sem duplicar a obra', () => {
    const first = project('a', 'Primeira', '2026-08-18T10:00:00Z')
    const updated = project('a', 'Atualizada', '2026-08-19T10:00:00Z')
    const result = upsertProject([first], updated)
    expect(result).toHaveLength(1)
    expect(result[0].projectName).toBe('Atualizada')
  })

  it('exporta e importa backup completo', () => {
    const active = project('a', 'Ativa', '2026-08-19T10:00:00Z')
    const other = project('b', 'Outra', '2026-08-19T09:00:00Z')
    const text = serializeProjectBackup(active, [other])
    const parsed = parseProjectBackup(text)
    expect(parsed.activeProject.id).toBe('a')
    expect(parsed.projects.map((item) => item.id).sort()).toEqual(['a', 'b'])
  })

  it('aceita um projeto V9 isolado como backup legado', () => {
    const active = project('legacy', 'Legado', '2026-08-19T10:00:00Z')
    const parsed = parseProjectBackup(JSON.stringify(active))
    expect(parsed.projects).toHaveLength(1)
    expect(parsed.activeProject.id).toBe('legacy')
  })

  it('rejeita backup inválido', () => {
    expect(() => parseProjectBackup('{"x":1}')).toThrow('Arquivo de backup inválido')
  })
})
