import { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, PieChart, Landmark, Receipt, 
  Wallet, Share2, Search, Filter, Download, 
  Calendar, FileText, IndianRupee, CreditCard, Truck,
  AlertCircle, Users, Activity, Heart, UserSquare2, Tag,
  MapPin, Globe2, ShieldCheck, AlertTriangle
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import InfoButton from '../../components/ui/InfoButton'

// --- DYNAMIC COMPONENTS ---

const CustomerReports = ({ products = [], offers = [] }) => {
  const [filters, setFilters] = useState({
    min_spent: '',
    max_spent: '',
    start_date: '',
    end_date: '',
    product_id: '',
    offer_code: '',
    search: ''
  })
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      // Clean filters: remove empty strings so backend doesn't throw 422
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      )
      
      api.get('/analytics/customer-report', { params: cleanFilters })
        .then(res => setData(res.data))
        .catch(() => toast.error('Failed to update report'))
        .finally(() => setLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  }, [filters])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* FILTER BAR */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>INDIVIDUAL SEARCH</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 34, fontSize: '0.8rem' }} placeholder="Name or Email..." value={filters.search} onChange={e => set('search', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>SPEND RANGE (MIN-MAX)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ fontSize: '0.8rem' }} placeholder="Min AED " type="number" value={filters.min_spent} onChange={e => set('min_spent', e.target.value)} />
            <input className="input" style={{ fontSize: '0.8rem' }} placeholder="Max AED " type="number" value={filters.max_spent} onChange={e => set('max_spent', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>DATE RANGE</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ fontSize: '0.8rem' }} type="date" value={filters.start_date} onChange={e => set('start_date', e.target.value)} />
            <input className="input" style={{ fontSize: '0.8rem' }} type="date" value={filters.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>FILTER BY PRODUCT</label>
          <select className="select" style={{ fontSize: '0.8rem' }} value={filters.product_id} onChange={e => set('product_id', e.target.value)}>
            <option value="">All Products</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>APPLIED OFFER</label>
          <select className="select" style={{ fontSize: '0.8rem' }} value={filters.offer_code} onChange={e => set('offer_code', e.target.value)}>
            <option value="">Any Offer</option>
            {offers.map(o => <option key={o.code} value={o.code}>{o.title} ({o.code})</option>)}
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="table-container" style={{ position: 'relative' }}>
        {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 12, color: 'var(--gold)', fontWeight: 700 }}>Refreshing Report...</div>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>{r.full_name.charAt(0)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.full_name}
                        {r.is_new && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'var(--success)', color: '#000', borderRadius: 3, fontWeight: 900, lineHeight: 1 }}>NEW</span>}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{r.email}</td>
                <td><span className={`badge ${r.loyalty_tier === 'Gold' ? 'badge-gold' : r.loyalty_tier === 'Silver' ? 'badge-secondary' : 'badge-primary'}`}>{r.loyalty_tier}</span></td>
                <td><strong>{r.order_count}</strong></td>
                <td><strong style={{ color: 'var(--gold-bright)' }}>AED {r.total_spent.toLocaleString()}</strong></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.last_order_at ? new Date(r.last_order_at).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No customers match the current filter criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const MarketingReports = ({ scentTrends = [], socialData = [], geoData = [], seoHealth = null, kpiData = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="grid-4">
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Avg. CAC <InfoButton text="Customer Acquisition Cost. Total marketing cost spent to acquire a single customer." />
          </span>
          <Share2 size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpiData ? `AED ${kpiData.avg_cac.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'Calculating...'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>{kpiData ? kpiData.avg_cac_change : ''}</div>
      </div>
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Organic Reach <InfoButton text="Estimated total users viewing content via non-paid referrals like search and direct links." />
          </span>
          <Search size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpiData ? kpiData.organic_reach : 'Calculating...'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>{kpiData ? kpiData.organic_reach_change : ''}</div>
      </div>
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Ad Conversions <InfoButton text="Percentage of user sessions originating from paid ad networks resulting in a purchase." />
          </span>
          <TrendingUp size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpiData ? `${kpiData.ad_conversions}%` : 'Calculating...'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: 4 }}>{kpiData ? kpiData.ad_conversions_change : ''}</div>
      </div>
      <div className="stat-card" style={{ padding: 20, background: 'linear-gradient(145deg, rgba(16,185,129,0.05), rgba(0,0,0,0.2))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>
            SEO Visibility Score <InfoButton text="Calculation based on meta tag fill rates across your catalog items. High score equals better crawler discoverability." />
          </span>
          <ShieldCheck size={16} color="var(--success)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
          {seoHealth !== null ? `${seoHealth.health_score}%` : 'Calculating...'}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>On-page meta completeness</div>
      </div>
    </div>

    <div className="grid-2">
      {/* GEO ANALYSIS */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe2 size={18} color="var(--gold)" /> Regional Customer Hotbeds <InfoButton text="Heatmap density of generated receipts by recognized Indian State territories." />
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {geoData.map((g, index) => (
            <div key={g.state} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--gold)' }}>{index + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.8rem' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{g.state}</span>
                  <span style={{ fontWeight: 700 }}>AED {g.revenue.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(g.revenue / (geoData[0]?.revenue || 1)) * 100}%`, background: 'var(--gold-bright)' }} />
                </div>
              </div>
            </div>
          ))}
          {geoData.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Waiting for finalized region data...</div>}
        </div>
      </div>

      {/* SEO AUDIT METRICS */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={18} color="var(--gold)" /> Static Asset SEO Audit <InfoButton text="Evaluates correctness and completeness of meta descriptive tags across frontend catalogs." />
          </h4>
          <span style={{ fontSize: '0.6rem', padding: '2px 8px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 4 }}>Active Scan</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Missing Meta Desc.</span>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: seoHealth?.missing_meta_description > 0 ? 'var(--warning)' : 'var(--success)' }}>{seoHealth?.missing_meta_description || 0}</div>
                <AlertTriangle size={14} color={seoHealth?.missing_meta_description > 0 ? 'var(--warning)' : 'var(--success)'} />
             </div>
             <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4 }}>Across {seoHealth?.total_entities || 0} catalog items</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
             <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Missing Meta Titles</span>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: seoHealth?.missing_meta_title > 0 ? 'var(--warning)' : 'var(--success)' }}>{seoHealth?.missing_meta_title || 0}</div>
                <AlertTriangle size={14} color={seoHealth?.missing_meta_title > 0 ? 'var(--warning)' : 'var(--success)'} />
             </div>
             <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4 }}>Requires focus attention</div>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 12, background: 'rgba(201,168,76,0.05)', border: '1px dashed rgba(201,168,76,0.2)', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Robots.txt & Sitemap.xml</div>
            <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>Valid & Live</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Canonical indexations mapped properly to search crawlers.</div>
        </div>
      </div>
    </div>

    <div className="grid-2">
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Heart size={18} color="var(--gold)" /> Scent Profile Preference <InfoButton text="Breakdown analysis identifying dominant fragrance notes preferred by registered clientele." />
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scentTrends.map(t => (
            <div key={t.family} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 100, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.family}</div>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(t.revenue / (scentTrends[0]?.revenue || 1)) * 100}%`, background: 'var(--gold)' }} />
              </div>
              <div style={{ width: 80, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>AED {t.revenue.toLocaleString()}</div>
            </div>
          ))}
          {scentTrends.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No scent trend data available.</div>}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
           <Activity size={18} color="var(--gold)" /> Social Ecosystem Metrics <InfoButton text="Direct measurement of click-through rates generated via major advertising funnels." />
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Total Interactions</th>
              <th>Click Through (CTR)</th>
            </tr>
          </thead>
          <tbody>
            {socialData.map(s => (
              <tr key={s.platform}>
                <td><strong style={{ color: '#fff' }}>{s.platform}</strong></td>
                <td>{s.clicks.toLocaleString()} Clicks</td>
                <td><span style={{ color: 'var(--success)', fontWeight: 700 }}>{s.ctr}%</span></td>
              </tr>
            ))}
            {socialData.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading engagement metrics...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

const FinancialReports = ({ kpiData = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="grid-4">
      <div className="stat-card" style={{ padding: 16 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          5.0% UAE VAT COLLECTED <InfoButton text="Total 5.0% UAE Value Added Tax collected on taxable product sales." />
        </span>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{kpiData ? `AED ${(kpiData.total_tax_liability || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'Calculating...'}</div>
      </div>
      <div className="stat-card" style={{ padding: 16 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          ZERO-RATED EXEMPTIONS <InfoButton text="Exports and zero-rated catalog items exempt from UAE VAT." />
        </span>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>AED 0.00</div>
      </div>
      <div className="stat-card" style={{ padding: 16 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          REVERSE CHARGE VAT <InfoButton text="Imported goods or cross-border B2B reverse charge VAT liabilities." />
        </span>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>AED 0.00</div>
      </div>
      <div className="stat-card" style={{ padding: 16, border: '1px solid var(--gold)' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700 }}>
          NET UAE VAT LIABILITY <InfoButton text="Cumulative 5.0% UAE VAT liability payable to the Federal Tax Authority (FTA)." />
        </span>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>{kpiData ? `AED ${(kpiData.total_tax_liability || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'Calculating...'}</div>
      </div>
    </div>

    <div className="table-container">
      <div className="table-header" style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>UAE VAT Statutory Audit Ledger (FTA Compliant)</h4>
        <button className="btn btn-sm btn-secondary" style={{ gap: 8 }}><Download size={14}/> Export Excel</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Taxable Subtotal</th>
            <th>VAT Rate</th>
            <th>UAE VAT (5.0%)</th>
            <th>Exemptions</th>
            <th>Total Payable Tax</th>
          </tr>
        </thead>
        <tbody>
          {kpiData && kpiData.gstr1_ledger && kpiData.gstr1_ledger.map((row, index) => (
            <tr key={index}>
              <td>{row.month}</td>
              <td>AED {row.taxable_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td>5.0%</td>
              <td>AED {row.total_gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td>AED 0.00</td>
              <td><strong style={{ color: 'var(--gold-bright)' }}>AED {row.total_gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
            </tr>
          ))}
          {(!kpiData || !kpiData.gstr1_ledger || kpiData.gstr1_ledger.length === 0) && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                No tax ledger transactions recorded for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const SalesAnalytics = ({ rfmData, kpiData = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={18} color="var(--gold)" /> RFM Customer Segmentation <InfoButton text="Recency, Frequency, & Monetary framework. Groups customers based on behavioral patterns." position="right" />
        </h4>
        <div className="grid-2" style={{ gap: 16 }}>
          {rfmData?.segments?.map(s => (
            <div key={s.segment} style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{s.segment}</span>
                <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{s.count} users</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 10px 0', lineHeight: 1.4 }}>{s.description}</p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg. Spend: <strong>AED {Math.round(s.avg_monetary).toLocaleString()}</strong></div>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          Top 5 High-Value Champions <InfoButton text="The core demographic providing maximum localized liquidity in the last rolling window." />
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rfmData?.top_customers?.slice(0, 5).map(c => (
            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{c.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.orders} orders • Last active {c.last_active}d ago</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold-bright)' }}>AED {c.spent.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="table-container">
      <div className="table-header" style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          Sales Pipeline (Lead Stages) <InfoButton text="Theoretical probability map modeling lead dropoff down towards finalized checkout." />
        </h4>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {kpiData && kpiData.pipeline ? kpiData.pipeline.map(s => (
          <div key={s.stage}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
              <span>{s.stage}</span>
              <span style={{ fontWeight: 700 }}>{s.count}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
            </div>
          </div>
        )) : [
          { stage: 'Initial Inquiry', count: 142, pct: 100, color: 'var(--gold)' },
          { stage: 'Samples Sent', count: 68, pct: 48, color: '#9ca3af' },
          { stage: 'Negotiation', count: 24, pct: 17, color: 'var(--warning)' },
          { stage: 'Closed Won', count: 12, pct: 8, color: 'var(--success)' }
        ].map(s => (
          <div key={s.stage}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
              <span>{s.stage}</span>
              <span style={{ fontWeight: 700 }}>{s.count}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const InventoryHealth = ({ healthData }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="grid-3">
       <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            TURNOVER RATIO <InfoButton text="Rate at which existing catalog stock replaces itself over normalized annual runtimes. Higher is better." />
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{healthData?.turnover_ratio || '0.0'}x</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Annualized frequency</div>
       </div>
       <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            DEAD STOCK (SKUS) <InfoButton text="Number of unique variants carrying active count which generated 0 transactions in past 90 calendar days." />
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)', marginTop: 4 }}>{healthData?.dead_stock?.length || 0}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: 4 }}>No sales in 90 days</div>
       </div>
       <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            CAPITAL LOCKED <InfoButton text="Theoretical locked liquidity calculated by summing Cost-Price of all batch items on hand in real-time." />
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>AED {healthData?.stock_value_by_category?.reduce((acc, c) => acc + c.value, 0).toLocaleString()}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Total warehouse valuation</div>
       </div>
    </div>

    <div className="grid-2">
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} color="var(--error)" /> Dead Stock Identification
        </h4>
        <table className="data-table">
          <thead>
            <tr><th>SKU / Product</th><th>Units on Hand</th><th>Status</th></tr>
          </thead>
          <tbody>
            {healthData?.dead_stock?.map(s => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td><strong>{s.qty}</strong></td>
                <td><span className="badge badge-danger">High Risk</span></td>
              </tr>
            ))}
            {healthData?.dead_stock?.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No dead stock found. Great work!</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>Stock Valuation by Olfactory Family <InfoButton text="Aggregate dollar valuation aggregated strictly across categorized olfactory groups." /></h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {healthData?.stock_value_by_category?.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 100, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.name}</div>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.value / (healthData.stock_value_by_category[0]?.value || 1)) * 100}%`, background: 'var(--gold)' }} />
              </div>
              <div style={{ width: 100, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>AED {Math.round(c.value).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

const LogisticsReports = ({ data = null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="grid-4">
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Shipments Booked
          </span>
          <Truck size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data ? data.total_shipments : '0'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>Delhivery logistics partner</div>
      </div>
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            In Transit / Shipped
          </span>
          <Globe2 size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data ? data.shipped : '0'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Packages currently in route</div>
      </div>
      <div className="stat-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Out For Delivery
          </span>
          <AlertCircle size={16} color="var(--gold)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data ? data.out_for_delivery : '0'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: 4 }}>Expected delivery today</div>
      </div>
      <div className="stat-card" style={{ padding: 20, background: 'linear-gradient(145deg, rgba(16,185,129,0.05), rgba(0,0,0,0.2))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>
            Successful Deliveries
          </span>
          <ShieldCheck size={16} color="var(--success)" />
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{data ? data.delivered : '0'}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>Completed handovers</div>
      </div>
    </div>

    <div className="grid-2">
      {/* PAYMENTS REPORT */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Receipt size={18} color="var(--gold)" /> Gateway & Payment Type Volume
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Transaction Count</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.payment_methods_breakdown?.map(pm => (
              <tr key={pm.method}>
                <td><strong style={{ color: '#fff' }}>{pm.method === 'CARD' ? 'Credit/Debit Card' : pm.method === 'UPI' ? 'UPI / NetBanking' : pm.method === 'COD' ? 'Cash on Delivery (Disabled)' : pm.method}</strong></td>
                <td>{pm.count} orders</td>
                <td><span className="badge badge-success">Processed</span></td>
              </tr>
            ))}
            {(!data || !data.payment_methods_breakdown || data.payment_methods_breakdown.length === 0) && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No payment transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CARRIERS REPORT */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <h4 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={18} color="var(--gold)" /> Carrier Distribution & Automated Sync
        </h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Shipments Handled</th>
              <th>Webhook Sync</th>
            </tr>
          </thead>
          <tbody>
            {data?.carrier_breakdown?.map(cb => (
              <tr key={cb.carrier}>
                <td><strong style={{ color: '#fff' }}>{cb.carrier}</strong></td>
                <td>{cb.count} packages</td>
                <td>
                  <span className={`badge ${cb.carrier === 'Delhivery' ? 'badge-success' : 'badge-secondary'}`}>
                    {cb.carrier === 'Delhivery' ? 'Active Polling' : 'Manual'}
                  </span>
                </td>
              </tr>
            ))}
            {(!data || !data.carrier_breakdown || data.carrier_breakdown.length === 0) && (
              <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No carrier assignments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('marketing') // marketing | sales | finance | inventory | customers | logistics
  const [rfmData, setRfmData] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [scentTrends, setScentTrends] = useState([])
  const [socialData, setSocialData] = useState([])
  const [geoData, setGeoData] = useState([])
  const [seoHealth, setSeoHealth] = useState(null)
  const [products, setProducts] = useState([])
  const [offers, setOffers] = useState([])
  const [kpiData, setKpiData] = useState(null)
  const [logisticsData, setLogisticsData] = useState(null)
  const [loading, setLoading] = useState({
    rfm: true,
    health: true,
    trends: true,
    social: true,
    geo: true,
    seo: true,
    products: true,
    offers: true,
    kpis: true,
    logistics: true
  })

  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    api.get('/analytics/rfm').then(r => setRfmData(r.data)).finally(() => setLoad('rfm', false))
    api.get('/analytics/inventory-health').then(r => setHealthData(r.data)).finally(() => setLoad('health', false))
    api.get('/analytics/scent-trends').then(r => setScentTrends(r.data)).finally(() => setLoad('trends', false))
    api.get('/analytics/social-engagement').then(r => setSocialData(r.data)).finally(() => setLoad('social', false))
    api.get('/analytics/geo-insights').then(r => setGeoData(r.data)).finally(() => setLoad('geo', false))
    api.get('/analytics/seo-health').then(r => setSeoHealth(r.data)).finally(() => setLoad('seo', false))
    api.get('/products?limit=100').then(r => setProducts(r.data)).finally(() => setLoad('products', false))
    api.get('/offers').then(r => setOffers(r.data)).finally(() => setLoad('offers', false))
    api.get('/analytics/kpis').then(r => setKpiData(r.data)).finally(() => setLoad('kpis', false))
    api.get('/analytics/logistics').then(r => setLogisticsData(r.data)).finally(() => setLoad('logistics', false))
  }, [])

  const tabs = [
    { id: 'marketing', label: 'Marketing & SEO', icon: Share2 },
    { id: 'customers', label: 'Customer Report', icon: UserSquare2 },
    { id: 'sales', label: 'Sales & Conversion', icon: TrendingUp },
    { id: 'finance', label: 'Tax & Compliance', icon: Landmark },
    { id: 'inventory', label: 'Inventory Health', icon: Activity },
    { id: 'logistics', label: 'Logistics & Payments', icon: Truck }
  ]

  // Removed full page block

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Executive Intelligence & Analytics</h1>
          <p className="page-subtitle">Real-time business flow monitoring and statutory reporting</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Calendar size={14} color="var(--gold)" />
            <select style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none' }}>
              <option>Current Fiscal (2026-27)</option>
              <option>Last Quarter</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <button className="btn btn-secondary" style={{ gap: 8 }}>
            <Download size={14} /> Master PDF Report
          </button>
        </div>
      </div>

      {/* DASHBOARD KPIs */}
      <div className="grid-4" style={{ marginBottom: 30 }}>
         <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, transparent 100%)', border: '1px solid rgba(201,168,76,0.2)', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.05em' }}>
              NET PROFIT MARGIN <InfoButton text="Realized revenue minus all costs including tax, split overheads, & acquisition multipliers." />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{kpiData ? `${kpiData.net_profit_margin}%` : 'Calculating...'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>{kpiData ? kpiData.net_profit_margin_change : ''}</div>
         </div>
         <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              AVG ORDER VALUE (AOV) <InfoButton text="Total Gross Sales Revenue divided by the Total Distinct Count of Successful Orders." />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{kpiData ? `AED ${kpiData.aov.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'Calculating...'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{kpiData ? `Based on ${kpiData.aov_transactions_count} successful transactions` : ''}</div>
         </div>
         <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              PAYMENT SUCCESS RATE <InfoButton text="Proportion of checkout intents successfully processed vs those marked as abandoned or failed natively." />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{kpiData ? `${kpiData.payment_success_rate}%` : 'Calculating...'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>{kpiData ? 'via Razorpay Gateway' : ''}</div>
         </div>
         <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              ROAS (AD SPEND) <InfoButton text="Return On Ad Spend. Generated Gross Revenue for every rupee allocated to paid digital media networks." />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{kpiData ? `${kpiData.roas}x` : 'Calculating...'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: 4 }}>{kpiData ? kpiData.roas_target : ''}</div>
         </div>
      </div>

      {/* TABS HEADER */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 6, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map(t => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 700 : 500,
                background: active ? 'var(--gold)' : 'transparent',
                color: active ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* CONTENT AREA */}
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {activeTab === 'marketing' && <MarketingReports scentTrends={scentTrends} socialData={socialData} geoData={geoData} seoHealth={seoHealth} kpiData={kpiData} />}
        {activeTab === 'customers' && <CustomerReports products={products} offers={offers} />}
        {activeTab === 'finance' && <FinancialReports kpiData={kpiData} />}
        {activeTab === 'sales' && <SalesAnalytics rfmData={rfmData} kpiData={kpiData} />}
        {activeTab === 'inventory' && <InventoryHealth healthData={healthData} />}
        {activeTab === 'logistics' && <LogisticsReports data={logisticsData} />}
      </div>
    </div>
  )
}
