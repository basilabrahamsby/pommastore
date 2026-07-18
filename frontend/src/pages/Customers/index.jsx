import { useEffect, useState } from 'react'
import { Search, User } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const TIER_COLORS = { Bronze:'#cd7f32', Silver:'#aaa', Gold:'var(--gold)', Platinum:'#e5e4e2' }

export default function Customers() {
  const [customers,setCustomers]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')

  useEffect(()=>{
    setLoading(true)
    api.get('/customers',{params:{search:search||undefined}})
      .then(r=>setCustomers(r.data))
      .catch(()=>toast.error('Failed to load customers'))
      .finally(()=>setLoading(false))
  },[search])

  const fmt = n => `AED ${Number(n||0).toLocaleString('en-US')}`

  return (
    <div>
      <div style={{marginBottom:24}}>
        <div className="page-title">Customers</div>
        <div className="page-subtitle">Customer profiles, loyalty tiers & purchase history</div>
      </div>
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search className="search-icon"/>
            <input className="input" placeholder="Search name, email, phone…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <span style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{customers.length} customers</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Contact</th><th>Loyalty Tier</th><th>Points</th><th>Orders</th><th>Total Spent</th><th>Last Order</th><th>Source</th></tr></thead>
          <tbody>
            {loading?<tr><td colSpan={8} className="table-empty">Loading…</td></tr>
             :customers.length===0?<tr><td colSpan={8} className="table-empty">No customers yet.</td></tr>
             :customers.map(c=>(
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div style={{width:28,height:28,borderRadius:'50%',background:'var(--gold-glow)',border:'1px solid var(--gold-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:'var(--gold)',flexShrink:0}}>
                      {c.full_name?c.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?'}
                    </div>
                    <div>
                      <div style={{fontWeight:600}}>{c.full_name||<span style={{color:'var(--text-muted)'}}>—</span>}</div>
                      {c.gender&&<div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{c.gender}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{fontSize:'0.8rem'}}>{c.email||'—'}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{c.phone||''}</div>
                </td>
                <td><span className="badge" style={{color:TIER_COLORS[c.loyalty_tier],background:TIER_COLORS[c.loyalty_tier]+'22'}}>{c.loyalty_tier}</span></td>
                <td style={{fontWeight:600}}>{c.loyalty_points}</td>
                <td>{c.order_count}</td>
                <td style={{fontWeight:700,color:'var(--gold-bright)'}}>{fmt(c.total_spent)}</td>
                <td style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{c.last_order_at?new Date(c.last_order_at).toLocaleDateString('en-US'):'—'}</td>
                <td><span className="badge badge-neutral">{c.acquisition_source||'—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
