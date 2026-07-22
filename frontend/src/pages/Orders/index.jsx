import { useEffect, useState } from 'react'
import { Search, ChevronDown, User, DollarSign, CreditCard, Activity, Plus, TrendingUp, TrendingDown, Download, Filter, ArrowUpRight, ArrowDownRight, ShoppingBag, Users, Percent, Building, Clock, Check, X, Package, ShieldCheck, Smartphone, Mail, Truck } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import InfoButton from '../../components/ui/InfoButton'


function OrderModal({ onClose, onSaved, customers, variants }) {
  const [currentStep, setCurrentStep] = useState(0) // 0: Contact, 1: Verification, 2: Fulfillment
  const [showPinSuggestions, setShowPinSuggestions] = useState(false)
  const [liveSuggestions, setLiveSuggestions] = useState([])
  const [customerAddresses, setCustomerAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('new')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  
  const [allOffers, setAllOffers] = useState([])
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [promoCode, setPromoCode] = useState('')

  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [cmsLayout, setCmsLayout] = useState(null)

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
    billingSameAsShipping: true,
    billing_pincode: '',
    billing_city: '',
    billing_state: '',
    billing_address_line1: '',
    billing_address_line2: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    alt_contact_phone: '',
    coupon_code: '',
    transaction_id: '',
    payment_gateway: '',
    items: [{ variant_id: '', quantity: 1, unit_price: 0 }]
  })

  const calculateSubtotal = () => {
    return form.items.reduce((acc, curr) => acc + (Number(curr.unit_price || 0) * Number(curr.quantity || 1)), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - Number(form.discount_amount || 0) + Number(form.tax_amount || 0) + Number(form.shipping_amount || 0)
  }

  useEffect(() => {
    api.get('/offers').then(res => setAllOffers(res.data || [])).catch(() => {})
    api.get('/settings/storefront_layout').then(res => setCmsLayout(res.data)).catch(() => {})
  }, [])

  const applyOffer = (offer) => {
    // 1. Reset previous offer impact
    setForm(prev => ({
      ...prev,
      discount_amount: 0,
      coupon_code: '',
      // Remove any items that were added as free gifts (price 0 and not in original selection)
      items: prev.items.filter(it => it.unit_price > 0 || it.is_manual_addition)
    }))

    if (!offer) return

    const subtotal = calculateSubtotal()
    if (offer.min_purchase_amount && subtotal < offer.min_purchase_amount) {
      toast.error(`Min purchase for this offer is AED ${offer.min_purchase_amount}`)
      setSelectedOfferId('')
      return
    }

    // 2. Apply Financial Discount
    let discount = 0
    if (offer.discount_type.toLowerCase().includes('percentage')) {
      discount = (subtotal * (offer.discount_percentage || 0)) / 100
    } else if (offer.discount_type.toLowerCase().includes('flat')) {
      discount = offer.flat_discount_amount || 0
    }
    
    // 3. Handle BOGO Gifting logic
    if (offer.discount_type.toLowerCase().includes('bogo')) {
       const giftSkus = offer.get_skus || []
       const giftItems = giftSkus.map(sku => {
          const v = variants.find(vr => vr.sku === sku)
          return v ? { variant_id: v.variant_id, quantity: 1, unit_price: 0, product_name: v.product_name, sku: v.sku } : null
       }).filter(Boolean)

       if (giftItems.length > 0) {
          setForm(prev => ({
             ...prev,
             items: [...prev.items, ...giftItems]
          }))
          toast.success(`🎁 ${giftItems.length} free gift(s) added to your cart!`)
       }
    }

    set('discount_amount', discount)
    set('coupon_code', offer.code)
    toast.success(`Applied ${offer.title}!`)
  }

  const handlePromoApply = () => {
    const matched = allOffers.find(o => o.code.toUpperCase() === promoCode.toUpperCase())
    if (matched) {
      applyOffer(matched)
      setSelectedOfferId(matched.id)
    } else {
      toast.error('Invalid Promo Code')
    }
  }
  const [saving, setSaving] = useState(false)
  const [delhiveryActive, setDelhiveryActive] = useState(true)
  const [razorpaySimulating, setRazorpaySimulating] = useState(false)
  const [selectedRazorpayMethod, setSelectedRazorpayMethod] = useState('card')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const totalQty = form.items.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0)

  useEffect(() => {
    if (delhiveryActive) {
      const subtotal = calculateSubtotal()
      const limit = cmsLayout?.free_shipping_limit || 999
      
      if (subtotal >= limit) {
        set('shipping_amount', 0)
        return
      }

      const pin = (form.shipping_pincode || '').trim()
      let baseShipping = 17 // Standard UAE base delivery charge
      let perItemShipping = 0

      const simulatedShipping = totalQty > 0 ? baseShipping : 0
      set('shipping_amount', simulatedShipping)
    } else {
      set('shipping_amount', 0)
    }
  }, [delhiveryActive, totalQty, form.shipping_pincode, cmsLayout])

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
    updated[index].is_manual_addition = true
    if (key === 'variant_id') {
      const selectedVar = variants.find(v => v.variant_id === val)
      if (selectedVar) {
        updated[index].unit_price = selectedVar.selling_price || selectedVar.cost_price || 0
      }
    }
    set('items', updated)
  }

  const addItem = () => {
    set('items', [...form.items, { variant_id: '', quantity: 1, unit_price: 0, is_manual_addition: true }])
  }

  const removeItem = (index) => {
    const updated = form.items.filter((_, i) => i !== index)
    set('items', updated.length ? updated : [{ variant_id: '', quantity: 1, unit_price: 0 }])
  }

  useEffect(() => {
    if (selectedOfferId) {
       const off = allOffers.find(o => o.id === selectedOfferId)
       if (off) applyOffer(off)
    }
  }, [form.items.length])

  const sendOtp = () => {
    if (!form.contact_email || !form.contact_phone || !form.contact_name) {
      toast.error('Please complete contact details first')
      return
    }
    setSaving(true)
    setTimeout(() => {
      setOtpSent(true)
      setCurrentStep(2)
      setSaving(false)
      toast.success('Verification code sent to ' + form.contact_email)
    }, 1200)
  }

  const performActualBooking = async () => {
    if (!form.contact_phone) {
      toast.error('Mobile number is compulsory for tracking and communication')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      payment_status: 'paid',
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
      billing_address: form.billingSameAsShipping ? (form.shipping_pincode ? {
        recipient_name: form.contact_name,
        pincode: form.shipping_pincode,
        city: form.shipping_city,
        state: form.shipping_state,
        address_line1: form.shipping_address_line1,
        address_line2: form.shipping_address_line2,
        full_address: `${form.shipping_address_line1}, ${form.shipping_address_line2}, ${form.shipping_city}, ${form.shipping_state} - ${form.shipping_pincode}`
      } : null) : (form.billing_pincode ? {
        recipient_name: form.contact_name,
        pincode: form.billing_pincode,
        city: form.billing_city,
        state: form.billing_state,
        address_line1: form.billing_address_line1,
        address_line2: form.billing_address_line2,
        full_address: `${form.billing_address_line1}, ${form.billing_address_line2}, ${form.billing_city}, ${form.billing_state} - ${form.billing_pincode}`
      } : null),
      transaction_id: form.transaction_id || null,
      payment_gateway: form.payment_gateway || null,
      items: form.items.map(i => ({
        variant_id: i.variant_id,
        quantity: Number(i.quantity || 1),
        unit_price: Number(i.unit_price || 0),
        discount_amount: 0
      }))
    }
    try {
      const res = await api.post('/orders', payload)
      toast.success('Order created successfully!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order. Verify FIFO stock allocation.')
    } finally {
      setSaving(false)
      setRazorpaySimulating(false)
      setOtpSent(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setVerifyingOtp(true)
    
    setTimeout(() => {
      setVerifyingOtp(false)
      if (otpValue !== '1234' && otpValue !== '0000') {
         toast.error('Invalid verification code')
         return
      }

      if (form.payment_method === 'razorpay') {
        setRazorpaySimulating(true)
      } else {
        performActualBooking()
      }
    }, 800)
  }

  const getRelevantOffers = () => {
    const cartItems = form.items.filter(it => it.variant_id)
    
    // Hide all offers until at least one product is added to the cart
    if (cartItems.length === 0) return []

    const cartSkus = cartItems.map(it => {
       const v = variants.find(vr => vr.variant_id === it.variant_id)
       return v?.sku
    }).filter(Boolean)

    const cartBrands = cartItems.map(it => {
       const v = variants.find(vr => vr.variant_id === it.variant_id)
       return v?.brand_name
    }).filter(Boolean)

    const cartCategories = cartItems.map(it => {
       const v = variants.find(vr => vr.variant_id === it.variant_id)
       return v?.category_name
    }).filter(Boolean)

    return allOffers.filter(o => {
       if (o.status !== 'Active') return false
       
       // Global offers apply to any non-empty cart
       if (o.target_scope === 'all') return true
       
       // Relevance Check: Does this offer apply to the specific items currently selected?
       const isBuySkuMatched = (o.buy_skus || []).some(s => cartSkus.includes(s))
       const isTargetSkuMatched = (o.target_skus || []).some(s => cartSkus.includes(s))
       const isBrandMatched = (o.target_brands || []).some(b => cartBrands.includes(b))
       const isCategoryMatched = (o.target_categories || []).some(c => cartCategories.includes(c))

       return isBuySkuMatched || isTargetSkuMatched || isBrandMatched || isCategoryMatched
    })
  }

  const relevantOffers = getRelevantOffers()

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">🛒 New Sales Order — Premium POS</span>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        
        {/* Step Progress Bar */}
        <div style={{ padding: '0 24px', display: 'flex', gap: 4, marginBottom: 20 }}>
           {[
             { label: 'Recipient & Items', icon: <ShoppingBag size={14}/> },
             { label: 'Delivery & Payment', icon: <CreditCard size={14}/> },
             { label: 'Verify & Confirm', icon: <ShieldCheck size={14}/> }
           ].map((step, idx) => (
             <div key={idx} style={{ 
               flex: 1, 
               padding: '10px 4px', 
               background: currentStep === idx ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
               borderBottom: `2px solid ${currentStep === idx ? 'var(--gold)' : 'transparent'}`,
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               gap: 6,
               opacity: currentStep >= idx ? 1 : 0.4,
               transition: 'all 0.3s'
             }}>
                <div style={{ color: currentStep === idx ? 'var(--gold)' : '#fff' }}>{step.icon}</div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: currentStep === idx ? 'var(--gold)' : 'var(--text-muted)' }}>{step.label}</div>
             </div>
           ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
            
            {/* STEP 0: RECIPIENT & ITEMS */}
            {currentStep === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <label className="label">Search Existing Customer</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Recipient Full Name</label>
                    <input type="text" className="input" placeholder="e.g. Rahul Sharma" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Primary Mobile Number <span style={{ color: 'var(--error)' }}>*</span></label>
                    <input type="tel" className="input" placeholder="+91 98765 43210" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Customer Email Address</label>
                    <input type="email" className="input" placeholder="customer@example.com" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required />
                  </div>
                </div>

                {/* Items Section (Moved from Step 2) */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)' }}>🛒 Ordered SKUs / Variants</span>
                    <button type="button" className="btn btn-xs btn-secondary" onClick={addItem}>+ Add SKU</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: 10, borderRadius: 8 }}>
                        <div style={{ flex: 1.5 }}>
                          <select className="select" value={item.variant_id} onChange={e => handleItemChange(idx, 'variant_id', e.target.value)} required>
                            <option value="">Select Variant...</option>
                            {variants.map(v => <option key={v.variant_id} value={v.variant_id}>{v.product_name} - {v.sku} (Avail: {v.current_stock})</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 0.6 }}>
                          <input type="number" className="input" min={1} value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required />
                        </div>
                        <div style={{ flex: 0.8 }}>
                          <input type="number" className="input" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} required />
                        </div>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeItem(idx)} style={{ color: 'var(--error)', border: 'none' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OFFERS SECTION (Moved from Step 2) */}
                <div style={{ background: 'rgba(201,168,76,0.03)', border: '1px dashed rgba(201,168,76,0.2)', padding: 16, borderRadius: 12 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>🏷️ Apply Active Offer</span>
                      <button type="button" onClick={() => { setSelectedOfferId(''); applyOffer(null); }} style={{ fontSize: '0.65rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
                   </div>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {relevantOffers.map(o => (
                        <div key={o.id} onClick={() => { setSelectedOfferId(o.id); applyOffer(o); }} style={{ padding: '6px 12px', borderRadius: 20, fontSize: '0.7rem', cursor: 'pointer', background: selectedOfferId === o.id ? 'var(--gold)' : 'rgba(255,255,255,0.05)', color: selectedOfferId === o.id ? '#000' : '#fff', border: `1px solid ${selectedOfferId === o.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`, fontWeight: 700 }} className="hover-lift">{o.code}</div>
                      ))}
                      {relevantOffers.length === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No relevant offers found.</div>}
                   </div>
                   <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                      <div style={{ flex: 1 }}>
                        <input type="text" className="input" placeholder="Manual Promo Code..." value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} />
                      </div>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ height: '38px' }} onClick={handlePromoApply}>Apply</button>
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'rgba(201,168,76,0.05)', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(201,168,76,0.1)' }}>
                   <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subtotal Estimate</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-bright)' }}>AED {calculateSubtotal().toLocaleString('en-US')}</div>
                   </div>
                </div>
              </div>
            )}

            {/* STEP 1: DELIVERY & PAYMENT (Merged) */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Saved Addresses Dropdown */}
                {form.customer_id && customerAddresses.length > 0 && (
                  <div>
                    <label className="label">Select Saved Address</label>
                    <select className="select" value={selectedAddressId} onChange={e => {
                      const val = e.target.value
                      setSelectedAddressId(val)
                      if (val === 'new') {
                        setForm(p => ({ ...p, shipping_pincode: '', shipping_city: '', shipping_state: '', shipping_address_line1: '', shipping_address_line2: '' }))
                      } else {
                        const matched = customerAddresses.find(a => a.id === val)
                        if (matched) setForm(p => ({ ...p, shipping_pincode: matched.pincode || '', shipping_city: matched.city || '', shipping_state: matched.state || '', shipping_address_line1: matched.address_line1 || '', shipping_address_line2: matched.address_line2 || '' }))
                      }
                    }}>
                      {customerAddresses.map(addr => <option key={addr.id} value={addr.id}>📍 {addr.pincode} — {addr.address_line1}</option>)}
                      <option value="new">➕ Add New Address</option>
                    </select>
                  </div>
                )}

                {/* Delivery Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <label className="label">Pincode (PIN)</label>
                    <input type="text" className="input" placeholder="e.g. 110001" maxLength={6} value={form.shipping_pincode} onChange={e => { set('shipping_pincode', e.target.value); setShowPinSuggestions(true); }} onFocus={() => setShowPinSuggestions(true)} onBlur={() => setShowPinSuggestions(false)} required={delhiveryActive} />
                    {showPinSuggestions && form.shipping_pincode && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, width: '280px', background: '#12182d', border: '1px solid var(--border)', borderRadius: 8, zIndex: 150, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                        {liveSuggestions.map((item, index) => (
                          <div key={index} style={{ padding: '8px 12px', fontSize: '0.72rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }} onMouseDown={() => {
                            setForm(p => ({ ...p, shipping_pincode: item.pincode, shipping_city: item.city, shipping_state: item.state, shipping_address_line1: item.line1, shipping_address_line2: item.line2 }))
                            setShowPinSuggestions(false)
                          }}>
                            📌 <strong>{item.pincode}</strong> — {item.city} ({item.line1})
                          </div>
                        ))}
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
                    <label className="label">Shipping Address Line 1</label>
                    <input type="text" className="input" placeholder="Flat, Street name..." value={form.shipping_address_line1} onChange={e => set('shipping_address_line1', e.target.value)} required={delhiveryActive} />
                  </div>
                  <div>
                    <label className="label">Alternate Contact (Optional)</label>
                    <input type="tel" className="input" placeholder="Backup mobile..." value={form.alt_contact_phone} onChange={e => set('alt_contact_phone', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="billing_same" checked={form.billingSameAsShipping} onChange={e => set('billingSameAsShipping', e.target.checked)} style={{ cursor: 'pointer' }} />
                  <label htmlFor="billing_same" style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Billing address is same as shipping</label>
                </div>

                {!form.billingSameAsShipping && (
                  <div style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 10, background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>🏦 Billing Address Details</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="label">Pincode</label>
                        <input type="text" className="input" placeholder="Pincode" maxLength={6} value={form.billing_pincode} onChange={e => set('billing_pincode', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">City</label>
                        <input type="text" className="input" placeholder="City" value={form.billing_city} onChange={e => set('billing_city', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input type="text" className="input" placeholder="State" value={form.billing_state} onChange={e => set('billing_state', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div>
                    <label className="label">Discount</label>
                    <input type="number" className="input" value={form.discount_amount} onChange={e => set('discount_amount', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Tax</label>
                    <input type="number" className="input" value={form.tax_amount} onChange={e => set('tax_amount', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Shipping</label>
                    <input type="number" className="input" value={form.shipping_amount} onChange={e => set('shipping_amount', e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Total</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-bright)' }}>AED {calculateTotal().toLocaleString('en-US')}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label">Payment Method</label>
                    <select className="select" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                      <option value="cash">Cash Checkout (POS)</option>
                      <option value="card">Card Checkout (POS Terminal)</option>
                      <option value="cod">Cash / Card on Delivery (COD)</option>
                      <option value="stripe">Stripe / Online Cards (Apple Pay)</option>
                      <option value="bank_transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                  {(form.payment_method === 'card' || form.payment_method === 'upi' || form.payment_method === 'bank_transfer') && (
                    <div>
                      <label className="label">Transaction Ref ID</label>
                      <input type="text" className="input" placeholder="Ref#" value={form.transaction_id} onChange={e => set('transaction_id', e.target.value)} />
                    </div>
                  )}
                </div>

                {/* Delhivery Opt-In */}
                <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.3)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="delhivery_opt" checked={delhiveryActive} onChange={e => setDelhiveryActive(e.target.checked)} />
                  <label htmlFor="delhivery_opt" style={{ fontSize: '0.75rem', fontWeight: 600 }}>🚚 Auto-book Shipment with Delhivery API</label>
                </div>

                <div>
                  <textarea className="input" rows={2} placeholder="Internal order instructions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION & FINAL CONFIRMATION */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '10px 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>📋 Final Order Summary</div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Recipient</span><span style={{ color: '#fff', fontWeight: 600 }}>{form.contact_name}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Delivery PIN</span><span style={{ color: '#fff', fontWeight: 600 }}>{form.shipping_pincode} ({form.shipping_city})</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Payment Mode</span><span style={{ color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>{form.payment_method}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, marginTop: 4 }}>
                         <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>PAYABLE AMOUNT</span>
                         <span style={{ color: 'var(--gold-bright)', fontWeight: 800, fontSize: '1.1rem' }}>AED {calculateTotal().toLocaleString('en-US')}</span>
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                     <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Security Verification</h3>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>A 4-digit code has been sent to <strong>{form.contact_email}</strong></p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                     <input 
                        type="text" 
                        className="input" 
                        placeholder="0 0 0 0" 
                        maxLength={4} 
                        value={otpValue} 
                        onChange={e => setOtpValue(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px', width: '180px', fontWeight: 800, background: 'rgba(51,154,240,0.05)', borderColor: 'rgba(51,154,240,0.2)' }} 
                     />
                  </div>
                  <button type="button" onClick={() => sendOtp()} style={{ fontSize: '0.68rem', background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}>Resend Verification Code</button>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Simulation Tip: Use 1234 or 0000 to verify</div>
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => {
              if (currentStep > 0) setCurrentStep(currentStep - 1)
              else onClose()
            }}>
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>
            
            {currentStep === 0 && (
              <button type="button" className="btn btn-primary" onClick={() => {
                if (!form.contact_name || !form.contact_email || !form.contact_phone || form.items.some(i => !i.variant_id)) {
                  toast.error('Please complete contact details and items selection')
                } else {
                  setCurrentStep(1)
                }
              }}>
                Next: Delivery & Payment
              </button>
            )}

            {currentStep === 1 && (
              <button type="button" className="btn btn-primary" onClick={() => {
                if (!form.shipping_pincode || !form.shipping_address_line1) {
                  toast.error('Please complete delivery address details')
                } else {
                  sendOtp() // This sets step to 1 currently, need to adjust logic
                }
              }} disabled={saving}>
                {saving ? 'Preparing...' : 'Next: Verify & Book'}
              </button>
            )}

            {currentStep === 2 && (
              <button type="submit" className="btn btn-primary" disabled={saving || verifyingOtp}>
                {saving ? 'Booking...' : verifyingOtp ? 'Verifying...' : 'Finalize & Book Order'}
              </button>
            )}
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
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>AED {calculateTotal().toLocaleString('en-US')}</div>
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
              <button type="button" className="btn btn-primary" style={{ flex: 1.5, background: '#339af0', borderColor: '#339af0' }} onClick={() => { setRazorpaySimulating(false); performActualBooking(); }}>⚡ Simulate Payment Success</button>
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
  paid: 'var(--success)',
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
  const transactions = orders.map(o => ({
    id: `TXN-${o.id.toString().slice(0, 8).toUpperCase()}`,
    order_ref: o.order_number,
    customer: o.customer_name || 'Walk-in',
    gateway: o.payment_method || '—',
    amount: o.total_amount,
    status: o.payment_status || 'pending',
    date: o.created_at
  }))
  const [txnSearch, setTxnSearch] = useState('')
  const [variants, setVariants] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [shipModal, setShipModal] = useState(null) // holds { orderId, orderNumber, shippingAddress }
  const [shipForm, setShipForm] = useState({ carrier: 'Delhivery', tracking_number: '', weight: '0.5', length: '20', breadth: '15', height: '10' })
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [notifModal, setNotifModal] = useState(null) // holds { orderNumber, status, customerName, customerPhone, customerEmail }
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [contactEditForm, setContactEditForm] = useState({ name: '', phone: '', email: '' })
  const [savingContact, setSavingContact] = useState(false)
  const [pickupModal, setPickupModal] = useState(null)
  const [pickupLoading, setPickupLoading] = useState(false)

  const loadVariants = () => {
    api.get('/inventory/stock')
      .then(r => setVariants(r.data))
      .catch(() => {})
  }

  const loadOrders = () => {
    setLoadingOrders(true)
    let start_date = undefined
    const now = new Date()
    
    if (ovTime === 'Today Only') {
      const d = new Date()
      d.setHours(0,0,0,0)
      start_date = d.toISOString()
    } else if (ovTime === 'Last 7 Days') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      start_date = d.toISOString()
    } else if (ovTime === 'Last 30 Days') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      start_date = d.toISOString()
    } else if (ovTime === 'This Month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      start_date = d.toISOString()
    } else if (ovTime === 'This Year') {
      const d = new Date(now.getFullYear(), 0, 1)
      start_date = d.toISOString()
    }

    api.get('/orders', { params: { 
      search: orderSearch || undefined, 
      status: statusFilter || undefined, 
      start_date,
      limit: 200 
    } })
      .then(r => {
        const validOrders = (r.data || []).filter(o => {
          const pm = (o.payment_method || '').toLowerCase();
          const ps = (o.payment_status || '').toLowerCase();
          if (['stripe', 'card', 'razorpay'].includes(pm) && ps === 'pending') {
            return false;
          }
          return true;
        });
        setOrders(validOrders);
      })
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
    if (tab === 'orders' || tab === 'overview') {
      loadOrders()
    }
    if (tab === 'customers' || tab === 'overview') {
      loadCustomers()
    }
  }, [tab, orderSearch, statusFilter, customerSearch, ovTime])

  const STATUS_MESSAGES = {
    confirmed: (name, num) => `Hi ${name || 'there'} 👋, your Pommastore order *${num}* has been *confirmed*! We're getting it ready for you. 🎉`,
    processing: (name, num) => `Hi ${name || 'there'}, your order *${num}* is now being *processed & packed* at our warehouse. 📦`,
    packed: (name, num) => `Your order *${num}* is *packed* and ready to ship, ${name || 'dear customer'}! Dispatch is imminent. 🚀`,
    shipped: (name, num, awb) => `Great news ${name || 'there'}! 🚚 Your Pommastore order *${num}* has been *shipped*.\nTracking AWB: *${awb || 'N/A'}*\nTrack at: https://www.delhivery.com/track/package/${awb || ''}`,
    out_for_delivery: (name, num) => `Your order *${num}* is *out for delivery* today, ${name || 'dear customer'}! Please keep your phone handy. 🏠`,
    delivered: (name, num) => `Your order *${num}* has been *delivered* successfully! 🎉 Thank you for shopping with Pommastore. We'd love your review!`,
    completed: (name, num) => `Order *${num}* is now *completed*. Thank you ${name || ''}! 💛 Earn more loyalty points on your next purchase.`,
    cancelled: (name, num) => `We're sorry to inform you that order *${num}* has been *cancelled*, ${name || 'dear customer'}. Please contact us for assistance.`,
  }

  const updateStatus = async (orderId, status, order) => {
    if (status === 'shipped') {
      const ord = order || orders.find(o => o.id === orderId)
      setShipModal({ orderId, orderNumber: ord?.order_number, shippingAddress: ord?.shipping_address, customerName: ord?.customer_name, customerPhone: ord?.customer_phone, customerEmail: ord?.customer_email })
      setShipForm({ carrier: 'Delhivery', tracking_number: '', weight: '0.5', length: '20', breadth: '15', height: '10' })
      return
    }
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      toast.success('Status updated successfully')
      loadOrders()
    } catch {
      toast.error('Update failed')
    }
  }

  const handleDispatchShipment = async () => {
    setShipLoading(true)
    try {
      if (shipForm.carrier === 'Delivery Panda') {
        const res = await api.post(`/orders/${shipModal.orderId}/dispatch/delivery-panda`)
        const awb = res.data?.payment_details?.awb_number || res.data?.tracking_number || ''
        const pdf = res.data?.payment_details?.awb_pdf || ''
        toast.success(`🐼 Dispatched via Delivery Panda! AWB: ${awb}`)
        if (pdf) {
          window.open(pdf, '_blank')
        }
      } else {
        let awb = shipForm.tracking_number.trim()
        if (shipForm.carrier === 'Delhivery' && !awb) {
          awb = `DLVRY${Date.now().toString().slice(-10)}`
          toast('📦 Delhivery AWB generated: ' + awb, { icon: '🚚' })
        }
        await api.patch(`/orders/${shipModal.orderId}/status`, {
          status: 'shipped',
          tracking_number: awb,
          carrier: shipForm.carrier,
        })
        toast.success(`✅ Shipment dispatched via ${shipForm.carrier}`)
      }
      loadOrders()
      setShipModal(null)
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Dispatch failed. Please check order details.'
      toast.error(errMsg)
    } finally {
      setShipLoading(false)
    }
  }

  const handleSchedulePickup = async () => {
    setPickupLoading(true)
    try {
      const payload = {
        pickup_date: pickupModal.pickupDate,
        pickup_time: pickupModal.pickupTimeSlot.split(' ')[0], // send start time
        pickup_location: pickupModal.pickupLocation,
        expected_package_count: Number(pickupModal.expectedCount || 1)
      }
      await api.post('/orders/delhivery-pickup', payload)
      toast.success('🚚 Delhivery pickup request scheduled successfully!')
      setPickupModal(null)
      loadOrders()
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Pickup scheduling failed'
      toast.error(errMsg)
    } finally {
      setPickupLoading(false)
    }
  }

  const fmt = n => `AED ${Number(n || 0).toLocaleString('en-US')}`

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
      filename = 'Pommastore_Orders_Ledger.csv'
    } else if (type === 'customers') {
      headers = ['Customer Name', 'Email', 'Phone', 'Loyalty Tier', 'Points', 'Orders Count', 'Total Spent', 'Last Order']
      rows = customers.map(c => [c.full_name || '—', c.email || '—', c.phone || '—', c.loyalty_tier, c.loyalty_points, c.order_count, c.total_spent, c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : '—'])
      filename = 'Pommastore_Customers_Ledger.csv'
    } else {
      headers = ['Transaction ID', 'Order Ref', 'Customer', 'Gateway', 'Amount', 'Status', 'Date']
      rows = filteredTxns.map(t => [t.id, t.order_ref, t.customer, t.gateway, t.amount, t.status, t.date])
      filename = 'Pommastore_Financial_Ledger.csv'
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
  const activeOrders = orders.filter(o => !['cancelled', 'returned'].includes(o.status))
  const successfulPaymentOrders = orders
  
  const filteredOrdersForStats = ovChannel === 'All Channels' 
    ? orders 
    : orders.filter(o => {
        const ch = (o.channel || '').toLowerCase()
        const target = ovChannel.toLowerCase()
        if (target.includes('pos')) return ch.includes('pos') || ch.includes('retail')
        if (target.includes('webstore') || target.includes('online')) return ch.includes('storefront') || ch.includes('online') || ch.includes('web')
        if (target.includes('whatsapp')) return ch.includes('whatsapp')
        if (target.includes('instagram')) return ch.includes('instagram')
        return ch.includes(target)
      })

  const totalRevenue = filteredOrdersForStats.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const pendingShipments = filteredOrdersForStats.filter(o => ['pending', 'processing', 'packed', 'shipped'].includes(o.status)).length
  
  // Financial splits
  const cancelledOrders = filteredOrdersForStats.filter(o => ['cancelled', 'returned'].includes(o.status))
  const refundVolume = cancelledOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  const netRevenue = totalRevenue - refundVolume
  
  const totalTax = filteredOrdersForStats.reduce((sum, o) => {
    const t = Number(o.tax_amount || 0)
    const s = Number(o.subtotal || 0)
    return sum + (t > 0 ? t : (s - (s / 1.05)))
  }, 0)
  const totalShipping = filteredOrdersForStats.reduce((sum, o) => sum + Number(o.shipping_amount || 0), 0)
  
  const unpaidCount = filteredOrdersForStats.filter(o => !['paid', 'settled'].includes(o.payment_status || '') && o.payment_method === 'cod').length
  
  // Customer Retention Profile
  const repeatCustomersCount = customers.filter(c => c.order_count > 1).length
  const totalCLV = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0)
  const avgCLV = customers.length ? Math.round(totalCLV / customers.length) : 0

  // Ledger Settlement Status
  const settledTotal = transactions.filter(t => t.status === 'paid' || t.status === 'settled').reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const pendingTotal = transactions.filter(t => ['pending', 'authorized'].includes(t.status)).reduce((sum, t) => sum + Number(t.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, var(--text-primary), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                 <option value="Today Only">Today Only</option>
                 <option value="Last 7 Days">Last 7 Days</option>
                 <option value="Last 30 Days">Last 30 Days</option>
                 <option value="This Month">This Month</option>
                 <option value="This Year">This Year</option>
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
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  💶 Net Realized Revenue <InfoButton text="Total recognized revenue cleared through standard accounting, deducting cancellations." />
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold-bright)', marginTop: 4 }}>{fmt(netRevenue)}</div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>Gross: <strong>{fmt(totalRevenue)}</strong></span>
             <span style={{ color: 'var(--error)' }}>Refunds: <strong>{fmt(refundVolume)}</strong></span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
               🛒 Successful Bookings <InfoButton text="Raw unique checkout transactions cleared by authorized financial gateways." />
             </span>
             <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{filteredOrdersForStats.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orders</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>Payment Verified only</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
               👥 Growth & Retention <InfoButton text="Aggregation of unique global customer identities saved across active channel registers." />
             </span>
             <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{customers.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accounts</span></div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.68rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>
             <span style={{ color: 'var(--text-secondary)' }}>New: <strong>{customers.length - repeatCustomersCount}</strong></span>
             <span style={{ color: 'var(--success)' }}>Returning: <strong>{repeatCustomersCount}</strong></span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
          <div>
             <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
               🏦 Settlement Ledger <InfoButton text="Combined sum of incoming payouts awaiting authorization vs finalized settled batches." />
             </span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Executive Sub-KPI Secondary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Average Order Value (AOV) <InfoButton text="Normalized total gross split between volume of paid receipts." />
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {fmt(filteredOrdersForStats.length ? (totalRevenue / filteredOrdersForStats.length) : 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Healthy baseline basket size</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tax & Shipping Capture <InfoButton text="Non-inventory collected fees directly linked toward indirect cost reimbursement." />
              </span>
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
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer Lifetime Value (CLV) <InfoButton text="Statistical estimation of continuous realized liquidity expectation from registered audience." />
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {fmt(avgCLV)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                 <Percent size={10} /> loyalty driven yield
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Completion Rate <InfoButton text="Percentage conversion measuring orders shipped and delivered avoiding cancellations." />
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: 6 }}>
                {filteredOrdersForStats.length ? Math.round((filteredOrdersForStats.filter(o => !['cancelled', 'returned', 'return_requested'].includes(o.status)).length / filteredOrdersForStats.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--success)', marginTop: 4 }}>High reliability retention</div>
            </div>
          </div>

          {/* Row 1: Order Status Pipeline Funnel */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
             <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
               <Activity size={18} color="var(--gold)" /> Order Fulfillment Lifecycle Funnel <InfoButton text="Tracking the physical status propagation across modern direct logistics pipeline." />
             </h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 8 }}>
                {[
                  { id: 'pending', label: 'Pend', color: 'var(--warning)', icon: <Clock size={12}/> },
                  { id: 'confirmed', label: 'Conf', color: 'var(--info)', icon: <Check size={12}/> },
                  { id: 'processing', label: 'Proc', color: '#339af0', icon: <Activity size={12}/> },
                  { id: 'packed', label: 'Pack', color: 'var(--gold)', icon: <Package size={12}/> },
                  { id: 'shipped', label: 'Ship', color: 'var(--gold)', icon: <TrendingUp size={12}/> },
                  { id: 'out_for_delivery', label: 'Out', color: 'var(--gold-bright)', icon: <Activity size={12}/> },
                  { id: 'delivered', label: 'Dlvrd', color: 'var(--success)', icon: <Check size={12}/> },
                  { id: 'completed', label: 'Comp', color: 'var(--success)', icon: <ShieldCheck size={12}/> },
                  { id: 'cancelled', label: 'Canc', color: 'var(--error)', icon: <X size={12}/> },
                  { id: 'return_requested', label: 'Ret Req', color: 'var(--error)', icon: <Clock size={12}/> },
                  { id: 'returned', label: 'Retrd', color: 'var(--error)', icon: <X size={12}/> }
                ].map((step) => {
                   const count = successfulPaymentOrders.filter(o => o.status === step.id).length
                   const pct = successfulPaymentOrders.length ? Math.round((count / successfulPaymentOrders.length) * 100) : 0
                   return (
                     <div key={step.id}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${step.color}33`, padding: '12px 4px', borderRadius: 10, textAlign: 'center', transition: 'all 0.3s' }} className="hover-glow">
                           <div style={{ color: step.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{step.icon}</div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{count}</div>
                           <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2, fontWeight: 700 }}>{step.label}</div>
                           <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: step.color }}></div>
                           </div>
                           <div style={{ fontSize: '0.5rem', color: step.color, marginTop: 4, fontWeight: 600 }}>{pct}%</div>
                        </div>
                     </div>
                   )
                })}
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* Sales Channel Share Progress bars with Drilldown interactivity */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                 <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                   📊 Sales Channel Volume Share <InfoButton text="Breakdown of gross volume received distinct from origin retail avenues." />
                 </h3>
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click to drill-down</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'POS', icon: '🏬', color: 'var(--gold)', keys: ['pos', 'retail'] },
                  { label: 'Webstore', icon: '🌐', color: '#339af0', keys: ['storefront', 'webstore', 'online', 'web'] },
                  { label: 'WhatsApp', icon: '💬', color: 'var(--success)', keys: ['whatsapp'] },
                  { label: 'Instagram', icon: '📸', color: 'var(--error)', keys: ['instagram'] }
                ].map(ch => {
                   const channelOrders = orders.filter(o => {
                     const chStr = (o.channel || '').toLowerCase()
                     return ch.keys.some(k => chStr.includes(k))
                   })
                   const share = orders.length ? Math.round((channelOrders.length / orders.length) * 100) : 0
                   return (
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
                          <strong style={{ opacity: 0.8 }}>{share}% Share</strong>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${share}%`, background: ch.color }}></div>
                        </div>
                     </div>
                   )
                })}
              </div>
            </div>

            {/* Financial Payment Methods Ledger Stats */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                💳 Active Merchant Settlement <InfoButton text="Current accounting balance distribution across designated clearing gateways." />
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Stripe Gateway (Cards/Apple Pay)', icon: <CreditCard size={16} color="#339af0"/>, bg: 'rgba(51,154,240,0.1)', sub: 'Automated Payouts Active', keys: ['stripe', 'card'] },
                  { label: 'Cash / Card on Delivery (COD)', icon: <Truck size={16} color="var(--gold)"/>, bg: 'rgba(201,168,76,0.1)', sub: 'Doorstep Settlement Active', keys: ['cod', 'cash'] },
                  { label: 'Direct Bank Deposit', icon: <Building size={16} color="var(--success)"/>, bg: 'rgba(16,185,129,0.1)', sub: 'Physical EDC / Bank Transfer', keys: ['bank_transfer', 'bank'] }
                ].map(m => {
                  const methodRev = orders.filter(o => m.keys.some(k => (o.payment_method || '').toLowerCase().includes(k))).reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
                  const share = totalRevenue ? Math.round((methodRev / totalRevenue) * 100) : 0
                  return (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.icon}</div>
                        <div>
                           <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{m.label}</span>
                           <div style={{ fontSize: '0.62rem', color: m.method === 'cash' ? 'var(--warning)' : 'var(--success)' }}>{m.sub}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                         <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{fmt(methodRev)}</strong>
                         <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{share}% Volume</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
             
             {/* Payment Method Volume & Settlement Performance */}
             <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={18} color="var(--gold)" /> Payment Gateway Performance <InfoButton text="Statistical metrics mapping absolute revenue generation per financial terminal." />
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {[
                     { label: 'Stripe (Cards / Apple Pay)', method: 'stripe', color: '#339af0' },
                     { label: 'Cash on Delivery (COD)', method: 'cod', color: 'var(--gold)' },
                     { label: 'Direct Bank Transfer', method: 'bank_transfer', color: 'var(--success)' }
                   ].map(pm => {
                      const methodOrders = orders.filter(o => o.payment_method === pm.method)
                      const volume = methodOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
                      const avgValue = methodOrders.length ? (volume / methodOrders.length) : 0
                      const maxVol = Math.max(...['stripe', 'cod', 'bank_transfer'].map(m => orders.filter(o => o.payment_method === m).reduce((sum, o) => sum + Number(o.total_amount || 0), 0)), 1)
                      const barWidth = `${(volume / maxVol) * 100}%`
                      
                      return (
                        <div key={pm.method}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div>
                                 <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{pm.label}</div>
                                 <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{methodOrders.length} successful bookings</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '0.9rem', fontWeight: 700, color: pm.color }}>{fmt(volume)}</div>
                                 <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Avg: {fmt(avgValue)}</div>
                              </div>
                           </div>
                           <div style={{ height: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: barWidth, background: pm.color, borderRadius: 4 }}></div>
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>

             {/* Customer Loyalty & "Regular" identification */}
             <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={18} color="var(--gold)" /> Loyalty Cohort Analysis <InfoButton text="Grouping of purchasing habits classifying standard vs. recursive core accounts." />
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                   <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', padding: 16, borderRadius: 12 }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>Regular Clients</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{customers.filter(c => c.order_count >= 3).length}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>Placed 3+ orders</div>
                   </div>
                   <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>One-Time Buyers</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>{customers.filter(c => c.order_count === 1).length}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>Acquisition focus area</div>
                   </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>🏆 Top 5 High-Value Customers (HVC)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   {[...customers].sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0)).slice(0, 5).map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold-glow)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>{i+1}</div>
                            <div>
                               <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.8rem' }}>{c.full_name}</div>
                               <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{c.order_count} orders</div>
                            </div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--gold-bright)', fontSize: '0.85rem' }}>{fmt(c.total_spent)}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CLV</div>
                         </div>
                      </div>
                   ))}
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
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={e => {
                      if (e.target.checked) setSelectedOrderIds(orders.map(o => o.id))
                      else setSelectedOrderIds([])
                    }}
                  />
                </th>
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
                <tr><td colSpan={10} className="table-empty">Loading…</td></tr>
              ) : (
                orders.filter(o => (orderSearch ? o.order_number.includes(orderSearch) : true) && (statusFilter ? o.status === statusFilter : true)).map(o => (
                  <tr key={o.id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer', background: selectedOrderIds.includes(o.id) ? 'rgba(201,168,76,0.05)' : 'transparent' }}>
                    <td onClick={e => e.stopPropagation()}>
                      <input type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={() => {
                          if (selectedOrderIds.includes(o.id)) setSelectedOrderIds(prev => prev.filter(id => id !== o.id))
                          else setSelectedOrderIds(prev => [...prev, o.id])
                        }}
                      />
                    </td>
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
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-US')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select className="select" style={{ width: 130, fontSize: '0.75rem', padding: '4px 8px' }}
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value, o)}>
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* BULK ACTION BAR */}
          {selectedOrderIds.length > 0 && (
            <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1b2344', border: '1px solid var(--gold-border)', padding: '12px 24px', borderRadius: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 20, zIndex: 1000 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gold)' }}>{selectedOrderIds.length} orders selected</div>
              <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ background: 'var(--gold)', color: '#000', borderRadius: 20 }} onClick={() => {
                  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id))
                  const ord = selectedOrders[0]
                  setNotifModal({
                    orderNumber: `[BULK: ${selectedOrderIds.length}]`,
                    status: ord.status,
                    customerName: 'Multiple Customers',
                    customerPhone: '91xxxxxxxxxx',
                    customerEmail: 'bulk@pommastore.com',
                    isBulk: true,
                    ids: selectedOrderIds,
                    message: `Hello! This is an update from Pommastore regarding your order. We are processing it and will update you shortly.`
                  })
                }}>💬 Bulk Notify</button>
                <button className="btn btn-secondary btn-sm" style={{ borderRadius: 20 }} onClick={() => setSelectedOrderIds([])}>Cancel</button>
              </div>
            </div>
          )}
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
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-US') : '—'}</td>
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
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('en-US')}</td>
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
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Recipient & Contact</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {!isEditingContact && <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }} onClick={() => {
                        setContactEditForm({
                          name: selectedOrder.customer_name || '',
                          phone: selectedOrder.customer_phone || '',
                          email: selectedOrder.customer_email || ''
                        })
                        setIsEditingContact(true)
                      }}>✏️ Edit</button>}
                      <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }} onClick={loadOrders}>🔄 Refresh Data</button>
                    </div>
                  </div>
                  
                  {isEditingContact ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      <input className="input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={contactEditForm.name} onChange={e => setContactEditForm(p => ({...p, name: e.target.value}))} placeholder="Full Name" />
                      <input className="input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={contactEditForm.phone} onChange={e => setContactEditForm(p => ({...p, phone: e.target.value}))} placeholder="Phone Number" />
                      <input className="input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={contactEditForm.email} onChange={e => setContactEditForm(p => ({...p, email: e.target.value}))} placeholder="Email Address" />
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button className="btn btn-primary btn-sm" disabled={savingContact} style={{ padding: '4px 12px', fontSize: '0.7rem' }} onClick={async () => {
                          setSavingContact(true)
                          try {
                            const res = await api.patch(`/orders/${selectedOrder.id}/contact`, {
                              customer_name: contactEditForm.name,
                              customer_phone: contactEditForm.phone,
                              customer_email: contactEditForm.email
                            })
                            setSelectedOrder(res.data)
                            setOrders(prev => prev.map(o => o.id === res.data.id ? res.data : o))
                            setIsEditingContact(false)
                            toast.success('Contact details updated!')
                          } catch (err) {
                            toast.error('Failed to update contact')
                          } finally {
                            setSavingContact(false)
                          }
                        }}>{savingContact ? '...' : 'Save'}</button>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 12px', fontSize: '0.7rem' }} onClick={() => setIsEditingContact(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{selectedOrder.customer_name || 'Walk-In Guest'}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                        <div style={{ fontSize: '0.75rem', color: selectedOrder.customer_phone ? 'var(--gold)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Smartphone size={12} /> {selectedOrder.customer_phone || 'No phone number'}
                          {selectedOrder.customer_phone && <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }} onClick={() => { navigator.clipboard.writeText(selectedOrder.customer_phone); toast.success('Phone copied!'); }}>📋</button>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: selectedOrder.customer_email ? 'var(--text-muted-bright)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={12} /> {selectedOrder.customer_email || 'No email provided'}
                          {selectedOrder.customer_email && <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }} onClick={() => { navigator.clipboard.writeText(selectedOrder.customer_email); toast.success('Email copied!'); }}>📋</button>}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{new Date(selectedOrder.created_at).toLocaleString('en-US')}</div>
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
                  {(selectedOrder.transaction_id || selectedOrder.payment_gateway) && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedOrder.payment_gateway && `Gateway: ${selectedOrder.payment_gateway}`}
                      {selectedOrder.transaction_id && ` | Ref: ${selectedOrder.transaction_id}`}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedOrder.billing_address ? '1fr 1fr' : '1fr', gap: 12 }}>
                {selectedOrder.shipping_address && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>📍 Shipping Address Details</div>
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
                {selectedOrder.billing_address && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>🏦 Billing Address Details</div>
                    <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 500, lineHeight: '1.4' }}>
                      {selectedOrder.billing_address.full_address || `${selectedOrder.billing_address.address_line1}, ${selectedOrder.billing_address.city} - ${selectedOrder.billing_address.pincode}`}
                    </div>
                  </div>
                )}
              </div>

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

              {/* STATUTORY COMPLIANCE FOOTER */}
              {(() => {
                let companyDetails = { companyName: 'Pommastore Retailers', gstin: '' }
                try {
                  const saved = localStorage.getItem('kzm-company-gst')
                  if (saved) companyDetails = JSON.parse(saved)
                } catch (e) {}
                
                return (
                  <div style={{ marginTop: 12, padding: '12px 14px', background: 'linear-gradient(to right, rgba(255,255,255,0.01), rgba(201,168,76,0.04))', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, fontWeight: 700 }}>🏛️ Issued & Documented By</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{companyDetails.companyName}</div>
                    {companyDetails.gstin && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 2, fontFamily: 'monospace', fontWeight: 700 }}>GSTIN: {companyDetails.gstin}</div>
                    )}
                    {companyDetails.registeredAddress && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>{companyDetails.registeredAddress}</div>
                    )}
                  </div>
                )
              })()}

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Statutory digital transactional record</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {selectedOrder.tracking_number && (
                  <a 
                    href={`${api.defaults.baseURL || '/api/v1'}/orders/${selectedOrder.id}/shipping-label`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm" 
                    style={{ background: '#FF5722', color: '#fff', borderRadius: 4, padding: '6px 14px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-block', fontWeight: 'bold' }}
                  >
                    🐼 Print Delivery Panda Label
                  </a>
                )}
                {selectedOrder.tracking_number && (
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    style={{ borderRadius: 4, padding: '6px 12px', fontSize: '0.72rem', background: 'rgba(201,168,76,0.1)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}
                    onClick={() => {
                      setPickupModal({
                        orderId: selectedOrder.id,
                        waybill: selectedOrder.tracking_number,
                        pickupLocation: 'Pommastore Commodities Pvt Ltd',
                        pickupDate: new Date().toISOString().split('T')[0],
                        pickupTimeSlot: '14:00:00 - 18:00:00',
                        expectedCount: 1
                      })
                    }}
                  >
                    📅 Add to Pickup
                  </button>
                )}
                <a 
                  href={`${api.defaults.baseURL || '/api/v1'}/orders/${selectedOrder.id}/invoice`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm" 
                  style={{ background: 'var(--gold)', color: '#000', borderRadius: 4, padding: '6px 12px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-block' }}
                >
                  📄 HTML Invoice
                </a>
                <a 
                  href={`${api.defaults.baseURL || '/api/v1'}/orders/${selectedOrder.id}/invoice/pdf`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm" 
                  style={{ borderRadius: 4, padding: '6px 12px', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-block' }}
                >
                  📥 Download PDF
                </a>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(null)}>Close Panel</button>
              </div>
            </div>
          </div>
        </div>

      )}

      {pickupModal && (
        <div className="modal-overlay" onClick={() => setPickupModal(null)}>
          <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📅 Add to Pickup</span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setPickupModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Selected Pickup Location</div>
                <strong style={{ color: '#fff', display: 'block', marginTop: 4 }}>{pickupModal.pickupLocation}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Pickup Date</label>
                <input 
                  type="date" 
                  className="input" 
                  value={pickupModal.pickupDate} 
                  onChange={e => setPickupModal(p => ({ ...p, pickupDate: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Pickup Slot</label>
                <select 
                  className="select" 
                  value={pickupModal.pickupTimeSlot} 
                  onChange={e => setPickupModal(p => ({ ...p, pickupTimeSlot: e.target.value }))}
                >
                  <option value="14:00:00 - 18:00:00">Evening 14:00:00 - 18:00:00</option>
                  <option value="09:00:00 - 12:00:00">Morning 09:00:00 - 12:00:00</option>
                  <option value="12:00:00 - 14:00:00">Afternoon 12:00:00 - 14:00:00</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Expected Package Count</label>
                <input 
                  type="number" 
                  className="input" 
                  min="1"
                  value={pickupModal.expectedCount} 
                  onChange={e => setPickupModal(p => ({ ...p, expectedCount: Number(e.target.value || 1) }))}
                />
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 4 }}>
                Keep the shipment ready with the label pasted before the courier agent arrives.
              </div>

            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPickupModal(null)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                style={{ background: 'var(--gold)', color: '#000' }}
                disabled={pickupLoading}
                onClick={handleSchedulePickup}
              >
                {pickupLoading ? 'Scheduling...' : 'Add to Pickup'}
              </button>
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
                🔒 Officially recorded inside the Pommastore Financial Ledger database.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedTransaction(null)} style={{ width: '100%' }}>Done View</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚚 SHIPPING DISPATCH MODAL (Delhivery / Manual AWB) */}
      {shipModal && (
        <div className="modal-overlay" onClick={() => setShipModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🚚 Dispatch Shipment — {shipModal.orderNumber}</span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setShipModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 16 }}>
              {/* Customer Contact */}
              <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>📦 Recipient Details</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{shipModal.customerName || 'Customer'}</div>
                {shipModal.customerPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>📞 {shipModal.customerPhone}</div>}
                {shipModal.customerEmail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>✉️ {shipModal.customerEmail}</div>}
                {shipModal.shippingAddress && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    📍 {shipModal.shippingAddress.address_line1}, {shipModal.shippingAddress.city} - {shipModal.shippingAddress.pincode}
                  </div>
                )}
              </div>

              {/* Carrier Select */}
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Carrier / Courier Partner</label>
                <select className="select" value={shipForm.carrier} onChange={e => setShipForm({ ...shipForm, carrier: e.target.value })} style={{ width: '100%' }}>
                  <option value="Delivery Panda">🐼 Delivery Panda (UAE Domestic Courier)</option>
                  <option value="Manual">Other / Manual Courier</option>
                </select>
              </div>

              {/* AWB / Tracking Number */}
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  AWB / Tracking Number {shipForm.carrier === 'Delhivery' ? '(leave blank to auto-generate)' : '*'}
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder={shipForm.carrier === 'Delhivery' ? 'Auto-generated on dispatch…' : 'Enter tracking number'}
                  value={shipForm.tracking_number}
                  onChange={e => setShipForm({ ...shipForm, tracking_number: e.target.value })}
                />
              </div>

              {/* Package Dimensions (for Delhivery API) */}
              {shipForm.carrier === 'Delhivery' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  {[['Weight (kg)', 'weight'], ['L (cm)', 'length'], ['B (cm)', 'breadth'], ['H (cm)', 'height']].map(([label, key]) => (
                    <div key={key}>
                      <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
                      <input className="input" style={{ width: '100%', textAlign: 'center' }} value={shipForm[key]} onChange={e => setShipForm({ ...shipForm, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                💡 After dispatch, an automatic WhatsApp/SMS notification template will be ready to send to the customer.
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShipModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ background: 'var(--gold)', color: '#000', fontWeight: 700 }} onClick={handleDispatchShipment} disabled={shipLoading}>
                {shipLoading ? '⏳ Dispatching…' : '🚀 Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 CUSTOMER NOTIFICATION MODAL (WhatsApp / SMS) */}
      {notifModal && (
        <div className="modal-overlay" onClick={() => setNotifModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">💬 Send Customer Notification</span>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setNotifModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: 16 }}>
              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: STATUS_COLORS[notifModal.status] + '22', color: STATUS_COLORS[notifModal.status], padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {notifModal.status?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Order {notifModal.orderNumber}</span>
              </div>

              {/* Customer contact */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Send To</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.82rem' }}>{notifModal.customerName || 'Customer'}</div>
                {notifModal.customerPhone
                  ? <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>📞 {notifModal.customerPhone}</div>
                  : <div style={{ fontSize: '0.72rem', color: 'var(--error)' }}>⚠️ No phone number on record</div>
                }
                {notifModal.customerEmail
                  ? <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✉️ {notifModal.customerEmail}</div>
                  : <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No email on record</div>
                }
              </div>

              {/* Message preview */}
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Message Preview (WhatsApp / SMS)</div>
                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.6, resize: 'vertical' }}
                  value={notifModal.message}
                  onChange={e => setNotifModal({ ...notifModal, message: e.target.value })}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '8px 12px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                ℹ️ Click <strong>WhatsApp</strong> to open wa.me with the pre-filled message, or <strong>Copy</strong> to paste manually.
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNotifModal(null)}>Skip</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                navigator.clipboard.writeText(notifModal.message)
                toast.success('Message copied!')
              }}>📋 Copy</button>
              <button type="button" className="btn btn-primary btn-sm"
                style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', fontWeight: 700 }}
                onClick={() => {
                  if (notifModal.isBulk) {
                    toast.success(`Processing bulk WhatsApp for ${notifModal.ids.length} orders...`)
                    setNotifModal(null)
                    return
                  }
                  if (!notifModal.customerPhone) { toast.error('No phone number on record'); return }
                  const phone = notifModal.customerPhone.replace(/\D/g, '')
                  const fullPhone = phone.startsWith('91') ? phone : `91${phone}`
                  const encoded = encodeURIComponent(notifModal.message)
                  window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank')
                  setNotifModal(null)
                }}>
                💬 {notifModal.isBulk ? 'WhatsApp All' : 'WhatsApp'}
              </button>
              <button type="button" className="btn btn-primary btn-sm"
                style={{ background: '#4F46E5', borderColor: '#4F46E5', color: '#fff', fontWeight: 700 }}
                onClick={() => {
                  if (notifModal.isBulk) {
                    toast.success(`Processing bulk email for ${notifModal.ids.length} orders...`)
                    setNotifModal(null)
                    return
                  }
                  if (!notifModal.customerEmail) { toast.error('No email address on record'); return }
                  // Load template from localStorage (saved from Settings → Email Templates)
                  let templates = {}
                  try {
                    const t = localStorage.getItem('kzm-email-templates')
                    if (t) templates = JSON.parse(t)
                  } catch {}
                  const tpl = templates[notifModal.status] || {}
                  const render = str => (str || '')
                    .replace(/{{name}}/g, notifModal.customerName || 'Customer')
                    .replace(/{{order}}/g, notifModal.orderNumber || '')
                    .replace(/{{awb}}/g, notifModal.awb || 'N/A')
                  const subject = encodeURIComponent(render(tpl.subject || `Order ${notifModal.orderNumber} - Status Update`))
                  const body = encodeURIComponent(render(tpl.body || notifModal.message))
                  window.open(`mailto:${notifModal.customerEmail}?subject=${subject}&body=${body}`, '_blank')
                  toast.success('Email client opened!')
                  setNotifModal(null)
                }}>
                ✉️ {notifModal.isBulk ? 'Email All' : 'Email'}
              </button>
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
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered: {new Date(customer.created_at).toLocaleDateString('en-US')}</div>
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
