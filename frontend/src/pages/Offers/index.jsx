import { useState, useEffect } from 'react'
import { 
  Plus, Tag, Calendar, Percent, Image, Trash2, Eye, Upload, Check, X, 
  ShieldCheck, Smartphone, Layers, Lock, LineChart, TrendingUp, Clock,
  Star, Sparkles, Gift, Trophy, CheckCircle2, XCircle, Search, Edit2
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { getMediaUrl } from '../../services/media'


// In production the API is co-hosted on the same domain via Nginx (/api → :8000, /static_uploads → :8000)
const API_BASE = import.meta.env.VITE_API_URL || ''

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`

function OfferCard({ o, onDelete, onEdit, isPercentage, isFlat, isBogo, onPreview }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const images = o.images && o.images.length > 0 ? o.images : [o.banner_url]
  const usagePct = Math.min(100, Math.round(((o.redemption_count || 0) / (o.usage_limit || 100)) * 100))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }} className="hover-lift">
      <div style={{ position: 'relative', height: 160, width: '100%' }}>
        <img src={getMediaUrl(images[activeIdx])} alt={o.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }} />
        
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
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
           <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Redeemed</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>{o.redemption_count || 0}</div>
           </div>
           <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
              <div style={{ fontWeight: 800, color: 'var(--gold-bright)', fontSize: '0.9rem' }}>{fmt(o.attributed_revenue || 0)}</div>
           </div>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AOV Lift</div>
              <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.9rem' }}>{o.aov_lift || '+0%'}</div>
           </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4', height: '36px', overflow: 'hidden' }}>{o.subtitle}</p>
        
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
              <strong style={{ color: '#fff' }}>{fmt(o.flat_discount_amount)} OFF</strong>
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
             <button className="btn btn-sm" type="button" onClick={() => onEdit(o)} style={{ padding: '6px 8px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
               <Edit2 size={13} />
             </button>
             <button className="btn btn-sm" type="button" onClick={() => onDelete(o.id)} style={{ padding: '6px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'none', cursor: 'pointer' }}>
               <Trash2 size={13} />
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Offers() {
  const [activeTab, setActiveTab] = useState('campaigns')
  const [offers, setOffers] = useState([])
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)

  const [previewOffer, setPreviewOffer] = useState(null)
  const [skuList, setSkuList] = useState([])
  const [allVariants, setAllVariants] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])

  const [editingOffer, setEditingOffer] = useState(null)

  // Campaign modal states
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({
    title: '', subtitle: '', code: '', discount_type: 'BOGO Pairing',
    discount_percentage: '', buy_skus: [], get_skus: [], target_scope: 'all',
    target_skus: [], target_brands: [], target_categories: [], flat_discount_amount: '',
    min_purchase_amount: '', images: [], active_until: '', status: 'Active',
    usage_limit: '', is_stackable: false, customer_segment: 'All Users'
  })

  // Loyalty modal states
  const [loyaltyModal, setLoyaltyModal] = useState(false)
  const [editingReward, setEditingReward] = useState(null)
  const [loyaltyForm, setLoyaltyForm] = useState({
    name: '', 
    description: '', 
    point_cost: '', 
    reward_type: 'product',
    variant_id: '',
    stock_available: '',
    voucher_value: '', 
    image_url: '', 
    reward_metadata: {},
    is_active: true,
  })

  const [offerTypes, setOfferTypes] = useState(['BOGO Pairing', 'Percentage Discount', 'Flat Discount'])
  const [newCustomType, setNewCustomType] = useState('')
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [oRes, rRes, ordersRes] = await Promise.all([
        api.get('/offers'),
        api.get('/loyalty/rewards'),
        api.get('/orders?limit=100')
      ])
      setOffers(oRes.data || [])
      setRewards(rRes.data || [])
      setRedemptions(ordersRes.data.filter(o => (o.loyalty_points_used || 0) > 0) || [])
    } catch (err) {
      toast.error('Failed to load marketing data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    Promise.all([
      api.get('/products', { params: { limit: 100 } }),
      api.get('/brands'),
      api.get('/categories')
    ]).then(([p, b, c]) => {
      const list = []
      const flattened = []
      p.data?.forEach(prod => {
        prod.variants?.forEach(v => {
          const item = { sku: v.sku, label: `${prod.name} (${v.size_ml}ml) — ${v.sku}` }
          list.push(item)
          flattened.push({ ...v, product_name: prod.name })
        })
      })
      setSkuList(list)
      setAllVariants(flattened)
      setBrands(b.data?.map(x => x.name) || [])
      setCategories(c.data?.map(x => x.name) || [])
    }).catch(() => {})
  }, [])

  const closeModal = () => {
    setModal(null)
    setEditingOffer(null)
  }

  const handleEditOffer = (offer) => {
    setEditingOffer(offer)
    setForm({
      title: offer.title || '',
      subtitle: offer.subtitle || '',
      code: offer.code || '',
      discount_type: offer.discount_type || 'BOGO Pairing',
      discount_percentage: offer.discount_percentage !== null && offer.discount_percentage !== undefined ? String(offer.discount_percentage) : '',
      buy_skus: offer.buy_skus || [],
      get_skus: offer.get_skus || [],
      target_scope: offer.target_scope || 'all',
      target_skus: offer.target_skus || [],
      target_brands: offer.target_brands || [],
      target_categories: offer.target_categories || [],
      flat_discount_amount: offer.flat_discount_amount !== null && offer.flat_discount_amount !== undefined ? String(offer.flat_discount_amount) : '',
      min_purchase_amount: offer.min_purchase_amount !== null && offer.min_purchase_amount !== undefined ? String(offer.min_purchase_amount) : '',
      images: offer.images || (offer.banner_url ? [offer.banner_url] : []),
      active_until: offer.active_until ? offer.active_until.split('T')[0] : '',
      status: offer.status || 'Active',
      usage_limit: offer.usage_limit !== null && offer.usage_limit !== undefined ? String(offer.usage_limit) : '',
      is_stackable: !!offer.is_stackable,
      customer_segment: offer.customer_segment || 'All Users'
    })
    setModal('edit')
  }

  const handleToggleSku = (field, sku) => {
    setForm(prev => {
      const active = prev[field] || []
      const updated = active.includes(sku) ? active.filter(s => s !== sku) : [...active, sku]
      return { ...prev, [field]: updated }
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = `${API_BASE}${res.data.url}` // Append backend host
      setForm(prev => ({ ...prev, images: [url] }))
      toast.success('Banner uploaded successfully')
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  const handleLoyaltyImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const uploadToast = toast.loading('Uploading reward image...')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = `${API_BASE}${res.data.url}`
      setLoyaltyForm(prev => ({ ...prev, image_url: url }))
      toast.success('Reward image uploaded successfully!', { id: uploadToast })
    } catch (err) {
      toast.error('Failed to upload image', { id: uploadToast })
    }
  }

  const handleToggleTag = (field, tag) => {
    setForm(prev => {
      const active = prev[field] || []
      const updated = active.includes(tag) ? active.filter(t => t !== tag) : [...active, tag]
      return { ...prev, [field]: updated }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      discount_percentage: form.discount_percentage ? Number(form.discount_percentage) : null,
      flat_discount_amount: form.flat_discount_amount ? Number(form.flat_discount_amount) : null,
      min_purchase_amount: form.min_purchase_amount ? Number(form.min_purchase_amount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : 1000,
      banner_url: form.images[0] || ''
    }

    const request = editingOffer 
      ? api.patch(`/offers/${editingOffer.id}`, payload)
      : api.post('/offers', payload)

    request
      .then(() => {
        toast.success(editingOffer ? 'Campaign updated!' : 'Campaign published!')
        closeModal()
        loadData()
      })
      .catch(err => toast.error(err.response?.data?.detail || 'Failed'))
  }

  const handleLoyaltySubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...loyaltyForm,
        reward_metadata: loyaltyForm.reward_metadata || {},
        point_cost: parseInt(loyaltyForm.point_cost),
        voucher_value: loyaltyForm.voucher_value ? parseFloat(loyaltyForm.voucher_value) : null,
        variant_id: loyaltyForm.reward_type === 'product' && loyaltyForm.variant_id ? loyaltyForm.variant_id : null,
        stock_available: loyaltyForm.reward_type === 'product' && loyaltyForm.stock_available ? parseInt(loyaltyForm.stock_available) : null,
      }
      if (editingReward) await api.patch(`/loyalty/rewards/${editingReward.id}`, payload)
      else await api.post('/loyalty/rewards', payload)
      toast.success(editingReward ? 'Reward updated' : 'New reward assigned')
      setLoyaltyModal(false)
      loadData()
    } catch (err) { toast.error('Operation failed') }
  }

  const handleEditReward = (reward) => {
    setEditingReward(reward)
    setLoyaltyForm({
      name: reward.name,
      description: reward.description || '',
      point_cost: reward.point_cost,
      reward_type: reward.reward_type,
      variant_id: reward.variant_id || '',
      stock_available: reward.stock_available || '',
      voucher_value: reward.voucher_value || '',
      image_url: reward.image_url || '',
      reward_metadata: reward.reward_metadata || {},
      is_active: reward.is_active,
    })
    setLoyaltyModal(true)
  }

  const isBogo = (type) => type.toLowerCase().includes('bogo') || type.toLowerCase().includes('buy')
  const isPercentage = (type) => type.toLowerCase().includes('percent') || type.includes('%')
  const isFlat = (type) => type.toLowerCase().includes('flat') || type.toLowerCase().includes('amount') || type.toLowerCase().includes('₹')

  const totalAttributed = offers.reduce((acc, o) => acc + Number(o.attributed_revenue || 0), 0)
  
  // Calculate average CTR
  const avgCtr = offers.length 
    ? (offers.reduce((sum, o) => sum + parseFloat(o.ctr || 0), 0) / offers.length).toFixed(1) + "%" 
    : "0.0%"

  // Calculate campaign utilization or total redemptions
  const totalRedemptions = offers.reduce((sum, o) => sum + (o.redemption_count || 0), 0)

  // Template Quick-Start Handler
  const handleApplyTemplate = (type) => {
    let templateForm = {
      title: '', subtitle: '', code: '', discount_type: 'Percentage Discount',
      discount_percentage: '', buy_skus: [], get_skus: [], target_scope: 'all',
      target_skus: [], target_brands: [], target_categories: [], flat_discount_amount: '',
      min_purchase_amount: '', images: [], active_until: '', status: 'Active',
      usage_limit: '500', is_stackable: false, customer_segment: 'All Users'
    }

    if (type === 'vip') {
      templateForm = {
        ...templateForm,
        title: 'VIP Gold Tier Curation',
        subtitle: 'Exclusive 20% off on all signature fragrances for Gold loyalty members.',
        code: 'GOLDVIP20',
        discount_type: 'Percentage Discount',
        discount_percentage: '20',
        customer_segment: 'Gold Tier Members',
        usage_limit: '250',
        images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600']
      }
    } else if (type === 'bogo') {
      const testSku = skuList[0]?.sku || 'AET-IMP-OUD-100'
      templateForm = {
        ...templateForm,
        title: 'Midnight Special BOGO',
        subtitle: 'Buy one bottle of private-reserve signature fragrance and get a free travel spray.',
        code: 'MIDNIGHTBOGO',
        discount_type: 'BOGO Pairing',
        buy_skus: [testSku],
        get_skus: [testSku],
        customer_segment: 'All Users',
        usage_limit: '1000',
        images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600']
      }
    } else if (type === 'summer') {
      templateForm = {
        ...templateForm,
        title: 'High Summer Solstice Saving',
        subtitle: 'Flat ₹1,500 premium saving on our entire woody & exotic scent families.',
        code: 'SUMMER1500',
        discount_type: 'Flat Discount',
        flat_discount_amount: '1500',
        min_purchase_amount: '7500',
        customer_segment: 'All Users',
        usage_limit: '500',
        images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600']
      }
    }

    setForm(templateForm)
    setModal('new')
    toast.success(`Template applied: ${templateForm.title}! Review details and publish.`)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Marketing & Loyalty Hub</h2>
          <p className="page-subtitle">Configure promotional campaigns and point-based rewards</p>
        </div>
        {activeTab === 'campaigns' ? (
          <button className="btn btn-primary" onClick={() => {
            setEditingOffer(null);
            setForm({
              title: '', subtitle: '', code: '', discount_type: 'BOGO Pairing',
              discount_percentage: '', buy_skus: [], get_skus: [], target_scope: 'all',
              target_skus: [], target_brands: [], target_categories: [], flat_discount_amount: '',
              min_purchase_amount: '', images: [], active_until: '', status: 'Active',
              usage_limit: '', is_stackable: false, customer_segment: 'All Users'
            });
            setModal('new');
          }}><Plus size={16} style={{ marginRight: 8 }} /> Create Campaign</button>
        ) : activeTab === 'loyalty' ? (
          <button className="btn btn-primary" onClick={() => { setEditingReward(null); setLoyaltyForm({ name: '', description: '', point_cost: '', reward_type: 'product', voucher_value: '', image_url: '', is_active: true }); setLoyaltyModal(true); }}>
            <Plus size={16} style={{ marginRight: 8 }} /> Assign Gift
          </button>
        ) : null}
      </div>

      {/* Ultra-Premium Glassmorphism Sliding Pills Tab Selector */}
      <div style={{ 
        display: 'inline-flex', 
        background: 'rgba(255, 255, 255, 0.015)', 
        border: '1px solid rgba(255, 255, 255, 0.06)', 
        borderRadius: 12, 
        padding: 4, 
        backdropFilter: 'blur(12px)', 
        gap: 6, 
        marginBottom: 28,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}>
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Tag },
          { id: 'loyalty', label: 'Loyalty Rewards', icon: Star },
          { id: 'history', label: 'Points History', icon: Clock }
        ].map(tabItem => {
          const IconComp = tabItem.icon
          const isActive = activeTab === tabItem.id
          return (
            <button 
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)} 
              style={{ 
                padding: '8px 18px', 
                borderRadius: 10, 
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 100%)' 
                  : 'transparent', 
                border: isActive 
                  ? '1px solid rgba(201, 168, 76, 0.3)' 
                  : '1px solid transparent',
                color: isActive ? 'var(--gold-bright)' : 'var(--text-secondary)', 
                fontWeight: isActive ? 600 : 500, 
                fontSize: '0.82rem',
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 2px 10px rgba(201,168,76,0.08)' : 'none'
              }}
            >
              <IconComp size={14} style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)', transition: 'color 0.3s' }} /> 
              {tabItem.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="loading-state">Syncing marketing engine...</div>
      ) : activeTab === 'campaigns' ? (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Attributed Rev</div>
              <div className="stat-value" style={{ color: 'var(--gold-bright)' }}>{fmt(totalAttributed)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Live Campaigns</div>
              <div className="stat-value">{offers.filter(o => o.status === 'Active').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Campaign CTR</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{avgCtr}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Redemptions</div>
              <div className="stat-value">{totalRedemptions}</div>
            </div>
          </div>

          {offers.length === 0 ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, rgba(10,10,15,0.7) 100%)',
              border: '1px dashed rgba(201,168,76,0.3)',
              borderRadius: 16,
              padding: '44px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                background: 'rgba(201,168,76,0.1)',
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                color: 'var(--gold)',
                marginBottom: 8
              }}>
                🎟️
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>No Promotional Campaigns Active</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto', lineHeight: '1.5' }}>
                Create high-conversion discount incentives, BOGO pairings, or flat cart promotions to attract storefront engagement, calculate dynamic social click rates, and drive attributed revenue.
              </p>
              
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>✨ LAUNCH FROM A LUXURY CAMPAIGN TEMPLATE</span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleApplyTemplate('vip')}
                    style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--gold-bright)', fontWeight: 600, padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    💎 VIP Gold 20% Off
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleApplyTemplate('bogo')}
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', fontWeight: 600, padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    🔥 Midnight Oud BOGO
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleApplyTemplate('summer')}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    ✨ Summer ₹1,500 Saving
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: 24 }}>
              {offers.map(o => (
                <OfferCard 
                  key={o.id} 
                  o={o} 
                  onDelete={(id) => api.delete(`/offers/${id}`).then(loadData)} 
                  onEdit={handleEditOffer}
                  isPercentage={isPercentage} 
                  isFlat={isFlat} 
                  isBogo={isBogo} 
                  onPreview={setPreviewOffer} 
                />
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'loyalty' ? (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Active Gifts</span>
                <Gift size={16} className="stat-icon" />
              </div>
              <div className="stat-value">{rewards.filter(r => r.reward_type === 'product').length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Vouchers</span>
                <Trophy size={16} className="stat-icon" />
              </div>
              <div className="stat-value">{rewards.filter(r => r.reward_type === 'voucher').length}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--gold)' }}>
              <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Points Redeemed</span>
                <Sparkles size={16} className="stat-icon" />
              </div>
              <div className="stat-value">{redemptions.reduce((sum, r) => sum + (r.loyalty_points_used || 0), 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reward Name</th>
                  <th>Type</th>
                  <th>Point Cost</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '44px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🎁</div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>No Active Loyalty Rewards Configured</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxContent: 350, margin: '6px auto 14px auto', lineHeight: '1.5' }}>
                        Set up physical perfume discovery sets, branded accessories, or virtual store vouchers that customers can unlock with their loyalty points.
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={() => { setEditingReward(null); setLoyaltyForm({ name: '', description: '', point_cost: '', reward_type: 'product', voucher_value: '', image_url: '', is_active: true }); setLoyaltyModal(true); }}
                        style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                      >
                        Create First Reward Gift
                      </button>
                    </td>
                  </tr>
                ) : rewards.map(reward => (
                  <tr key={reward.id}>
                     <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         {reward.image_url ? (
                           <img 
                             src={getMediaUrl(reward.image_url)} 
                             alt={reward.name} 
                             style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
                           />
                         ) : (
                           <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                             🎁
                           </div>
                         )}
                         <div>
                           <div style={{ fontWeight: 600 }}>{reward.name}</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reward.description}</div>
                         </div>
                       </div>
                     </td>
                    <td>
                      <span className={`badge ${reward.reward_type === 'product' ? 'badge-info' : 'badge-gold'}`}>
                        {reward.reward_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{reward.point_cost} PTS</td>
                    <td>{reward.voucher_value ? `₹${reward.voucher_value}` : 'Product'}</td>
                    <td>
                      {reward.is_active ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                          <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Active
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                          <XCircle size={14} style={{ marginRight: 4 }} /> Disabled
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEditReward(reward)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={async () => { if(confirm('Delete?')) { await api.delete(`/loyalty/rewards/${reward.id}`); loadData(); } }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Customer</th><th>Points Used</th><th>Order</th></tr></thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>📜</div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>No Point Redemptions Logged Yet</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxContent: 300, margin: '4px auto 0 auto', lineHeight: '1.5' }}>
                      Redemptions are automatically recorded here when customers purchase items on your storefront using their accumulated loyalty points.
                    </div>
                  </td>
                </tr>
              ) : redemptions.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>{r.customer_name}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.loyalty_points_used} PTS</td>
                  <td>{r.order_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {(modal === 'new' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 700, width: '90%' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{modal === 'edit' ? 'Edit Campaign Details' : 'Publish Luxury Campaign'}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure promotional logic and target audience</p>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Campaign Title *</label>
                <input className="input" placeholder="e.g. Summer Solstice Curation" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Subtitle / Description</label>
                <input className="input" placeholder="e.g. Exclusive 20% off on signature scents" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Promo Code *</label>
                <input className="input" placeholder="KOZMO20" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required />
              </div>
              <div>
                <label className="form-label">Campaign Type</label>
                <select className="select" value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})}>
                  {['Percentage Discount', 'Flat Discount', 'BOGO Pairing'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {isPercentage(form.discount_type) && (
                <div>
                  <label className="form-label">Discount Percentage (%)</label>
                  <input className="input" type="number" placeholder="20" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})} required />
                </div>
              )}
              {isFlat(form.discount_type) && (
                <div>
                  <label className="form-label">Flat Discount Amount (₹)</label>
                  <input className="input" type="number" placeholder="500" value={form.flat_discount_amount} onChange={e => setForm({...form, flat_discount_amount: e.target.value})} required />
                </div>
              )}
              
              <div>
                <label className="form-label">Min Purchase (₹)</label>
                <input className="input" type="number" placeholder="999" value={form.min_purchase_amount} onChange={e => setForm({...form, min_purchase_amount: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Usage Limit</label>
                <input className="input" type="number" placeholder="1000" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Active Until</label>
                <input className="input" type="date" value={form.active_until} onChange={e => setForm({...form, active_until: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Customer Segment</label>
                <select className="select" value={form.customer_segment} onChange={e => setForm({...form, customer_segment: e.target.value})}>
                  {['All Users', 'New Customers', 'Gold Tier Members', 'Lapsed Users'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {modal === 'edit' && (
                <div>
                  <label className="form-label">Campaign Status</label>
                  <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              {isBogo(form.discount_type) && (
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div>
                    <label className="form-label" style={{ color: 'var(--gold)', fontWeight: 800 }}>1. BUY ITEMS (TRIGGER) *</label>
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {skuList.map(item => (
                        <div key={item.sku} onClick={() => handleToggleSku('buy_skus', item.sku)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 4, background: form.buy_skus.includes(item.sku) ? 'rgba(201,168,76,0.15)' : 'transparent', marginBottom: 2 }}>
                          <div style={{ width: 14, height: 14, border: '1px solid var(--gold)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: form.buy_skus.includes(item.sku) ? 'var(--gold)' : 'transparent' }}>
                            {form.buy_skus.includes(item.sku) && <Check size={10} color="#000" />}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: form.buy_skus.includes(item.sku) ? '#fff' : 'var(--text-muted)' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ color: 'var(--success)', fontWeight: 800 }}>2. GET ITEMS (FREE/DISC) *</label>
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                      {skuList.map(item => (
                        <div key={item.sku} onClick={() => handleToggleSku('get_skus', item.sku)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 4, background: form.get_skus.includes(item.sku) ? 'rgba(16,185,129,0.15)' : 'transparent', marginBottom: 2 }}>
                          <div style={{ width: 14, height: 14, border: '1px solid var(--success)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: form.get_skus.includes(item.sku) ? 'var(--success)' : 'transparent' }}>
                            {form.get_skus.includes(item.sku) && <Check size={10} color="#000" />}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: form.get_skus.includes(item.sku) ? '#fff' : 'var(--text-muted)' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Target Scope Selection */}
              <div style={{ gridColumn: 'span 2', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <label className="form-label" style={{ fontWeight: 800, marginBottom: 12, display: 'block' }}>TARGETING SCOPE</label>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  {[
                    { id: 'all', label: 'Global (All)', icon: ShieldCheck },
                    { id: 'skus', label: 'Specific Items', icon: Tag },
                    { id: 'brands', label: 'By Brand', icon: Star },
                    { id: 'categories', label: 'By Category', icon: Layers }
                  ].map(scope => (
                    <button 
                      key={scope.id}
                      type="button"
                      onClick={() => setForm({...form, target_scope: scope.id})}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: 8, border: '1px solid', 
                        borderColor: form.target_scope === scope.id ? 'var(--gold)' : 'var(--border)',
                        background: form.target_scope === scope.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                        color: form.target_scope === scope.id ? 'var(--gold)' : 'var(--text-muted)',
                        fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <scope.icon size={14} /> {scope.label}
                    </button>
                  ))}
                </div>

                {form.target_scope === 'skus' && (
                  <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {skuList.map(item => (
                      <div key={item.sku} onClick={() => handleToggleTag('target_skus', item.sku)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', borderRadius: 4, background: form.target_skus.includes(item.sku) ? 'rgba(201,168,76,0.15)' : 'transparent', marginBottom: 2 }}>
                        <div style={{ width: 14, height: 14, border: '1px solid var(--gold)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: form.target_skus.includes(item.sku) ? 'var(--gold)' : 'transparent' }}>
                          {form.target_skus.includes(item.sku) && <Check size={10} color="#000" />}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: form.target_skus.includes(item.sku) ? '#fff' : 'var(--text-muted)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {form.target_scope === 'brands' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {brands.map(brand => (
                      <button 
                        key={brand} 
                        type="button"
                        onClick={() => handleToggleTag('target_brands', brand)}
                        style={{ 
                          padding: '6px 12px', borderRadius: 20, border: '1px solid',
                          borderColor: form.target_brands.includes(brand) ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                          background: form.target_brands.includes(brand) ? 'rgba(201,168,76,0.2)' : 'transparent',
                          color: form.target_brands.includes(brand) ? 'var(--gold)' : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}

                {form.target_scope === 'categories' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        type="button"
                        onClick={() => handleToggleTag('target_categories', cat)}
                        style={{ 
                          padding: '6px 12px', borderRadius: 20, border: '1px solid',
                          borderColor: form.target_categories.includes(cat) ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                          background: form.target_categories.includes(cat) ? 'rgba(201,168,76,0.2)' : 'transparent',
                          color: form.target_categories.includes(cat) ? 'var(--gold)' : 'var(--text-muted)',
                          fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Campaign Banner Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input className="input" placeholder="Upload or enter URL" value={form.images[0] || ''} onChange={e => setForm({...form, images: [e.target.value]})} />
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
                       {form.images[0] && <button type="button" onClick={() => setForm({...form, images: []})} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'none', padding: '4px', borderRadius: 4, cursor: 'pointer' }}><Trash2 size={12}/></button>}
                    </div>
                  </div>
                  <label style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#fff', hover: { background: 'rgba(255,255,255,0.05)' } }}>
                    <Upload size={14} /> Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                {form.images[0] && (
                  <div style={{ marginTop: 12, height: 120, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={getMediaUrl(form.images[0])} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{modal === 'edit' ? 'Save & Update Campaign' : 'Confirm & Publish Campaign'}</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loyaltyModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500, width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingReward ? 'Edit Reward Privilege' : 'Create New Reward'}</h3>
              <button className="btn btn-ghost" onClick={() => setLoyaltyModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleLoyaltySubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
              <div>
                <label className="form-label">Reward Name *</label>
                <input className="input" required value={loyaltyForm.name} onChange={e => setLoyaltyForm({...loyaltyForm, name: e.target.value})} placeholder="e.g. Premium Discovery Set" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="textarea" rows={2} value={loyaltyForm.description} onChange={e => setLoyaltyForm({...loyaltyForm, description: e.target.value})} placeholder="What does the customer receive?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Point Cost *</label>
                  <input className="input" type="number" required value={loyaltyForm.point_cost} onChange={e => setLoyaltyForm({...loyaltyForm, point_cost: e.target.value})} placeholder="1000" />
                </div>
                <div>
                  <label className="form-label">Reward Type</label>
                  <select className="select" value={loyaltyForm.reward_type} onChange={e => setLoyaltyForm({...loyaltyForm, reward_type: e.target.value})}>
                    <option value="product">Physical Product</option>
                    <option value="voucher">Virtual Voucher</option>
                    <option value="trip">Family Trip</option>
                    <option value="occasion">Attend Occasion</option>
                    <option value="activity">Free Activity</option>
                  </select>
                </div>
              </div>
              
              {loyaltyForm.reward_type === 'product' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Linked Product Variant</label>
                    <select className="select" value={loyaltyForm.variant_id} onChange={e => setLoyaltyForm({...loyaltyForm, variant_id: e.target.value})}>
                      <option value="">None / Custom Product</option>
                      {allVariants.map(v => (
                        <option key={v.id} value={v.id}>{v.product_name} - {v.size_ml}ml ({v.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Initial Stock</label>
                    <input className="input" type="number" value={loyaltyForm.stock_available} onChange={e => setLoyaltyForm({...loyaltyForm, stock_available: e.target.value})} placeholder="e.g. 50" />
                  </div>
                </div>
              )}
              
              {loyaltyForm.reward_type === 'voucher' && (
                <div>
                  <label className="form-label">Voucher Face Value (₹)</label>
                  <input className="input" type="number" value={loyaltyForm.voucher_value} onChange={e => setLoyaltyForm({...loyaltyForm, voucher_value: e.target.value})} placeholder="500" />
                </div>
              )}
              
              {['trip', 'activity', 'occasion'].includes(loyaltyForm.reward_type) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Location</label>
                    <input className="input" value={loyaltyForm.reward_metadata?.location || ''} 
                      onChange={e => setLoyaltyForm({...loyaltyForm, reward_metadata: {...loyaltyForm.reward_metadata, location: e.target.value}})} 
                      placeholder="e.g. Goa" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Duration</label>
                    <input className="input" value={loyaltyForm.reward_metadata?.duration || ''} 
                      onChange={e => setLoyaltyForm({...loyaltyForm, reward_metadata: {...loyaltyForm.reward_metadata, duration: e.target.value}})} 
                      placeholder="e.g. 3 Days" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Pax</label>
                    <input className="input" type="number" value={loyaltyForm.reward_metadata?.pax || ''} 
                      onChange={e => setLoyaltyForm({...loyaltyForm, reward_metadata: {...loyaltyForm.reward_metadata, pax: e.target.value}})} 
                      placeholder="e.g. 4" 
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="form-label">Reward Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input className="input" placeholder="Upload or enter URL" value={loyaltyForm.image_url || ''} onChange={e => setLoyaltyForm({...loyaltyForm, image_url: e.target.value})} />
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 6 }}>
                       {loyaltyForm.image_url && <button type="button" onClick={() => setLoyaltyForm({...loyaltyForm, image_url: ''})} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'none', padding: '4px', borderRadius: 4, cursor: 'pointer' }}><Trash2 size={12}/></button>}
                    </div>
                  </div>
                  <label style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                    <Upload size={14} /> Upload Image
                    <input type="file" hidden accept="image/*" onChange={handleLoyaltyImageUpload} />
                  </label>
                </div>
                {loyaltyForm.image_url && (
                  <div style={{ marginTop: 12, height: 120, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={getMediaUrl(loyaltyForm.image_url)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="is_active_loyalty" checked={loyaltyForm.is_active} onChange={e => setLoyaltyForm({...loyaltyForm, is_active: e.target.checked})} />
                <label htmlFor="is_active_loyalty" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Make this reward active immediately</label>
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingReward ? 'Update Privilege' : 'Confirm & Create'}</button>
                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setLoyaltyModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
