import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installViewportGuards } from './services/viewport'

const removeViewportGuards = installViewportGuards()
if (import.meta.hot) import.meta.hot.dispose(removeViewportGuards)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
