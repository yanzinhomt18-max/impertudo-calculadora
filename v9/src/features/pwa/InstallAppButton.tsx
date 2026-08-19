import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setIos(/iphone|ipad|ipod/.test(ua))
    const handler = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt()
      await promptEvent.userChoice
      setPromptEvent(null)
      return
    }
    setShowHelp((value) => !value)
  }

  return (
    <div className="installWrap">
      <button className="installButton" onClick={install}>{promptEvent ? 'Instalar aplicativo' : 'Como instalar'}</button>
      {showHelp && (
        <div className="installHelp">
          {ios
            ? 'No Safari: toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
            : 'No Chrome/Edge: abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.'}
        </div>
      )}
    </div>
  )
}
