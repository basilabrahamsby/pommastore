import { useEffect, useState } from 'react'
import { 
  ShoppingCart, Package, Users, TrendingUp, AlertTriangle, 
  MousePointerClick, Percent, Target, CalendarDays, ArrowUpRight 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, ComposedChart, Line
} from 'recharts'
import api from '../../services/api'
import InfoButton from '../../components/ui/InfoButton'

// Shared formatting
const fmt = (n) => `AED ${Number(n || 0).toLocaleString('en-US')}`

const StatCard = ({ label, value, icon: Icon, color, trend, trendLabel, sub, info }) => (
  <div className="stat-card" style={{ background: 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))', border: '1px solid rgba(201,168,76,0.08)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-card-label" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          {label}
          {info && <InfoButton text={info} size={11} />}
        </div>
        <div className="stat-card-value" style={{ marginTop: 4, fontSize: '1.6rem' }}>{value}</div>
      </div>
      <div className="stat-card-icon" style={{ background: color + '15', padding: 10, borderRadius: 12 }}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
      {trend && (
        <span style={{ 
          display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600,
          color: trend > 0 ? 'var(--success)' : 'var(--error)',
          background: trend > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '2px 6px', borderRadius: 4
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {trendLabel || sub || 'vs last period'}
      </span>
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding: '12px 16px', minWidth: 140, background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(201,168,76,0.3)', backdropFilter: 'blur(8px)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ fontSize: '0.9rem', fontWeight: 700, color: entry.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{color: 'var(--text-secondary)', fontWeight: 500}}>{entry.name}</span>
          <span>{isCurrency ? `AED ${Number(entry.value).toLocaleString('en-US')}` : entry.value}</span>
        </p>
      ))}
    </div>
  )
}

const STATUS_COLORS = {
  pending: 'var(--warning)', confirmed: 'var(--info)', processing: 'var(--info)',
  shipped: 'var(--gold)', delivered: 'var(--success)', completed: 'var(--success)',
  cancelled: 'var(--error)', returned: 'var(--error)',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [chartType, setChartType] = useState('area')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <div className="page-title">Business Analytics</div>
      <div className="page-subtitle">Loading reports and intelligence…</div>
      <div className="stats-grid" style={{ marginTop: 24 }}>
        {[...Array(8)].map((_, i) => <div key={i} className="stat-card skeleton" style={{ height: 130 }} />)}
      </div>
    </div>
  )

  const realRevenue = stats?.total_revenue || 0
  const realOrders = stats?.total_orders || 0
  const realMonthly = stats?.monthly_revenue || 0
  const realGrossProfit = stats?.gross_profit || 0
  const realCustomers = stats?.total_customers || 0
  const realPending = stats?.orders_pending || 0
  const realAOV = stats?.average_order_value || 0

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, var(--text-primary), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Executive Dashboard
          </div>
          <div className="page-subtitle">Comprehensive business growth and traffic analytics <InfoButton text="Consolidated intelligence from POS, Online, and B2B channels. Data refreshes in real-time." position="right" /></div>
        </div>
        
        {/* ── 3 PREMIUM INTERACTIVE DASHBOARD CONTROLS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          
          {/* Option 1: Date Range Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Time Period</span>
            <select className="select" value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.78rem', height: 34, padding: '0 10px', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>
              <option value="7">📅 Last 7 Days (Weekly)</option>
              <option value="30">📅 Last 30 Days (Monthly)</option>
              <option value="90">📅 Last 90 Days (Quarterly)</option>
            </select>
          </div>

          {/* Option 2: Distribution Channel Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Sales Channel</span>
            <select className="select" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.78rem', height: 34, padding: '0 10px', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>
              <option value="all">🌐 All Channels</option>
              <option value="direct">💻 Direct Web App</option>
              <option value="retail">🏪 Retail Boutiques</option>
              <option value="b2b">🤝 B2B Distributors</option>
            </select>
          </div>

          {/* Option 3: Primary Chart Mode Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>Chart Style</span>
            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 6, border: '1px solid var(--border)', height: 34, alignItems: 'center' }}>
              <button type="button" onClick={() => setChartType('area')} style={{ fontSize: '0.72rem', border: 'none', borderRadius: 4, height: '100%', padding: '0 12px', background: chartType === 'area' ? 'var(--gold)' : 'transparent', color: chartType === 'area' ? '#000' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Area</button>
              <button type="button" onClick={() => setChartType('bar')} style={{ fontSize: '0.72rem', border: 'none', borderRadius: 4, height: '100%', padding: '0 12px', background: chartType === 'bar' ? 'var(--gold)' : 'transparent', color: chartType === 'bar' ? '#000' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Bar</button>
            </div>
          </div>

        </div>
      </div>

      {/* ── PRIMARY GROWTH KPIs ── */}
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
        Growth & Revenue
        <InfoButton text="Financial performance metrics based on net sales revenue." />
      </h3>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 32 }}>
        <StatCard 
          label="Total Revenue" value={fmt(realRevenue)} 
          icon={TrendingUp} color="var(--gold-bright)" 
          trend={stats?.weekly_growth} trendLabel="growth this week"
          info="Cumulative revenue from all successful orders across all selected time periods and channels."
        />
        <StatCard 
          label="Today's Sales" value={fmt(stats?.revenue_today || 0)} 
          icon={CalendarDays} color="#f59e0b" 
          sub={`${stats?.orders_today || 0} orders today`}
          info="Net revenue generated from orders created today (starting 12:00 AM)."
        />
        <StatCard 
          label="Monthly Run Rate" value={fmt(realMonthly)} 
          icon={Target} color="#60a5fa" 
          info="Projected monthly revenue based on the average daily performance observed in the last 30 days."
        />
        <StatCard 
          label="Average Order Value" value={fmt(realAOV)} 
          icon={ShoppingCart} color="#34d399" 
          info="Calculated as Total Revenue divided by Total Number of Orders. Represents the average basket size."
        />
        <StatCard 
          label="Gross Profit" value={fmt(realGrossProfit)} 
          icon={Percent} color="#a78bfa" 
          trend={stats?.gross_margin || 0} trendLabel="margin" 
          info="Revenue minus Cost of Goods Sold (COGS). The margin represents (Gross Profit / Revenue) * 100."
        />
      </div>

      {/* ── TRAFFIC & OPERATIONS KPIs ── */}
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
        Sales & Operations
        <InfoButton text="Operational efficiency and volume tracking." />
      </h3>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 32 }}>
        <StatCard label="Fulfillment Rate" value={`${stats?.fulfillment_rate || 0}%`} icon={Package} color="#f472b6" info="Percentage of orders that have been successfully shipped or delivered out of total orders." />
        <StatCard label="Total Orders" value={realOrders.toLocaleString()} icon={ShoppingCart} color="var(--info)" info="Total count of unique orders placed by customers." />
        <StatCard label="Active Customers" value={realCustomers.toLocaleString()} icon={Users} color="var(--success)" info="Unique customers who have placed at least one successful order in the selected period." />
        <StatCard label="Pending Orders" value={realPending} icon={AlertTriangle} color="var(--warning)" info="Orders that are currently in 'pending', 'confirmed', or 'processing' states." />
        <StatCard label="Low Stock SKUs" value={stats?.low_stock_count || 0} icon={Package} color="var(--error)" info="Number of unique product variants where current inventory is below the 10-unit safety threshold." />
      </div>

      {/* ── PRODUCT INTELLIGENCE ── */}
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
        Product Velocity & Health Intelligence
        <InfoButton text="Heuristic analysis of inventory movement and risk factors." />
      </h3>
      <div className="grid-3" style={{ gap: 24, marginBottom: 32 }}>
         {/* Fast Moving Items */}
         <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  🚀 Fast Moving Creations
                  <InfoButton text="SKUs with the highest sales volume in the last 30 days." />
               </h4>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Last 30 Days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {(stats?.fast_moving_items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                     <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{item.units} units sold</span>
                  </div>
               ))}
               {(!stats?.fast_moving_items?.length) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No sales recorded in period.</p>}
            </div>
         </div>

         {/* Slow Moving Items */}
         <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  🐢 Stagnant Inventory
                  <InfoButton text="Items with high stock levels but low sales velocity (less than 5 units sold in 30 days)." />
               </h4>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>At Risk Items</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {(stats?.slow_moving_items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Stock: {item.stock} units</div>
                     </div>
                     <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{item.sales} sold</span>
                  </div>
               ))}
               {(!stats?.slow_moving_items?.length) && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All items moving healthy.</p>}
            </div>
         </div>

         {/* Expiry Risk */}
         <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
               <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  ⚠️ Upcoming Shelf-Life Expiry
                  <InfoButton text="Inventory batches approaching their expiration date within the next 90 days." />
               </h4>
               <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Next 90 Days</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {(stats?.upcoming_expiries || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Batch: {item.batch}</div>
                     </div>
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 700 }}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.qty} units</div>
                     </div>
                  </div>
               ))}
               {(!stats?.upcoming_expiries?.length) && <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>No expiry risks detected.</p>}
            </div>
         </div>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* REVENUE & ORDERS AREA CHART */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p className="chart-title" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                Revenue Trends
                <InfoButton text="Visualizes daily revenue accumulation compared against order volume over the last 7 days." />
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily revenue vs order volume</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={stats?.revenue_last_7_days || []}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `AED ${(v/1000).toFixed(0)}k`} dx={-10} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dx={10} />
              <Tooltip content={<CustomTooltip isCurrency={true} />} />
              {chartType === 'area' ? (
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="var(--gold)" strokeWidth={3} fill="url(#revGrad2)" activeDot={{ r: 6, fill: 'var(--gold)', stroke: '#08080f', strokeWidth: 2 }} />
              ) : (
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              )}
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* PROFIT & REVENUE COMPARISON CHART */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <p className="chart-title" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              Profit Margins
              <InfoButton text="Compares daily gross revenue against calculated gross profit to highlight margin consistency." />
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily gross profit vs revenue</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={stats?.profit_timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `AED ${(v/1000).toFixed(0)}k`} dx={-10} />
              <Tooltip content={<CustomTooltip isCurrency={true} />} />
              <Bar dataKey="revenue" name="Revenue" fill="#1e293b" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" name="Gross Profit" stroke="#34d399" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#34d399', stroke: '#08080f', strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── REPORTS SECTION ── */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Recent Orders Report */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p className="chart-title" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              Live Order Stream
              <InfoButton text="A real-time feed of the latest orders entering the system from all channels." />
            </p>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>View All <ArrowUpRight size={14} /></button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(stats?.recent_orders || []).map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-bg-surface">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{o.order_number}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{new Date(o.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(o.total_amount)}</div>
                  <span className="badge" style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status], fontSize: '0.65rem', marginTop: 4, display: 'inline-block' }}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Channel Report */}
        <div className="card" style={{ padding: 24 }}>
          <p className="chart-title" style={{ margin: 0, fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
            Sales by Channel
            <InfoButton text="Breaks down total revenue and volume contribution from different sales touchpoints." />
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(stats?.channel_performance || []).map((channel, i) => {
              const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
              const color = colors[i % colors.length];
              const activeChannels = stats?.channel_performance || [];
              const maxRev = Math.max(...activeChannels.map(c => c.revenue), 1);
              const barWidth = `${(channel.revenue / maxRev) * 100}%`;
              
              return (
                <div key={channel.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{channel.name}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{channel.orders} orders</span>
                      <span style={{ color: 'var(--gold-bright)' }}>{fmt(channel.revenue)}</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: barWidth, height: '100%', background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 32, padding: 16, background: 'linear-gradient(to right, rgba(201,168,76,0.1), transparent)', borderLeft: '3px solid var(--gold)', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--gold-bright)', margin: '0 0 4px' }}>Real-time Insight</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This data is pulled 100% live from the database. Gross profit margins are dynamically calculated.
            </p>
          </div>
        </div>

        {/* Customer Acquisition Report */}
        <div className="card" style={{ padding: 24 }}>
          <p className="chart-title" style={{ margin: 0, fontSize: '1.1rem', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
            Customer Acquisition Breakdown
            <InfoButton text="Distinguishes between 'Social Media' customers and 'Userend' (Webstore) registrations." />
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(stats?.customer_source_breakdown || []).map((source, i) => {
              const colors = ['#8b5cf6', '#06b6d4', '#f43f5e', '#10b981'];
              const color = colors[i % colors.length];
              const totalCusts = stats?.total_customers || 1;
              const barWidth = `${(source.count / totalCusts) * 100}%`;
              
              // Friendly labels
              let sourceLabel = source.source;
              if (sourceLabel.toLowerCase() === 'pos') sourceLabel = '🏪 Retail / POS';
              if (sourceLabel.toLowerCase() === 'online') sourceLabel = '💻 Webstore (Userend)';
              if (sourceLabel.toLowerCase() === 'whatsapp') sourceLabel = '💬 WhatsApp Social';
              if (sourceLabel.toLowerCase() === 'instagram') sourceLabel = '📸 Instagram Social';

              return (
                <div key={source.source}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sourceLabel}</span>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{source.count} customers</span>
                      <span style={{ color: 'var(--gold-bright)' }}>{Math.round((source.count / totalCusts) * 100)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: barWidth, height: '100%', background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 32, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              💡 <strong>Strategy:</strong> Group "WhatsApp" and "Instagram" to calculate total **Social Media** reach vs. **Userend** organic traffic.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

