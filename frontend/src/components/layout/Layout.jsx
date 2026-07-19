import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile: dark overlay behind open sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar — receives open state for mobile class */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Mobile top bar with hamburger */}
          <div style={{ background: '#0a0a0f', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.3)' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Pommastore Logo" style={{ height: '30px', objectFit: 'contain', display: 'block' }} onError={(e) => { e.target.onerror = null; e.target.src = '/pommastore/admin/logo.png' }} />
          </div>
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
