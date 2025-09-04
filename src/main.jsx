import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppSSO from './AppSSO.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppSSO />
  </StrictMode>,
)
