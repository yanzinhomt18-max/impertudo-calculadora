import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ProjectProvider } from './project/ProjectContext'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </StrictMode>
)
