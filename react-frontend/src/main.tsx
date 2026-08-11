import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { captureReferralFromUrl } from './utils/referral'

// Capture referral code from URL on app load
captureReferralFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-center" richColors />
    <App />
  </StrictMode>,
)
