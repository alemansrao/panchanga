import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import './index.css'
import App from './App.jsx'
import CredCursor from './components/cred/CredCursor'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeroUIProvider>
      <CredCursor />
      <App />
    </HeroUIProvider>
  </StrictMode >
)
