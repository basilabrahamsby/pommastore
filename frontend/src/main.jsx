import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#13131f',
          color: '#f0eff7',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          fontSize: '0.83rem',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#13131f' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#13131f' } },
      }}
    />
  </React.StrictMode>,
)
