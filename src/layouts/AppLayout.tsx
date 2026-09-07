import type { ReactNode } from 'react'
import '../styles/layout.css'

type AppLayoutProps = {
  appName: string
  actions?: ReactNode
  children: ReactNode
}

export default function AppLayout({ appName, actions, children }: AppLayoutProps) {
  return (
    <div className="app-layout" lang="pt-BR">
      <header className="app-layout__header">
        <div className="app-layout__container app-layout__header-content">
          <span className="app-layout__name">{appName}</span>
          {actions != null && <div className="app-layout__actions">{actions}</div>}
        </div>
      </header>

      <main className="app-layout__container app-layout__main">{children}</main>
    </div>
  )
}
