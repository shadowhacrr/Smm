import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right" 
      toastOptions={{ 
        style: { 
          background: 'rgba(10,10,10,0.95)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          color: '#fff' 
        } 
      }} 
    />
  </StrictMode>,
)
