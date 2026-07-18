import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { 
  Trophy, Gift, Plus, Search, Edit2, Trash2, 
  ChevronRight, Sparkles, CheckCircle2, XCircle
} from 'lucide-react'

export default function Loyalty() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReward, setEditingReward] = useState(null)
  const [allVariants, setAllVariants] = useState([])
  const [form, setForm] = useState({
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

  useEffect(() => {
    fetchRewards()
    fetchRedemptions()
    fetchVariants()
  }, [])

  const fetchVariants = async () => {
    try {
      const res = await api.get('/products')
      // Flatten products to variants
      const flattened = res.data.flatMap(p => p.variants.map(v => ({ ...v, product_name: p.name })))
      setAllVariants(flattened)
    } catch (err) {
      console.error('Failed to load variants')
    }
  }

  const fetchRewards = async () => {
    try {
      const res = await api.get('/loyalty/rewards')
      setRewards(res.data)
    } catch (err) {
      toast.error('Failed to load rewards')
    }
  }

  const fetchRedemptions = async () => {
    setLoading(true)
    try {
      // Fetch orders that used loyalty points
      const res = await api.get('/orders?limit=100')
      const filtered = res.data.filter(o => o.loyalty_points_used > 0)
      setRedemptions(filtered)
    } catch (err) {
      console.error('Failed to load redemptions', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reward) => {
    setEditingReward(reward)
    setForm({
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
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reward?')) return
    try {
      await api.delete(`/loyalty/rewards/${id}`)
      toast.success('Reward deleted')
      fetchRewards()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        reward_metadata: form.reward_metadata || {},
        point_cost: parseInt(form.point_cost),
        voucher_value: form.voucher_value ? parseFloat(form.voucher_value) : null,
        variant_id: form.reward_type === 'product' && form.variant_id ? form.variant_id : null,
        stock_available: form.reward_type === 'product' && form.stock_available ? parseInt(form.stock_available) : null,
      }
      
      if (editingReward) {
        await api.patch(`/loyalty/rewards/${editingReward.id}`, payload)
        toast.success('Reward updated')
      } else {
        await api.post('/loyalty/rewards', payload)
        toast.success('New reward created')
      }
      setShowModal(false)
      fetchRewards()
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Loyalty & Rewards</h2>
          <p className="page-subtitle">Configure customer privileges and point milestones</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingReward(null); setForm({ name: '', description: '', point_cost: '', reward_type: 'product', variant_id: '', stock_available: '', voucher_value: '', image_url: '', is_active: true }); setShowModal(true); }}>
          <Plus size={16} style={{ marginRight: 8 }} />
          Create Reward
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Gifts</span>
            <Gift size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{rewards.filter(r => r.reward_type === 'product').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Vouchers</span>
            <Trophy size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{rewards.filter(r => r.reward_type === 'voucher').length}</div>
        </div>
        <div className="stat-card theme-quartz">
          <div className="stat-header">
            <span className="stat-label">Points Redeemed</span>
            <Sparkles size={16} className="stat-icon" />
          </div>
          <div className="stat-value">{redemptions.reduce((sum, r) => sum + (r.loyalty_points_used || 0), 0).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('catalog')}
          style={{ padding: '12px 0', borderBottom: activeTab === 'catalog' ? '2px solid var(--gold)' : '2px solid transparent', background: 'none', color: activeTab === 'catalog' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
        >
          Rewards Catalog
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '12px 0', borderBottom: activeTab === 'history' ? '2px solid var(--gold)' : '2px solid transparent', background: 'none', color: activeTab === 'history' ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
        >
          Redemption History
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Syncing loyalty data stream...</div>
      ) : activeTab === 'catalog' ? (
        <div className="table-container">
          <table className="table">
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
              {rewards.map(reward => (
                <tr key={reward.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{reward.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reward.description}</div>
                  </td>
                  <td>
                    <span className={`badge ${reward.reward_type === 'product' ? 'badge-info' : 'badge-gold'}`}>
                      {reward.reward_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{reward.point_cost} PTS</td>
                  <td>{reward.voucher_value ? `AED ${reward.voucher_value}` : 'Product'}</td>
                  <td>
                    {reward.is_active ? (
                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                        <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Active
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <XCircle size={14} style={{ marginRight: 4 }} /> Disabled
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleEdit(reward)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDelete(reward.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Order #</th>
                <th>Points Used</th>
                <th>Discount Value</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{order.customer_phone}</div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.order_number}</span></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{order.loyalty_points_used} PTS</td>
                  <td style={{ fontWeight: 600 }}>AED {order.loyalty_points_used}</td>
                </tr>
              ))}
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No points redemptions found in recent history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingReward ? 'Edit Reward Privilege' : 'Create New Reward'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Reward Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Premium Discovery Set" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What does the customer receive?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Point Cost *</label>
                  <input className="input" type="number" required value={form.point_cost} onChange={e => setForm({...form, point_cost: e.target.value})} placeholder="1000" />
                </div>
                <div>
                  <label className="form-label">Reward Type</label>
                  <select className="input" value={form.reward_type} onChange={e => setForm({...form, reward_type: e.target.value})}>
                    <option value="product">Physical Product</option>
                    <option value="voucher">Virtual Voucher</option>
                    <option value="trip">Family Trip</option>
                    <option value="occasion">Attend Occasion</option>
                    <option value="activity">Free Activity</option>
                  </select>
                </div>
              </div>
              {form.reward_type === 'product' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Linked Product Variant</label>
                    <select className="input" value={form.variant_id} onChange={e => setForm({...form, variant_id: e.target.value})}>
                      <option value="">None / Custom Product</option>
                      {allVariants.map(v => (
                        <option key={v.id} value={v.id}>{v.product_name} - {v.size_ml}ml ({v.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Initial Stock</label>
                    <input className="input" type="number" value={form.stock_available} onChange={e => setForm({...form, stock_available: e.target.value})} placeholder="e.g. 50" />
                  </div>
                </div>
              )}
              {form.reward_type === 'voucher' && (
                <div>
                  <label className="form-label">Voucher Face Value (AED )</label>
                  <input className="input" type="number" value={form.voucher_value} onChange={e => setForm({...form, voucher_value: e.target.value})} placeholder="500" />
                </div>
              )}
              {['trip', 'activity', 'occasion'].includes(form.reward_type) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Location</label>
                    <input className="input" value={form.reward_metadata?.location || ''} 
                      onChange={e => setForm({...form, reward_metadata: {...form.reward_metadata, location: e.target.value}})} 
                      placeholder="e.g. Goa" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Duration</label>
                    <input className="input" value={form.reward_metadata?.duration || ''} 
                      onChange={e => setForm({...form, reward_metadata: {...form.reward_metadata, duration: e.target.value}})} 
                      placeholder="e.g. 3 Days" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Pax / Travelers</label>
                    <input className="input" type="number" value={form.reward_metadata?.pax || ''} 
                      onChange={e => setForm({...form, reward_metadata: {...form.reward_metadata, pax: e.target.value}})} 
                      placeholder="e.g. 4" 
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="form-label">Image URL (Optional)</label>
                <input className="input" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} placeholder="/placeholder-perfume.png" />
              </div>
              <div className="checkbox-container">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                <label htmlFor="is_active">Make this reward active immediately</label>
              </div>
              <div className="modal-footer" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingReward ? 'Update Privilege' : 'Confirm & Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
