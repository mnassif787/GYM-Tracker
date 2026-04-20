// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { WorkoutProvider } from '@/context/WorkoutContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <WorkoutProvider>
          <App />
          <Toaster richColors position="top-center" />
        </WorkoutProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
