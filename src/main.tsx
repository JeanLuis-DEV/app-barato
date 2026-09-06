import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@apps-simples/ui/style.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
