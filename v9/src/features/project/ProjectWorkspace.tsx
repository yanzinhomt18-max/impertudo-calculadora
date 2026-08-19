import PriceCatalogPanel from './PriceCatalogPanel'
import ProjectLibraryPanel from './ProjectLibraryPanel'
import ProjectDashboard from './ProjectDashboard'

export default function ProjectWorkspace() {
  return (
    <div className="projectWorkspace">
      <PriceCatalogPanel />
      <ProjectLibraryPanel />
      <ProjectDashboard />
    </div>
  )
}
