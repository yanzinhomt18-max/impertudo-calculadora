import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './AppErrorBoundary'
import { ProjectProvider } from './project/ProjectContext'
import './v9-app.css'
import './v9-reliability.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </ProjectProvider>
  </StrictMode>
)
