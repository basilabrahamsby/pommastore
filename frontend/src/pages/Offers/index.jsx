import { useState, useEffect } from 'react'
import { Plus, Tag, Calendar, Percent, Image, Trash2, Eye, Upload, Check, X, ShieldCheck, Smartphone, Layers, Lock, LineChart, TrendingUp, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

function OfferCard({ o, onDelete, isPercentage, isFlat, isBogo, onPreview }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const images = o.images && o.images.length > 0 ? o.images : [o.banner_url]
  const usagePct = Math.min(100, Math.round(((o.redemption_count || 0) / (o.usage_limit || 100)) * 100))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }} className="hover-lift">
      <div style={{ position: 'relative', height: 160, width: '100%' }}>
        <img src={images[activeIdx]} alt={o.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />
        
        {/* Floating Mobile Preview & Actions */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
           <button type="button" onClick={() => onPreview(o)} style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <Smartphone size={10} /> Preview
           </button>
           <div style={{ display: 'flex', gap: 4 }}>
              {o.is_stackable ? (
                 <span style={{ fontSize: '0.6rem', background: 'rgba(16,185,129,0.2)', color: 'var(--success)', padding: '3px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700 }}><Layers size={9}/> Stackable</span>
              ) : (
                 <span style={{ fontSize: '0.6rem', background: 'rgba(239,68,68,0.2)', color: 'var(--error)', padding: '3px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700 }}><Lock size={9}/> Exclusive</span>
              )}
           </div>
        </div>

        {images.length > 1 && (
          <div style={{ position: 'absolute', inset: '0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
            <button type="button" className="btn" onClick={() => setActiveIdx(p => (p === 0 ? images.length - 1 : p - 1))} style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>‹</button>
            <button type="button" className="btn" onClick={() => setActiveIdx(p => (p === images.length - 1 ? 0 : p + 1))} style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>›</button>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
          <span className="badge badge-gold" style={{ fontSize: '0.65rem', marginBottom: 4 }}>{o.discount_type}</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>{o.title}</h3>
        </div>

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 4 }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === activeIdx ? 'var(--gold-bright)' : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* Campaign Analytic Stats Overlay */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
           <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Redeemed</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{o.redemption_count || 0}</div>
           </div>
           <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
              <div style={{ fontWeight: 800, color: 'var(--gold-bright)', fontSize: '0.9rem' }}>₹{((o.attributed_revenue || 0) / 1000).toFixed(1)}k</div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AOV Lift</div>
              <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.9rem' }}>{o.aov_lift || '+0%'}</div>
           </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4', height: '36px', overflow: 'hidden' }}>{o.subtitle}</p>
        
        {/* Dynamic Progress Usage Indicator */}
        <div style={{ marginBottom: 16 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Usage Capacity ({o.redemption_count || 0}/{o.usage_limit || '∞'})</span>
              <strong style={{ color: usagePct > 85 ? 'var(--error)' : '#fff' }}>{usagePct}%</strong>
           </div>
           <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${usagePct}%`, background: usagePct > 85 ? 'var(--error)' : 'var(--gold)', transition: 'width 0.5s ease' }}></div>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'rgba(0,0,0,0.15)', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>PROMO CODE</span>
            <strong style={{ fontFamily: 'monospace', color: 'var(--gold-bright)', background: 'rgba(201,168,76,0.1)', padding: '2px 6px', borderRadius: 4 }}>{o.code}</strong>
          </div>

          {isPercentage(o.discount_type) && o.discount_percentage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>INTENSITY</span>
              <strong style={{ color: '#fff' }}>{o.discount_percentage}% OFF</strong>
            </div>
          )}

          {isFlat(o.discount_type) && o.flat_discount_amount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>FLAT SAVING</span>
              <strong style={{ color: '#fff' }}>₹{Number(o.flat_discount_amount).toLocaleString('en-IN')} OFF</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>SEGMENT</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{o.customer_segment || 'Global Access'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>EXPIRY</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{o.active_until || '—'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span className={`badge ${o.status === 'Active' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{o.status}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>CTR: {o.ctr || '0%'}</span>
             <button className="btn btn-sm" onClick={() => onDelete(o.id)} style={{ padding: '6px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'none' }}>
               <Trash2 size={13} />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Offers() {
  const [offers, setOffers] = useState([
    {
      id: 1,
      title: 'Royal Oud Autumn BOGO',
      subtitle: 'Buy Midnight Oud (100ml) & Get a 50ml travel bottle absolutely free.',
      code: 'OUDBOGO',
      discount_type: 'BOGO Pairing',
      buy_skus: ['KL-OUD-100', 'CHAN-5-100'],
      get_skus: ['KL-OUD-50-FREE'],
      min_purchase_amount: 5000,
      banner_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'
      ],
      active_until: '2026-11-30',
      status: 'Active',
      redemption_count: 442,
      usage_limit: 500,
      attributed_revenue: 840000,
      aov_lift: '+12%',
      is_stackable: false,
      customer_segment: 'Elite Members',
      ctr: '6.4%'
    },
    {
      id: 2,
      title: 'Prestige Festive Flat 20%',
      subtitle: 'Enjoy 20% flat discount on all premium Chanel and Dior fragrance houses.',
      code: 'PRESTIGE20',
      discount_type: 'Percentage Discount',
      discount_percentage: 20,
      target_scope: 'brand_category',
      target_brands: ['Chanel', 'Dior'],
      target_categories: ['Eau de Parfum'],
      min_purchase_amount: 8000,
      banner_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80'
      ],
      active_until: '2026-07-15',
      status: 'Active',
      redemption_count: 128,
      usage_limit: 1000,
      attributed_revenue: 1250000,
      aov_lift: '+24%',
      is_stackable: true,
      customer_segment: 'All Users',
      ctr: '3.8%'
    }
  ])

  const [previewOffer, setPreviewOffer] = useState(null)

  const [skuList, setSkuList] = useState([])
  const [brands, setBrands] = useState(['Chanel', 'Dior', 'Kozmocart Originals', 'Tom Ford', 'Creed'])
  const [categories, setCategories] = useState(['Eau de Parfum', 'Extrait de Parfum', 'Attar Extracts', 'Travel Atomizers'])

  useEffect(() => {
    api.get('/products', { params: { limit: 100 } })
      .then(r => {
        const list = []
        r.data?.forEach(p => {
          p.variants?.forEach(v => {
            list.push({
              sku: v.sku,
              label: `${p.name} (${v.size_ml}ml) — ${v.sku}`
            })
          })
        })
        if (list.length === 0) {
          setSkuList([
            { sku: 'KL-OUD-100', label: 'Midnight Royal Oud (100ml) — KL-OUD-100' },
            { sku: 'KL-OUD-50-FREE', label: 'Royal Oud Travel Atomizer (50ml) — KL-OUD-50-FREE' },
            { sku: 'CHAN-5-100', label: 'Chanel No. 5 Prestige (100ml) — CHAN-5-100' },
            { sku: 'DIOR-SAUV-100', label: 'Dior Sauvage Elixir (100ml) — DIOR-SAUV-100' }
          ])
        } else {
          setSkuList(list)
        }
      }).catch(() => {
        // Fallback luxury mock SKUs if backend is sleeping or empty
        setSkuList([
          { sku: 'KL-OUD-100', label: 'Midnight Royal Oud (100ml) — KL-OUD-100' },
          { sku: 'KL-OUD-50-FREE', label: 'Royal Oud Travel Atomizer (50ml) — KL-OUD-50-FREE' },
          { sku: 'CHAN-5-100', label: 'Chanel No. 5 Prestige (100ml) — CHAN-5-100' },
          { sku: 'DIOR-SAUV-100', label: 'Dior Sauvage Elixir (100ml) — DIOR-SAUV-100' }
        ])
      })
  }, [])

  const [offerTypes, setOfferTypes] = useState([
    'BOGO Pairing',
    'Percentage Discount',
    'Flat Discount'
  ])

  const [newCustomType, setNewCustomType] = useState('')
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)

  const [modal, setModal] = useState(null) // null | 'new'
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    code: '',
    discount_type: 'BOGO Pairing',
    discount_percentage: '',
    buy_skus: [],
    get_skus: [],
    target_scope: 'all', // 'all' | 'items' | 'brand_category'
    target_skus: [],
    target_brands: [],
    target_categories: [],
    flat_discount_amount: '',
    min_purchase_amount: '',
    images: [],
    active_until: '',
    status: 'Active'
  })

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = []
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result)
        if (newImages.length === files.length) {
          setForm(prev => ({
            ...prev,
            images: [...(prev.images || []), ...newImages]
          }))
          toast.success(`${files.length} campaign banner asset(s) loaded successfully!`)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveUploadedImage = (idx) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }))
  }

  const handleToggleSku = (field, sku) => {
    setForm(prev => {
      const active = prev[field] || []
      const updated = active.includes(sku)
        ? active.filter(s => s !== sku)
        : [...active, sku]
      return { ...prev, [field]: updated }
    })
  }

  const handleToggleTag = (field, tag) => {
    setForm(prev => {
      const active = prev[field] || []
      const updated = active.includes(tag)
        ? active.filter(t => t !== tag)
        : [...active, tag]
      return { ...prev, [field]: updated }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.code) {
      toast.error('Title and Promo Code are required')
      return
    }
    const newOffer = {
      id: Date.now(),
      ...form,
      banner_url: form.images[0] || 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
      redemption_count: 0,
      usage_limit: form.usage_limit || 1000,
      attributed_revenue: 0,
      aov_lift: '+0%',
      is_stackable: form.is_stackable || false,
      customer_segment: form.customer_segment || 'All Users',
      ctr: '0.0%'
    }
    setOffers([newOffer, ...offers])
    toast.success('Luxury Promotion Offer created successfully!')
    setModal(null)
    setForm({
      title: '',
      subtitle: '',
      code: '',
      discount_type: offerTypes[0] || 'BOGO Pairing',
      discount_percentage: '',
      buy_skus: [],
      get_skus: [],
      target_scope: 'all',
      target_skus: [],
      target_brands: [],
      target_categories: [],
      flat_discount_amount: '',
      min_purchase_amount: '',
      images: [],
      active_until: '',
      status: 'Active',
      usage_limit: '',
      is_stackable: false,
      customer_segment: 'All Users'
    })
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this promotional offer?')) {
      setOffers(offers.filter(o => o.id !== id))
      toast.success('Offer removed')
    }
  }

  const handleAddCustomType = () => {
    if (!newCustomType.trim()) return
    if (offerTypes.includes(newCustomType.trim())) {
      toast.error('Offer Type already exists!')
      return
    }
    setOfferTypes([...offerTypes, newCustomType.trim()])
    setForm({ ...form, discount_type: newCustomType.trim() })
    setNewCustomType('')
    setShowCustomTypeInput(false)
    toast.success('Custom Offer Type registered!')
  }

  const isBogo = (type) => type.toLowerCase().includes('bogo') || type.toLowerCase().includes('buy')
  const isPercentage = (type) => type.toLowerCase().includes('percent') || type.includes('%')
  const isFlat = (type) => type.toLowerCase().includes('flat') || type.toLowerCase().includes('amount') || type.toLowerCase().includes('₹')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #fff, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Promotional Offers & Banners
          </h1>
          <p className="page-subtitle">Configure Buy-One-Get-One pairings, multi-item targeting, and brand/category campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')} style={{ gap: 8 }}>
          <Plus size={16} /> Create Offer
        </button>
      </div>

      {/* KPI Row */}
      {/* Analytics KPI Cluster */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Total Attributed Rev</span>
             <TrendingUp size={14} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>₹{(offers.reduce((acc, o) => acc + (o.attributed_revenue || 0), 0)/100000).toFixed(1)} Lakh</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Sales routed via offers</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Discount Cost Basis</span>
             <LineChart size={14} color="var(--gold)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>₹1.4 Lakh</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Total markdown absorption</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Global Offer Yield</span>
             <Percent size={14} color="#339af0" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>5.1% <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>avg CTR</span></div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Banner efficiency metrics</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 700 }}>Expiring Soon</span>
             <Clock size={14} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', marginTop: 4 }}>{offers.filter(o => ((o.redemption_count || 0) / (o.usage_limit || 100) * 100) > 85).length} Offers</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Threshold breaches & timeouts</p>
        </div>
      </div>

      {/* Offers Showcase Grid */}
      <div className="grid-3" style={{ gap: 24 }}>
        {offers.map(o => (
          <OfferCard key={o.id} o={o} onDelete={handleDelete} isPercentage={isPercentage} isFlat={isFlat} isBogo={isBogo} onPreview={(off) => setPreviewOffer(off)} />
        ))}
      </div>

      {/* CREATE OFFER MODAL */}
      {modal === 'new' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--gold)' }}>Create Luxury Offer Campaign</h3>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setModal(null)} style={{ border: 'none', color: '#fff' }}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Campaign Title</label>
                <input className="input" placeholder="e.g. Royal Autumn BOGO" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Campaign Subtitle / Description</label>
                <textarea className="textarea" placeholder="Describe the offer details..." value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Promo Code</label>
                  <input className="input" placeholder="e.g. AUTUMNBOGO" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Offer Type</label>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowCustomTypeInput(!showCustomTypeInput)} style={{ fontSize: '0.68rem', padding: '2px 6px', height: 'auto', border: '1px solid var(--border)' }}>
                      {showCustomTypeInput ? 'Cancel' : '➕ Custom'}
                    </button>
                  </div>
                  {showCustomTypeInput ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="input" placeholder="Enter custom type..." value={newCustomType} onChange={e => setNewCustomType(e.target.value)} style={{ flex: 1 }} />
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCustomType} style={{ padding: '0 12px' }}>Add</button>
                    </div>
                  ) : (
                    <select className="select" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                      {offerTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* DYNAMIC OFFER FIELDS BASED ON SELECTED TYPE */}
              {isPercentage(form.discount_type) && (
                <div style={{ background: 'rgba(201,168,76,0.03)', border: '1px dashed rgba(201,168,76,0.2)', padding: 14, borderRadius: 8 }}>
                  <label className="form-label" style={{ color: 'var(--gold)' }}>Discount Percentage (%)</label>
                  <input type="number" className="input" placeholder="e.g. 20" value={form.discount_percentage} onChange={e => setForm({ ...form, discount_percentage: e.target.value })} required />
                </div>
              )}

              {isFlat(form.discount_type) && (
                <div style={{ background: 'rgba(201,168,76,0.03)', border: '1px dashed rgba(201,168,76,0.2)', padding: 14, borderRadius: 8 }}>
                  <label className="form-label" style={{ color: 'var(--gold)' }}>Flat Discount Amount (₹)</label>
                  <input type="number" className="input" placeholder="e.g. 1500" value={form.flat_discount_amount} onChange={e => setForm({ ...form, flat_discount_amount: e.target.value })} required />
                </div>
              )}

              {isBogo(form.discount_type) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(201,168,76,0.03)', border: '1px dashed rgba(201,168,76,0.2)', padding: 14, borderRadius: 8 }}>
                  
                  {/* MULTI SKU TRIGGER FOR BOGO */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--gold)' }}>Select Buy SKUs (Triggers the BOGO offer) *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      {skuList.map(s => {
                        const isSelected = form.buy_skus?.includes(s.sku)
                        return (
                          <button key={s.sku} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleSku('buy_skus', s.sku)} style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isSelected && <Check size={10} />}
                            {s.sku}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* MULTI SKU REWARD FOR BOGO */}
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--gold)' }}>Select Get SKUs (Free / Reward Items) *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      {skuList.map(s => {
                        const isSelected = form.get_skus?.includes(s.sku)
                        return (
                          <button key={s.sku} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleSku('get_skus', s.sku)} style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isSelected && <Check size={10} />}
                            {s.sku}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TARGETING SEGMENT SCOPE (ONLY FOR DISCOUNTS) */}
              {!isBogo(form.discount_type) && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--gold)' }}>🎯 Promotion Targeting Scope</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { id: 'all', label: 'Store-wide' },
                        { id: 'items', label: 'Particular Items' },
                        { id: 'brand_category', label: 'Brand / Category' }
                      ].map(opt => (
                        <button key={opt.id} type="button" className={`btn btn-sm ${form.target_scope === opt.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setForm(p => ({ ...p, target_scope: opt.id }))} style={{ fontSize: '0.72rem', padding: '6px 4px' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ALL PRODUCTS INFORMATION */}
                  {form.target_scope === 'all' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(16,185,129,0.05)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <ShieldCheck size={14} color="var(--success)" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>Store-wide promotion applied to all collections automatically.</span>
                    </div>
                  )}

                  {/* PARTICULARS SKUS SELECTION */}
                  {form.target_scope === 'items' && (
                    <div className="form-group">
                      <label className="form-label">Select Target SKUs *</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                        {skuList.map(s => {
                          const isSelected = form.target_skus?.includes(s.sku)
                          return (
                            <button key={s.sku} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleSku('target_skus', s.sku)} style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {isSelected && <Check size={10} />}
                              {s.sku}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* BRAND & CATEGORY SELECTION */}
                  {form.target_scope === 'brand_category' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label">Select Target Brands</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {brands.map(b => {
                            const isSelected = form.target_brands?.includes(b)
                            return (
                              <button key={b} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleTag('target_brands', b)} style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                                {b}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Select Target Categories</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {categories.map(c => {
                            const isSelected = form.target_categories?.includes(c)
                            return (
                              <button key={c} type="button" className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleTag('target_categories', c)} style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                                {c}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Minimum Purchase Amount (₹)</label>
                <input type="number" className="input" placeholder="e.g. 5000 (0 for no limit)" value={form.min_purchase_amount} onChange={e => setForm({ ...form, min_purchase_amount: e.target.value })} />
              </div>

              {/* DIRECT MULTIPLE FILE UPLOADER */}
              <div className="form-group">
                <label className="form-label">Upload Marketing Banners (Multiple Images supported)</label>
                <label htmlFor="banner-file-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: 10, padding: '24px 16px', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <Upload size={24} style={{ color: 'var(--gold)', marginBottom: 8 }} />
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Click to upload local images</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>Supports .jpg, .png, .webp (Direct Preview)</span>
                </label>
                <input type="file" id="banner-file-upload" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />

                {/* Uploaded Previews */}
                {form.images && form.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                    {form.images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => handleRemoveUploadedImage(idx)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.8)', border: 'none', color: '#fff', fontSize: '0.62rem', padding: '2px 4px', borderRadius: '50%', width: 14, height: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Active Until</label>
                  <input type="date" className="input" value={form.active_until} onChange={e => setForm({ ...form, active_until: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Segment</label>
                  <select className="select" value={form.customer_segment} onChange={e => setForm({ ...form, customer_segment: e.target.value })}>
                    <option value="All Users">All Users</option>
                    <option value="New Customers">New Customers Only</option>
                    <option value="Elite Members">Elite Members (VIP)</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Redemption Limit</label>
                  <input type="number" className="input" placeholder="e.g. 500 clients" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stacking Preference</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '38px' }}>
                     <input type="checkbox" checked={form.is_stackable} onChange={e => setForm({ ...form, is_stackable: e.target.checked })} />
                     <span style={{ fontSize: '0.75rem' }}>Allow Stacking with other offers</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 10 }}>
                <button type="button" className="btn" onClick={() => setModal(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE SIMULATOR LIVE PREVIEW OVERLAY */}
      {previewOffer && (
        <div className="modal-overlay" onClick={() => setPreviewOffer(null)}>
          <div style={{ position: 'relative', width: 320, height: 640, background: '#000', borderRadius: 40, border: '8px solid #222', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
             
             {/* iPhone style dynamic island Notch */}
             <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 25, background: '#000', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }}></div>

             <div style={{ flex: 1, background: '#050505', overflowY: 'auto', paddingTop: 30 }}>
                
                {/* Mock App Header */}
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontFamily: 'Georgia, serif', color: 'var(--gold)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em' }}>KOZMOCART</span>
                   <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                </div>

                {/* Rendered Banner within Mock UI */}
                <div style={{ position: 'relative', margin: '10px 16px', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <img src={previewOffer.images?.[0] || previewOffer.banner_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }}></div>
                   <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                      <span style={{ fontSize: '0.55rem', background: 'var(--gold)', color: '#000', fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{previewOffer.discount_type}</span>
                      <h4 style={{ color: '#fff', margin: '6px 0 2px 0', fontSize: '1.1rem', fontWeight: 800 }}>{previewOffer.title}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', margin: 0 }}>{previewOffer.subtitle}</p>
                   </div>
                </div>

                {/* Mock shop grid below */}
                <div style={{ padding: '16px' }}>
                   <div style={{ height: 20, width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 12 }}></div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[1,2].map(i => (
                         <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 8 }}>
                            <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 8 }}></div>
                            <div style={{ height: 8, width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 4 }}></div>
                            <div style={{ height: 8, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}></div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Simulator Actions */}
             <div style={{ padding: 12, background: '#111', borderTop: '1px solid #222', display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => setPreviewOffer(null)} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '6px 16px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Close Simulator</button>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
