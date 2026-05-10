import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Palette, DollarSign, Bell, Shield, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const [currency, setCurrency] = useState(() => localStorage.getItem('kzm-currency') || 'INR')
  const [theme, setTheme] = useState(() => localStorage.getItem('kzm-theme') || 'dark')
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('kzm-color-theme') || 'classic')
  const [notifications, setNotifications] = useState({
    stockAlert: true,
    orders: true,
    hazmat: false
  })
  const [workspace, setWorkspace] = useState({
    defaultLimit: '50',
    landingTab: 'dashboard'
  })

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

  const handleSave = () => {
    localStorage.setItem('kzm-currency', currency)
    localStorage.setItem('kzm-notifications', JSON.stringify(notifications))
    localStorage.setItem('kzm-workspace', JSON.stringify(workspace))
    toast.success('Luxury ERP settings updated successfully!')
  }

  const currencies = [
    { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', label: 'Euro (€)', symbol: '€' },
    { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { code: 'AED', label: 'UAE Dirham (د.إ)', symbol: 'د.إ' }
  ]

  const colorThemes = [
    { id: 'classic', name: 'Classic Onyx & Gold', desc: 'Midnight obsidian backdrop with gold trim' },
    { id: 'quartz', name: 'Rose Quartz Blush', desc: 'Soft warm luxury tones with champagne highlights' },
    { id: 'emerald', name: 'Royal Malachite Green', desc: 'Prestige forest green and metallic emerald accents' },
    { id: 'sapphire', name: 'Imperial Sapphire Blue', desc: 'Deep sovereign navy with brilliant sapphire trim' }
  ]

  return (
    <div style={{ maxWidth: 800, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #fff, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ERP System Settings
        </h1>
        <p className="page-subtitle">Configure your custom currency formats, luxury themes, and notification preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* SECTION 1: GLOBALIZATION & CURRENCY */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <DollarSign size={20} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>Globalization & Currency</h3>
          </div>
          <div className="form-group" style={{ maxWidth: 400 }}>
            <label className="form-label">Preferred Currency Display</label>
            <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Configures price displays across product, inventory, and order transaction panels.
            </p>
          </div>
        </div>

        {/* SECTION 2: LUXURY APPEARANCE DESIGN */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Palette size={20} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>Appearance & Aesthetics</h3>
          </div>
          
          <div className="grid-2" style={{ gap: 20, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Active Palette Theme</label>
              <select className="select" value={colorTheme} onChange={e => setColorTheme(e.target.value)}>
                {colorThemes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Aesthetic Contrast</label>
              <select className="select" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="dark">Dark Mode (Premium Glassmorphic)</option>
                <option value="light">Light Mode (Clean Silk)</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            {colorThemes.map(t => (
              <div 
                key={t.id} 
                onClick={() => setColorTheme(t.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  background: colorTheme === t.id ? 'rgba(201,168,76,0.08)' : 'rgba(0,0,0,0.1)', 
                  border: colorTheme === t.id ? '1px solid var(--gold)' : '1px solid transparent', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.id === 'classic' ? 'var(--gold)' : `var(--primary)` }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: SYSTEM NOTIFICATIONS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Bell size={20} style={{ color: 'var(--gold)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>System & Order Notifications</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="flex items-center gap-3 text-sm" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.stockAlert} onChange={e => setNotifications(prev => ({ ...prev, stockAlert: e.target.checked }))} />
              <div>
                <strong style={{ display: 'block', color: '#fff' }}>Warehouse Inventory Alerts</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Trigger notifications when stock counts drop below designated SKU thresholds.</span>
              </div>
            </label>
            <label className="flex items-center gap-3 text-sm" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.orders} onChange={e => setNotifications(prev => ({ ...prev, orders: e.target.checked }))} />
              <div>
                <strong style={{ display: 'block', color: '#fff' }}>Real-time Dispatch Updates</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Send automated alerts to customers instantly on luxury courier dispatchment.</span>
              </div>
            </label>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ gap: 8, padding: '12px 24px' }}>
            <Save size={16} /> Save ERP Preferences
          </button>
        </div>

      </div>
    </div>
  )
}
