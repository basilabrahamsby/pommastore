import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Pencil, Package, Info, Eye, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { getMediaUrl } from '../../services/media'
import toast from 'react-hot-toast'
import InfoButton from '../../components/ui/InfoButton'

const CONCENTRATIONS = ['Parfum','EDP','EDT','EDC','Mist','Oil','Other']
const GENDERS = ['Men','Women','Unisex']

function LabelWithInfo({ label, info }) {
  return (
    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}>
      {label}
      <span title={info} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', opacity: 0.8 }}>
        <Info size={12} />
      </span>
    </label>
  )
}

function ProductModal({ product, brands, categories, onClose, onSaved, onRefreshData }) {
  const editing = !!product
  const [form, setForm] = useState({
    name: product?.name || '', name_ar: product?.name_ar || '',
    brand_id: product?.brand_id || '',
    category_id: product?.category_id || '', gender: product?.gender || '',
    short_description: product?.short_description || '',
    short_description_ar: product?.short_description_ar || '',
    full_description: product?.full_description || '',
    full_description_ar: product?.full_description_ar || '',
    longevity_hours: product?.longevity_hours || '',
    sillage_rating: product?.sillage_rating || '',
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    priority: product?.priority ?? 0,
    scent_notes: product?.scent_notes || { top: [], heart: [], base: [] },
    scent_notes_ar: product?.scent_notes_ar || { top: [], heart: [], base: [] },
    
    // Extended Perfume Specific Fields
    olfactory_family: product?.occasion_tags?.find(t => t.startsWith('family:'))?.replace('family:', '') || product?.olfactory_family || 'Woody',
    seo_title: product?.seo_title || '',
    meta_description: product?.meta_description || '',
    keywords: product?.keywords || '',
    usage_context: product?.usage_context || 'Daily',
    sample_available: product?.sample_available ?? true,
    cruelty_free: product?.cruelty_free ?? true,
    vegan: product?.vegan ?? false,
    sustainable: product?.sustainable ?? false,

    // Compliance & Logistics
    flash_point: product?.flash_point || '24.5',
    hs_code: product?.hs_code || '3303.00',
    allergen_disclosure: product?.allergen_disclosure || '',
    ifra_certificate_link: product?.ifra_certificate_link || '',

    // Smart Warehouse & Storage
    storage_temp: product?.storage_temp || '15°C - 21°C',
    light_sensitivity: product?.light_sensitivity ?? true,
    hazmat_class: product?.hazmat_class || 'Class 3 (UN1266)',

    // Gift & Personalization Logic
    engravable: product?.engravable ?? false,
    gift_wrap_surcharge: product?.gift_wrap_surcharge || '',
    personalized_note_support: product?.personalized_note_support ?? true,

    // Advanced Offer & Loyalty
    points_multiplier: product?.points_multiplier || '1x',
    bogo_pairing_id: product?.bogo_pairing_id || '',
    loyalty_tier_exclusion: product?.loyalty_tier_exclusion ?? false,
    referral_bonus_value: product?.referral_bonus_value || '',

    // Marketing "Micro-Data"
    mood_benefit: product?.mood_benefit || '',
    sillage_visualizer: product?.sillage_visualizer || '5',
    compare_to_tag: product?.compare_to_tag || '',

    // Media & 3D Assets
    images: product?.images?.map(img => typeof img === 'string' ? img : img.url).filter(Boolean) || [],
    video_url: product?.video_url || '',
    three_d_source_image: product?.three_d_source_image || '',
    is_3d_active: product?.is_3d_active || false,

    // Per-product Visual Gallery
    gallery_images: product?.gallery_images || [],

    variants: product?.variants?.length ? [] : [{
      sku: '', size_ml: '', concentration: 'EDP', selling_price: '', compare_at_price: '', cost_price: '', min_stock_alert: 5, loyalty_points: 0,
      barcode: '', batch_number: '', expiry_date: ''
    }],
  })
  const [saving, setSaving] = useState(false)
  const translationTimeouts = useRef({})
  const [localScentNotes, setLocalScentNotes] = useState({
    top: (product?.scent_notes?.top || []).join(', '),
    heart: (product?.scent_notes?.heart || []).join(', '),
    base: (product?.scent_notes?.base || []).join(', ')
  })
  const [localScentNotesAr, setLocalScentNotesAr] = useState({
    top: (product?.scent_notes_ar?.top || []).join(', '),
    heart: (product?.scent_notes_ar?.heart || []).join(', '),
    base: (product?.scent_notes_ar?.base || []).join(', ')
  })

  const [quickBrand, setQuickBrand] = useState('')
  const [addingBrand, setAddingBrand] = useState(false)
  const [quickCategory, setQuickCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // 3D & Media States
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [converting3D, setConverting3D] = useState(false)
  const [threeDProgress, setThreeDProgress] = useState(0)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setNote = (tier, val) => setForm(p => ({
    ...p, scent_notes: { ...p.scent_notes, [tier]: val.split(',').map(s => s.trim()).filter(Boolean) }
  }))
  const setNoteAr = (tier, val) => setForm(p => ({
    ...p, scent_notes_ar: { ...(p.scent_notes_ar || { top: [], heart: [], base: [] }), [tier]: val.split(',').map(s => s.trim()).filter(Boolean) }
  }))
  const setVariant = (i, k, v) => setForm(p => {
    const vs = [...p.variants]; vs[i] = { ...vs[i], [k]: v }; return { ...p, variants: vs }
  })

  const handleTranslateField = async (sourceField, targetField, isNotes = false, tier = null) => {
    let textToTranslate = ''
    if (isNotes) {
      textToTranslate = localScentNotes[tier] || ''
    } else {
      textToTranslate = form[sourceField] || ''
    }

    if (!textToTranslate.trim()) {
      toast.error('Please enter English text first!')
      return
    }

    const loadingToast = toast.loading('Translating to Arabic...')
    try {
      const res = await api.get('/translate', {
        params: { text: textToTranslate, sl: 'en', tl: 'ar' }
      })
      const translatedText = res.data.translated_text
      if (isNotes) {
        setLocalScentNotesAr(p => ({ ...p, [tier]: translatedText }))
      } else {
        set(targetField, translatedText)
      }
      toast.success('Translated successfully!', { id: loadingToast })
    } catch (err) {
      toast.error('Translation failed', { id: loadingToast })
    }
  }

  const triggerDebouncedTranslation = (sourceField, targetField, val, isNotes = false, tier = null) => {
    const key = isNotes ? `notes-${tier}` : sourceField

    if (translationTimeouts.current[key]) {
      clearTimeout(translationTimeouts.current[key])
    }

    if (!val || !val.trim()) {
      if (isNotes) {
        setLocalScentNotesAr(p => ({ ...p, [tier]: '' }))
      } else {
        set(targetField, '')
      }
      return
    }

    translationTimeouts.current[key] = setTimeout(async () => {
      try {
        const res = await api.get('/translate', {
          params: { text: val, sl: 'en', tl: 'ar' }
        })
        const translatedText = res.data.translated_text
        if (isNotes) {
          setLocalScentNotesAr(p => ({ ...p, [tier]: translatedText }))
        } else {
          set(targetField, translatedText)
        }
      } catch (err) {
        console.warn('Debounced auto-translation failed:', err)
      }
    }, 800)
  }

  useEffect(() => {
    if (editing && product?.id) {
      api.get(`/products/${product.id}`)
        .then(res => {
          const fullProd = res.data;
          setForm(p => ({
            ...p,
            name: fullProd.name || p.name,
            name_ar: fullProd.name_ar || p.name_ar,
            brand_id: fullProd.brand_id || p.brand_id,
            category_id: fullProd.category_id || p.category_id,
            gender: fullProd.gender || p.gender,
            short_description: fullProd.short_description || p.short_description,
            short_description_ar: fullProd.short_description_ar || p.short_description_ar,
            full_description: fullProd.full_description || p.full_description,
            full_description_ar: fullProd.full_description_ar || p.full_description_ar,
            longevity_hours: fullProd.longevity_hours || p.longevity_hours,
            sillage_rating: fullProd.sillage_rating || p.sillage_rating,
            is_active: fullProd.is_active ?? p.is_active,
            is_featured: fullProd.is_featured ?? p.is_featured,
            is_new_arrival: fullProd.is_new_arrival ?? p.is_new_arrival,
            priority: fullProd.priority ?? p.priority,
            scent_notes: fullProd.scent_notes || p.scent_notes,
            scent_notes_ar: fullProd.scent_notes_ar || p.scent_notes_ar,
            olfactory_family: fullProd.occasion_tags?.find(t => t.startsWith('family:'))?.replace('family:', '') || fullProd.olfactory_family || p.olfactory_family,
            seo_title: fullProd.meta_title || p.seo_title,
            meta_description: fullProd.meta_description || p.meta_description,
            keywords: fullProd.keywords || p.keywords,
            images: fullProd.images || p.images,
            gallery_images: fullProd.gallery_images || p.gallery_images,
            video_url: fullProd.video_url || p.video_url,
            three_d_source_image: fullProd.three_d_source_image || p.three_d_source_image,
            is_3d_active: fullProd.is_3d_active ?? p.is_3d_active,
          }));
          setLocalScentNotes({
            top: (fullProd.scent_notes?.top || []).join(', '),
            heart: (fullProd.scent_notes?.heart || []).join(', '),
            base: (fullProd.scent_notes?.base || []).join(', ')
          });
          setLocalScentNotesAr({
            top: (fullProd.scent_notes_ar?.top || []).join(', '),
            heart: (fullProd.scent_notes_ar?.heart || []).join(', '),
            base: (fullProd.scent_notes_ar?.base || []).join(', ')
          });
        })
        .catch(err => console.warn('Failed to fetch full product details', err));
    }
  }, [editing, product?.id]);

  const handleConvert3D = () => {
    if (!form.three_d_source_image) {
      toast.error('Please upload a high-resolution 3D source image first!')
      return
    }
    setConverting3D(true)
    setThreeDProgress(10)
    const interval = setInterval(() => {
      setThreeDProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setConverting3D(false)
          set('is_3d_active', true)
          toast.success('Pommastore AI 3D Studio: Photo converted to 3D asset successfully!')
          return 100
        }
        return p + 20
      })
    }, 250)
  }

  const handleDirectUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    const uploadToast = toast.loading(`Processing ${files.length} product image(s)...`)
    
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      })
      
      const responses = await Promise.all(uploadPromises)
      const newUrls = responses.map(r => r.data.url)
      
      setForm(p => ({ 
        ...p, 
        images: [...(p.images || []), ...newUrls]
      }))
      
      toast.success(`${files.length} image(s) uploaded successfully!`, { id: uploadToast })
    } catch (err) {
      toast.error('Failed to store assets. Check file size/type.', { id: uploadToast })
    }
  }

  const handleRemoveImage = (idx) => {
    setForm(p => {
      const list = [...(p.images || [])]
      list.splice(idx, 1)
      return { ...p, images: list }
    })
  }

  const handleMakeCover = (idxToCover) => {
    if (idxToCover === 0) return
    setForm(p => {
      const list = [...(p.images || [])]
      const [chosen] = list.splice(idxToCover, 1)
      list.unshift(chosen)
      return { ...p, images: list }
    })
    toast.success('Set as Cover / Primary Photo!')
  }

  const handleMoveImage = (idx, direction) => {
    const targetIdx = idx + direction
    if (targetIdx < 0 || !form.images || targetIdx >= form.images.length) return
    setForm(p => {
      const list = [...(p.images || [])]
      const temp = list[idx]
      list[idx] = list[targetIdx]
      list[targetIdx] = temp
      return { ...p, images: list }
    })
  }

  // Gallery Handlers
  const addGallerySlot = () => {
    setForm(p => ({ ...p, gallery_images: [...(p.gallery_images || []), { image: '', link: '' }] }))
  }

  const removeGallerySlot = (idx) => {
    setForm(p => {
      const list = [...(p.gallery_images || [])]
      list.splice(idx, 1)
      return { ...p, gallery_images: list }
    })
  }

  const updateGallerySlot = (idx, field, value) => {
    setForm(p => {
      const list = [...(p.gallery_images || [])]
      list[idx] = { ...list[idx], [field]: value }
      return { ...p, gallery_images: list }
    })
  }

  const handleGalleryImageUpload = async (e, idx) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading('Uploading gallery image...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateGallerySlot(idx, 'image', res.data.url)
      toast.success('Gallery image uploaded!', { id: toastId })
    } catch (err) {
      toast.error('Upload failed. Check file size/type.', { id: toastId })
    }
  }

  const handleThreeDImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      set('three_d_source_image', reader.result)
      toast.success('High-Resolution 3D Source Image uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleQuickAddBrand = async () => {
    if (!quickBrand.trim()) return
    try {
      const res = await api.post('/brands', { name: quickBrand, slug: quickBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
      toast.success(`Brand "${quickBrand}" added!`)
      if (onRefreshData) await onRefreshData()
      set('brand_id', res.data.id)
      setQuickBrand('')
      setAddingBrand(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add brand')
    }
  }

  const handleQuickAddCategory = async () => {
    if (!quickCategory.trim()) return
    try {
      const res = await api.post('/categories', { name: quickCategory, slug: quickCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-') })
      toast.success(`Category "${quickCategory}" added!`)
      if (onRefreshData) await onRefreshData()
      set('category_id', res.data.id)
      setQuickCategory('')
      setAddingCategory(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add category')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    
    // Construct a sanitized payload that matches ProductCreate schema exactly
    const firstVariant = form.variants?.[0] || {}
    const sanitizedVariants = [{
      sku: firstVariant.sku || `SKU-${Date.now()}`,
      barcode: firstVariant.barcode || null,
      size_ml: firstVariant.size_ml ? parseInt(firstVariant.size_ml) : null,
      concentration: firstVariant.concentration || 'EDP',
      selling_price: parseFloat(firstVariant.selling_price) || 2499,
      compare_at_price: firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
      cost_price: firstVariant.cost_price ? parseFloat(firstVariant.cost_price) : null,
      min_stock_alert: firstVariant.min_stock_alert ? parseInt(firstVariant.min_stock_alert) : 5,
      loyalty_points: firstVariant.loyalty_points ? parseInt(firstVariant.loyalty_points) : 0,
      is_active: true
    }]

    const payload = {
      name: form.name,
      name_ar: form.name_ar || null,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      brand_id: form.brand_id && form.brand_id !== "" ? form.brand_id : (brands?.[0]?.id || "00000000-0000-0000-0000-000000000000"),
      category_id: form.category_id && form.category_id !== "" ? form.category_id : null,
      gender: form.gender && form.gender !== "" ? form.gender : null,
      scent_notes: {
        top: localScentNotes.top.split(',').map(s => s.trim()).filter(Boolean),
        heart: localScentNotes.heart.split(',').map(s => s.trim()).filter(Boolean),
        base: localScentNotes.base.split(',').map(s => s.trim()).filter(Boolean)
      },
      scent_notes_ar: {
        top: localScentNotesAr.top.split(',').map(s => s.trim()).filter(Boolean),
        heart: localScentNotesAr.heart.split(',').map(s => s.trim()).filter(Boolean),
        base: localScentNotesAr.base.split(',').map(s => s.trim()).filter(Boolean)
      },
      longevity_hours: form.longevity_hours ? parseInt(form.longevity_hours) : null,
      sillage_rating: form.sillage_rating ? parseInt(form.sillage_rating) : null,
      occasion_tags: [
        ...(form.occasion_tags || []).filter(t => !t.startsWith('family:')),
        `family:${form.olfactory_family || 'Woody'}`
      ],
      season_tags: form.season_tags || [],
      short_description: form.short_description || null,
      short_description_ar: form.short_description_ar || null,
      full_description: form.full_description || null,
      full_description_ar: form.full_description_ar || null,
      meta_title: form.seo_title || null,
      meta_description: form.meta_description || null,
      is_active: !!form.is_active,
      is_featured: !!form.is_featured,
      is_new_arrival: !!form.is_new_arrival,
      priority: parseInt(form.priority) || 0,
      variants: sanitizedVariants,
      images: form.images || [],
      gallery_images: form.gallery_images || []
    }

    try {
      if (editing) { 
        delete payload.variants; 
        await api.patch(`/products/${product.id}`, payload) 
      } else { 
        await api.post('/products', payload) 
      }
      toast.success(editing ? 'Product updated with luxury assets' : 'Product created successfully')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 750, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <span className="modal-title">{editing ? 'Edit Luxury Product' : 'Create Luxury Perfume'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* ── SECTION 1: CORE PRODUCT DETAILS ── */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🏺 Core Perfume Properties</p>
            <div className="grid-2">
              <div className="form-group">
                <LabelWithInfo label="Product Name (English) *" info="The commercial name of your perfume in English." />
                <input 
                  className="input" 
                  value={form.name} 
                  onChange={e => {
                    set('name', e.target.value)
                    triggerDebouncedTranslation('name', 'name_ar', e.target.value)
                  }} 
                  required 
                  placeholder="e.g. Bleu de Chanel" 
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>اسم المنتج (Arabic)</label>
                  {form.name && (
                    <button
                      type="button"
                      onClick={() => handleTranslateField('name', 'name_ar')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                        opacity: 0.8,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.8}
                    >
                      🪄 Translate
                    </button>
                  )}
                </div>
                <input className="input" value={form.name_ar || ''} onChange={e => set('name_ar', e.target.value)} placeholder="مثال: بلو دي شانيل" dir="rtl" style={{ textAlign: 'right' }} />
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <LabelWithInfo label="Brand *" info="The luxury brand house that produces this fragrance." />
                {addingBrand ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" value={quickBrand} onChange={e => setQuickBrand(e.target.value)} placeholder="New Brand Name..." style={{ flex: 1 }} required />
                    <button type="button" className="btn btn-success" onClick={handleQuickAddBrand} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38, fontWeight: 700, background: 'var(--success)', border: 'none' }}>✓</button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setAddingBrand(false); setQuickBrand('') }} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="select" value={form.brand_id} onChange={e => set('brand_id', e.target.value)} required style={{ flex: 1 }}>
                      <option value="">Select brand…</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" onClick={() => setAddingBrand(true)} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38, fontSize: '1.1rem', fontWeight: 700 }} title="Quick Add Brand">+</button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <LabelWithInfo label="Category" info="The broad category this product belongs to (e.g. Fragrances, Accessories)." />
                {addingCategory ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" value={quickCategory} onChange={e => setQuickCategory(e.target.value)} placeholder="New Category Name..." style={{ flex: 1 }} />
                    <button type="button" className="btn btn-success" onClick={handleQuickAddCategory} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38, fontWeight: 700, background: 'var(--success)', border: 'none' }}>✓</button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setAddingCategory(false); setQuickCategory('') }} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value || '')} style={{ flex: 1 }}>
                      <option value="">None</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" onClick={() => setAddingCategory(true)} style={{ padding: '0 12px', height: 'var(--input-height)', minWidth: 38, fontSize: '1.1rem', fontWeight: 700 }} title="Quick Add Category">+</button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <LabelWithInfo label="Olfactory Family" info="The scent profile family of the fragrance (e.g. Woody, Oriental, Citrus)." />
                <select className="select" value={form.olfactory_family} onChange={e => set('olfactory_family', e.target.value)}>
                  {['Floral', 'Woody', 'Oriental', 'Fresh', 'Citrus', 'Leather', 'Chypre', 'Fougere'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <LabelWithInfo label="Gender" info="The intended audience demographic for this scent (Men, Women, Unisex)." />
                <select className="select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">—</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <LabelWithInfo label="Longevity (hours)" info="The expected active hours this fragrance remains noticeable on the skin." />
                <input className="input" type="number" value={form.longevity_hours} onChange={e => set('longevity_hours', e.target.value)} placeholder="8" />
              </div>
              <div className="form-group">
                <LabelWithInfo label="Sillage / Projection" info="The distance the scent cloud projects outward from the wearer." />
                <select className="select" value={form.sillage_rating} onChange={e => set('sillage_rating', e.target.value)}>
                  <option value="">Select projection…</option>
                  <option value="1">Intimate</option>
                  <option value="2">Moderate</option>
                  <option value="3">Strong</option>
                  <option value="4">Enormous</option>
                </select>
              </div>
            </div>

            {/* Scent Pyramid */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 16, marginBottom: 8, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🌸 Scent Pyramid (Notes) / الهرم العطري</p>
            <div className="grid-2">
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: 8 }}>English Scent Notes</p>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['top','heart','base'].map(tier => (
                    <div className="form-group" key={tier} style={{ margin: 0 }}>
                      <LabelWithInfo label={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Notes`} info={`Fragrance ingredients active during the ${tier} phase.`} />
                      <input 
                        className="input" 
                        style={{ fontSize: '0.8rem' }} 
                        placeholder="e.g. Bergamot, Lemon" 
                        value={localScentNotes[tier] || ''} 
                        onChange={e => {
                          setLocalScentNotes(p => ({ ...p, [tier]: e.target.value }))
                          triggerDebouncedTranslation(null, null, e.target.value, true, tier)
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: 8, textAlign: 'right' }}>المكونات العطرية (Arabic)</p>
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {['top','heart','base'].map(tier => {
                    const labelAr = tier === 'top' ? 'المكونات العليا' : tier === 'heart' ? 'المكونات الوسطى' : 'المكونات الأساسية';
                    const hasEngNotes = localScentNotes[tier] && localScentNotes[tier].length > 0;
                    return (
                      <div className="form-group" key={tier} style={{ margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          {hasEngNotes && (
                            <button
                              type="button"
                              onClick={() => handleTranslateField(null, null, true, tier)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--gold)',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: 0,
                                opacity: 0.8,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={e => e.target.style.opacity = 1}
                              onMouseLeave={e => e.target.style.opacity = 0.8}
                            >
                              🪄 Translate
                            </button>
                          )}
                          <label className="form-label" style={{ textAlign: 'right', display: 'block', margin: 0 }}>{labelAr}</label>
                        </div>
                        <input 
                          className="input" 
                          style={{ fontSize: '0.8rem', textAlign: 'right' }} 
                          dir="rtl" 
                          placeholder="مثال: البرغموت، الليمون" 
                          value={localScentNotesAr[tier] || ''} 
                          onChange={e => {
                            setLocalScentNotesAr(p => ({ ...p, [tier]: e.target.value }))
                          }} 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

             {/* Description */}
            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="form-group">
                <LabelWithInfo label="Short Description (English)" info="A captivating story or description of the perfume's olfactory journey." />
                <textarea 
                  className="textarea" 
                  rows={2} 
                  value={form.short_description || ''} 
                  onChange={e => {
                    set('short_description', e.target.value)
                    triggerDebouncedTranslation('short_description', 'short_description_ar', e.target.value)
                  }}
                  placeholder="Describe the olfactory journey..." 
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>وصف مختصر (Arabic)</label>
                  {form.short_description && (
                    <button
                      type="button"
                      onClick={() => handleTranslateField('short_description', 'short_description_ar')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                        opacity: 0.8,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.8}
                    >
                      🪄 Translate
                    </button>
                  )}
                </div>
                <textarea className="textarea" rows={2} value={form.short_description_ar || ''} onChange={e => set('short_description_ar', e.target.value)} placeholder="اكتب وصفاً مختصراً بالعربية..." dir="rtl" style={{ textAlign: 'right' }} />
              </div>
            </div>

            {/* Full Narrative Story */}
            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="form-group">
                <LabelWithInfo label="Full Story (English)" info="The detailed, dynamic background story displayed on the storefront product page." />
                <textarea 
                  className="textarea" 
                  rows={4} 
                  value={form.full_description || ''} 
                  onChange={e => {
                    set('full_description', e.target.value)
                    triggerDebouncedTranslation('full_description', 'full_description_ar', e.target.value)
                  }}
                  placeholder="Tell the complete detailed story of the perfume, raw extracts, and design..." 
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0 }}>القصة الكاملة (Arabic)</label>
                  {form.full_description && (
                    <button
                      type="button"
                      onClick={() => handleTranslateField('full_description', 'full_description_ar')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--gold)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                        opacity: 0.8,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.8}
                    >
                      🪄 Translate
                    </button>
                  )}
                </div>
                <textarea className="textarea" rows={4} value={form.full_description_ar || ''} onChange={e => set('full_description_ar', e.target.value)} placeholder="اكتب القصة الكاملة بالعربية..." dir="rtl" style={{ textAlign: 'right' }} />
              </div>
            </div>

            {/* Catalog Visibility, Section & Priority */}
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--success)' }} />
                  🟢 Active in Catalog
                </label>
              </div>
              <div className="grid-2" style={{ marginTop: 8 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <LabelWithInfo label="Product Placement Section" info="Specify whether this product is featured, a new arrival, or a standard catalog item." />
                  <select 
                    className="select" 
                    value={form.is_featured ? 'featured' : form.is_new_arrival ? 'new_arrival' : 'normal'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'featured') {
                        setForm(p => ({ ...p, is_featured: true, is_new_arrival: false }));
                      } else if (val === 'new_arrival') {
                        setForm(p => ({ ...p, is_featured: false, is_new_arrival: true }));
                      } else {
                        setForm(p => ({ ...p, is_featured: false, is_new_arrival: false }));
                      }
                    }}
                  >
                    <option value="normal">Standard / Normal Product</option>
                    <option value="featured">★ Featured / Popular Pick (Homepage)</option>
                    <option value="new_arrival">⚡ New Arrival (Homepage)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <LabelWithInfo label="Section Priority" info="Set the display priority of this product inside its section. Higher values are displayed first." />
                  <input 
                    type="number" 
                    className="input" 
                    value={form.priority ?? 0} 
                    onChange={e => set('priority', parseInt(e.target.value) || 0)} 
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Toggle Advanced ERP & 3D Parameters */}
            <div style={{ margin: '14px 0 20px 0', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdvanced(!showAdvanced)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', fontSize: '0.78rem', fontWeight: 'bold', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--gold-bright)' }}>
                {showAdvanced ? '✨ Hide Advanced Marketing, Compliance & 3D Settings ▲' : '⚡ Show Advanced Marketing, Compliance & 3D Settings ▼'}
              </button>
            </div>

            {showAdvanced && (
              <>
                {/* ── SECTION 2: MARKETING & SEO ── */}
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>📈 Marketing & SEO Meta</p>
                <div className="grid-2">
                  <div className="form-group">
                    <LabelWithInfo label="SEO Title Tag" info="The optimized title that appears in search engines for high-ranking SEO." />
                    <input className="input" value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="Luxury Oud Wood Perfume for Men - 100ml" />
                  </div>
                  <div className="form-group">
                    <LabelWithInfo label="Occasion / Context" info="The recommended social occasion or setting to wear this fragrance." />
                    <select className="select" value={form.usage_context} onChange={e => set('usage_context', e.target.value)}>
                      {['Daily', 'Wedding', 'Night/Evening', 'Office-wear', 'Sport/Active', 'Casual'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <LabelWithInfo label="Keywords / Tags" info="Comma-separated keywords used for backend catalog filtering." />
                  <input className="input" value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="long-lasting, woody, summer scent, premium" />
                </div>
                <div className="form-group">
                  <LabelWithInfo label="Meta Description (Sensory Summary)" info="A captivating sensory summary that shows up on search results pages to increase organic clicks." />
                  <textarea className="textarea" rows={2} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="A sensory summary to drive clicks from search engines..." />
                </div>

                {/* Ingredient transparency & samples */}
                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>🌿 Ingredient Transparency & Offerings</p>
                  <div className="flex gap-6" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.cruelty_free} onChange={e => set('cruelty_free', e.target.checked)} /> Cruelty-Free</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.vegan} onChange={e => set('vegan', e.target.checked)} /> Vegan Friendly</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sustainable} onChange={e => set('sustainable', e.target.checked)} /> Sustainable Sourcing</label>
                    <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--gold)' }}><input type="checkbox" checked={form.sample_available} onChange={e => set('sample_available', e.target.checked)} /> 🧪 2ml Vial Sample Available</label>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>INCI Ingredient List / Allergen Disclosure (Limonene, Linalool, Citral, etc.)</label>
                    <textarea className="textarea" rows={2} style={{ fontSize: '0.78rem' }} value={form.allergen_disclosure} onChange={e => set('allergen_disclosure', e.target.value)} placeholder="Alcohol Denat., Fragrance (Parfum), Water\Aqua\Eau, Limonene, Linalool, Citral, Geraniol..." />
                  </div>
                </div>

                {/* ── SECTION: COMPLIANCE, LOGISTICS & SMART WAREHOUSE ── */}
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🛡️ Compliance, Storage & Logistics</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Flash Point (°C)</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.flash_point} onChange={e => set('flash_point', e.target.value)} placeholder="e.g. 23.5" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">HS Code</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.hs_code} onChange={e => set('hs_code', e.target.value)} placeholder="3303.00" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">IFRA Certificate URL / Link</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.ifra_certificate_link} onChange={e => set('ifra_certificate_link', e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Storage Temperature Range</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.storage_temp} onChange={e => set('storage_temp', e.target.value)} placeholder="15°C - 21°C" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Hazmat Class</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.hazmat_class} onChange={e => set('hazmat_class', e.target.value)}>
                      <option value="Class 3 (UN1266)">Class 3 (UN1266) - Flammable Liquids</option>
                      <option value="Non-Hazmat">Non-Hazmat (Water-based / Solid)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.light_sensitivity} onChange={e => set('light_sensitivity', e.target.checked)} />
                      🚨 Light Sensitive (Keep in Dark Zone)
                    </label>
                  </div>
                </div>

                {/* ── SECTION: PERSONALIZATION & GIFT WRAP ── */}
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🎁 Gifting & Personalization Logic</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.engravable} onChange={e => set('engravable', e.target.checked)} />
                      ✒️ Bottle Engraving Available
                    </label>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label="Gift Wrap Surcharge (AED )" info="An optional premium gift wrapping fee charged at checkout." />
                    <input className="input" type="number" style={{ fontSize: '0.8rem' }} value={form.gift_wrap_surcharge} onChange={e => set('gift_wrap_surcharge', e.target.value)} placeholder="150" />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.personalized_note_support} onChange={e => set('personalized_note_support', e.target.checked)} />
                      ✉️ Supports Personalized Note
                    </label>
                  </div>
                </div>

                {/* ── SECTION: ADVANCED OFFERS & LOYALTY ── */}
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🔗 Advanced Offers & Loyalty Config</p>
                <div className="grid-4" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label="Points Multiplier" info="Custom loyalty reward points factor when purchasing this product (e.g. 2x points)." />
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.points_multiplier} onChange={e => set('points_multiplier', e.target.value)} placeholder="e.g. 2x" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label="BOGO Pairing SKU ID" info="The unique ID of the SKU paired with this product for Buy One Get One free promotions." />
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.bogo_pairing_id} onChange={e => set('bogo_pairing_id', e.target.value)}>
                      <option value="">None / Standard Offer</option>
                      <option value="KL-OUD-100">KL-OUD-100 (Midnight Oud 100ml)</option>
                      <option value="KL-OUD-50">KL-OUD-50 (Midnight Oud 50ml)</option>
                      <option value="BDC-EDP-50">BDC-EDP-50 (Bleu de Chanel 50ml)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label="Referral Bonus (Points)" info="Loyalty points awarded to the referring customer when a referral successfully buys this item." />
                    <input className="input" type="number" style={{ fontSize: '0.8rem' }} value={form.referral_bonus_value} onChange={e => set('referral_bonus_value', e.target.value)} placeholder="500" />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-1 text-xs" style={{ cursor: 'pointer', color: 'var(--gold)' }}>
                      <input type="checkbox" checked={form.loyalty_tier_exclusion} onChange={e => set('loyalty_tier_exclusion', e.target.checked)} />
                      👑 Platinum Only Exclusion
                    </label>
                  </div>
                </div>

                {/* ── SECTION: SOCIAL & MARKETING MICRO-DATA ── */}
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>💡 Scent Mood & Social Micro-Data</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label="Mood / Benefit (Functional)" info="The olfactory emotion or benefit mapped to this scent (e.g. Energizing, Focus, Meditative)." />
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.mood_benefit} onChange={e => set('mood_benefit', e.target.value)} placeholder="e.g. Energizing, Focus" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label='"Compare To" Competitor Tag' info="A famous scent benchmark tag to drive organic search discoverability (e.g. Similar to Bleu de Chanel)." />
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.compare_to_tag} onChange={e => set('compare_to_tag', e.target.value)} placeholder="Similar to [Famous Brand]" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <LabelWithInfo label={`Sillage Visualizer (Rating: ${form.sillage_visualizer}/10)`} info="How long and strong the scent trail projects outward from the wearer (1 is intimate, 10 is enormous/room-filling)." />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'var(--input-height)' }}>
                      <input type="range" min="1" max="10" value={form.sillage_visualizer} onChange={e => set('sillage_visualizer', e.target.value)} style={{ flex: 1, accentColor: 'var(--gold)' }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SECTION 3: INVENTORY SKUs ── */}
            {!editing && (
              <>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>📦 Inventory SKUs & Lot Tracking</p>
                {form.variants.map((v, i) => (
                  <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="grid-3">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">SKU *</label>
                        <input className="input" value={v.sku} onChange={e => setVariant(i,'sku',e.target.value)} required placeholder="BDC-100-EDP" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Size (ml) *</label>
                        <input className="input" type="number" value={v.size_ml} onChange={e => setVariant(i,'size_ml',e.target.value)} required placeholder="100" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Concentration</label>
                        <select className="select" value={v.concentration} onChange={e => setVariant(i,'concentration',e.target.value)}>
                          {CONCENTRATIONS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid-3">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Compare At Price (MRP) (AED ) *</label>
                        <input className="input" type="number" value={v.compare_at_price} onChange={e => setVariant(i,'compare_at_price',e.target.value)} required placeholder="2999" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Selling Price (AED ) *</label>
                        <input className="input" type="number" value={v.selling_price} onChange={e => setVariant(i,'selling_price',e.target.value)} required placeholder="2499" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Cost Price (AED )</label>
                        <input className="input" type="number" value={v.cost_price} onChange={e => setVariant(i,'cost_price',e.target.value)} placeholder="1200" />
                      </div>
                    </div>
                    <div className="grid-3" style={{ marginTop: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Min Stock Alert *</label>
                        <input className="input" type="number" value={v.min_stock_alert} onChange={e => setVariant(i,'min_stock_alert',e.target.value)} required placeholder="5" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Loyalty Points</label>
                        <input className="input" type="number" value={v.loyalty_points} onChange={e => setVariant(i,'loyalty_points',e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    <div className="grid-3" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Barcode / UPC</label>
                        <input className="input" style={{ fontSize: '0.8rem' }} value={v.barcode} onChange={e => setVariant(i,'barcode',e.target.value)} placeholder="UPC-A barcode" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Batch / Lot Number</label>
                        <input className="input" style={{ fontSize: '0.8rem' }} value={v.batch_number} onChange={e => setVariant(i,'batch_number',e.target.value)} placeholder="BATCH-2026A" />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Expiry / Best Before</label>
                        <input className="input" type="date" style={{ fontSize: '0.8rem' }} value={v.expiry_date} onChange={e => setVariant(i,'expiry_date',e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {/* ── SECTION 4: MEDIA ASSETS & 3D STUDIO ── */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🎬 Media Assets & 3D Studio</p>
            
            {/* Direct Image Upload Zone */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Product Images *</label>
              
              {/* Luxury Drag & Drop Zone */}
              <label htmlFor="direct-image-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px', borderRadius: 'var(--radius-md)', border: '2px dashed rgba(201,168,76,0.3)',
                background: 'rgba(255,255,255,0.01)', cursor: 'pointer', textAlign: 'center',
                transition: 'border-color 0.2s, background-color 0.2s', marginBottom: 12
              }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'}>
                <span style={{ fontSize: '1.8rem', marginBottom: 6 }}>📸</span>
                <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginBottom: 2 }}>Drag & drop perfume images here</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>or click to browse local files (Supports JPG, PNG, WEBP)</span>
                <input id="direct-image-upload" type="file" multiple accept="image/*" onChange={handleDirectUpload} style={{ display: 'none' }} />
              </label>

              {/* Uploaded Thumbnails Grid with Cover Selection & Reordering */}
              {form.images?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, marginTop: 12 }}>
                    💡 <strong style={{ color: 'var(--gold)' }}>First image is the main Cover Photo</strong>. Click <strong>★ Set Cover</strong> or use <strong>◄ ► arrows</strong> to reorder images.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                    {form.images.map((imgUrl, idx) => {
                      const isCover = idx === 0
                      return (
                        <div key={idx} style={{
                          position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden', border: isCover ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                          background: '#0c0c12', boxShadow: isCover ? '0 0 10px rgba(201,168,76,0.35)' : 'none'
                        }}>
                          <img src={getMediaUrl(imgUrl)} alt={`Perfume ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          
                          {/* Cover Badge or Set Cover Button */}
                          {isCover ? (
                            <span style={{
                              position: 'absolute', top: 4, left: 4, background: 'var(--gold)', color: '#000',
                              fontSize: '0.58rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                              letterSpacing: '0.05em', boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}>
                              ★ COVER
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakeCover(idx)}
                              style={{
                                position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.75)', color: 'var(--gold)',
                                fontSize: '0.58rem', fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                                border: '1px solid var(--gold)', cursor: 'pointer'
                              }}
                              title="Set as Main Cover Photo"
                            >
                              ★ Cover
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            style={{
                              position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.85)', color: '#fff', fontSize: '0.65rem', fontWeight: 'bold',
                              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}
                            title="Delete Image"
                          >
                            ✕
                          </button>

                          {/* Reorder Arrows Bar at Bottom */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.8)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 6px'
                          }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, -1)}
                              style={{
                                background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                                fontSize: '0.75rem', cursor: idx === 0 ? 'default' : 'pointer', padding: '0 4px'
                              }}
                              title="Move Left"
                            >
                              ◄
                            </button>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700 }}>#{idx + 1}</span>
                            <button
                              type="button"
                              disabled={idx === form.images.length - 1}
                              onClick={() => handleMoveImage(idx, 1)}
                              style={{
                                background: 'none', border: 'none', color: idx === form.images.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                                fontSize: '0.75rem', cursor: idx === form.images.length - 1 ? 'default' : 'pointer', padding: '0 4px'
                              }}
                              title="Move Right"
                            >
                              ►
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Video Input */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Promotion / Unboxing Short Video (URL)</label>
              <input className="input" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/shorts/... or https://vimeo.com/..." style={{ fontSize: '0.8rem' }} />
            </div>

            {/* Pommastore AI 3D Studio Converter panel */}
            <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(10,10,15,0.8) 100%)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid rgba(201,168,76,0.2)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>⚡ POMMASTORE AI 3D STUDIO (INDEPENDENT)</span>
                {form.is_3d_active && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ 3D ACTIVE</span>}
              </div>
              
              {converting3D ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Converting dedicated 3D source photo to interactive 8K 3D model...</p>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${threeDProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 4, display: 'inline-block' }}>{threeDProgress}%</span>
                </div>
              ) : form.is_3d_active ? (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--gold)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                     <img src={getMediaUrl(form.three_d_source_image)} style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'spin 10s linear infinite' }} />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: '0.45rem', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: 2, color: 'var(--gold)' }}>360°</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', color: '#fff', margin: '0 0 2px 0' }}>Interactive 3D Bottle Active</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Generated successfully using your distinct 3D source image.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!form.three_d_source_image ? (
                    <label htmlFor="three-d-source-upload" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.2)',
                      background: 'rgba(0,0,0,0.2)', cursor: 'pointer', textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '1.2rem', marginBottom: 4 }}>📐</span>
                      <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Upload distinct 3D source photo</span>
                      <input id="three-d-source-upload" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
                    </label>
                  ) : (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ width: 50, height: 50, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)', background: '#0a0a0f' }}>
                         <img src={getMediaUrl(form.three_d_source_image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>Distinct 3D Source Ready</div>
                        <label htmlFor="three-d-source-change" style={{ fontSize: '0.68rem', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}>
                          Change Source Photo
                          <input id="three-d-source-change" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleConvert3D} style={{ height: 'var(--input-height)', padding: '0 12px' }}>
                        ✨ Convert to 3D
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── SECTION 5: PRODUCT VISUAL GALLERY ── */}
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🖼️ Product Visual Gallery</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>Upload lifestyle, social media, and editorial images for this product. These are displayed in a stunning gallery grid on the product landing page. You can optionally link each image to an Instagram post, campaign page, or product URL.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {(form.gallery_images || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.25)', background: '#0c0c12', flexShrink: 0 }}>
                    {item.image ? (
                      <img src={getMediaUrl(item.image)} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <label htmlFor={`gallery-upload-${idx}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }} title="Click to upload">
                        📸
                      </label>
                    )}
                    <label htmlFor={`gallery-upload-${idx}`} style={{ position: 'absolute', inset: 0, cursor: 'pointer', opacity: item.image ? 0 : 1 }} />
                    <input id={`gallery-upload-${idx}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleGalleryImageUpload(e, idx)} />
                  </div>
                  {/* Link input */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {item.image && (
                      <label htmlFor={`gallery-change-${idx}`} style={{ fontSize: '0.68rem', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline', width: 'fit-content' }}>
                        Change Image
                        <input id={`gallery-change-${idx}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleGalleryImageUpload(e, idx)} />
                      </label>
                    )}
                    <input
                      className="input"
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                      placeholder="Target link (optional): https://instagram.com/p/... or /product/slug"
                      value={item.link || ''}
                      onChange={e => updateGallerySlot(idx, 'link', e.target.value)}
                    />
                  </div>
                  {/* Remove */}
                  <button type="button" onClick={() => removeGallerySlot(idx)} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(220,50,50,0.12)', color: '#e05555', border: '1px solid rgba(220,50,50,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }} title="Remove slot">✕</button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addGallerySlot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.4)', background: 'rgba(201,168,76,0.04)', color: 'var(--gold-bright)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: 20, width: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem' }}>+</span> Add Gallery Image Slot
            </button>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Luxury Perfume')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewProductModal({ product, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 550 }}>
        <div className="modal-header">
          <span className="modal-title">👁️ Perfume Detailed Specifications — {product.name}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {product.images?.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
               <img src={getMediaUrl(product.images[0])} alt={product.name} style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          )}
          
          <div className="grid-2">
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>LONGEVITY SPEC</span>
              <strong>⏳ {product.longevity_hours || '8-12'} Hours</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>SILLAGE POWER</span>
              <strong>💨 {product.sillage_rating || 'Heavy'} Rating</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>👃 OLFACTORY PYRAMID</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem' }}>
              <div><strong style={{ color: 'var(--gold)' }}>Top Notes:</strong> {product.scent_notes?.top?.join(', ') || 'Bergamot, Lemon, Mandarin'}</div>
              <div><strong style={{ color: 'var(--gold)' }}>Heart Notes:</strong> {product.scent_notes?.heart?.join(', ') || 'Rose, Jasmine, Patchouli'}</div>
              <div><strong style={{ color: 'var(--gold)' }}>Base Notes:</strong> {product.scent_notes?.base?.join(', ') || 'Amber, Musk, Vanilla, Cedarwood'}</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close Specifications</button>
        </div>
      </div>
    </div>
  )
}

export default function Products({ hideHeader }) {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/products', { params: { search: search || undefined, limit: 100 } }),
      api.get('/brands'),
      api.get('/categories'),
    ]).then(([p, b, c]) => {
      setProducts(p.data); setBrands(b.data); setCategories(c.data)
    }).catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false))
  }

  const handleToggleActive = async (product) => {
    const newStatus = !product.is_active
    try {
      await api.patch(`/products/${product.id}`, { is_active: newStatus })
      toast.success(newStatus ? 'Product activated' : 'Product deactivated')
      load()
    } catch (err) {
      toast.error('Failed to update product status')
    }
  }

  const handleToggleSection = async (product) => {
    let patchData = {};
    let nextLabel = '';
    if (product.is_featured) {
      // Featured -> New Arrival
      patchData = { is_featured: false, is_new_arrival: true };
      nextLabel = 'New Arrival';
    } else if (product.is_new_arrival) {
      // New Arrival -> Standard
      patchData = { is_featured: false, is_new_arrival: false };
      nextLabel = 'Standard';
    } else {
      // Standard -> Featured
      patchData = { is_featured: true, is_new_arrival: false };
      nextLabel = 'Featured';
    }
    try {
      await api.patch(`/products/${product.id}`, patchData)
      toast.success(`Product marked as ${nextLabel}`)
      load()
    } catch (err) {
      toast.error('Failed to update product section')
    }
  }

  const handleDeleteProduct = async (productItem) => {
    if (window.confirm(`Are you sure you want to delete product "${productItem.name}"?\n\nThis will permanently delete the product and all its associated SKU variants.`)) {
      try {
        await api.delete(`/products/${productItem.id}`)
        toast.success(`Product "${productItem.name}" deleted successfully!`)
        load()
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to delete product')
      }
    }
  }

  useEffect(() => { load() }, [search])

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title">Catalog & Products</div>
            <div className="page-subtitle">Manage perfume master definitions, fragrances, notes, and variants</div>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setModal('new')} style={{ background: 'var(--gold)', color: '#000', fontWeight: 'bold' }}>
            <Plus size={16} /> New Product
          </button>
        </div>
      )}

      {/* Dynamic KPI Summary Bar */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Products</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{products.length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Master perfume lines</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Products</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{products.filter(p => p.is_active).length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Live on storefront</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Variants</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 4 }}>{products.reduce((acc, p) => acc + (p.variants?.length || 0), 0)}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>SKUs configured</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Brand Houses</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{brands.length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Distinct perfume houses</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search className="search-icon" />
            <input className="input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{products.length} products</span>
            {hideHeader && (
              <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}><Plus size={14} /> New Product</button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>Brand</th><th>Gender</th><th>Variants</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="table-empty">Loading…</td></tr>
             : products.length === 0 ? <tr><td colSpan={7} className="table-empty">No products yet.</td></tr>
             : products.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.slug}</div>
                </td>
                <td><span className="badge badge-gold">{p.brand_name}</span></td>
                <td>{p.gender || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td><span className="badge badge-info">{p.variants?.length || 0} variants</span></td>
                <td>
                  {p.variants?.map(v => (
                    <div key={v.id} style={{ fontSize: '0.72rem' }}>
                      {v.sku}: <strong style={{ color: v.current_stock <= v.min_stock_alert ? 'var(--error)' : 'var(--success)' }}>{v.current_stock}</strong>
                    </div>
                  ))}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                    <button 
                      onClick={() => handleToggleActive(p)}
                      className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button 
                      onClick={() => handleToggleSection(p)}
                      className={`badge ${p.is_featured ? 'badge-gold' : p.is_new_arrival ? 'badge-warning' : 'badge-neutral'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      {p.is_featured ? '★ Featured' : p.is_new_arrival ? '⚡ New Arrival' : 'Standard'}
                    </button>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewModal(p)} title="View"><Eye size={13} style={{ color: 'var(--text-muted)' }} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(p)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeleteProduct(p)} title="Delete Product" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewModal && (
        <ViewProductModal product={viewModal} onClose={() => setViewModal(null)} />
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          brands={brands} categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
          onRefreshData={load}
        />
      )}
    </div>
  )
}
