import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, Palette, DollarSign, Bell, Shield, 
  Save, Building2, FileText, Globe, Search, Link as LinkIcon, Truck, Award, Mail, MessageSquare, Smartphone, Wifi, WifiOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const DEFAULT_EMAIL_TEMPLATES = {
  confirmed:      { subject: 'Your Kozmocart Order {{order}} is Confirmed! 🎉', body: 'Dear {{name}},\n\nGreat news! Your order *{{order}}* has been confirmed and is being prepared.\n\nThank you for choosing Kozmocart.\n\nWarm Regards,\nKozmocart Team' },
  processing:     { subject: 'Order {{order}} is Being Processed 📦', body: 'Dear {{name}},\n\nYour order *{{order}}* is currently being processed at our warehouse. We will notify you once it is packed and ready to ship.\n\nThank you for your patience.\n\nKozmocart Team' },
  packed:         { subject: 'Order {{order}} is Packed & Ready to Ship 🚀', body: 'Dear {{name}},\n\nYour order *{{order}}* has been packed and will be dispatched very soon!\n\nKozmocart Team' },
  shipped:        { subject: 'Your Order {{order}} Has Shipped! 🚚 Track it Here', body: 'Dear {{name}},\n\nExciting news — your order *{{order}}* is on its way!\n\nTracking AWB: {{awb}}\nTrack here: https://www.delhivery.com/track/package/{{awb}}\n\nEstimated delivery: 3-5 business days.\n\nKozmocart Team' },
  out_for_delivery: { subject: 'Out for Delivery Today! 🏠 Order {{order}}', body: 'Dear {{name}},\n\nYour order *{{order}}* is out for delivery today. Please keep your phone handy for the delivery partner.\n\nKozmocart Team' },
  delivered:      { subject: 'Order {{order}} Delivered Successfully ✅', body: 'Dear {{name}},\n\nYour order *{{order}}* has been delivered. We hope you love your purchase!\n\nPlease share a review — it means the world to us.\n\nKozmocart Team' },
  completed:      { subject: 'Thank You for Shopping with Kozmocart 💛', body: 'Dear {{name}},\n\nOrder *{{order}}* is now marked complete. Thank you for being a valued Kozmocart customer.\n\nEarn more loyalty points on your next order!\n\nKozmocart Team' },
  cancelled:      { subject: 'Order {{order}} Has Been Cancelled', body: 'Dear {{name}},\n\nWe are sorry to inform you that order *{{order}}* has been cancelled.\n\nIf you have any concerns, please reach out to our support team immediately.\n\nKozmocart Team' },
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('appearance')

  const [currency, setCurrency] = useState('INR')
  const [theme, setTheme] = useState('light')
  const [colorTheme, setColorTheme] = useState('classic')
  const [notifications, setNotifications] = useState({ stockAlert: true, orders: true, hazmat: false })
  const [companyGst, setCompanyGst] = useState({
    companyName: 'Kozmocart Luxury Innovations Pvt Ltd',
    gstin: '',
    pan: '',
    registeredAddress: '',
    stateCode: '07 (Delhi)'
  })
  const [seoConfig, setSeoConfig] = useState({
    siteTitle: 'Kozmocart | Luxury Perfume ERP',
    metaDescription: 'The definitive ERP for high-end perfume houses and luxury retail management.',
    metaKeywords: 'perfume erp, luxury retail, inventory management, fragrance software',
    googleConsoleId: '',
    robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://kozmocart.in/api/v1/seo/sitemap.xml',
    indexingEnabled: true
  })

  // New Phase 3/4 states
  const [exchangeRates, setExchangeRates] = useState({ USD: 83.5, EUR: 89.2, GBP: 104.5, AED: 22.7 })
  const [restrictedRegions, setRestrictedRegions] = useState('IR, KP, SY')
  const [loyaltySettings, setLoyaltySettings] = useState({ 
    points_per_currency_unit: '1', 
    referral_bonus_points: '500',
    point_value_in_currency: '1'
  })

  const [returnPolicy, setReturnPolicy] = useState({
    title: 'Returns & Exchange Policy',
    lastUpdated: 'Last updated June 2026',
    authenticityTitle: '100% Authenticity',
    authenticityDesc: 'Every fragrance dispatched from Kozmocart is completely sealed and sourced directly. We guarantee absolute authenticity.',
    windowTitle: '7-Day Window',
    windowDesc: 'Requests for returns or replacements due to transit damage or shipping errors are accepted within 7 days of delivery.',
    contentHtml: ''
  })

  const [privacyPolicy, setPrivacyPolicy] = useState({
    title: 'Privacy Policy',
    lastUpdated: 'Last updated June 2026',
    authenticityTitle: '100% Secure Data',
    authenticityDesc: 'All personal identifiers and transactions are protected via AES-256 standard encryption protocols. Your data is private.',
    windowTitle: 'Zero Third-Party Sharing',
    windowDesc: 'We do not sell, rent, or lease your private personal information, olfactory profiles, or browsing habits under any conditions.',
    contentHtml: ''
  })

  const [termsConditions, setTermsConditions] = useState({
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated June 2026',
    authenticityTitle: 'Age Mandate',
    authenticityDesc: 'By utilizing Kozmocart storefront, you affirm you are at least 18 years of age or accessing under familial supervision.',
    windowTitle: 'Commercial Fair Use',
    windowDesc: 'We prohibit automated bot crawlers or resellers from executing speculative bulk orders. We reserve cancellation rights.',
    contentHtml: ''
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Communications config
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    encryption: 'TLS',
    username: 'noreply@kozmocart.in',
    password: '',
    fromName: 'Kozmocart Orders',
    fromEmail: 'noreply@kozmocart.in',
    enabled: false
  })
  const [whatsappConfig, setWhatsappConfig] = useState({
    provider: 'meta',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    wabaId: '',
    enabled: false
  })
  const [smsConfig, setSmsConfig] = useState({
    provider: 'msg91',
    apiKey: '',
    senderId: 'KOZMOC',
    dltTemplateId: '',
    enabled: false
  })
  const [commTesting, setCommTesting] = useState({ smtp: null, whatsapp: null, sms: null }) // null | 'testing' | 'ok' | 'fail'
  const [commSubTab, setCommSubTab] = useState('smtp')

  // Email notification config
  const [emailConfig, setEmailConfig] = useState({ senderName: 'Kozmocart', replyTo: '', enabled: true })
  const [emailTemplates, setEmailTemplates] = useState(DEFAULT_EMAIL_TEMPLATES)
  const [selectedEmailStatus, setSelectedEmailStatus] = useState('confirmed')

  // Load settings from DB on mount
  useEffect(() => {
    api.get('/settings')
      .then(res => {
        const d = res.data
        if (d.appearance) {
          if (d.appearance.theme) setTheme(d.appearance.theme)
          if (d.appearance.colorTheme) setColorTheme(d.appearance.colorTheme)
        }
        if (d.globalization?.currency) setCurrency(d.globalization.currency)
        if (d.notifications) setNotifications(d.notifications)
        if (d.company) setCompanyGst(d.company)
        if (d.seo) setSeoConfig(d.seo)
        if (d.geo) {
          if (d.geo.exchangeRates) setExchangeRates(d.geo.exchangeRates)
          if (d.geo.restrictedRegions) setRestrictedRegions(d.geo.restrictedRegions)
        }
        if (d.marketing?.loyaltySettings) setLoyaltySettings(d.marketing.loyaltySettings)
        if (d.emailConfig) setEmailConfig(d.emailConfig)
        if (d.emailTemplates) setEmailTemplates({ ...DEFAULT_EMAIL_TEMPLATES, ...d.emailTemplates })
        if (d.smtpConfig) setSmtpConfig(prev => ({ ...prev, ...d.smtpConfig }))
        if (d.whatsappConfig) setWhatsappConfig(prev => ({ ...prev, ...d.whatsappConfig }))
        if (d.smsConfig) setSmsConfig(prev => ({ ...prev, ...d.smsConfig }))
        if (d.return_policy) setReturnPolicy(d.return_policy)
        if (d.privacy_policy) setPrivacyPolicy(d.privacy_policy)
        if (d.terms_conditions) setTermsConditions(d.terms_conditions)
      })
      .catch(() => toast.error('Cloud config not initialized. Showing defaults.'))
      .finally(() => setLoading(false))
  }, [])

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        appearance: { theme, colorTheme },
        globalization: { currency },
        notifications,
        company: companyGst,
        seo: seoConfig,
        geo: { exchangeRates, restrictedRegions },
        marketing: { loyaltySettings },
        emailConfig,
        emailTemplates,
        smtpConfig: { ...smtpConfig, password: smtpConfig.password }, // stored server-side
        whatsappConfig: { ...whatsappConfig },
        smsConfig: { ...smsConfig },
        return_policy: returnPolicy,
        privacy_policy: privacyPolicy,
        terms_conditions: termsConditions
      }
      await api.patch('/settings', payload)
      // Also persist to localStorage for use across the app
      localStorage.setItem('kzm-email-config', JSON.stringify(emailConfig))
      localStorage.setItem('kzm-email-templates', JSON.stringify(emailTemplates))
      localStorage.setItem('kzm-smtp-config', JSON.stringify(smtpConfig))
      localStorage.setItem('kzm-whatsapp-config', JSON.stringify(whatsappConfig))
      localStorage.setItem('kzm-sms-config', JSON.stringify(smsConfig))
      
      // Sync local state just in case they are read synchronously by app shells
      localStorage.setItem('kzm-theme', theme)
      localStorage.setItem('kzm-color-theme', colorTheme)
      
      toast.success('Configuration safely persisted to cloud infrastructure!')
    } catch (err) {
      toast.error('Failed to sync settings with ERP cluster.')
    } finally {
      setSaving(false)
    }
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

  const handleTestSMTP = async () => {
    setCommTesting(p => ({ ...p, smtp: 'testing' }))
    await new Promise(r => setTimeout(r, 1800))
    // Demo: always succeed. Replace with real API test call: await api.post('/settings/test-smtp', smtpConfig)
    setCommTesting(p => ({ ...p, smtp: smtpConfig.host && smtpConfig.username ? 'ok' : 'fail' }))
    if (smtpConfig.host && smtpConfig.username) toast.success('✅ SMTP connection verified (demo)')
    else toast.error('Fill in host and username first')
  }

  const handleTestWhatsApp = async () => {
    setCommTesting(p => ({ ...p, whatsapp: 'testing' }))
    await new Promise(r => setTimeout(r, 1800))
    setCommTesting(p => ({ ...p, whatsapp: whatsappConfig.accessToken ? 'ok' : 'fail' }))
    if (whatsappConfig.accessToken) toast.success('✅ WhatsApp Business API verified (demo)')
    else toast.error('Enter your Access Token first')
  }

  const handleTestSMS = async () => {
    setCommTesting(p => ({ ...p, sms: 'testing' }))
    await new Promise(r => setTimeout(r, 1800))
    setCommTesting(p => ({ ...p, sms: smsConfig.apiKey ? 'ok' : 'fail' }))
    if (smsConfig.apiKey) toast.success('✅ Bulk SMS gateway verified (demo)')
    else toast.error('Enter your API Key first')
  }

  const StatusDot = ({ state }) => {
    if (!state) return <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Not tested</span>
    if (state === 'testing') return <span style={{ fontSize: '0.65rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 4 }}><Wifi size={12} /> Testing…</span>
    if (state === 'ok') return <span style={{ fontSize: '0.65rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><Wifi size={12} /> Connected</span>
    return <span style={{ fontSize: '0.65rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 4 }}><WifiOff size={12} /> Failed</span>
  }

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'globalization', label: 'Currencies', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'seo', label: 'Public SEO', icon: Search },
    { id: 'geo', label: 'GEO Logic', icon: Truck },
    { id: 'marketing', label: 'Marketing Engine', icon: Award },
    { id: 'email', label: 'Email Templates', icon: Mail },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'return_policy', label: 'Return Policy', icon: FileText },
    { id: 'privacy_policy', label: 'Privacy Policy', icon: FileText },
    { id: 'terms_conditions', label: 'Terms & Conditions', icon: FileText },
  ]

  return (
    <div style={{ maxWidth: 850, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, var(--text-primary), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ERP System Settings
        </h1>
        <p className="page-subtitle">Configure your business profile, GST compliance, currency format, and aesthetics</p>
      </div>

      {/* TABS ROW */}
      <div className="settings-tabs" style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 6, borderRadius: 10, width: '100%', overflowX: 'auto' }}>
        {tabs.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                background: active ? 'var(--gold)' : 'transparent',
                color: active ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 30 }}>
        
        {/* TAB 1: APPEARANCE */}
        {activeTab === 'appearance' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Palette size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Appearance & Aesthetics</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Modify the visual profile of the Luxury ERP portal</p>
              </div>
            </div>
            
            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theme Previews</span>
              {colorThemes.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setColorTheme(t.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s ease',
                    background: colorTheme === t.id ? 'rgba(201,168,76,0.08)' : 'rgba(0,0,0,0.15)', 
                    border: colorTheme === t.id ? '1px solid var(--gold)' : '1px solid var(--border)', 
                  }}
                  className="hover-lift"
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.id === 'classic' ? 'var(--gold)' : `var(--primary)`, boxShadow: colorTheme === t.id ? '0 0 10px var(--gold)' : 'none' }} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GLOBALIZATION */}
        {activeTab === 'globalization' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <DollarSign size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Globalization & Currency</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure financial unit displays across modules</p>
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <label className="form-label">Preferred Base Currency Display</label>
              <select className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                This preference updates localized symbolic prefixes (e.g. ₹, $) across Catalog valuations, Order POS registers, and analytic KPIs.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Bell size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>System Trigger Routing</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Fine-tune threshold automated operational notifications</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { id: 'stockAlert', title: 'Warehouse Stock Thresholds', desc: 'Trigger browser & dashboard flags when SKU quantities penetrate defined min thresholds.' },
                { id: 'orders', title: 'Real-time Transaction Feed', desc: 'Send dispatchment webhook feeds for fulfillment tracking instantly on bookings.' }
              ].map(n => (
                <label key={n.id} style={{ display: 'flex', gap: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                  <div style={{ paddingTop: 2 }}>
                    <input type="checkbox" checked={notifications[n.id]} onChange={e => setNotifications(prev => ({ ...prev, [n.id]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--gold)' }} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#fff', fontSize: '0.9rem' }}>{n.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY & GST */}
        {activeTab === 'company' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Building2 size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Company Profile & GST Compliance</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure statutory identification details for digital invoicing</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Company Registered Legal Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Kozmocart Retailers Private Limited"
                  value={companyGst.companyName}
                  onChange={e => setCompanyGst(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Company GSTIN *</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. 07AADCB2230M1Z5"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, color: 'var(--gold-bright)' }}
                    value={companyGst.gstin}
                    onChange={e => setCompanyGst(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="ABCDE1234F"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                    value={companyGst.pan}
                    onChange={e => setCompanyGst(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Registered Address (Appears on Transactions)</label>
                <textarea 
                  className="input" 
                  rows={3}
                  placeholder="Enter full statutory address for invoice footers..."
                  value={companyGst.registeredAddress}
                  onChange={e => setCompanyGst(prev => ({ ...prev, registeredAddress: e.target.value }))}
                />
              </div>

              <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 8, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <FileText size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Statutory Transaction Visibility</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Entering your GSTIN here will instantly dynamically embed the compliance header onto generated transactional summaries, receipts and order detail modals system-wide.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SOFTWARE SEO */}
        {activeTab === 'seo' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Search size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Software & Public SEO</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure global discovery parameters and search engine signals</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Global Website Title</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Kozmocart | Prestige Fragrances ERP"
                  value={seoConfig.siteTitle}
                  onChange={e => setSeoConfig(prev => ({ ...prev, siteTitle: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Global Meta Description</label>
                <textarea 
                  className="input" 
                  rows={2}
                  placeholder="Enter high-converting description for search results..."
                  value={seoConfig.metaDescription}
                  onChange={e => setSeoConfig(prev => ({ ...prev, metaDescription: e.target.value }))}
                />
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Google Search Console ID</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="G-XXXXXXXXXX"
                    style={{ fontFamily: 'monospace' }}
                    value={seoConfig.googleConsoleId}
                    onChange={e => setSeoConfig(prev => ({ ...prev, googleConsoleId: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Search Indexing Status</label>
                  <div 
                    onClick={() => setSeoConfig(prev => ({ ...prev, indexingEnabled: !prev.indexingEnabled }))}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                      background: seoConfig.indexingEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${seoConfig.indexingEnabled ? 'var(--success)' : 'var(--error)'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: seoConfig.indexingEnabled ? 'var(--success)' : 'var(--error)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: seoConfig.indexingEnabled ? 'var(--success)' : 'var(--error)' }}>
                      {seoConfig.indexingEnabled ? 'Search Engines Allowed' : 'Indexing Restricted (Private)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Robots.txt Configuration</label>
                <textarea 
                  className="input" 
                  rows={4}
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.5 }}
                  placeholder="User-agent: *..."
                  value={seoConfig.robotsTxt}
                  onChange={e => setSeoConfig(prev => ({ ...prev, robotsTxt: e.target.value }))}
                />
              </div>

              <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 8, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Globe size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Global Discovery Control</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    These parameters control how your luxury portal is indexed by Google, Bing, and other crawlers. Changes here may take several days to reflect on search engine results pages.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GEO LOGIC */}
        {activeTab === 'geo' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Truck size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>GEO Localization & Restrictions</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage dynamic rates and high-risk hazmat shipping exclusion zones</p>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: 10 }}>Global Exchange Rate Overrides (vs INR Base)</h4>
              <div className="grid-3" style={{ gap: 14 }}>
                {Object.keys(exchangeRates).map(curr => (
                  <div key={curr} className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">1 {curr} =</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="input" type="number" step="0.01" value={exchangeRates[curr]} onChange={e => setExchangeRates(prev => ({...prev, [curr]: e.target.value}))} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Restricted Shipping Regions (ISO-2 Codes)</label>
              <textarea className="textarea" rows={2} value={restrictedRegions} onChange={e => setRestrictedRegions(e.target.value)} placeholder="Comma-separated ISO-2 codes e.g. RU, IR, CU" style={{ fontFamily: 'monospace' }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>System will auto-reject carts for perfume delivery addressing these jurisdictions due to shipping line embargoes.</p>
            </div>
          </div>
        )}

        {/* TAB 7: MARKETING ENGINE */}
        {activeTab === 'marketing' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Award size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Advanced Marketing & Loyalty Engine</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Calibrate your customer reward velocity and growth algorithms</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Points Acceleration Factor</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="input" type="number" value={loyaltySettings.points_per_currency_unit} onChange={e => setLoyaltySettings(prev => ({ ...prev, points_per_currency_unit: e.target.value }))} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>point per {currency} spent</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Point Redemption Value</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>1 Point =</span>
                  <input className="input" type="number" step="0.1" value={loyaltySettings.point_value_in_currency} onChange={e => setLoyaltySettings(prev => ({ ...prev, point_value_in_currency: e.target.value }))} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{currency} Discount</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Static Referral Bonus Bounty</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="input" type="number" value={loyaltySettings.referral_bonus_points} onChange={e => setLoyaltySettings(prev => ({ ...prev, referral_bonus_points: e.target.value }))} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Loyalty Points</span>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: 20, background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.2)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Dynamic Lifecycle Logic</div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Updating these will not alter historical user credits, but will modify calculation weights for all future settled transactions and new affiliate attributions instantaneously.
              </p>
            </div>
          </div>
        )}

        {/* TAB 8: EMAIL TEMPLATES */}
        {activeTab === 'email' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Mail size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Order Email Notification Templates</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Customise transactional emails sent to customers on every order status change</p>
              </div>
            </div>

            {/* Sender config */}
            <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 14 }}>✉️ Sender Configuration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">From Name</label>
                  <input className="input" value={emailConfig.senderName} onChange={e => setEmailConfig(p => ({ ...p, senderName: e.target.value }))} placeholder="e.g. Kozmocart" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Reply-To Email</label>
                  <input className="input" type="email" value={emailConfig.replyTo} onChange={e => setEmailConfig(p => ({ ...p, replyTo: e.target.value }))} placeholder="support@kozmocart.in" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={emailConfig.enabled} onChange={e => setEmailConfig(p => ({ ...p, enabled: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                Enable email notifications on status change
              </label>
            </div>

            {/* Status selector */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {Object.keys(DEFAULT_EMAIL_TEMPLATES).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedEmailStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: '0.72rem', fontWeight: 700,
                    background: selectedEmailStatus === s ? 'var(--gold)' : 'transparent',
                    color: selectedEmailStatus === s ? '#000' : 'var(--text-muted)',
                    borderColor: selectedEmailStatus === s ? 'var(--gold)' : 'var(--border)',
                    cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Template editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email Subject</label>
                <input
                  className="input"
                  value={emailTemplates[selectedEmailStatus]?.subject || ''}
                  onChange={e => setEmailTemplates(p => ({ ...p, [selectedEmailStatus]: { ...p[selectedEmailStatus], subject: e.target.value } }))}
                  placeholder="Subject line…"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Body</label>
                <textarea
                  className="input"
                  rows={10}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.7, resize: 'vertical' }}
                  value={emailTemplates[selectedEmailStatus]?.body || ''}
                  onChange={e => setEmailTemplates(p => ({ ...p, [selectedEmailStatus]: { ...p[selectedEmailStatus], body: e.target.value } }))}
                />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                💡 Available placeholders: <code style={{ color: 'var(--gold)' }}>{'{{name}}'}</code> — customer name &nbsp;|&nbsp;
                <code style={{ color: 'var(--gold)' }}>{'{{order}}'}</code> — order number &nbsp;|&nbsp;
                <code style={{ color: 'var(--gold)' }}>{'{{awb}}'}</code> — tracking AWB (shipped only)
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setEmailTemplates(p => ({ ...p, [selectedEmailStatus]: DEFAULT_EMAIL_TEMPLATES[selectedEmailStatus] }))}
              >
                ↩ Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: COMMUNICATIONS */}
        {activeTab === 'communications' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <MessageSquare size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Communications Hub</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure SMTP email, WhatsApp Business API, and Bulk SMS gateway credentials</p>
              </div>
            </div>

            {/* Sub-tab selector */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
              {[
                { id: 'smtp', label: '✉️ SMTP / Email', icon: Mail },
                { id: 'whatsapp', label: '💬 WhatsApp Business', icon: MessageSquare },
                { id: 'sms', label: '📱 Bulk SMS', icon: Smartphone },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => setCommSubTab(t.id)} style={{
                  padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: commSubTab === t.id ? 700 : 400,
                  color: commSubTab === t.id ? 'var(--gold)' : 'var(--text-muted)',
                  borderBottom: commSubTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.2s'
                }}>{t.label}</button>
              ))}
            </div>

            {/* ─── SMTP Panel ─── */}
            {commSubTab === 'smtp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>SMTP Mail Server</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Used for transactional order emails (confirmation, shipping, delivery)</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusDot state={commTesting.smtp} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: smtpConfig.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                      <input type="checkbox" checked={smtpConfig.enabled} onChange={e => setSmtpConfig(p => ({ ...p, enabled: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                      {smtpConfig.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">SMTP Host</label>
                      <input className="input" value={smtpConfig.host} onChange={e => setSmtpConfig(p => ({ ...p, host: e.target.value }))} placeholder="smtp.gmail.com" style={{ fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Port</label>
                      <input className="input" value={smtpConfig.port} onChange={e => setSmtpConfig(p => ({ ...p, port: e.target.value }))} placeholder="587" style={{ fontFamily: 'monospace', textAlign: 'center' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Encryption</label>
                      <select className="select" value={smtpConfig.encryption} onChange={e => setSmtpConfig(p => ({ ...p, encryption: e.target.value }))}>
                        <option value="TLS">TLS (587)</option>
                        <option value="SSL">SSL (465)</option>
                        <option value="None">None (25)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Username / Login Email</label>
                      <input className="input" value={smtpConfig.username} onChange={e => setSmtpConfig(p => ({ ...p, username: e.target.value }))} placeholder="noreply@kozmocart.in" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Password / App Password</label>
                      <input className="input" type="password" value={smtpConfig.password} onChange={e => setSmtpConfig(p => ({ ...p, password: e.target.value }))} placeholder="••••••••••••••••" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">From Name</label>
                      <input className="input" value={smtpConfig.fromName} onChange={e => setSmtpConfig(p => ({ ...p, fromName: e.target.value }))} placeholder="Kozmocart Orders" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">From Email Address</label>
                      <input className="input" value={smtpConfig.fromEmail} onChange={e => setSmtpConfig(p => ({ ...p, fromEmail: e.target.value }))} placeholder="noreply@kozmocart.in" />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  💡 <strong style={{ color: 'var(--gold)' }}>Gmail:</strong> Use App Passwords (2FA required). Go to Google Account → Security → App Passwords.<br/>
                  💡 <strong style={{ color: 'var(--gold)' }}>Outlook:</strong> Host: <code>smtp.office365.com</code>, Port: <code>587</code>, TLS.<br/>
                  💡 <strong style={{ color: 'var(--gold)' }}>Custom SMTP:</strong> Check with your hosting provider (cPanel/Zoho/AWS SES).
                </div>

                <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', gap: 8 }} onClick={handleTestSMTP} disabled={commTesting.smtp === 'testing'}>
                  {commTesting.smtp === 'testing' ? '⏳ Testing…' : '🔌 Test SMTP Connection'}
                </button>
              </div>
            )}

            {/* ─── WhatsApp Business Panel ─── */}
            {commSubTab === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>WhatsApp Business API</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Send order status updates directly to customers via WhatsApp</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusDot state={commTesting.whatsapp} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: whatsappConfig.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                      <input type="checkbox" checked={whatsappConfig.enabled} onChange={e => setWhatsappConfig(p => ({ ...p, enabled: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                      {whatsappConfig.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Provider / Integration</label>
                  <select className="select" value={whatsappConfig.provider} onChange={e => setWhatsappConfig(p => ({ ...p, provider: e.target.value }))}>
                    <option value="meta">Meta (Official WhatsApp Business API)</option>
                    <option value="twilio">Twilio WhatsApp</option>
                    <option value="360dialog">360dialog</option>
                    <option value="wati">WATI.io</option>
                    <option value="interakt">Interakt</option>
                    <option value="aisensy">AiSensy</option>
                  </select>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {whatsappConfig.provider === 'meta' && (<>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Permanent Access Token</label>
                        <input className="input" type="password" value={whatsappConfig.accessToken} onChange={e => setWhatsappConfig(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxxxxxxxxxxx" style={{ fontFamily: 'monospace' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Phone Number ID</label>
                        <input className="input" value={whatsappConfig.phoneNumberId} onChange={e => setWhatsappConfig(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="1234567890" style={{ fontFamily: 'monospace' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Business Account ID (WABA ID)</label>
                        <input className="input" value={whatsappConfig.wabaId} onChange={e => setWhatsappConfig(p => ({ ...p, wabaId: e.target.value }))} placeholder="WABA ID from Meta Business Suite" style={{ fontFamily: 'monospace' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">App / Business Account ID</label>
                        <input className="input" value={whatsappConfig.businessAccountId} onChange={e => setWhatsappConfig(p => ({ ...p, businessAccountId: e.target.value }))} placeholder="Meta App ID" style={{ fontFamily: 'monospace' }} />
                      </div>
                    </div>
                  </>)}
                  {['twilio', '360dialog', 'wati', 'interakt', 'aisensy'].includes(whatsappConfig.provider) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">API Key / Token</label>
                        <input className="input" type="password" value={whatsappConfig.accessToken} onChange={e => setWhatsappConfig(p => ({ ...p, accessToken: e.target.value }))} placeholder="Your API token" style={{ fontFamily: 'monospace' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">WhatsApp Business Number</label>
                        <input className="input" value={whatsappConfig.phoneNumberId} onChange={e => setWhatsappConfig(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="+91XXXXXXXXXX" style={{ fontFamily: 'monospace' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(37,211,102,0.05)', border: '1px dashed rgba(37,211,102,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  💡 <strong style={{ color: '#25D366' }}>Meta Official:</strong> Apply at <code>business.facebook.com</code> → WhatsApp → Get Started. Requires business verification.<br/>
                  💡 <strong style={{ color: '#25D366' }}>WATI / Interakt:</strong> Easiest for India. Sign up → connect your number → get API key within hours.<br/>
                  💡 <strong style={{ color: '#25D366' }}>Templates:</strong> All automated messages must use pre-approved message templates from Meta.
                </div>

                <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', gap: 8, background: 'rgba(37,211,102,0.1)', borderColor: '#25D366', color: '#25D366' }} onClick={handleTestWhatsApp} disabled={commTesting.whatsapp === 'testing'}>
                  {commTesting.whatsapp === 'testing' ? '⏳ Testing…' : '💬 Test WhatsApp Connection'}
                </button>
              </div>
            )}

            {/* ─── Bulk SMS Panel ─── */}
            {commSubTab === 'sms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Bulk SMS Gateway</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Send transactional SMS alerts (OTP, shipping updates) to customers</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusDot state={commTesting.sms} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.78rem', color: smsConfig.enabled ? 'var(--success)' : 'var(--text-muted)' }}>
                      <input type="checkbox" checked={smsConfig.enabled} onChange={e => setSmsConfig(p => ({ ...p, enabled: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                      {smsConfig.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">SMS Provider / Gateway</label>
                  <select className="select" value={smsConfig.provider} onChange={e => setSmsConfig(p => ({ ...p, provider: e.target.value }))}>
                    <option value="msg91">MSG91 (India — Recommended)</option>
                    <option value="fast2sms">Fast2SMS (India)</option>
                    <option value="textlocal">TextLocal (India)</option>
                    <option value="twilio">Twilio (Global)</option>
                    <option value="kaleyra">Kaleyra / Vonage</option>
                    <option value="aws_sns">AWS SNS</option>
                  </select>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">API Key / Auth Token</label>
                      <input className="input" type="password" value={smsConfig.apiKey} onChange={e => setSmsConfig(p => ({ ...p, apiKey: e.target.value }))} placeholder="Your gateway API key" style={{ fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Sender ID (6-char max)</label>
                      <input className="input" value={smsConfig.senderId} onChange={e => setSmsConfig(p => ({ ...p, senderId: e.target.value.toUpperCase().slice(0, 6) }))} placeholder="KOZMOC" style={{ fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.1em' }} />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">DLT Template ID (TRAI Mandatory for India)</label>
                    <input className="input" value={smsConfig.dltTemplateId} onChange={e => setSmsConfig(p => ({ ...p, dltTemplateId: e.target.value }))} placeholder="1007xxxxxxxxxxxxxxxxx" style={{ fontFamily: 'monospace' }} />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>Required by TRAI for all commercial SMS in India. Register at your telecom provider's DLT portal.</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px dashed rgba(99,102,241,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  💡 <strong style={{ color: '#818cf8' }}>MSG91:</strong> Best for India. Sign up at <code>msg91.com</code> → Create campaign → Get Auth Key.<br/>
                  💡 <strong style={{ color: '#818cf8' }}>Fast2SMS:</strong> Easiest setup, no DLT needed for personal use. Get key from <code>fast2sms.com</code> dashboard.<br/>
                  💡 <strong style={{ color: '#818cf8' }}>Twilio:</strong> Global. Account SID + Auth Token from <code>console.twilio.com</code>.
                </div>

                <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start', gap: 8, background: 'rgba(99,102,241,0.1)', borderColor: '#818cf8', color: '#818cf8' }} onClick={handleTestSMS} disabled={commTesting.sms === 'testing'}>
                  {commTesting.sms === 'testing' ? '⏳ Testing…' : '📱 Test SMS Gateway'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: RETURN POLICY */}
        {activeTab === 'return_policy' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <FileText size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Return & Exchange Policy Editor</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Dynamically edit return guarantees, timelines, and legal policy pages served on the storefront</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Page Main Title</label>
                <input className="input" value={returnPolicy.title} onChange={e => setReturnPolicy(p => ({ ...p, title: e.target.value }))} placeholder="Returns & Exchange Policy" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Updated Timestamp</label>
                <input className="input" value={returnPolicy.lastUpdated} onChange={e => setReturnPolicy(p => ({ ...p, lastUpdated: e.target.value }))} placeholder="Last updated May 2026" />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Guarantee Badges Content</h4>
              <div className="grid-2" style={{ gap: 24, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 1 Title</label>
                    <input className="input" value={returnPolicy.authenticityTitle} onChange={e => setReturnPolicy(p => ({ ...p, authenticityTitle: e.target.value }))} placeholder="100% Authenticity" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 1 Description</label>
                    <textarea className="textarea" rows={3} value={returnPolicy.authenticityDesc} onChange={e => setReturnPolicy(p => ({ ...p, authenticityDesc: e.target.value }))} placeholder="Authenticity promise description..." />
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 2 Title</label>
                    <input className="input" value={returnPolicy.windowTitle} onChange={e => setReturnPolicy(p => ({ ...p, windowTitle: e.target.value }))} placeholder="7-Day Window" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 2 Description</label>
                    <textarea className="textarea" rows={3} value={returnPolicy.windowDesc} onChange={e => setReturnPolicy(p => ({ ...p, windowDesc: e.target.value }))} placeholder="Return window timeline description..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <label className="form-label">Policy Body Content (HTML / Rich Text)</label>
              <textarea 
                className="textarea" 
                rows={12} 
                value={returnPolicy.contentHtml} 
                onChange={e => setReturnPolicy(p => ({ ...p, contentHtml: e.target.value }))} 
                placeholder="Enter rich HTML for policy sections..." 
                style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.5 }}
              />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>
                You can write complete HTML blocks here (e.g. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;ol&gt;, &lt;strong&gt;) to style your returns sections dynamically.
              </p>
            </div>
          </div>
        )}

        {/* TAB 11: PRIVACY POLICY */}
        {activeTab === 'privacy_policy' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <FileText size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Privacy Policy Editor</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Dynamically edit privacy guarantees, policies, and statements served on the storefront</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Page Main Title</label>
                <input className="input" value={privacyPolicy.title} onChange={e => setPrivacyPolicy(p => ({ ...p, title: e.target.value }))} placeholder="Privacy Policy" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Updated Timestamp</label>
                <input className="input" value={privacyPolicy.lastUpdated} onChange={e => setPrivacyPolicy(p => ({ ...p, lastUpdated: e.target.value }))} placeholder="Last updated June 2026" />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Guarantee Badges Content</h4>
              <div className="grid-2" style={{ gap: 24, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 1 Title</label>
                    <input className="input" value={privacyPolicy.authenticityTitle} onChange={e => setPrivacyPolicy(p => ({ ...p, authenticityTitle: e.target.value }))} placeholder="100% Secure Data" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 1 Description</label>
                    <textarea className="textarea" rows={3} value={privacyPolicy.authenticityDesc} onChange={e => setPrivacyPolicy(p => ({ ...p, authenticityDesc: e.target.value }))} placeholder="Security promise description..." />
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 2 Title</label>
                    <input className="input" value={privacyPolicy.windowTitle} onChange={e => setPrivacyPolicy(p => ({ ...p, windowTitle: e.target.value }))} placeholder="Zero Third-Party Sharing" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 2 Description</label>
                    <textarea className="textarea" rows={3} value={privacyPolicy.windowDesc} onChange={e => setPrivacyPolicy(p => ({ ...p, windowDesc: e.target.value }))} placeholder="Privacy timeline description..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <label className="form-label">Policy Body Content (HTML / Rich Text)</label>
              <textarea 
                className="textarea" 
                rows={12} 
                value={privacyPolicy.contentHtml} 
                onChange={e => setPrivacyPolicy(p => ({ ...p, contentHtml: e.target.value }))} 
                placeholder="Enter rich HTML for privacy sections..." 
                style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.5 }}
              />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>
                You can write complete HTML blocks here (e.g. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;ol&gt;, &lt;strong&gt;) to style your privacy sections dynamically.
              </p>
            </div>
          </div>
        )}

        {/* TAB 12: TERMS & CONDITIONS */}
        {activeTab === 'terms_conditions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <FileText size={24} style={{ color: 'var(--gold)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Terms & Conditions Editor</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Dynamically edit terms of use, commerce agreements, and mandates served on the storefront</p>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Page Main Title</label>
                <input className="input" value={termsConditions.title} onChange={e => setTermsConditions(p => ({ ...p, title: e.target.value }))} placeholder="Terms & Conditions" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Updated Timestamp</label>
                <input className="input" value={termsConditions.lastUpdated} onChange={e => setTermsConditions(p => ({ ...p, lastUpdated: e.target.value }))} placeholder="Last updated June 2026" />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginBottom: 24 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Guarantee Badges Content</h4>
              <div className="grid-2" style={{ gap: 24, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 1 Title</label>
                    <input className="input" value={termsConditions.authenticityTitle} onChange={e => setTermsConditions(p => ({ ...p, authenticityTitle: e.target.value }))} placeholder="Age Mandate" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 1 Description</label>
                    <textarea className="textarea" rows={3} value={termsConditions.authenticityDesc} onChange={e => setTermsConditions(p => ({ ...p, authenticityDesc: e.target.value }))} placeholder="Age mandate description..." />
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 16, borderRadius: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Badge 2 Title</label>
                    <input className="input" value={termsConditions.windowTitle} onChange={e => setTermsConditions(p => ({ ...p, windowTitle: e.target.value }))} placeholder="Commercial Fair Use" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Badge 2 Description</label>
                    <textarea className="textarea" rows={3} value={termsConditions.windowDesc} onChange={e => setTermsConditions(p => ({ ...p, windowDesc: e.target.value }))} placeholder="Fair use agreement description..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <label className="form-label">Policy Body Content (HTML / Rich Text)</label>
              <textarea 
                className="textarea" 
                rows={12} 
                value={termsConditions.contentHtml} 
                onChange={e => setTermsConditions(p => ({ ...p, contentHtml: e.target.value }))} 
                placeholder="Enter rich HTML for terms sections..." 
                style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.5 }}
              />
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6 }}>
                You can write complete HTML blocks here (e.g. &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;ol&gt;, &lt;strong&gt;) to style your terms sections dynamically.
              </p>
            </div>
          </div>
        )}

        {/* SAVE BUTTON IN ALL TABS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 30, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, padding: '12px 28px', fontWeight: 700, boxShadow: '0 4px 14px rgba(201,168,76,0.3)' }}>
            <Save size={16} /> {saving ? 'Persisting Cloud Data...' : 'Save All System Settings'}
          </button>
        </div>

      </div>
    </div>
  )
}

