import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { failed: boolean; message: string }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      failed: true,
      message: error instanceof Error ? error.message : 'Erro inesperado na aplicação.'
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('IMPERTUDO V9 — erro não tratado', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="fatalErrorPage">
        <section className="fatalErrorCard">
          <div className="eyebrow dark">RECUPERAÇÃO DA V9</div>
          <h1>A calculadora encontrou um erro inesperado.</h1>
          <p>Os dados salvos no navegador não são apagados por esta tela. Recarregue a aplicação; se o problema persistir, evite limpar os dados do navegador até conseguir exportar um backup da Biblioteca de Obras.</p>
          <code>{this.state.message}</code>
          <div className="fatalErrorActions">
            <button className="primaryButton" onClick={() => window.location.reload()}>Recarregar aplicação</button>
            <button className="secondaryButton" onClick={() => this.setState({ failed: false, message: '' })}>Tentar continuar</button>
          </div>
        </section>
      </main>
    )
  }
}
