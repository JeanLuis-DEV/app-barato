import type { ReactNode } from 'react'
import '../styles/layout.css'

type AppLayoutProps = {
  appName: string
  icon?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export default function AppLayout({ appName, icon, actions, footer, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <div className="app-layout__container app-layout__header-content">
          <span className="app-layout__icon" aria-hidden="true">{icon ?? '◇'}</span>
          <span className="app-layout__name">{appName}</span>
          {actions != null && <div className="app-layout__actions">{actions}</div>}
        </div>
      </header>

      <main className="app-layout__container app-layout__main">{children}</main>

      {footer != null && (
        <footer className="app-layout__footer">
          <div className="app-layout__container">{footer}</div>
        </footer>
      )}
    </div>
  )
}
