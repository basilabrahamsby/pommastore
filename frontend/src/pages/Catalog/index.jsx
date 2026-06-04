import { useState, useEffect } from 'react'
import Products from '../Products'
import Brands from '../Brands'
import Categories from '../Categories'
import SKUs from '../SKUs'
import { 
  FolderTree, Tag, Package, BarChart2, LayoutDashboard, 
  Plus, Search, Calendar, AlertTriangle, TrendingUp, 
  Clock, ArrowRight, ChevronRight, Filter
} from 'lucide-react'
import api from '../../services/api'
import InfoButton from '../../components/ui/InfoButton'

function CatalogOverview({ setActiveTab }) {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/products', { params: { limit: 200 } }),
      api.get('/brands'),
      api.get('/categories'),
      api.get('/offers'),
    ]).then(([p, b, c, o]) => {
      setProducts(p.data || [])
      setBrands(b.data || [])
      setCategories(c.data || [])
      setOffers(o.data || [])
    }).catch(() => {})
    .finally(() => setLoading(false))
  }, [])

  // Calculate dynamic variables
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.is_active).length
  const draftProducts = products.filter(p => !p.is_active).length
  const featuredProducts = products.filter(p => p.is_featured).length

  const totalBrands = brands.length
  const activeBrands = brands.filter(b => b.is_active).length

  const totalCategories = categories.length
  const activeCategories = categories.filter(c => c.is_active).length
  const rootCategories = categories.filter(c => !c.parent_id).length

  // Flatten SKUs from products
  const flattenedSkus = []
  products.forEach(p => {
    if (p.variants) {
      p.variants.forEach(v => {
        flattenedSkus.push({
          ...v,
          product_name: p.name,
          brand_name: p.brand_name || 'Generic'
        })
      })
    }
  })

  const totalSkus = flattenedSkus.length
  const lowStockLimit = 10 // default alert boundary
  const lowStockSkus = flattenedSkus.filter(v => (v.current_stock || 0) > 0 && (v.current_stock || 0) <= (v.min_stock_alert || lowStockLimit))
  const outOfStockSkus = flattenedSkus.filter(v => (v.current_stock || 0) === 0)
  const totalStockCount = flattenedSkus.reduce((acc, v) => acc + (v.current_stock || 0), 0)

  // Gender wise details
  const menCount = products.filter(p => p.gender?.toLowerCase() === 'men' || p.gender?.toLowerCase() === 'male').length
  const womenCount = products.filter(p => p.gender?.toLowerCase() === 'women' || p.gender?.toLowerCase() === 'female').length
  const unisexCount = products.filter(p => p.gender?.toLowerCase() === 'unisex' || p.gender?.toLowerCase() === 'shared').length
  const totalGender = (menCount + womenCount + unisexCount) || 1
  const menPct = Math.round((menCount / totalGender) * 100)
  const womenPct = Math.round((womenCount / totalGender) * 100)
  const unisexPct = Math.round((unisexCount / totalGender) * 100)

  // Price Distribution Intelligence
  const prices = flattenedSkus.map(s => Number(s.selling_price) || 0).filter(p => p > 0)
  const tier1 = prices.filter(p => p < 2000).length
  const tier2 = prices.filter(p => p >= 2000 && p <= 7500).length
  const tier3 = prices.filter(p => p > 7500).length
  const totalPriced = (tier1 + tier2 + tier3) || 1
  const t1Pct = Math.round((tier1 / totalPriced) * 100)
  const t2Pct = Math.round((tier2 / totalPriced) * 100)
  const t3Pct = Math.round((tier3 / totalPriced) * 100)

  // Filter results based on search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand_name && p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5)

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.origin_country && b.origin_country.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5)

  // Toggle Actions
  const handleToggleBrand = async (brand) => {
    const newStatus = !brand.is_active
    if (!newStatus) {
      if (!confirm(`Deactivating "${brand.name}" will also deactivate all its products. Continue?`)) return
    }
    try {
      await api.patch(`/brands/${brand.id}`, { is_active: newStatus })
      toast.success(newStatus ? 'Brand activated' : 'Brand deactivated')
      // Refresh local state
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, is_active: newStatus } : b))
    } catch { toast.error('Toggle failed') }
  }

  const handleToggleProduct = async (product) => {
    const newStatus = !product.is_active
    try {
      await api.patch(`/products/${product.id}`, { is_active: newStatus })
      toast.success(newStatus ? 'Product activated' : 'Product deactivated')
      // Refresh local state
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p))
    } catch { toast.error('Toggle failed') }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
         <div className="skeleton" style={{ height: 40, width: '100%' }}></div>
         <div className="grid-4">
           {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }}></div>)}
         </div>
         <div className="skeleton" style={{ height: 200, width: '100%' }}></div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* GLOBAL FILTERS & SEARCH HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'rgba(255,255,255,0.02)', 
        padding: '16px 20px', 
        borderRadius: 12, 
        border: '1px solid var(--border)',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
          <Search className="search-icon" />
          <input 
            type="text" 
            className="input" 
            placeholder="Quick search brands, SKUs or products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-surface)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', padding: '6px 0' }}
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Lifetime">Total Lifetime</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', padding: '6px 0' }}
            >
              <option value="All Regions">Global View</option>
              <option value="India">Region: India</option>
              <option value="UAE">Region: UAE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards with Add Actions */}
      <div className="grid-4">
        
        {/* Card 1: Products */}
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(0,0,0,0.4))', border: '1px solid rgba(201,168,76,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '800' }}>
              LUXURY PRODUCTS <InfoButton text="Master directory of core merchandise offerings across global catalog hierarchy." />
            </span>
            <button onClick={() => setActiveTab('products')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: 'var(--gold)' }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>{totalProducts}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{activeProducts} Live</span>
            <span className="badge badge-neutral" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{draftProducts} Draft</span>
          </div>
        </div>

        {/* Card 2: Brands */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '800' }}>
              PRESTIGE BRANDS <InfoButton text="Registered perfume houses and corporate manufacturer entities mapped to offerings." />
            </span>
            <button onClick={() => setActiveTab('brands')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{totalBrands}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            <TrendingUp size={12} color="var(--success)" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {activeBrands} active perfume houses
          </p>
        </div>

        {/* Card 3: Categories */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '800' }}>
              COLLECTIONS <InfoButton text="Taxonomic hierarchies and parent/child collections enabling structured routing logic." />
            </span>
            <button onClick={() => setActiveTab('categories')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{totalCategories}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{rootCategories} Root tiers • {totalCategories - rootCategories} Child</p>
        </div>

        {/* Card 4: Inventory Urgency */}
        <div className={`stat-card ${lowStockSkus.length > 0 || outOfStockSkus.length > 0 ? 'pulse-border' : ''}`} 
             style={{ 
               border: outOfStockSkus.length > 0 ? '1px solid rgba(239,68,68,0.3)' : lowStockSkus.length > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
               background: outOfStockSkus.length > 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.05), var(--bg-card))' : 'var(--bg-card)'
             }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '800' }}>
              INVENTORY HEALTH <InfoButton text="Calculated aggregate safety across variants. Red indicates depletion levels requiring replenishment." />
            </span>
            <AlertTriangle size={14} color={outOfStockSkus.length > 0 ? 'var(--error)' : 'var(--warning)'} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{totalSkus} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>SKUs</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
             {outOfStockSkus.length > 0 ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>
                 <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--error)' }}></span>
                 {outOfStockSkus.length} Out of Stock
               </div>
             ) : null}
             {lowStockSkus.length > 0 ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>
                 <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--warning)' }}></span>
                 {lowStockSkus.length} Low Stock Alerts
               </div>
             ) : null}
             {outOfStockSkus.length === 0 && lowStockSkus.length === 0 && (
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--success)' }}>
                 <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--success)' }}></span>
                 Inventory is healthy
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Dual-distribution Analysis Section */}
      <div className="grid-2">
        {/* Left Analysis: Olfactory focus */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '20px 24px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>👃</span> Olfactory Gender Profile <InfoButton text="Distribution breakdown tracking percentage counts allocated towards targeted gender definitions." />
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Men / Masculine</span>
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>{menPct}% ({menCount})</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ width: `${menPct}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Women / Feminine</span>
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>{womenPct}% ({womenCount})</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ width: `${womenPct}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unisex / Shared</span>
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>{unisexPct}% ({unisexCount})</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ width: `${unisexPct}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Analysis: Pricing Tier Insights */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '20px 24px', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--gold-bright)" /> Price Range Distribution <InfoButton text="Volume clustering plotting variants distinct across designated affordability bands." />
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 110, gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             {/* Bar 1 */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
               <div style={{ height: `${Math.max(5, t1Pct)}%`, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px 4px 0 0', transition: 'all 0.5s', position: 'relative' }}>
                 <span style={{ position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t1Pct}%</span>
               </div>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>Under ₹2k</span>
             </div>
             {/* Bar 2 */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
               <div style={{ height: `${Math.max(5, t2Pct)}%`, width: '100%', background: 'var(--gold-dim)', borderRadius: '4px 4px 0 0', transition: 'all 0.5s', position: 'relative' }}>
                 <span style={{ position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', color: 'var(--gold)' }}>{t2Pct}%</span>
               </div>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>Premium (2-7k)</span>
             </div>
             {/* Bar 3 */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
               <div style={{ height: `${Math.max(5, t3Pct)}%`, width: '100%', background: 'var(--gold)', borderRadius: '4px 4px 0 0', transition: 'all 0.5s', position: 'relative' }}>
                 <span style={{ position: 'absolute', top: -18, left: 0, right: 0, textAlign: 'center', fontSize: '0.7rem', color: 'var(--gold-bright)', fontWeight: 'bold' }}>{t3Pct}%</span>
               </div>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>Luxury (7k+)</span>
             </div>
          </div>
        </div>
      </div>

      {/* ACTIONABLE ALERTS: LOW INVENTORY LIST */}
      {(lowStockSkus.length > 0 || outOfStockSkus.length > 0) && (
        <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
             <h4 style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
               <AlertTriangle size={16} /> Critical Stock Alerts <InfoButton text="Real-time notification queue listing variants in imminent need of manufacturing re-orders." />
             </h4>
             <button onClick={() => setActiveTab('skus')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
               View All Replenishments <ChevronRight size={14} />
             </button>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {[...outOfStockSkus, ...lowStockSkus].slice(0, 5).map((s, i) => (
              <div key={i} style={{ minWidth: 220, background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{s.product_name}</span>
                   <span className={s.current_stock === 0 ? 'badge badge-error' : 'badge badge-warning'} style={{ fontSize: '0.55rem', padding: '1px 5px' }}>
                     {s.current_stock === 0 ? 'EMPTY' : 'LOW'}
                   </span>
                 </div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.size_ml}ml • SKU: {s.sku_code || 'N/A'}</div>
                 <div style={{ fontSize: '0.75rem', color: s.current_stock === 0 ? 'var(--error)' : 'var(--warning)', fontWeight: 700, marginTop: 4 }}>
                   Available: {s.current_stock} qty
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCHABLE LISTS SECTION */}
      <div className="grid-2">
        
        {/* PRODUCT-WISE DETAILS */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-bright)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} /> Recent Products
            </h3>
            <button onClick={() => setActiveTab('products')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Manage All <ArrowRight size={12} style={{ marginLeft: 4 }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredProducts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, transition: 'transform 0.2s', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{p.brand_name || 'Generic House'} • {p.gender}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>{p.variants?.length || 0} Var</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleProduct(p); }}
                    className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}
                    style={{ fontSize: '0.62rem', border: 'none', cursor: 'pointer', outline: 'none', background: !p.is_active ? 'rgba(255,255,255,0.05)' : undefined }}
                  >
                    {p.is_active ? 'Live' : 'Draft'}
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No matching products found.</div>}
          </div>
        </div>

        {/* BRAND-WISE DETAILS */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-bright)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} /> Key Perfume Houses
            </h3>
            <button onClick={() => setActiveTab('brands')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Manage All <ArrowRight size={12} style={{ marginLeft: 4 }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredBrands.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{b.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Origin: {b.origin_country || 'Global House'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.62rem' }}>{b.product_count || 0} Models</span>
                  <button 
                    onClick={() => handleToggleBrand(b)}
                    className={`badge ${b.is_active ? 'badge-success' : 'badge-neutral'}`}
                    style={{ fontSize: '0.62rem', border: 'none', cursor: 'pointer', outline: 'none' }}
                  >
                    {b.is_active ? 'Live' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
            {filteredBrands.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No matching brands found.</div>}
          </div>
        </div>

        {/* ACTIVE PROMOTIONAL OFFERS & DETAILS */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 24, borderRadius: 16, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-bright)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🎁 Live Promotions Performance <InfoButton text="Tracks effectiveness of existing voucher codes and campaign redemptions in current scope." />
            </h3>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Active now</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {offers.filter(o => o.status === 'Active').slice(0, 2).map(offer => (
              <div key={offer.id} style={{ padding: 18, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', fontSize: '0.6rem', fontWeight: 800, borderBottomLeftRadius: 8, textTransform: 'uppercase' }}>{offer.discount_type}</div>
                
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{offer.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: 1.4, height: 36, overflow: 'hidden' }}>{offer.subtitle || 'Exclusive Campaign'}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--gold)', border: '1px dashed var(--gold-border)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>CODE: {offer.code}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-bright)' }}>{offer.redemption_count || 0}</div>
                       <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uses</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--success)' }}>{offer.ctr || '0%'}</div>
                       <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CTR</div>
                     </div>
                  </div>
                </div>
              </div>
            ))}
            {offers.filter(o => o.status === 'Active').length === 0 && (
               <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '30px 0', background: 'rgba(0,0,0,0.05)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                 No active campaigns found. Add promotions in the Offers deck.
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Catalog() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: CatalogOverview },
    { id: 'products', label: 'Products', icon: Package, component: Products },
    { id: 'brands', label: 'Brands', icon: Tag, component: Brands },
    { id: 'categories', label: 'Categories', icon: FolderTree, component: Categories },
    { id: 'skus', label: 'SKUs / Variants', icon: BarChart2, component: SKUs },
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || CatalogOverview

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, var(--text-primary), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Catalog Manager
        </h1>
        <p className="page-subtitle">Centralized control for your brands, categories, products, and inventory SKUs</p>
      </div>

      {/* Tabs Row */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        borderBottom: '1px solid var(--border)', 
        marginBottom: 24, 
        paddingBottom: 2,
        overflowX: 'auto'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                color: isActive ? 'var(--gold-bright)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div style={{ animation: 'fadeIn 0.2s ease' }}>
        <ActiveComponent hideHeader={true} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}
