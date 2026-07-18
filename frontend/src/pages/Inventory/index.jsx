import { useEffect, useState } from 'react'
import { Plus, Search, AlertTriangle, Hammer, Sliders, MapPin, Layers, Percent, Activity, Calendar, Building, FileText, User, Mail, Phone, Map, Filter, ChevronRight, ArrowRight, TrendingUp, Package } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import InfoButton from '../../components/ui/InfoButton'

function BatchModal({ variants, suppliers, prefill, onClose, onSaved }) {
  const [supplierId, setSupplierId] = useState('')
  const [batchCode, setBatchCode] = useState(prefill ? `LOT-${prefill.sku}-RESTOCK` : `LOT-${Date.now().toString().slice(-6)}`)
  const [notes, setNotes] = useState(prefill ? `Automated restock order created for low-stock SKU: ${prefill.sku}` : '')
  const [warehouseLocation, setWarehouseLocation] = useState(prefill ? prefill.warehouse_location || '' : '')
  const [manufactureDate, setManufactureDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [saving, setSaving] = useState(false)

  // List of items in this shipment batch
  const [items, setItems] = useState([
    {
      variant_id: prefill ? prefill.variant_id : '',
      initial_quantity: '',
      purchase_cost: prefill ? prefill.cost_price || '' : ''
    }
  ])

  const handleAddItem = () => {
    setItems(p => [...p, { variant_id: '', initial_quantity: '', purchase_cost: '' }])
  }

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) {
      toast.error('At least one item SKU must be received in a shipment.')
      return
    }
    setItems(p => p.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, key, val) => {
    setItems(p => p.map((item, i) => {
      if (i === idx) {
        if (key === 'variant_id') {
          const selectedVar = variants.find(v => v.variant_id === val)
          return {
            ...item,
            [key]: val,
            purchase_cost: selectedVar ? selectedVar.cost_price || '' : ''
          }
        }
        return { ...item, [key]: val }
      }
      return item
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)

    // Validation
    const invalidItem = items.find(item => !item.variant_id || !item.initial_quantity || Number(item.initial_quantity) <= 0)
    if (invalidItem) {
      toast.error('Please specify a valid Variant SKU and positive Quantity for all items.')
      setSaving(false)
      return
    }

    const uploadToast = toast.loading(`Receiving shipment of ${items.length} item(s)...`)
    try {
      const promises = items.map(item => {
        const payload = {
          variant_id: item.variant_id,
          supplier_id: supplierId || null,
          batch_code: batchCode,
          initial_quantity: Number(item.initial_quantity),
          purchase_cost: item.purchase_cost ? Number(item.purchase_cost) : null,
          notes: notes || null,
          warehouse_location: warehouseLocation || null,
          manufacture_date: manufactureDate || null,
          expiry_date: expiryDate || null
        }
        return api.post('/inventory/batches', payload)
      })

      await Promise.all(promises)
      toast.success(`Shipment received successfully: ${items.length} item lots stored!`, { id: uploadToast })
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to receive bulk stock shipment', { id: uploadToast })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 750 }}>
        <div className="modal-header">
          <span className="modal-title">Receive Stock Shipment (Bulk Support)</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* ── PART 1: SHIPMENT PARAMETERS ── */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🚚 Shipment & Lot Parameters</p>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">None / Direct Wholesale</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Batch Code / Lot ID *</label>
                <input className="input" value={batchCode} onChange={e => setBatchCode(e.target.value)} placeholder="e.g. SHIP-LOT01" required />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Warehouse Location</label>
                <input className="input" value={warehouseLocation} onChange={e => setWarehouseLocation(e.target.value)} placeholder="Aisle 4, Shelf B" />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacture Date</label>
                <input className="input" type="date" value={manufactureDate} onChange={e => setManufactureDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input className="input" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
            </div>

            {/* ── PART 2: ITEMS IN SHIPMENT ── */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🏺 Items in Shipment</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  
                  {/* SKU Dropdown */}
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: 4 }}>Variant SKU *</label>
                    <select className="select" value={item.variant_id} onChange={e => updateItem(idx, 'variant_id', e.target.value)} required style={{ fontSize: '0.8rem', height: '36px' }}>
                      <option value="">Select variant SKU…</option>
                      {variants.map(v => <option key={v.variant_id} value={v.variant_id}>{v.sku} — {v.product_name}</option>)}
                    </select>
                  </div>

                  {/* Quantity received */}
                  <div className="form-group" style={{ margin: 0, width: 100 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: 4 }}>Quantity *</label>
                    <input className="input" type="number" min="1" value={item.initial_quantity} onChange={e => updateItem(idx, 'initial_quantity', e.target.value)} required placeholder="10" style={{ fontSize: '0.8rem', height: '36px' }} />
                  </div>

                  {/* Purchase Cost */}
                  <div className="form-group" style={{ margin: 0, width: 140 }}>
                    <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: 4 }}>Purchase Cost (AED )</label>
                    <input className="input" type="number" min="0" value={item.purchase_cost} onChange={e => updateItem(idx, 'purchase_cost', e.target.value)} placeholder="1200" style={{ fontSize: '0.8rem', height: '36px' }} />
                  </div>

                  {/* Remove Button */}
                  <button type="button" className="btn btn-danger btn-icon" onClick={() => handleRemoveItem(idx)} style={{ height: 36, width: 36, padding: 0, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }} title="Remove Item">
                    ✕
                  </button>

                </div>
              ))}
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(201,168,76,0.3)', color: 'var(--gold-bright)' }}>
              ➕ Add Another Item to Shipment
            </button>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label">Shipment Notes / QC Flags</label>
              <textarea className="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Supply chain notes, condition, or QC flags..." />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Receive Bulk Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddSupplierModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    gst_number: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/inventory/suppliers', form)
      toast.success('New luxury supplier registered successfully!')
      onSaved()
    } catch {
      toast.error('Failed to register supplier')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">🏢 Register Luxury Supplier</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input className="input" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Grasse Essential Oils Inc." required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input className="input" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="e.g. Pierre Jean" required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Pierre@grasse.fr" required />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">GSTIN / Import License</label>
              <input className="input" value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="e.g. 27AABCF1234F1Z5" />
            </div>
            <div className="form-group">
              <label className="form-label">Corporate Address</label>
              <textarea className="textarea" rows={2} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Corporate warehouse address..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>Save Supplier</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LedgerReportModal({ supplier, onClose }) {
  const fmt = n => `AED ${Number(n || 0).toLocaleString('en-US')}`
  const totalInvoiced = supplier.total_invoiced || 0
  const totalPaid = totalInvoiced - (supplier.outstanding || 0)
  
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div>
            <span className="modal-title" style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>📊 Supply & Financial Ledger Report</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Company: <strong>{supplier.company_name}</strong> | Contact: {supplier.contact_name}</div>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Orders Value</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{fmt(totalInvoiced)}</div>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Amount Settled</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>{fmt(totalPaid)}</div>
            </div>
            <div style={{ background: supplier.outstanding > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)', border: `1px solid ${supplier.outstanding > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: supplier.outstanding > 0 ? 'var(--error)' : 'var(--success)', marginTop: 4 }}>{fmt(supplier.outstanding)}</div>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 10px 0', fontWeight: 700 }}>📜 Invoice Ledger Log</h4>
            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr><th>Ref ID</th><th>Batch Delivered</th><th>Subtotal</th><th>Tax (GST 18%)</th><th>Grand Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(supplier.ledger || []).map(txn => (
                    <tr key={txn.ref}><td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{txn.ref}</span></td><td><span style={{ fontFamily: 'monospace', color: '#fff' }}>{txn.batch}</span></td><td>{fmt(txn.sub)}</td><td>{fmt(txn.tax)}</td><td style={{ fontWeight: 700, color: 'var(--gold)' }}>{fmt(txn.total)}</td><td><span className="badge" style={{
                          background: txn.status === 'Settled' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: txn.status === 'Settled' ? 'var(--success)' : '#f59e0b'
                        }}>
                          {txn.status}
                        </span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  )
}

function StockDetailsModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500, border: '1px solid var(--border)', background: '#0a0a0c' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Logistics & Storage Report</span>
            <h3 className="modal-title" style={{ color: '#fff', fontSize: '1.25rem', margin: '4px 0 0 0' }}>
              {item.sku}
            </h3>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} style={{ border: 'none', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>
        <div className="modal-body" style={{ gap: 16, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ background: 'rgba(201,168,76,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{item.product_name}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logistics parameters for premium variants</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Stock</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.is_low_stock ? 'var(--error)' : 'var(--success)', marginTop: 4 }}>{item.current_stock}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cost Price</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>AED {item.cost_price.toLocaleString('en-US')}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selling Price</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>AED {item.selling_price.toLocaleString('en-US')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Warehouse Location</span>
              <strong style={{ color: '#fff' }}>{item.warehouse_location}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Packaging / Size</span>
              <strong style={{ color: '#fff' }}>{item.weight}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Lot Code</span>
              <strong style={{ color: 'var(--gold-bright)', fontFamily: 'monospace' }}>{item.batch_code}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lot Expiry Date</span>
              <strong style={{ color: '#fff' }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-US') : '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Points Multiplier</span>
              <strong style={{ color: 'var(--success)' }}>{item.points_multiplier || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Profit Margin</span>
              <strong style={{ color: 'var(--success)' }}>{item.selling_price ? Math.round(((item.selling_price - item.cost_price) / item.selling_price) * 100) : 0}%</strong>
            </div>
          </div>

        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}

function BatchDetailsModal({ batch, onClose }) {
  if (!batch) return null
  const totalValuation = batch.initial_quantity * (batch.purchase_cost || 0)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500, border: '1px solid var(--border)', background: '#0a0a0c' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Batch Logistics Sheet</span>
            <h3 className="modal-title" style={{ color: '#fff', fontSize: '1.25rem', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
              {batch.batch_code || 'UNASSIGNED-LOT'}
            </h3>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} style={{ border: 'none', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>
        <div className="modal-body" style={{ gap: 16, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🗄️</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{batch.product_name}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Variant SKU: {batch.variant_sku}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Initial Quantity</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{batch.initial_quantity.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Balance</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: batch.current_quantity === 0 ? 'var(--error)' : 'var(--success)', marginTop: 4 }}>{batch.current_quantity.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cost Per Unit</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gold)', marginTop: 4 }}>{batch.purchase_cost ? `AED ${batch.purchase_cost.toLocaleString()}` : '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Corporate Supplier</span>
              <strong style={{ color: '#fff' }}>{batch.supplier_name || 'Direct Wholesale'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Warehouse Storage Location</span>
              <strong style={{ color: '#fff' }}>{batch.warehouse_location || '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Receipt / Creation Date</span>
              <strong style={{ color: '#fff' }}>{new Date(batch.received_at).toLocaleDateString('en-US')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Batch Capital Valuation</span>
              <strong style={{ color: 'var(--gold-bright)' }}>AED {totalValuation.toLocaleString('en-US')}</strong>
            </div>
          </div>

          {batch.notes && (
            <div style={{ background: 'rgba(201,168,76,0.03)', border: '1px dashed rgba(201,168,76,0.2)', padding: 12, borderRadius: 8 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Logistics Operator Notes</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                {batch.notes}
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  )
}

function MovementDetailsModal({ movement, onClose }) {
  if (!movement) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460, border: '1px solid var(--border)', background: '#0a0a0c' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Stock Movement Log</span>
            <h3 className="modal-title" style={{ color: '#fff', fontSize: '1.25rem', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
              {movement.id}
            </h3>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} style={{ border: 'none', color: '#fff', fontSize: '1.2rem' }}>×</button>
        </div>
        <div className="modal-body" style={{ gap: 16, paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ background: movement.type === 'Restock' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: movement.type === 'Restock' ? 'var(--success)' : 'var(--error)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              {movement.type === 'Restock' ? '📥' : '📤'}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>{movement.product_name}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>SKU: {movement.sku}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.15)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Action Type</span>
              <strong style={{ color: movement.type === 'Restock' ? 'var(--success)' : (movement.type === 'Deduction' ? 'var(--error)' : 'var(--gold)') }}>{movement.type}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quantity Shift</span>
              <strong style={{ color: movement.qty > 0 ? 'var(--success)' : 'var(--error)' }}>
                {movement.qty > 0 ? `+${movement.qty.toLocaleString()}` : movement.qty.toLocaleString()} units
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction Date</span>
              <strong style={{ color: '#fff' }}>{new Date(movement.date).toLocaleDateString('en-US')}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Log Reason & Description</span>
            <p style={{ fontSize: '0.8rem', color: '#fff', margin: '4px 0 0 0', lineHeight: '1.4', fontWeight: 600 }}>
              {movement.reason}
            </p>
          </div>
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
            Dismiss Log
          </button>
        </div>
      </div>
    </div>
  )
}

function StockAdjustmentModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    variant_id: item.variant_id,
    adjustment_type: 'add', // 'add' | 'deduct' | 'override'
    quantity: '',
    reason: '',
    warehouse_location: item.warehouse_location || '',
    batch_id: item.batch_code || ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    const payload = {
      ...form,
      quantity: Number(form.quantity)
    }
    try {
      await api.post('/inventory/adjust', payload)
      toast.success('Stock adjusted successfully!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to adjust stock')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">📦 Stock Adjustment — {item.sku}</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{item.product_name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Current Stock: <strong style={{ color: 'var(--gold)' }}>{item.current_stock} units</strong></div>
            </div>
            <div className="form-group">
              <label className="form-label">Adjustment Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { id: 'add', label: '➕ Add Stock' },
                  { id: 'deduct', label: '➖ Deduct Stock' },
                  { id: 'override', label: '🎯 Override Total' }
                ].map(opt => (
                  <button key={opt.id} type="button" className={`btn btn-sm ${form.adjustment_type === opt.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => set('adjustment_type', opt.id)} style={{ padding: '8px 4px', fontSize: '0.72rem' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Quantity Change *</label>
                <input className="input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} required placeholder="10" />
              </div>
              <div className="form-group">
                <label className="form-label">Active Lot / Batch ID</label>
                <input className="input" value={form.batch_id} onChange={e => set('batch_id', e.target.value)} placeholder="e.g. LOT-A2" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse Location</label>
              <input className="input" value={form.warehouse_location} onChange={e => set('warehouse_location', e.target.value)} placeholder="Aisle 4, Shelf B" />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Adjustment *</label>
              <select className="select" value={form.reason} onChange={e => set('reason', e.target.value)} required>
                <option value="">Select reason…</option>
                <option value="Restock / Received Shipment">Restock / Received Shipment</option>
                <option value="Sales Return">Sales Return</option>
                <option value="QC Audit Correction">QC Audit Correction</option>
                <option value="Damaged / Leaked Bottle">Damaged / Leaked Bottle</option>
                <option value="Promotional Sample Vial">Promotional Sample Vial</option>
                <option value="Expired Stock Removal">Expired Stock Removal</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Adjustment</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [stock, setStock] = useState([])
  const [batches, setBatches] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // 'overview' | 'stock' | 'batches' | 'transactions' | 'suppliers'
  const [modal, setModal] = useState(false)
  const [supplierModal, setSupplierModal] = useState(false)
  const [selectedLedger, setSelectedLedger] = useState(null)
  const [adjustModal, setAdjustModal] = useState(null) // null | item row
  const [selectedStockItem, setSelectedStockItem] = useState(null) // null | item row
  const [selectedBatch, setSelectedBatch] = useState(null) // null | batch row
  const [selectedMovement, setSelectedMovement] = useState(null) // null | movement row
  const [lowOnly, setLowOnly] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [ovSearch, setOvSearch] = useState('')
  const [ovTime, setOvTime] = useState('Last 30 Days')
  const [ovWh, setOvWh] = useState('All Warehouses')

  // INVENTORY MOVEMENTS STATE
  const [movements, setMovements] = useState([])
  const [movementSearch, setMovementSearch] = useState('')
  
  const [dashboardStats, setDashboardStats] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/inventory/stock', { params: { low_stock_only: lowOnly } }),
      api.get('/inventory/batches'),
      api.get('/inventory/suppliers'),
      api.get('/inventory/movements'),
      api.get('/dashboard/stats')
    ]).then(([s, b, sup, m, ds]) => {
      setStock(s.data || [])
      setBatches(b.data || [])
      setSuppliers(sup.data || [])
      setMovements(m.data || [])
      setDashboardStats(ds.data || null)
    })
    .catch(() => toast.error('Failed to load inventory data'))
    .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [lowOnly])
  const lowCount = stock.filter(s => s.is_low_stock).length

  const filteredMovements = movements.filter(m =>
    m.id.toLowerCase().includes(movementSearch.toLowerCase()) ||
    m.sku.toLowerCase().includes(movementSearch.toLowerCase()) ||
    m.product_name.toLowerCase().includes(movementSearch.toLowerCase()) ||
    m.reason.toLowerCase().includes(movementSearch.toLowerCase())
  )

  const filteredSuppliers = suppliers.filter(s =>
    (s.company_name || '').toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.contact_name || '').toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(supplierSearch.toLowerCase())
  )

  // Derived Logic for Enhanced Overview
  const outCount = stock.filter(s => s.current_stock === 0).length
  const totalInventoryCount = stock.reduce((acc, curr) => acc + curr.current_stock, 0)
  const filteredStockForOv = stock.filter(s => 
    s.product_name.toLowerCase().includes(ovSearch.toLowerCase()) || 
    s.sku.toLowerCase().includes(ovSearch.toLowerCase())
  )
  const filteredBatchesForOv = batches.filter(b => 
    b.product_name.toLowerCase().includes(ovSearch.toLowerCase()) || 
    b.batch_code?.toLowerCase().includes(ovSearch.toLowerCase())
  )

  // Derived analytics for visualization
  const healthyCount = stock.filter(s => !s.is_low_stock && s.current_stock > 0).length
  const totalStatus = (healthyCount + lowCount) || 1
  const healthyPct = Math.round((healthyCount / totalStatus) * 100)
  const lowPct = Math.round((lowCount / totalStatus) * 100)

  const uniqueLocations = [...new Set(stock.map(s => s.warehouse_location || 'General Storage'))]

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Inventory & Supply Logistics</div>
          <div className="page-subtitle">Smart warehousing, batch receipts, adjusting stock levels, and supplier financial ledgers</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setSupplierModal(true)}>
            <Building size={14} /> Add Supplier
          </button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={14} /> Receive Stock
          </button>
        </div>
      </div>

      {lowCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--error-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20 }}>
          <AlertTriangle size={16} color="var(--error)" />
          <span style={{ fontSize: '0.83rem', color: 'var(--error)', fontWeight: 600 }}>{lowCount} SKU{lowCount > 1 ? 's' : ''} at or below reorder threshold</span>
        </div>
      )}

      {/* Financial Valuation Ledger */}
      {tab === 'stock' && (
        <div className="grid-4" style={{ gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Stock Cost Basis <InfoButton text="Summation of purchase cost across all batch inventory units currently sitting in distribution centers." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              AED {stock.reduce((acc, curr) => acc + (curr.current_stock * curr.cost_price), 0).toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Potential Revenue <InfoButton text="Gross realized value generated if every tracked unit sells at the current active listing price." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 2 }}>
              AED {stock.reduce((acc, curr) => acc + (curr.current_stock * curr.selling_price), 0).toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Projected Profit Yield <InfoButton text="Calculated net liquidity variance separating potential revenue against verified stock costs." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>
              AED {(stock.reduce((acc, curr) => acc + (curr.current_stock * curr.selling_price), 0) - stock.reduce((acc, curr) => acc + (curr.current_stock * curr.cost_price), 0)).toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Avg Brand Markup <InfoButton text="Standardized percentage disparity between acquisition and consumer pricing across standard items." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {stock.length > 0 ? Math.round(stock.reduce((acc, curr) => acc + curr.margin_pct, 0) / stock.length) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* TABS KPI: BATCHES */}
      {tab === 'batches' && (
        <div className="grid-4" style={{ gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Total Inflow Lots <InfoButton text="Aggregated sum of unique registered batch trackingIDs recognized within master database." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{batches.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Active Lots (Non-Zero) <InfoButton text="Batches that currently encompass non-exhausted physical count on facility shelves." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>
              {batches.filter(b => b.current_quantity > 0).length}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Batch Capitalization <InfoButton text="Gross historical locked investment utilized directly towards active logistics receipts." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 2 }}>
              AED {batches.reduce((acc, b) => acc + (b.initial_quantity * (b.purchase_cost || 0)), 0).toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Avg Lot Size <InfoButton text="Statistical mean calculated total capacity per inbound batch replenishment order." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              {batches.length > 0 ? Math.round(batches.reduce((acc, b) => acc + b.initial_quantity, 0) / batches.length) : 0} units
            </div>
          </div>
        </div>
      )}

      {/* TABS KPI: TRANSACTIONS */}
      {tab === 'transactions' && (
        <div className="grid-4" style={{ gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Movements Logged</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{movements.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>Today's Activity</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 2 }}>
              {movements.filter(m => new Date(m.date).toDateString() === new Date().toDateString()).length} entries
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>Restock vs Deduction</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
              <span style={{ color: 'var(--success)' }}>{movements.filter(m => m.type === 'Restock').length}</span> / <span style={{ color: 'var(--error)' }}>{movements.filter(m => m.type === 'Deduction').length}</span>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>Net Unit Variance</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: movements.reduce((acc, m) => acc + m.qty, 0) >= 0 ? 'var(--success)' : 'var(--error)', marginTop: 2 }}>
              {movements.reduce((acc, m) => acc + m.qty, 0).toLocaleString()} units
            </div>
          </div>
        </div>
      )}

      {/* TABS KPI: SUPPLIERS */}
      {tab === 'suppliers' && (
        <div className="grid-4" style={{ gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Registered Vendors <InfoButton text="Count of luxury upstream manufacturing relationships active in ledger system." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{suppliers.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Total Payables <InfoButton text="Cumulative absolute balance remaining outstanding due directly to manufacturing supply channels." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)', marginTop: 2 }}>
              AED {suppliers.reduce((acc, s) => acc + s.outstanding, 0).toLocaleString('en-US')}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Pending Settlements <InfoButton text="Entities with current balances above threshold waiting accounting allocation." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)', marginTop: 2 }}>
              {suppliers.filter(s => s.outstanding > 0).length} Partners
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Settled Accounts <InfoButton text="Partners which have zero remaining balance and finalized payment cycles." />
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: 2 }}>
              {suppliers.filter(s => s.outstanding === 0).length} Partners
            </div>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex gap-2" style={{ marginBottom: 16 }}>
        {[
          { id: 'overview', label: '🏠 Executive Overview' },
          { id: 'stock', label: '📦 Stock Levels' },
          { id: 'batches', label: '🗄️ Received Batches' },
          { id: 'transactions', label: '📜 Stock Movements' },
          { id: 'suppliers', label: '🏢 Luxury Suppliers' }
        ].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
        {tab === 'stock' && (
          <button className={`btn btn-sm ${lowOnly ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setLowOnly(p => !p)}>
            <AlertTriangle size={12} /> {lowOnly ? 'All Stock' : 'Low Stock Only'}
          </button>
        )}
      </div>

      {/* EXECUTIVE OVERVIEW TAB */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 24 }}>
          
          {/* ── TOP LAYER: INTELLIGENT FILTERS & SEARCH ── */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'linear-gradient(to right, rgba(255,255,255,0.03), transparent)', 
            padding: '16px 20px', 
            borderRadius: 16, 
            border: '1px solid var(--border)',
            gap: 20,
            flexWrap: 'wrap'
          }}>
            <div className="search-box" style={{ flex: 1, minWidth: 300 }}>
              <Search className="search-icon" color="var(--gold)" />
              <input 
                type="text" 
                className="input" 
                placeholder="Search global assets, SKUs, or received batch codes..." 
                value={ovSearch}
                onChange={(e) => setOvSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', height: 42 }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '0 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', height: 42 }}>
                <Calendar size={14} color="var(--gold)" />
                <select 
                  value={ovTime} 
                  onChange={(e) => setOvTime(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Today">Today's Pulse</option>
                  <option value="Last 7 Days">Weekly View</option>
                  <option value="Last 30 Days">Monthly Snapshot</option>
                  <option value="Total">Total Lifetime</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '0 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', height: 42 }}>
                <MapPin size={14} color="var(--gold)" />
                <select 
                  value={ovWh} 
                  onChange={(e) => setOvWh(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="All Warehouses">Global Inventory</option>
                  {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── MIDDLE LAYER: EXECUTIVE KPI CLUSTER (SMALLER) ── */}
          <div className="grid-5" style={{ gap: 10 }}>
            <div className="stat-card" style={{ padding: '12px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Unique SKUs <InfoButton text="Distinct count of recognized inventory tracking numbers." />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{stock.length}</div>
                </div>
                <div style={{ background: 'rgba(201,168,76,0.08)', padding: 6, borderRadius: 8 }}>
                  <Package size={12} style={{ color: 'var(--gold)' }} />
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '12px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Today's Inflow <InfoButton text="Quantity additions logged to facility within current 24hr window." />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', marginTop: 2 }}>
                    {movements.filter(m => m.type === 'Restock' && new Date(m.date).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + curr.qty, 0)}
                  </div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: 6, borderRadius: 8 }}>
                  <TrendingUp size={12} style={{ color: 'var(--success)' }} />
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '12px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Batch Intake <InfoButton text="Total individual bulk delivery tracking files recorded." />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{batches.length}</div>
                </div>
                <div style={{ background: 'rgba(201,168,76,0.08)', padding: 6, borderRadius: 8 }}>
                  <FileText size={12} style={{ color: 'var(--gold)' }} />
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '12px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))', border: '1px solid rgba(201,168,76,0.08)', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Partners <InfoButton text="Verified contracted corporate manufacturing vendors." />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{suppliers.length}</div>
                </div>
                <div style={{ background: 'rgba(201,168,76,0.08)', padding: 6, borderRadius: 8 }}>
                  <Building size={12} style={{ color: 'var(--gold)' }} />
                </div>
              </div>
            </div>

            <div className={`stat-card ${outCount > 0 || lowCount > 0 ? 'pulse-border' : ''}`} 
                 style={{ 
                   padding: '12px',
                   borderRadius: 10,
                   border: outCount > 0 ? '1px solid rgba(239,68,68,0.3)' : (lowCount > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(201,168,76,0.08)'),
                   background: outCount > 0 ? 'rgba(239,68,68,0.05)' : (lowCount > 0 ? 'rgba(245,158,11,0.05)' : 'linear-gradient(145deg, var(--bg-card), var(--bg-surface))')
                 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', color: outCount > 0 ? 'var(--error)' : 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    Alerts <InfoButton text="Current intersection of items either completely exhausted or hovering near depletion warning thresholds." />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: outCount > 0 ? 'var(--error)' : (lowCount > 0 ? 'var(--warning)' : 'var(--success)'), marginTop: 2 }}>
                    {lowCount + outCount}
                  </div>
                </div>
                <div style={{ background: outCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)', padding: 6, borderRadius: 8 }}>
                  <AlertTriangle size={12} style={{ color: outCount > 0 ? 'var(--error)' : 'var(--warning)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM LAYER: PRODUCT INTELLIGENCE & HEALTH ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
             
             {/* Velocity: Fast Moving Creations */}
             <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                     <TrendingUp size={18} color="var(--success)" /> High Velocity Creations <InfoButton text="Products exhibiting fastest turnover cycles and highest immediate volumetric sales." />
                   </h3>
                   <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>Last 30D</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {(dashboardStats?.fast_moving_items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                         <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}</span>
                         <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 800 }}>{item.units} sold</span>
                      </div>
                   ))}
                   {(!dashboardStats?.fast_moving_items?.length) && <div style={{ padding: 20, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>Waiting for sale records...</div>}
                </div>
             </div>

             {/* Risk: Stagnant Assets */}
             <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                     <Activity size={18} color="var(--warning)" /> Stagnant Asset Exposure <InfoButton text="Identifies low volume SKUs potentially incurring unnecessary overhead with locked capital." />
                   </h3>
                   <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>Attention Req</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {(dashboardStats?.slow_moving_items || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                         <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}</span>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 800 }}>{item.sales} sold</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Stock: {item.stock}</div>
                         </div>
                      </div>
                   ))}
                   {(!dashboardStats?.slow_moving_items?.length) && <div style={{ padding: 20, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>No exposure risks detected.</div>}
                </div>
             </div>

             {/* Shelf Life: Upcoming Expiries */}
             <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                   <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                     <AlertTriangle size={18} color="var(--error)" /> Shelf-Life Expiry Risk <InfoButton text="Time-based sensitivity scanner warning against lot codes reaching theoretical obsolescence." />
                   </h3>
                   <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>Next 90D</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {(dashboardStats?.upcoming_expiries || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                         <div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Batch: {item.batch}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 800 }}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.qty} units</div>
                         </div>
                      </div>
                   ))}
                   {(!dashboardStats?.upcoming_expiries?.length) && <div style={{ padding: 20, textAlign: 'center', fontSize: '0.75rem', color: 'var(--success)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 10 }}>No upcoming shelf-life risks.</div>}
                </div>
             </div>
          </div>

          {/* ── LOWER LAYER: OPERATIONAL HEALTH & DISTRIBUTION ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
             
             {/* Inventory Health & Pipeline Summary */}
             <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                   <Activity size={18} color="var(--gold)" /> Operational Health Profile <InfoButton text="Aggregate sanity overview detailing safety capacity vs depletion crisis risk probabilities." />
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Full Supply Availability</span>
                            <strong style={{ color: 'var(--success)' }}>{healthyPct}%</strong>
                         </div>
                         <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--success)', width: `${healthyPct}%`, borderRadius: 4, transition: 'width 1s ease' }} />
                         </div>
                      </div>
                      <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Restock Pipeline Urgency</span>
                            <strong style={{ color: 'var(--warning)' }}>{lowPct}%</strong>
                         </div>
                         <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, width: '100%', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--warning)', width: `${lowPct}%`, borderRadius: 4, transition: 'width 1s ease' }} />
                         </div>
                      </div>
                   </div>

                   <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Quick Restock Proposal</span>
                      {stock.filter(s => s.is_low_stock).length === 0 ? (
                         <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 8 }}>✅ All stock levels are healthy.</div>
                      ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                            {stock.filter(s => s.is_low_stock).slice(0, 2).map(s => (
                               <div key={s.variant_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.78rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{s.product_name}</div>
                                  <button onClick={() => setModal(s)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', cursor: 'pointer' }}>Restock</button>
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Site Load Visualizer */}
             <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                   <MapPin size={18} color="var(--gold)" /> Site Load Distribution <InfoButton text="Volumetric breakdown explaining geographic distribution density across global warehouses." />
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: 100, gap: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4 }}>
                   <div style={{ flex: 1, background: 'var(--gold)', height: '85%', borderRadius: '6px 6px 0 0', position: 'relative' }} className="hover-glow">
                      <span style={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Main Hub</span>
                   </div>
                   <div style={{ flex: 1, background: 'var(--gold-dim)', height: '35%', borderRadius: '6px 6px 0 0', position: 'relative' }} className="hover-glow">
                      <span style={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cold Chain</span>
                   </div>
                   <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '15%', borderRadius: '6px 6px 0 0', position: 'relative' }} className="hover-glow">
                      <span style={{ position: 'absolute', bottom: -20, width: '100%', textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transit</span>
                   </div>
                </div>
             </div>

          </div>

          {/* ── FINAL LAYER: INTELLIGENT INFLOW LOG ── */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
              <h4 style={{ margin: 0, color: 'var(--gold-bright)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} /> Verified Inventory Inflow Ledger <InfoButton text="Historical chain tracking incoming batch acknowledgements at receiving bay." />
              </h4>
              <button className="btn btn-sm btn-ghost" onClick={() => setTab('batches')} style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>View Comprehensive Log <ChevronRight size={16} /></button>
            </div>
            
            {filteredBatchesForOv.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 16 }}>
                No batch inflow records detected for the selected filters.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredBatchesForOv.slice(0, 3).map(b => (
                  <div key={b.id} onClick={() => setSelectedBatch(b)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: 18, borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.3s' }} className="hover-glow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 800, background: 'rgba(201,168,76,0.1)', padding: '3px 8px', borderRadius: 4 }}>{b.batch_code || 'LOT'}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(b.received_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{b.product_name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Inflow Units: <strong style={{ color: '#fff' }}>{b.initial_quantity}</strong></span>
                       <span style={{ fontSize: '0.62rem', color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✓ Received</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK LEVELS TAB */}
      {tab === 'stock' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>SKU</th><th>Product Name</th><th>Selling / Cost (AED )</th><th>Margin</th><th>Stock (Avail/Total)</th><th>Location</th><th>Weight</th><th>Expiry</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="table-empty">Loading…</td></tr>
              ) : stock.length === 0 ? (
                <tr><td colSpan={10} className="table-empty">No stock data. Receive your first batch!</td></tr>
              ) : (
                stock.map(s => {
                  const isExpiringSoon = s.expiry_date && (new Date(s.expiry_date) - new Date()) < (6 * 30 * 24 * 60 * 60 * 1000)
                  return (
                    <tr key={s.variant_id} onClick={() => setSelectedStockItem(s)} style={{ cursor: 'pointer' }} className="clickable-row">
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>{s.sku}</span></td><td><div style={{ fontWeight: 600 }}>{s.product_name}</div><span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Lot: {s.batch_code}</span></td><td><div style={{ color: '#fff', fontWeight: 600 }}>AED {s.selling_price.toLocaleString('en-US')}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cost: AED {s.cost_price.toLocaleString('en-US')}</div></td><td><span style={{ color: s.margin_pct >= 40 ? 'var(--success)' : 'var(--gold)', fontWeight: 700 }}>
                          {s.margin_pct}%
                        </span></td><td><strong style={{ color: s.is_low_stock ? 'var(--error)' : 'var(--success)' }}>
                          {s.current_stock}
                        </strong><span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> / {s.current_stock + 4}</span><div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Min Alert: {s.min_stock_alert}</div></td><td><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}><MapPin size={10} color="var(--gold)" />
                          {s.warehouse_location}
                        </div></td><td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.weight}</td><td><span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: isExpiringSoon ? 'var(--error)' : 'var(--text-secondary)',
                          background: isExpiringSoon ? 'rgba(239,68,68,0.1)' : 'transparent',
                          padding: isExpiringSoon ? '2px 6px' : '0', borderRadius: 4
                        }}>
                          {new Date(s.expiry_date).toLocaleDateString('en-US')}
                          {isExpiringSoon && <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 'bold' }}>⚠️ EXPIRING</span>}
                        </span></td><td><span className="badge" style={{
                          fontSize: '0.68rem', fontWeight: 700,
                          background: s.status === 'Low Stock' ? 'rgba(245,158,11,0.15)' : (s.status === 'Discontinued' ? 'rgba(255,255,255,0.05)' : 'rgba(201,168,76,0.15)'),
                          color: s.status === 'Low Stock' ? '#f59e0b' : (s.status === 'Discontinued' ? '#9ca3af' : 'var(--gold)'),
                          border: `1px solid ${s.status === 'Low Stock' ? 'rgba(245,158,11,0.3)' : (s.status === 'Discontinued' ? 'rgba(255,255,255,0.1)' : 'rgba(201,168,76,0.3)')}`,
                          boxShadow: s.status === 'Active' ? '0 0 8px rgba(201,168,76,0.15)' : 'none'
                        }}>
                          {s.status}
                        </span></td><td><div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                          {s.is_low_stock && (
                            <button className="btn btn-xs" onClick={(e) => { e.stopPropagation(); setModal(s) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)', padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>
                              <Layers size={10} /> Reorder
                            </button>
                          )}
                          <button className="btn btn-sm btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); setAdjustModal(s) }} title="Adjust Stock / Quick Plus" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold)' }}>
                            <Sliders size={12} /></button></div></td></tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RECEIVED BATCHES TAB */}
      {tab === 'batches' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Batch</th><th>Product/SKU</th><th>Supplier</th><th>Initial</th><th>Current</th><th>Cost/Unit</th><th>Warehouse Location</th><th>Date</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="table-empty">Loading…</td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">No batches yet.</td></tr>
              ) : (
                batches.map(b => (
                  <tr key={b.id} onClick={() => setSelectedBatch(b)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.batch_code || '—'}</span></td><td><div style={{ fontWeight: 600 }}>{b.product_name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.variant_sku}</div></td><td>{b.supplier_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td><td>{b.initial_quantity}</td><td><strong style={{ color: b.current_quantity === 0 ? 'var(--error)' : 'var(--text-primary)' }}>{b.current_quantity}</strong></td><td>{b.purchase_cost ? `AED ${b.purchase_cost}` : '—'}</td><td><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {b.warehouse_location || '—'}
                      </span></td><td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.received_at).toLocaleDateString('en-US')}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INVENTORY TRANSACTIONS TAB */}
      {tab === 'transactions' && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="search-icon" />
              <input className="input" placeholder="Search Movement ID, SKU, product, reason…" value={movementSearch} onChange={e => setMovementSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredMovements.length} records logged</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Movement ID</th><th>SKU</th><th>Product Name</th><th>Movement Type</th><th>Qty Change</th><th>Reason / Description</th><th>Date Logged</th></tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No stock movements found.</td></tr>
              ) : (
                filteredMovements.map(m => (
                  <tr key={m.id} onClick={() => setSelectedMovement(m)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)' }}>{m.id}</span></td><td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: '#fff' }}>{m.sku}</span></td><td style={{ fontWeight: 600 }}>{m.product_name}</td><td><span className="badge" style={{
                        background: m.type === 'Restock' ? 'rgba(16,185,129,0.15)' : (m.type === 'Deduction' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'),
                        color: m.type === 'Restock' ? 'var(--success)' : (m.type === 'Deduction' ? 'var(--error)' : '#f59e0b'),
                        fontWeight: 700, fontSize: '0.68rem'
                      }}>
                        {m.type}
                      </span></td><td><strong style={{ color: m.qty > 0 ? 'var(--success)' : 'var(--error)' }}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </strong></td><td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.reason}</td><td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.date).toLocaleDateString('en-US')}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LUXURY SUPPLIERS TAB */}
      {tab === 'suppliers' && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="search-icon" />
              <input className="input" placeholder="Search supplier company, email, contact name…" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredSuppliers.length} suppliers registered</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Company Name</th><th>Contact Representative</th><th>Email / Phone</th><th>GSTIN / Import ID</th><th>Corporate Location</th><th>Outstanding Bal.</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No suppliers matched.</td></tr>
              ) : (
                filteredSuppliers.map(s => (
                  <tr key={s.id} onClick={() => setSelectedLedger(s)} style={{ cursor: 'pointer' }}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', color: 'var(--gold)', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building size={14} /></div><div><strong style={{ color: '#fff' }}>{s.company_name}</strong></div></div></td><td><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}><User size={12} color="var(--text-secondary)" />
                        {s.contact_name}
                      </div></td><td><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}><Mail size={11} color="var(--text-muted)" />
                        {s.email}
                      </div><div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}><Phone size={11} />
                        {s.phone}
                      </div></td><td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>{s.gst_number || '—'}</span></td><td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="var(--gold)" />
                        {s.address}
                      </div></td><td><strong style={{ color: (s.outstanding || 0) > 0 ? 'var(--error)' : 'var(--success)' }}>
                        AED {(s.outstanding || 0).toLocaleString('en-US')}
                      </strong></td><td><div style={{ display: 'flex', justifyContent: 'center' }}><button className="btn btn-sm btn-ghost" onClick={() => setSelectedLedger(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                          <FileText size={11} /> Ledger Report
                        </button></div></td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BatchModal variants={stock} suppliers={suppliers} prefill={typeof modal === 'object' ? modal : null} onClose={() => setModal(false)} onSaved={() => { setModal(false); load() }} />
      )}

      {supplierModal && (
        <AddSupplierModal onClose={() => setSupplierModal(false)} onSaved={() => { setSupplierModal(false); load() }} />
      )}

      {selectedLedger && (
        <LedgerReportModal supplier={selectedLedger} onClose={() => setSelectedLedger(null)} />
      )}

      {adjustModal && (
        <StockAdjustmentModal item={adjustModal} onClose={() => setAdjustModal(null)} onSaved={() => { setAdjustModal(null); load() }} />
      )}

      {selectedStockItem && (
        <StockDetailsModal item={selectedStockItem} onClose={() => setSelectedStockItem(null)} />
      )}

      {selectedBatch && (
        <BatchDetailsModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      )}

      {selectedMovement && (
        <MovementDetailsModal movement={selectedMovement} onClose={() => setSelectedMovement(null)} />
      )}
    </div>
  )
}
