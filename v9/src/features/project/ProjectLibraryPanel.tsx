import { useRef, useState, type ChangeEvent } from 'react'
import { useProject } from '../../project/ProjectContext'

const dateTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function safeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

export default function ProjectLibraryPanel() {
  const {
    project,
    savedProjects,
    isCurrentSaved,
    storageOk,
    saveCurrentToLibrary,
    openSavedProject,
    duplicateCurrentProject,
    deleteSavedProject,
    exportBackup,
    importBackup
  } = useProject()
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  function exportJson() {
    const content = exportBackup()
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `impertudo-v9-backup-completo-${safeName(project.projectName || project.client || 'obras') || 'obras'}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setStatus('Backup completo exportado ✓')
    window.setTimeout(() => setStatus(''), 2000)
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const count = importBackup(text)
      setStatus(`${count} obra(s) importada(s) ✓`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível importar o backup.')
    }
    window.setTimeout(() => setStatus(''), 3500)
  }

  return (
    <section className="projectLibraryPanel">
      {!storageOk && <div className="storageWarning"><strong>Atenção ao armazenamento local</strong><span>O navegador recusou uma gravação local. Exporte um backup completo antes de fechar ou atualizar a página.</span><button className="secondaryButton" onClick={exportJson}>Exportar backup agora</button></div>}
      <div className="libraryHead">
        <div>
          <div className="eyebrow dark">BIBLIOTECA DE OBRAS</div>
          <h3>Projetos salvos neste dispositivo</h3>
          <p>Salve obras para reabrir depois. O backup completo inclui a obra ativa, a biblioteca e a tabela central de preços.</p>
        </div>
        <span className="libraryCounter">{savedProjects.length}</span>
      </div>

      <div className="libraryToolbar">
        <button className="primaryButton" onClick={() => { saveCurrentToLibrary(); setStatus('Obra salva ✓'); window.setTimeout(() => setStatus(''), 1800) }}>
          {isCurrentSaved ? 'Atualizar obra salva' : 'Salvar na biblioteca'}
        </button>
        <button className="secondaryButton" onClick={() => { duplicateCurrentProject(); setStatus('Cópia criada ✓'); window.setTimeout(() => setStatus(''), 1800) }}>Duplicar obra</button>
        <button className="secondaryButton" onClick={exportJson}>Exportar backup completo</button>
        <button className="secondaryButton" onClick={() => inputRef.current?.click()}>Importar backup</button>
        <input ref={inputRef} className="hiddenFileInput" type="file" accept="application/json,.json" onChange={importJson} />
        {status && <span className="libraryStatus">{status}</span>}
      </div>

      {savedProjects.length === 0 ? (
        <div className="emptyState small">Nenhuma obra salva ainda. A obra atual continua sendo salva como rascunho automático; use “Salvar na biblioteca” quando quiser mantê-la no histórico.</div>
      ) : (
        <div className="projectLibraryGrid">
          {savedProjects.map((item) => {
            const active = item.id === project.id
            return (
              <article className={`savedProjectCard${active ? ' active' : ''}`} key={item.id}>
                <div className="savedProjectTop">
                  <div>
                    <small>{active ? 'OBRA ATIVA' : 'OBRA SALVA'}</small>
                    <h4>{item.projectName || 'Obra sem nome'}</h4>
                    <p>{item.client || 'Cliente não informado'}{item.location ? ` • ${item.location}` : ''}</p>
                  </div>
                  <span>{item.calculations.length} cálculo(s)</span>
                </div>
                <div className="savedProjectMeta">{item.proposalNumber} • Atualizada em {dateTime(item.updatedAt)}</div>
                <div className="savedProjectActions">
                  <button className="secondaryButton" disabled={active} onClick={() => { openSavedProject(item.id); setStatus('Obra aberta ✓'); window.setTimeout(() => setStatus(''), 1800) }}>{active ? 'Aberta' : 'Abrir obra'}</button>
                  <button className="dangerButton" onClick={() => {
                    if (window.confirm(`Excluir “${item.projectName || 'Obra sem nome'}” da biblioteca?`)) {
                      deleteSavedProject(item.id)
                      setStatus('Obra removida da biblioteca')
                      window.setTimeout(() => setStatus(''), 1800)
                    }
                  }}>Excluir</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
