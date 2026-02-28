import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch() {}

  resetCache = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) await r.unregister()
    }
    if ('caches' in window) {
      const names = await caches.keys()
      await Promise.all(names.map(n => caches.delete(n)))
    }
    localStorage.clear()
    sessionStorage.clear()
    location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>App Error</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>{this.state.message || 'Unknown error'}</div>
          <button
            onClick={this.resetCache}
            style={{ background: '#ef4444', color: '#fff', border: 0, padding: '10px 14px', borderRadius: 12, fontWeight: 800 }}
          >
            Reset App Cache
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
