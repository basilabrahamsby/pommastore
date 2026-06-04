import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Boxes, ShoppingCart, Star,
  Users, LogOut, X, Sun, Moon, Palette, Settings, BarChart3, Monitor, HelpCircle
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Overview', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  ]},
  { label: 'Catalog', items: [
    { to: '/catalog',   icon: Package, label: 'Catalog Manager' },
  ]},
  { label: 'Operations', items: [
    { to: '/inventory', icon: Boxes,        label: 'Inventory' },
    { to: '/orders',    icon: ShoppingCart, label: 'Orders & CRM' },
    { to: '/offers',    icon: Tag,          label: 'Marketing & Loyalty Hub' },
  ]},
  { label: 'System', items: [
    { to: '/storefront', icon: Monitor,      label: 'Storefront CMS' },
    { to: '/settings',  icon: Settings,     label: 'Settings' },
    { to: '/help',      icon: HelpCircle,   label: 'System Manual' },
  ]},
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('kzm-theme') || 'light')
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('kzm-color-theme') || 'classic')

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
      document.body.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
      document.body.classList.remove('light-theme')
    }
    localStorage.setItem('kzm-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.remove('theme-quartz', 'theme-emerald', 'theme-sapphire')
    document.body.classList.remove('theme-quartz', 'theme-emerald', 'theme-sapphire')

    if (colorTheme !== 'classic') {
      document.documentElement.classList.add(`theme-${colorTheme}`)
      document.body.classList.add(`theme-${colorTheme}`)
    }
    localStorage.setItem('kzm-color-theme', colorTheme)
  }, [colorTheme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    toast.success(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`)
  }

  const cycleColorTheme = () => {
    const themes = ['classic', 'quartz', 'emerald', 'sapphire']
    const nextIdx = (themes.indexOf(colorTheme) + 1) % themes.length
    const nextColorTheme = themes[nextIdx]
    setColorTheme(nextColorTheme)
    
    const themeNames = {
      classic: 'Classic Onyx & Gold',
      quartz: 'Rose Quartz Blush',
      emerald: 'Royal Malachite Green',
      sapphire: 'Imperial Sapphire Blue'
    }
    toast.success(`Active Luxury Palette: ${themeNames[nextColorTheme]}`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KZ'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo row — includes close button on mobile */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <img src="/kozmocart/admin/logo.png" alt="Kozmocart Logo" style={{ height: '32px', objectFit: 'contain', display: 'block' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>
            Admin ERP
          </span>
        </div>
        {/* Only visible on mobile */}
        <button
          className="hamburger"
          onClick={onClose}
          style={{ flexShrink: 0 }}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.full_name || 'Admin'}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={cycleColorTheme} title="Cycle Luxury Color Theme" style={{ marginRight: 6 }}>
            <Palette size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ marginRight: 6 }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={handleLogout} title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
