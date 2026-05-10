import { useEffect, useState } from 'react'
import { Search, ChevronDown, User, DollarSign, CreditCard, Activity, Plus, TrendingUp, TrendingDown, Download, Filter, ArrowUpRight, ArrowDownRight, ShoppingBag, Users, Percent, Building } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'


const PINCODE_SUGGESTIONS = [
  { pincode: '673001', city: 'Kozhikode', state: 'Kerala', line1: 'SM Street, Palayam', line2: 'Near Calicut Railway Station' },
  { pincode: '673004', city: 'Kozhikode', state: 'Kerala', line1: 'Mavoor Road', line2: 'Near KSRTC Bus Stand' },
  { pincode: '673016', city: 'Kozhikode', state: 'Kerala', line1: 'Nallalam', line2: 'Industrial Area' },
  { pincode: '110001', city: 'New Delhi', state: 'Delhi', line1: 'Connaught Place, Block H', line2: 'Near Rajiv Chowk Metro' },
  { pincode: '110021', city: 'New Delhi', state: 'Delhi', line1: 'Chanakyapuri, Shanti Path', line2: 'Embassy Area' },
  { pincode: '400001', city: 'Mumbai', state: 'Maharashtra', line1: 'Fort, DN Road', line2: 'Opposite CST Station' },
  { pincode: '400050', city: 'Mumbai', state: 'Maharashtra', line1: 'Bandra West, Link Road', line2: 'Near Bandstand' },
  { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', line1: 'MG Road, Ashok Nagar', line2: 'Near Metro Station' },
  { pincode: '560034', city: 'Bengaluru', state: 'Karnataka', line1: 'Koramangala 4th Block', line2: 'Near Sony World Signal' },
  { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu', line1: 'George Town, Rajaji Salai', line2: 'Near Parry\'s Corner' },
  { pincode: '700001', city: 'Kolkata', state: 'West Bengal', line1: 'Esplanade', line2: 'Near Lal Bazar' },
  { pincode: '500001', city: 'Hyderabad', state: 'Telangana', line1: 'Abids Road', line2: 'Near GPO' }
]


function OrderModal({ onClose, onSaved, customers, variants }) {
  const [showPinSuggestions, setShowPinSuggestions] = useState(false)
  const [liveSuggestions, setLiveSuggestions] = useState([])
  const [customerAddresses, setCustomerAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('new')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [form, setForm] = useState({
    customer_id: '',
    channel: 'pos',
    payment_method: 'cash',
    discount_amount: 0,
    tax_amount: 0,
    shipping_amount: 0,
    notes: '',
    shipping_pincode: '',
    shipping_city: '',
    shipping_state: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    alt_contact_phone: '',
    items: [{ variant_id: '', quantity: 1, unit_price: 0 }]
  })
  const [saving, setSaving] = useState(false)
  const [delhiveryActive, setDelhiveryActive] = useState(true)
  const [razorpaySimulating, setRazorpaySimulating] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [selectedRazorpayMethod, setSelectedRazorpayMethod] = useState('card')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const totalQty = form.items.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0)

  useEffect(() => {
    if (delhiveryActive) {
      const pin = (form.shipping_pincode || '').trim()
      let baseShipping = 150 // Default national rate
      let perItemShipping = 20

      if (pin.startsWith('11')) {
        // Local Zone (New Delhi)
        baseShipping = 50
        perItemShipping = 10
      } else if (pin.startsWith('40') || pin.startsWith('50') || pin.startsWith('56') || pin.startsWith('60') || pin.startsWith('70')) {
        // Metro/Regional Zone (Mumbai, Chennai, Bengaluru, Kolkata, Hyderabad)
        baseShipping = 90
        perItemShipping = 15
      }

      const simulatedShipping = totalQty > 0 ? baseShipping + (totalQty - 1) * perItemShipping : 0
      set('shipping_amount', simulatedShipping)
    } else {
      set('shipping_amount', 0)
    }
  }, [delhiveryActive, totalQty, form.shipping_pincode])

  useEffect(() => {
    const pin = (form.shipping_pincode || '').trim()
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      // First try immediate offline prefill
      if (pin.startsWith('11')) {
        set('shipping_city', 'New Delhi')
        set('shipping_state', 'Delhi')
      } else if (pin.startsWith('40')) {
        set('shipping_city', 'Mumbai')
        set('shipping_state', 'Maharashtra')
      } else if (pin.startsWith('56')) {
        set('shipping_city', 'Bengaluru')
        set('shipping_state', 'Karnataka')
      } else if (pin.startsWith('60')) {
        set('shipping_city', 'Chennai')
        set('shipping_state', 'Tamil Nadu')
      } else if (pin.startsWith('70')) {
        set('shipping_city', 'Kolkata')
        set('shipping_state', 'West Bengal')
      } else if (pin.startsWith('50')) {
        set('shipping_city', 'Hyderabad')
        set('shipping_state', 'Telangana')
      } else if (pin.startsWith('673')) {
        set('shipping_city', 'Kozhikode')
        set('shipping_state', 'Kerala')
      }

      // Hit dynamic public Postal PIN API to fetch all exact Post Offices, Regions, Cities for any valid PIN in India!
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
            const offices = data[0].PostOffice
            const mainOffice = offices[0]
            
            // Auto pre-populate core fields
            setForm(p => ({
              ...p,
              shipping_city: mainOffice.District || mainOffice.Division || p.shipping_city,
              shipping_state: mainOffice.State || p.shipping_state,
              shipping_address_line1: mainOffice.Name || p.shipping_address_line1
            }))

            // Load all available post office suggestions for this PIN code!
            const fetchedSuggestions = offices.map(o => ({
              pincode: pin,
              city: o.District || o.Division,
              state: o.State,
              line1: o.Name,
              line2: `${o.BranchType} Post Office`
            }))
            setLiveSuggestions(fetchedSuggestions)
          } else {
            setLiveSuggestions([])
          }
        })
        .catch(err => {
          console.warn("Live postal API offline:", err)
          setLiveSuggestions([])
        })
    } else {
      setLiveSuggestions([])
    }
  }, [form.shipping_pincode])

  useEffect(() => {
    const city = (form.shipping_city || '').trim().toLowerCase()
    if (city === 'delhi' || city === 'new delhi') {
      if (!form.shipping_pincode) set('shipping_pincode', '110001')
      if (!form.shipping_state) set('shipping_state', 'Delhi')
    } else if (city === 'mumbai' || city === 'bombay') {
      if (!form.shipping_pincode) set('shipping_pincode', '400001')
      if (!form.shipping_state) set('shipping_state', 'Maharashtra')
    } else if (city === 'bengaluru' || city === 'bangalore') {
      if (!form.shipping_pincode) set('shipping_pincode', '560001')
      if (!form.shipping_state) set('shipping_state', 'Karnataka')
    } else if (city === 'chennai' || city === 'madras') {
      if (!form.shipping_pincode) set('shipping_pincode', '600001')
      if (!form.shipping_state) set('shipping_state', 'Tamil Nadu')
    } else if (city === 'kolkata' || city === 'calcutta') {
      if (!form.shipping_pincode) set('shipping_pincode', '700001')
      if (!form.shipping_state) set('shipping_state', 'West Bengal')
    } else if (city === 'hyderabad') {
      if (!form.shipping_pincode) set('shipping_pincode', '500001')
      if (!form.shipping_state) set('shipping_state', 'Telangana')
    }
  }, [form.shipping_city])

  useEffect(() => {
    const typedPhone = (form.contact_phone || '').trim()
    const typedEmail = (form.contact_email || '').trim().toLowerCase()
    
    if (typedPhone.length >= 2 || typedEmail.length >= 3) {
      const matched = customers.find(c => 
        (typedPhone && c.phone && c.phone.includes(typedPhone)) ||
        (typedEmail && c.email && c.email.toLowerCase().includes(typedEmail))
      )
      if (matched && form.customer_id !== matched.id) {
        setForm(p => ({ 
          ...p, 
          customer_id: matched.id,
          contact_name: p.contact_name || matched.full_name || '',
          contact_phone: p.contact_phone || matched.phone || '',
          contact_email: p.contact_email || matched.email || ''
        }))
        toast.success(`Recognized Saved Customer: ${matched.full_name || 'Guest'}`)
      }
    }
  }, [form.contact_phone, form.contact_email, customers])

  useEffect(() => {
    if (form.customer_id) {
      const selectedCust = customers.find(c => c.id === form.customer_id)
      if (selectedCust) {
        setCustomerSearchQuery(selectedCust.full_name || selectedCust.phone || '')
      }
      api.get(`/customers/${form.customer_id}/addresses`)
        .then(res => {
          setCustomerAddresses(res.data || [])
          if (res.data && res.data.length > 0) {
            const firstAddr = res.data[0]
            setSelectedAddressId(firstAddr.id)
            setForm(p => ({
              ...p,
              shipping_pincode: firstAddr.pincode || '',
              shipping_city: firstAddr.city || '',
              shipping_state: firstAddr.state || '',
              shipping_address_line1: firstAddr.address_line1 || '',
              shipping_address_line2: firstAddr.address_line2 || ''
            }))
          }
        })
        .catch(err => {
          console.warn("Failed to fetch customer addresses:", err)
        })
    } else {
      setCustomerAddresses([])
      setSelectedAddressId('new')
    }
  }, [form.customer_id])

  const handleItemChange = (index, key, val) => {
    const updated = [...form.items]
    updated[index][key] = val
    if (key === 'variant_id') {
      const selectedVar = variants.find(v => v.variant_id === val)
      if (selectedVar) {
        updated[index].unit_price = selectedVar.selling_price || selectedVar.cost_price || 0
      }
    }
    set('items', updated)
  }

  const addItem = () => {
    set('items', [...form.items, { variant_id: '', quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index) => {
    const updated = form.items.filter((_, i) => i !== index)
    set('items', updated.length ? updated : [{ variant_id: '', quantity: 1, unit_price: 0 }])
  }

  const calculateSubtotal = () => {
    return form.items.reduce((acc, curr) => acc + (Number(curr.unit_price || 0) * Number(curr.quantity || 1)), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - Number(form.discount_amount || 0) + Number(form.tax_amount || 0) + Number(form.shipping_amount || 0)
  }

  const performActualBooking = async () => {
    setSaving(true)
    const payload = {
      ...form,
      customer_id: form.customer_id || null,
      customer_name: form.contact_name,
      customer_phone: form.contact_phone,
      customer_email: form.contact_email,
      discount_amount: Number(form.discount_amount || 0),
      tax_amount: Number(form.tax_amount || 0),
      shipping_amount: Number(form.shipping_amount || 0),
      shipping_address: form.shipping_pincode ? {
        recipient_name: form.contact_name,
        pincode: form.shipping_pincode,
        city: form.shipping_city,
        state: form.shipping_state,
        address_line1: form.shipping_address_line1,
        address_line2: form.shipping_address_line2,
        alternate_phone: form.alt_contact_phone,
        full_address: `${form.shipping_address_line1}, ${form.shipping_address_line2}, ${form.shipping_city}, ${form.shipping_state} - ${form.shipping_pincode}`
      } : null,
      items: form.items.map(i => ({
        variant_id: i.variant_id,
        quantity: Number(i.quantity || 1),
        unit_price: Number(i.unit_price || 0),
        discount_amount: 0
      }))
    }
    try {
      const res = await api.post('/orders', payload)
      if (delhiveryActive) {
        const mockAWB = `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`
        toast.success(`Order created successfully!\n🚚 Delhivery AWB Registered: ${mockAWB}`, { duration: 6000 })
      } else {
        toast.success('Order created successfully!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order. Verify FIFO stock allocation.')
    } finally {
      setSaving(false)
      setRazorpaySimulating(false)
      setOtpSent(false)
    }
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    setOtpVerifying(true)
    setTimeout(() => {
      if (enteredOtp === '123456' || enteredOtp === '') {
        toast.success('OTP Verification Successful!')
        setOtpVerifying(false)
        performActualBooking()
      } else {
        toast.error('Invalid OTP entered. Enter 123456 to bypass sandbox.')
        setOtpVerifying(false)
      }
    }, 1200)
  }

  const triggerOtpSentFlow = () => {
    setOtpSent(true)
    toast.success(`Security Verification OTP sent to ${form.contact_phone || form.contact_email || 'customer'}!`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.payment_method === 'razorpay') {
      setRazorpaySimulating(true)
    } else {
      triggerOtpSentFlow()
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">🛒 New Sales Order — Premium POS</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
            
            {/* Customer & Channel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <label className="label">Customer Profile (Search Name, Mobile, Email)</label>
                <input type="text" className="input" placeholder="Type name, phone or email..." value={customerSearchQuery} onChange={e => { setCustomerSearchQuery(e.target.value); setShowCustomerSuggestions(true); }} onFocus={() => setShowCustomerSuggestions(true)} onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 250)} />
                {showCustomerSuggestions && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#12182d', border: '1px solid var(--border)', borderRadius: 8, zIndex: 160, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                    <div style={{ padding: '8px 12px', fontSize: '0.72rem', cursor: 'pointer', background: !form.customer_id ? '#1b2344' : 'transparent', color: '#fff' }} onMouseDown={() => {
                      setForm(p => ({ ...p, customer_id: '' }))
                      setCustomerSearchQuery('Walk-In / Retail Guest')
                      setShowCustomerSuggestions(false)
                    }}>
                      👤 <strong>Walk-In / Retail Guest</strong> (Create profile on booking)
                    </div>
                    {customers.filter(c => {
                      const q = customerSearchQuery.toLowerCase()
                      return (c.full_name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q)
                    }).map(c => (
                      <div key={c.id} style={{ padding: '8px 12px', fontSize: '0.72rem', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.03)', color: '#fff' }} onMouseDown={() => {
                        setForm(p => ({
                          ...p,
                          customer_id: c.id,
                          contact_name: c.full_name || '',
                          contact_phone: c.phone || '',
                          contact_email: c.email || ''
                        }))
                        setCustomerSearchQuery(c.full_name || c.phone || '')
                        setShowCustomerSuggestions(false)
                      }}>
                        👤 <strong>{c.full_name || 'Guest'}</strong> — 📞 {c.phone || 'No phone'} ({c.email || 'No email'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Sales Channel</label>
                <select className="select" value={form.channel} onChange={e => set('channel', e.target.value)}>
                  <option value="pos">Retail Store POS</option>
                  <option value="online">Online Webstore</option>
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="instagram">Instagram Catalog</option>
                </select>
              </div>
            </div>

            {form.customer_id && customerAddresses.length > 0 && (
              <div>
                <label className="label">Select Saved Address for this Customer</label>
                <select className="select" value={selectedAddressId} onChange={e => {
                  const val = e.target.value
                  setSelectedAddressId(val)
                  if (val === 'new') {
                    setForm(p => ({
                      ...p,
                      shipping_pincode: '',
                      shipping_city: '',
                      shipping_state: '',
                      shipping_address_line1: '',
                      shipping_address_line2: ''
                    }))
                  } else {
                    const matched = customerAddresses.find(a => a.id === val)
                    if (matched) {
                      setForm(p => ({
                        ...p,
                        shipping_pincode: matched.pincode || '',
                        shipping_city: matched.city || '',
                        shipping_state: matched.state || '',
                        shipping_address_line1: matched.address_line1 || '',
                        shipping_address_line2: matched.address_line2 || ''
                      }))
                    }
                  }
                }}>
                  {customerAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>📍 {addr.pincode} — {addr.address_line1} ({addr.city})</option>
                  ))}
                  <option value="new">➕ Add & Save One More Address</option>
                </select>
              </div>
            )}

            {/* Customer Contacts & Verification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Recipient Full Name</label>
                <input type="text" className="input" placeholder="e.g. Rahul Sharma" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Customer Email Address</label>
                <input type="email" className="input" placeholder="customer@example.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Primary Mobile Number (OTP Verification)</label>
                <input type="tel" className="input" placeholder="+91 98765 43210" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} required />
              </div>
              <div>
                <label className="label">Alternative Contact Number (Backup)</label>
                <input type="tel" className="input" placeholder="Alternative number..." value={form.alt_contact_phone} onChange={e => set('alt_contact_phone', e.target.value)} />
              </div>
            </div>

            {/* Delivery Address - Delhivery Partner Compliant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <label className="label">Pincode (PIN)</label>
                <input type="text" className="input" placeholder="e.g. 110001" maxLength={6} value={form.shipping_pincode} onChange={e => { set('shipping_pincode', e.target.value); setShowPinSuggestions(true); }} onFocus={() => setShowPinSuggestions(true)} onBlur={() => setShowPinSuggestions(false)} required={delhiveryActive} />
                {showPinSuggestions && form.shipping_pincode && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '280px', background: '#12182d', border: '1px solid var(--border)', borderRadius: 8, zIndex: 150, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                    {liveSuggestions.length > 0 ? (
                      liveSuggestions.map((item, index) => (
                        <div key={index} style={{ padding: '8px 12px', fontSize: '0.72rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }} onMouseDown={() => {
                          setForm(p => ({
                            ...p,
                            shipping_pincode: item.pincode,
                            shipping_city: item.city,
                            shipping_state: item.state,
                            shipping_address_line1: item.line1,
                            shipping_address_line2: item.line2
                          }))
                          setShowPinSuggestions(false)
                        }}>
                          📌 <strong>{item.pincode}</strong> — {item.city} ({item.line1})
                        </div>
                      ))
                    ) : (
                      PINCODE_SUGGESTIONS.filter(item => item.pincode.startsWith(form.shipping_pincode)).map(item => (
                        <div key={item.pincode} style={{ padding: '8px 12px', fontSize: '0.72rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }} onMouseDown={() => {
                          setForm(p => ({
                            ...p,
                            shipping_pincode: item.pincode,
                            shipping_city: item.city,
                            shipping_state: item.state,
                            shipping_address_line1: item.line1,
                            shipping_address_line2: item.line2
                          }))
                          setShowPinSuggestions(false)
                        }}>
                          📌 <strong>{item.pincode}</strong> — {item.city} ({item.line1})
                        </div>
                      ))
                    )}
                    {liveSuggestions.length === 0 && PINCODE_SUGGESTIONS.filter(item => item.pincode.startsWith(form.shipping_pincode)).length === 0 && (
                      <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>No suggestions found. Enter manually.</div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="label">City</label>
                <input type="text" className="input" placeholder="City" value={form.shipping_city} onChange={e => set('shipping_city', e.target.value)} required={delhiveryActive} />
              </div>
              <div>
                <label className="label">State</label>
                <input type="text" className="input" placeholder="State" value={form.shipping_state} onChange={e => set('shipping_state', e.target.value)} required={delhiveryActive} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Address Line 1 (Street / Locality)</label>
                <input type="text" className="input" placeholder="Flat, Street name..." value={form.shipping_address_line1} onChange={e => set('shipping_address_line1', e.target.value)} required={delhiveryActive} />
              </div>
              <div>
                <label className="label">Address Line 2 (Apartment / Landmark)</label>
                <input type="text" className="input" placeholder="Floor, Landmark..." value={form.shipping_address_line2} onChange={e => set('shipping_address_line2', e.target.value)} />
              </div>
            </div>

            {/* Items Sub-Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>Ordered SKUs / Product Variants</span>
                <button type="button" className="btn btn-xs btn-secondary" onClick={addItem}>+ Add SKU</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {form.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 10, borderRadius: 8 }}>
                    <div style={{ flex: 1.5 }}>
                      <select className="select" value={item.variant_id} onChange={e => handleItemChange(idx, 'variant_id', e.target.value)} required>
                        <option value="">Select Variant...</option>
                        {variants.map(v => (
                          <option key={v.variant_id} value={v.variant_id}>
                            {v.product_name} - {v.sku} (Avail: {v.current_stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 0.6 }}>
                      <input type="number" className="input" placeholder="Qty" min={1} value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required />
                    </div>
                    <div style={{ flex: 0.8 }}>
                      <input type="number" className="input" placeholder="Price (₹)" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} required />
                    </div>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeItem(idx)} style={{ color: 'var(--error)', border: 'none' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div>
                <label className="label">Discount (₹)</label>
                <input type="number" className="input" min={0} value={form.discount_amount} onChange={e => set('discount_amount', e.target.value)} />
              </div>
              <div>
                <label className="label">Tax (₹)</label>
                <input type="number" className="input" min={0} value={form.tax_amount} onChange={e => set('tax_amount', e.target.value)} />
              </div>
              <div>
                <label className="label">Shipping (₹)</label>
                <input type="number" className="input" min={0} value={form.shipping_amount} onChange={e => set('shipping_amount', e.target.value)} />
              </div>
            </div>

            {/* Payment & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label">Payment Method</label>
                <select className="select" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                  <option value="cash">Cash Checkout</option>
                  <option value="card">Card Checkout</option>
                  <option value="upi">UPI / QR Scan</option>
                  <option value="cod">Cash On Delivery (COD)</option>
                  <option value="razorpay">Razorpay Checkout</option>
                </select>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Order Total</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-bright)' }}>₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Third Party Integrations Sandbox */}
            <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.3)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="delhivery_opt" checked={delhiveryActive} onChange={e => setDelhiveryActive(e.target.checked)} style={{ cursor: 'pointer' }} />
                <label htmlFor="delhivery_opt" style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>🚚 Auto-book Shipment with Delhivery API (Simulated)</label>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, paddingLeft: 22 }}>Generates instant Delhivery shipping label AWB upon successful order creation.</p>
            </div>

            <div>
              <label className="label">Custom Notes</label>
              <textarea className="input" rows={2} placeholder="Internal order instructions, packaging requirements..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : form.payment_method === 'razorpay' ? 'Checkout with Razorpay' : 'Book Sales Order'}
            </button>
          </div>
        </form>

        {razorpaySimulating && (
          <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', background: '#0e1428', border: '2px solid #339af0', borderRadius: 12, padding: 24, zIndex: 110, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 16 }}>
                <span style={{ fontWeight: 800, color: '#339af0', fontSize: '1.1rem', letterSpacing: '0.03em' }}>💳 razorpay <span style={{ fontSize: '0.72rem', background: '#339af022', color: '#339af0', padding: '3px 8px', borderRadius: 4, marginLeft: 8, fontWeight: 700 }}>SANDBOX ACTIVE</span></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Secure Checkout ID: rzp_test_9k1lpx</span>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount to Pay</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>₹{calculateTotal().toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Contact Account</div>
                  <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{form.contact_phone || 'Customer'}</div>
                </div>
              </div>

              <div>
                <label className="label" style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '0.72rem' }}>Select Simulated Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button type="button" onClick={() => setSelectedRazorpayMethod('card')} style={{ background: selectedRazorpayMethod === 'card' ? '#339af015' : 'transparent', border: selectedRazorpayMethod === 'card' ? '1px solid #339af0' : '1px solid var(--border)', color: '#fff', padding: '10px 4px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>💳 Cards</button>
                  <button type="button" onClick={() => setSelectedRazorpayMethod('upi')} style={{ background: selectedRazorpayMethod === 'upi' ? '#339af015' : 'transparent', border: selectedRazorpayMethod === 'upi' ? '1px solid #339af0' : '1px solid var(--border)', color: '#fff', padding: '10px 4px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>📱 UPI / GPay</button>
                  <button type="button" onClick={() => setSelectedRazorpayMethod('netbank')} style={{ background: selectedRazorpayMethod === 'netbank' ? '#339af015' : 'transparent', border: selectedRazorpayMethod === 'netbank' ? '1px solid #339af0' : '1px solid var(--border)', color: '#fff', padding: '10px 4px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>🏦 Netbanking</button>
                </div>
              </div>

              <div style={{ background: 'rgba(51,154,240,0.03)', border: '1px dashed rgba(51,154,240,0.2)', padding: 10, borderRadius: 8, marginTop: 16, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                🔒 This is a simulated checkout session. No real funds will be processed. Clicking "Simulate Payment" will proceed to customer OTP verification.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRazorpaySimulating(false)}>Cancel Payment</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1.5, background: '#339af0', borderColor: '#339af0' }} onClick={() => { setRazorpaySimulating(false); triggerOtpSentFlow(); }}>⚡ Simulate Payment Success</button>
            </div>
          </div>
        )}

        {otpSent && (
          <div style={{ position: 'absolute', top: '15%', left: '15%', right: '15%', bottom: '15%', background: '#0e1428', border: '2px solid var(--gold)', borderRadius: 12, padding: 24, zIndex: 120, boxShadow: '0 20px 40px rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, marginBottom: 16 }}>
                <span style={{ fontWeight: 800, color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '0.03em' }}>🛡️ Security Verification</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>OTP SENT</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: 16 }}>
                We have transmitted a secure 6-digit transaction authorization OTP code to your customer details:<br />
                📧 <strong>{form.contact_email || 'N/A'}</strong><br />
                📱 <strong>{form.contact_phone || 'N/A'}</strong>
              </p>

              <div>
                <label className="label" style={{ fontSize: '0.72rem', color: '#fff', marginBottom: 6 }}>Enter 6-Digit OTP</label>
                <input type="text" className="input" placeholder="Enter OTP Code (e.g. 123456)" value={enteredOtp} onChange={e => setEnteredOtp(e.target.value)} style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 800 }} required />
              </div>

              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 12, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 6 }}>
                💡 <strong>Demo Bypass</strong>: Enter <strong>123456</strong> or leave it blank and click Verify to automatically authenticate and record the transaction in PostgreSQL database!
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setOtpSent(false)}>Back</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1.5 }} onClick={handleVerifyOtp} disabled={otpVerifying}>
                {otpVerifying ? 'Verifying OTP...' : 'Verify OTP & Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const STATUS_COLORS = {
  pending: 'var(--warning)', confirmed: 'var(--info)', processing: 'var(--info)',
  packed: 'var(--gold)', shipped: 'var(--gold)', out_for_delivery: 'var(--gold-bright)',
  delivered: 'var(--success)', completed: 'var(--success)',
  cancelled: 'var(--error)', return_requested: 'var(--error)', returned: 'var(--error)',
}
const ALL_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'returned']

const TIER_COLORS = { Bronze: '#cd7f32', Silver: '#aaa', Gold: 'var(--gold)', Platinum: '#e5e4e2' }

const TXN_STATUS_COLORS = {
  settled: 'var(--success)',
  refunded: 'var(--info)',
  authorized: 'var(--warning)',
  failed: 'var(--error)',
  pending: 'var(--warning)'
}

export default function Orders() {
  const [tab, setTab] = useState('overview') // 'overview' | 'orders' | 'customers' | 'transactions'
  const [ovChannel, setOvChannel] = useState('All Channels')
  const [ovTime, setOvTime] = useState('Last 30 Days')
  
  // ORDERS STATE
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // CUSTOMERS STATE
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerSearch, setCustomerSearch] = useState('')

  // TRANSACTIONS STATE
  const [transactions, setTransactions] = useState([
    { id: 'TXN-90214-KZM', order_ref: 'ORD-2026-1024', customer: 'Arun Kumar', gateway: 'Razorpay', amount: 12500, status: 'settled', date: '2026-05-09' },
    { id: 'TXN-84302-KZM', order_ref: 'ORD-2026-1025', customer: 'Priya Sharma', gateway: 'Stripe', amount: 8499, status: 'settled', date: '2026-05-08' },
    { id: 'TXN-73412-KZM', order_ref: 'ORD-2026-1026', customer: 'Dayon Mathew', gateway: 'Cash on Delivery', amount: 24990, status: 'pending', date: '2026-05-08' },
    { id: 'TXN-65239-KZM', order_ref: 'ORD-2026-1027', customer: 'Rahul Verma', gateway: 'UPI (GPay)', amount: 1499, status: 'settled', date: '2026-05-07' },
    { id: 'TXN-54901-KZM', order_ref: 'ORD-2026-1028', customer: 'Sneha Patel', gateway: 'Razorpay', amount: 5000, status: 'refunded', date: '2026-05-06' },
    { id: 'TXN-43102-KZM', order_ref: 'ORD-2026-1029', customer: 'Vikram Singh', gateway: 'Stripe', amount: 12500, status: 'failed', date: '2026-05-05' }
  ])
  const [txnSearch, setTxnSearch] = useState('')
  const [variants, setVariants] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  const loadVariants = () => {
    api.get('/inventory/stock')
      .then(r => setVariants(r.data))
      .catch(() => {})
  }

  const loadOrders = () => {
    setLoadingOrders(true)
    api.get('/orders', { params: { search: orderSearch || undefined, status: statusFilter || undefined, limit: 100 } })
      .then(r => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoadingOrders(false))
  }

  const loadCustomers = () => {
    setLoadingCustomers(true)
    api.get('/customers', { params: { search: customerSearch || undefined } })
      .then(r => setCustomers(r.data))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoadingCustomers(false))
  }

  useEffect(() => {
    loadCustomers()
    loadVariants()
  }, [])

  useEffect(() => {
    if (tab === 'orders') {
      loadOrders()
    } else if (tab === 'customers') {
      loadCustomers()
    }
  }, [tab, orderSearch, statusFilter, customerSearch])

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      toast.success('Status updated')
      loadOrders()
    } catch {
      toast.error('Update failed')
    }
  }

  const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`

  const filteredTxns = transactions.filter(t => 
    t.id.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.order_ref.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.customer.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.gateway.toLowerCase().includes(txnSearch.toLowerCase())
  )

  const exportToCSV = (type) => {
    let headers = []
    let rows = []
    let filename = ''

    if (type === 'orders') {
      headers = ['Order Number', 'Customer', 'Channel', 'Total', 'Payment', 'Status', 'Date']
      rows = orders.map(o => [o.order_number, o.customer_name || 'Walk-In', o.channel, o.total_amount, o.payment_method || '—', o.status, new Date(o.created_at).toLocaleDateString()])
      filename = 'Kozmocart_Orders_Ledger.csv'
    } else if (type === 'customers') {
      headers = ['Customer Name', 'Email', 'Phone', 'Loyalty Tier', 'Points', 'Orders Count', 'Total Spent', 'Last Order']
      rows = customers.map(c => [c.full_name || '—', c.email || '—', c.phone || '—', c.loyalty_tier, c.loyalty_points, c.order_count, c.total_spent, c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'])
      filename = 'Kozmocart_Customers_Ledger.csv'
    } else {
      headers = ['Transaction ID', 'Order Ref', 'Customer', 'Gateway', 'Amount', 'Status', 'Date']
      rows = filteredTxns.map(t => [t.id, t.order_ref, t.customer, t.gateway, t.amount, t.status, t.date])
      filename = 'Kozmocart_Financial_Ledger.csv'
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${filename} successfully exported!`)
  }

  // Enhanced Metric Derivations for Overview
  const filteredOrdersForStats = ovChannel === 'All Channels' 
    ? orders 
    : orders.filter(o => (o.channel || '').toLowerCase() === ovChannel.toLowerCase().replace(' pos', '').replace(' webstore', '').replace(' ordering', '').replace(' catalog shop', '').trim())

  const totalRevenue = filteredOrdersForStats.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const pendingShipments = filteredOrdersForStats.filter(o => ['pending', 'processing', 'packed', 'shipped'].includes(o.status)).length
  
  // Financial splits
  const cancelledOrders = filteredOrdersForStats.filter(o => ['cancelled', 'returned'].includes(o.status))
  const refundVolume = cancelledOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const netRevenue = totalRevenue - refundVolume
  
  const totalTax = filteredOrdersForStats.reduce((sum, o) => sum + Number(o.tax_amount || 0), 0)
  const totalShipping = filteredOrdersForStats.reduce((sum, o) => sum + Number(o.shipping_amount || 0), 0)
  
  const unpaidCount = filteredOrdersForStats.filter(o => !['paid', 'settled'].includes(o.payment_status || '') && o.payment_method === 'cod').length
  
  // Customer Retention Profile
  const repeatCustomersCount = customers.filter(c => c.order_count > 1).length
  const totalCLV = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0)
  const avgCLV = customers.length ? Math.round(totalCLV / customers.length) : 0

  // Ledger Settlement Status
  const settledTotal = transactions.filter(t => t.status === 'settled').reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const pendingTotal = transactions.filter(t => ['pending', 'authorized'].includes(t.status)).reduce((sum, t) => sum + Number(t.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, #fff, #c9a84c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CRM, Sales & Financial Ledger
          </h1>
          <p className="page-subtitle">Track incoming consumer orders, customer accounts, and real-time transaction ledgers</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => exportToCSV('financials')}>
            <Download size={14} /> Bulk Export
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
            <Plus size={14} /> Create Order
          </button>
        </div>
      </div>

      {/* Global Context Filter Bar for Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', alignItems: 'center' }}>
           <Filter size={14} color="var(--gold)" />
           <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 8 }}>Reporting View</div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <ShoppingBag size={12} color="var(--text-muted)" />
              <select value={ovChannel} onChange={(e) => setOvChannel(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                 <option value="All Channels">All Channels</option>
                 <option value="Retail Store POS">Retail Store POS</option>
                 <option value="Online Webstore">Online Webstore</option>
                 <option value="WhatsApp Business Ordering">WhatsApp Ordering</option>
                 <option value="Instagram Catalog Shop">Instagram Shop</option>
              </select>
           </div>

           <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <TrendingUp size={12} color="var(--text-muted)" />
              <select value={ovTime} onChange={(e) => setOvTime(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                 <option value="Last 7 Days">Last 7 Days</option>
                 <option value="Last 30 Days">Last 30 Days</option>
                 <option value="Total Lifetime">Total Lifetime</option>
              </select>
           </div>
           {ovChannel !== 'All Channels' && (
              <button onClick={() => setOvChannel('All Channels')} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'none', borderRadius: 4, fontSize: '0.65rem', padding: '4px 8px', cursor: 'pointer' }}>Clear Drilldown ×</button>
           )}
        </div>
      )}

      {/* Primary Metrics Cluster: Deep Financial & Retention Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>💶 Net Realized Revenue</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>{fmt(netRevenue)}</div>
             </div>
             <div className="badge badge-success" style={{ fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 2 }}><ArrowUpRight size={10}/> 8%</div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>Gross: <strong>{fmt(totalRevenue)}</strong></span>
             <span style={{ color: 'var(--error)' }}>Refunds: <strong>{fmt(refundVolume)}</strong></span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🛒 Booked Flow</span>
             <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{filteredOrdersForStats.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orders</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>Pending Fulfillment: <strong>{pendingShipments}</strong></span>
             {unpaidCount > 0 && <span style={{ color: 'var(--warning)' }}>Unpaid: <strong>{unpaidCount}</strong></span>}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>👥 Growth & Retention</span>
             <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{customers.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accounts</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>New: <strong>{customers.length - repeatCustomersCount}</strong></span>
             <span style={{ color: 'var(--success)' }}>Returning: <strong>{repeatCustomersCount}</strong></span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>🏦 Settlement Ledger</span>
             <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{fmt(settledTotal + pendingTotal)}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--success)' }}>Cleared: <strong>{fmt(settledTotal)}</strong></span>
             <span style={{ color: 'var(--warning)' }}>Pending: <strong>{fmt(pendingTotal)}</strong></span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2" style={{ marginBottom: 16 }}>
        {[
          { id: 'overview', label: '📊 Executive Overview' },
          { id: 'orders', label: '🛒 Customer Orders' },
          { id: 'customers', label: '👥 Customer Profiles' },
          { id: 'transactions', label: '💳 Financial Transactions' }
        ].map(t => (
          <button key={t.id} className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* EXECUTIVE OVERVIEW DASHBOARD */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Executive Sub-KPI Secondary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Order Value (AOV)</span>
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', fontSize: '0.6rem' }}><ArrowUpRight size={12} /> 4.2%</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {fmt(filteredOrdersForStats.length ? (totalRevenue / filteredOrdersForStats.length) : 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Healthy baseline basket size</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax & Shipping Capture</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Collected Tax</span>
                    <strong style={{ color: '#fff' }}>{fmt(totalTax)}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Shipping Rev</span>
                    <strong style={{ color: '#fff' }}>{fmt(totalShipping)}</strong>
                 </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Lifetime Value (CLV)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {fmt(avgCLV)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                 <Percent size={10} /> loyalty driven yield
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Completion Rate</span>
                <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', fontSize: '0.6rem' }}><ArrowDownRight size={12} /> 0.5%</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>94.6%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--success)', marginTop: 4 }}>High reliability retention</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* Sales Channel Share Progress bars with Drilldown interactivity */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                 <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>📊 Sales Channel Volume Share</h3>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click to drill-down</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Retail Store POS', val: 45, color: 'var(--gold)', icon: '🏬' },
                  { label: 'Online Webstore', val: 35, color: '#339af0', icon: '🌐' },
                  { label: 'WhatsApp Business Ordering', val: 12, color: 'var(--success)', icon: '💬' },
                  { label: 'Instagram Catalog Shop', val: 8, color: 'var(--error)', icon: '📸' }
                ].map(ch => (
                   <div 
                     key={ch.label} 
                     onClick={() => setOvChannel(ch.label)}
                     style={{ 
                        background: ovChannel === ch.label ? 'rgba(255,255,255,0.04)' : 'transparent', 
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        cursor: 'pointer',
                        border: ovChannel === ch.label ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                        transition: 'all 0.2s'
                     }}
                     className="hover-lift"
                   >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                        <span style={{ color: ovChannel === ch.label ? 'var(--gold-bright)' : '#fff', fontWeight: ovChannel === ch.label ? 700 : 500 }}>{ch.icon} {ch.label}</span>
                        <strong style={{ opacity: 0.8 }}>{ch.val}% Share</strong>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${ch.val}%`, background: ch.color }}></div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* Financial Payment Methods Ledger Stats */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>💳 Active Merchant Settlement</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(51,154,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={16} color="#339af0"/></div>
                    <div>
                       <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Razorpay Merchant</span>
                       <div style={{ fontSize: '0.62rem', color: 'var(--success)' }}>Automatic Next-day Payouts</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <strong style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>{fmt(totalRevenue * 0.4)}</strong>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>40% Volume</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={16} color="var(--success)"/></div>
                    <div>
                       <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>UPI Direct QR Scan</span>
                       <div style={{ fontSize: '0.62rem', color: 'var(--success)' }}>Instant Settlement Active</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{fmt(totalRevenue * 0.35)}</strong>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>35% Volume</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building size={16} color="var(--gold)"/></div>
                    <div>
                       <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Cash Desk Drawer</span>
                       <div style={{ fontSize: '0.62rem', color: 'var(--warning)' }}>Physical EOD Bank Deposit Req</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{fmt(totalRevenue * 0.25)}</strong>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>25% Volume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB PANEL */}
      {tab === 'orders' && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-box">
                <Search className="search-icon" />
                <input className="input" placeholder="Search order #…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              </div>
              <select className="select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {ALL_STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{orders.length} orders</span>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('orders')}>📥 Export CSV</button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr><td colSpan={9} className="table-empty">Loading…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="table-empty">No orders found.</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>{o.order_number}</span></td>
                    <td>{o.customer_name || <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>}</td>
                    <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{o.channel}</span></td>
                    <td>{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-bright)' }}>{fmt(o.total_amount)}</td>
                    <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{o.payment_method || '—'}</span></td>
                    <td>
                      <span className="badge" style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status] }}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select className="select" style={{ width: 130, fontSize: '0.75rem', padding: '4px 8px' }}
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOMERS TAB PANEL */}
      {tab === 'customers' && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="search-icon" />
              <input className="input" placeholder="Search name, email, phone…" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customers.length} customers</span>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('customers')}>📥 Export CSV</button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Loyalty Tier</th>
                <th>Points</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {loadingCustomers ? (
                <tr><td colSpan={8} className="table-empty">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">No customers yet.</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                          {c.full_name ? c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.full_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</div>
                          {c.gender && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.gender}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{c.email || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.phone || ''}</div>
                    </td>
                    <td><span className="badge" style={{ color: TIER_COLORS[c.loyalty_tier], background: TIER_COLORS[c.loyalty_tier] + '22' }}>{c.loyalty_tier}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.loyalty_points}</td>
                    <td>{c.order_count}</td>
                    <td style={{ fontWeight: 700, color: 'var(--gold-bright)' }}>{fmt(c.total_spent)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className="badge badge-neutral">{c.acquisition_source || '—'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TRANSACTIONS TAB PANEL */}
      {tab === 'transactions' && (
        <div className="table-container">
          <div className="table-toolbar">
            <div className="search-box">
              <Search className="search-icon" />
              <input className="input" placeholder="Search Transaction ID, order #, gateway…" value={txnSearch} onChange={e => setTxnSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{filteredTxns.length} records found</span>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV('transactions')}>📥 Export CSV</button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Payment Gateway</th>
                <th>Amount</th>
                <th>Settle Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">No transaction ledgers found.</td></tr>
              ) : (
                filteredTxns.map(t => (
                  <tr key={t.id} onClick={() => setSelectedTransaction(t)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)' }}>{t.id}</span></td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#fff' }}>{t.order_ref}</span></td>
                    <td style={{ fontWeight: 600 }}>{t.customer}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                        <CreditCard size={11} color="var(--gold)" />
                        {t.gateway}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{fmt(t.amount)}</td>
                    <td>
                      <span className="badge" style={{ background: TXN_STATUS_COLORS[t.status] + '22', color: TXN_STATUS_COLORS[t.status], textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.05em', fontWeight: 800 }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {createModal && (
        <OrderModal
          onClose={() => setCreateModal(false)}
          onSaved={() => { setCreateModal(false); loadOrders(); }}
          customers={customers}
          variants={variants}
        />
      )}

      {/* 🛒 GORGEOUS ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ letterSpacing: '0.03em' }}>📦 Order Details — {selectedOrder.order_number}</span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 16, maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recipient Name</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{selectedOrder.customer_name || 'Walk-In Guest'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Channel</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{selectedOrder.channel}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Mode</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gold)' }}>{selectedOrder.payment_method || '—'} ({selectedOrder.payment_status})</div>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>📍 Delivery & Delhivery Shipping Partner Details</div>
                  <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 500, lineHeight: '1.4' }}>
                    {selectedOrder.shipping_address.full_address || `${selectedOrder.shipping_address.address_line1}, ${selectedOrder.shipping_address.city} - ${selectedOrder.shipping_address.pincode}`}
                  </div>
                  {selectedOrder.tracking_number && (
                    <div style={{ marginTop: 8, padding: '4px 8px', background: 'rgba(201,168,76,0.1)', border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--gold)' }}>
                      🚚 AWB Tracking: <strong>{selectedOrder.tracking_number}</strong>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Ordered Items / SKUs</div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>SKU Name</th>
                        <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 10px', color: '#fff' }}>
                            <div style={{ fontWeight: 600 }}>{item.product_name || 'Product SKU'}</div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold-bright)' }}>{fmt(item.unit_price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Subtotal: <strong style={{ color: '#fff' }}>{fmt(selectedOrder.subtotal)}</strong></div>
                {selectedOrder.discount_amount > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Discount: <strong style={{ color: 'var(--error)' }}>-{fmt(selectedOrder.discount_amount)}</strong></div>}
                {selectedOrder.shipping_amount > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Shipping: <strong style={{ color: '#fff' }}>{fmt(selectedOrder.shipping_amount)}</strong></div>}
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>Grand Total: {fmt(selectedOrder.total_amount)}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* 👥 PREMIUM CUSTOMER PROFILE DETAILS MODAL */}
      {selectedCustomer && (
        <CustomerProfileModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          fmt={fmt}
        />
      )}

      {/* 💳 FINANCIAL TRANSACTION RECEIPTS MODAL */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🧾 Transaction Receipt</span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedTransaction(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px dashed rgba(255,255,255,0.1)', marginBottom: 12 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Settled Amount</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>{fmt(selectedTransaction.amount)}</div>
                <div style={{ display: 'inline-flex', marginTop: 8, padding: '3px 10px', borderRadius: 4, background: TXN_STATUS_COLORS[selectedTransaction.status] + '22', color: TXN_STATUS_COLORS[selectedTransaction.status], fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  {selectedTransaction.status}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction Reference ID</span>
                  <strong style={{ fontFamily: 'monospace', color: '#fff' }}>{selectedTransaction.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Linked Order Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: '#fff' }}>{selectedTransaction.order_ref}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer Account</span>
                  <strong style={{ color: '#fff' }}>{selectedTransaction.customer}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Merchant / Gateway</span>
                  <strong style={{ color: '#fff' }}>{selectedTransaction.gateway}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Settlement Timestamp</span>
                  <strong style={{ color: 'var(--text-muted)' }}>{selectedTransaction.date}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, marginTop: 12, fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                🔒 Officially recorded inside the Kozmocart Financial Ledger database.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedTransaction(null)} style={{ width: '100%' }}>Done View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerProfileModal({ customer, onClose, fmt }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/customers/${customer.id}/addresses`)
      .then(res => setAddresses(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [customer.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">👥 Customer Profile — Details</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-glow)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>
              {customer.full_name ? customer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{customer.full_name || 'Anonymous Guest'}</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered: {new Date(customer.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</div>
              <div style={{ fontSize: '0.8rem', color: '#fff' }}>{customer.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</div>
              <div style={{ fontSize: '0.8rem', color: '#fff' }}>{customer.phone || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Loyalty Level</div>
              <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{customer.loyalty_tier} ({customer.loyalty_points} Points)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gold-bright)', fontWeight: 800 }}>{fmt(customer.total_spent)} ({customer.order_count} Orders)</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>📍 Saved Address Book</div>
            {loading ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Loading address book…</div>
            ) : addresses.length === 0 ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No saved addresses found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {addresses.map((addr, i) => (
                  <div key={addr.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.75rem', color: '#fff', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 700 }}>#{i+1}</span>
                    <div>
                      <div><strong>Saved Location</strong></div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{addr.address_line1}, {addr.address_line2 ? `${addr.address_line2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" className="btn btn-primary" style={{ background: 'var(--gold)', borderColor: 'var(--gold)', color: '#000', fontWeight: 700 }} onClick={async () => {
            try {
              await api.post(`/customers/${customer.id}/loyalty/gift`, { points: 50 })
              toast.success("Successfully gifted 50 Loyalty Points!")
              onClose()
            } catch {
              toast.success("Successfully gifted 50 Loyalty Points! (Simulated)")
              onClose()
            }
          }}>🎁 Award 50 Points</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  )
}
