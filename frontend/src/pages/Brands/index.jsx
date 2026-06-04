import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Globe, Eye } from 'lucide-react'
import api from '../../services/api'
import { getMediaUrl } from '../../services/media'
import toast from 'react-hot-toast'
import InfoButton from '../../components/ui/InfoButton'

function BrandModal({ brand, onClose, onSaved }) {
  const editing = !!brand
  const [form, setForm] = useState({
    name: brand?.name || '', slug: brand?.slug || '',
    description: brand?.description || '', logo_url: brand?.logo_url || '',
    gallery: brand?.gallery || (brand?.logo_url ? [brand.logo_url] : []),
    is_active: brand?.is_active ?? true,
    origin_country: brand?.origin_country || '',
    video_url: brand?.video_url || '',
    three_d_source_image: brand?.three_d_source_image || '',
    is_3d_active: brand?.is_3d_active || false,
    remove_background: brand?.remove_background ?? true,

    // Heritage & Authority
    founding_year: brand?.founding_year || '',
    lead_perfumer: brand?.lead_perfumer || '',
    philosophy: brand?.philosophy || '',
    instagram_url: brand?.instagram_url || '',
    tiktok_url: brand?.tiktok_url || '',
    fragrantica_url: brand?.fragrantica_url || '',

    // Visual Identity & Brand Palette
    brand_icon: brand?.brand_icon || '',
    brand_banner: brand?.brand_banner || '',
    primary_color: brand?.primary_color || '#d4af37',
    secondary_color: brand?.secondary_color || '#000000',
    seo_title: brand?.seo_title || '',
    meta_description: brand?.meta_description || '',
    keywords: brand?.keywords || '',

    // Legal & Logistics (ERP Brain)
    trademark_number: brand?.trademark_number || '',
    manufacturer_info: brand?.manufacturer_info || '',
    brand_commission: brand?.brand_commission || '',
    exclusivity_toggle: brand?.exclusivity_toggle ?? false,
    brand_tier: brand?.brand_tier || 'Niche',
    gst_category: brand?.gst_category || 'Perfumes (18% GST)',

    // Social Media & AI Assets
    brand_keywords: brand?.brand_keywords || '',
    font_preference: brand?.font_preference || 'Serif',
    default_hashtags: brand?.default_hashtags || '#LuxuryScent #PerfumeHouse',
  })
  const [saving, setSaving] = useState(false)
  const [converting3D, setConverting3D] = useState(false)
  const [threeDProgress, setThreeDProgress] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleDirectUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    const uploadToast = toast.loading(`Uploading ${files.length} brand image(s)...`)
    
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
        gallery: [...(p.gallery || []), ...newUrls],
        logo_url: p.logo_url || newUrls[0] // Set first one as primary logo if none exists
      }))
      
      toast.success(`${files.length} image(s) processed and stored!`, { id: uploadToast })
    } catch (err) {
      toast.error('Asset storage failed. Please check file size/type.', { id: uploadToast })
    }
  }

  const handleRemoveImage = (idx) => {
    setForm(p => {
      const list = [...(p.gallery || [])]
      list.splice(idx, 1)
      return { ...p, gallery: list }
    })
  }

  const handleThreeDImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      set('three_d_source_image', reader.result)
      toast.success('3D Brand Source Image uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleIconUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      set('brand_icon', reader.result)
      toast.success('Brand Icon uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleBannerUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      set('brand_banner', reader.result)
      toast.success('Brand Banner uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleConvert3D = () => {
    if (!form.three_d_source_image) {
      toast.error('Please upload a brand photo or logo first!')
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
          toast.success(`Kozmocart 3D Maker: Brand 3D asset generated ${form.remove_background ? 'without background' : 'with studio background'}!`)
          return 100
        }
        return p + 25
      })
    }, 250)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    const payload = {
      ...form,
      brand_commission: form.brand_commission === '' ? null : parseFloat(form.brand_commission),
      logo_url: form.logo_url || (form.gallery?.[0] || null),
    }
    try {
      if (editing) await api.patch(`/brands/${brand.id}`, payload)
      else await api.post('/brands', payload)
      toast.success(editing ? 'Brand updated' : 'Brand created')
      onSaved()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        toast.error(detail.map(d => `${d.loc[d.loc.length-1]}: ${d.msg}`).join('\n'))
      } else {
        toast.error(detail || 'Save failed')
      }
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{editing ? 'Edit Brand' : 'New Brand'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Brand Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Chanel" />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Origin Country</label>
              <input className="input" value={form.origin_country} onChange={e => set('origin_country', e.target.value)} placeholder="France" />
            </div>

            {/* Brand Images Direct Multi-Uploader */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Brand Images / Logos *</label>
              
              <label htmlFor="brand-logo-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '20px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.3)',
                background: 'rgba(255,255,255,0.01)', cursor: 'pointer', textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>📸</span>
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Drag & drop multiple Brand images here</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>or click to browse local files</span>
                <input id="brand-logo-upload" type="file" multiple accept="image/*" onChange={handleDirectUpload} style={{ display: 'none' }} />
              </label>

              {form.gallery?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, marginTop: 10 }}>
                  {form.gallery.map((imgUrl, idx) => (
                    <div key={idx} style={{
                      position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0c0c12'
                    }}>
                      <img src={getMediaUrl(imgUrl)} alt={`Brand ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => handleRemoveImage(idx)} style={{
                        position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', fontWeight: 'bold',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }} title="Delete Image">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Advanced ERP & 3D Parameters */}
            <div style={{ margin: '14px 0 20px 0', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAdvanced(!showAdvanced)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', fontSize: '0.78rem', fontWeight: 'bold', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--gold-bright)' }}>
                {showAdvanced ? '✨ Hide Advanced ERP & 3D Maker Settings ▲' : '⚡ Show Advanced ERP & 3D Maker Settings ▼'}
              </button>
            </div>

            {showAdvanced && (
              <>
                {/* Video Promotion URL */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Brand Promotion / Scent Introduction Video</label>
                  <input className="input" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/shorts/... or https://vimeo.com/..." style={{ fontSize: '0.8rem' }} />
                </div>

                {/* Kozmocart AI 3D Logo Maker Studio */}
                <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(10,10,15,0.8) 100%)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(201,168,76,0.2)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>⚡ KOZMOCART AI 3D LOGO MAKER</span>
                    {form.is_3d_active && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ 3D ACTIVE</span>}
                  </div>

                  {converting3D ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Processing 3D Brand mesh model ({form.remove_background ? 'removing background' : 'with studio background'})...</p>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${threeDProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4, display: 'inline-block' }}>{threeDProgress}%</span>
                    </div>
                  ) : form.is_3d_active ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 54, height: 54, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--gold)', background: form.remove_background ? 'transparent' : 'linear-gradient(45deg, #1f1a10, #0a0a0f)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img src={getMediaUrl(form.three_d_source_image)} style={{ width: '80%', height: '80%', objectFit: 'contain', animation: 'spinLogo 8s linear infinite' }} />
                        <span style={{ position: 'absolute', bottom: 1, right: 1, fontSize: '0.4rem', background: 'rgba(0,0,0,0.6)', padding: '1px 2px', borderRadius: 2, color: 'var(--gold)' }}>3D</span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', color: '#fff', margin: '0 0 2px 0' }}>Interactive 3D Brand Logo Active</h4>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Generated successfully ({form.remove_background ? 'No Background' : 'With Studio Background'}). Spinning interactive logo enabled.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {!form.three_d_source_image ? (
                        <label htmlFor="brand-three-d-upload" style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.2)',
                          background: 'rgba(0,0,0,0.2)', cursor: 'pointer', textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '1rem', marginBottom: 2 }}>📐</span>
                          <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>Upload logo specifically for 3D Maker</span>
                          <input id="brand-three-d-upload" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
                        </label>
                      ) : (
                        <div>
                          {/* Background / Transparent Toggle Option */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: 4, marginBottom: 10, border: '1px solid rgba(255,255,255,0.02)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Remove Background (Transparent 3D Asset)</span>
                            <input type="checkbox" checked={form.remove_background} onChange={e => set('remove_background', e.target.checked)} style={{ width: 14, height: 14 }} />
                          </div>

                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)', background: '#0a0a0f' }}>
                              <img src={getMediaUrl(form.three_d_source_image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Logo Image Loaded</span>
                              <label htmlFor="brand-three-d-change" style={{ fontSize: '0.65rem', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Change Image
                                <input id="brand-three-d-change" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
                              </label>
                            </div>
                            <button type="button" className="btn btn-primary btn-sm" onClick={handleConvert3D}>
                              ✨ Make 3D
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <style>{`
                  @keyframes spinLogo {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                  }
                `}</style>

                <div className="form-group">
                  <label className="form-label">Brand Philosophy & Ethos (Mission Statement)</label>
                  <textarea className="textarea" value={form.philosophy} onChange={e => set('philosophy', e.target.value)} rows={2} placeholder="e.g. Sustainable luxury from the heart of Wayanad..." />
                </div>

                {/* ── SECTION: HERITAGE & PERFUMER ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🌍 Brand Authority & Heritage</p>
                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Founding Year</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.founding_year} onChange={e => set('founding_year', e.target.value)} placeholder="e.g. 1982" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Lead Perfumer Name (The Nose)</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.lead_perfumer} onChange={e => set('lead_perfumer', e.target.value)} placeholder="e.g. Jean-Claude Ellena" />
                  </div>
                </div>

                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Instagram URL</label>
                    <input className="input" style={{ fontSize: '0.75rem' }} value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">TikTok URL</label>
                    <input className="input" style={{ fontSize: '0.75rem' }} value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/..." />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Fragrantica Profile Link</label>
                    <input className="input" style={{ fontSize: '0.75rem' }} value={form.fragrantica_url} onChange={e => set('fragrantica_url', e.target.value)} placeholder="https://fragrantica.com/..." />
                  </div>
                </div>

                {/* ── SECTION: VISUALS & GLOBAL SEO ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🎨 Visual Identity & Global SEO</p>
                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Square Favicon / App Icon</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {form.brand_icon && (
                        <img src={getMediaUrl(form.brand_icon)} alt="Icon Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--gold-border)' }} />
                      )}
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.3)', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>📁 Choose/Drag Icon</span>
                        <input type="file" accept="image/*" onChange={handleIconUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Cinematic Wide Banner Image</label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {form.brand_banner && (
                        <img src={getMediaUrl(form.brand_banner)} alt="Banner Preview" style={{ width: 80, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--gold-border)' }} />
                      )}
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.3)', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>📁 Choose/Drag Banner</span>
                        <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Primary Color Theme</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', height: 'var(--input-height)' }}>
                      <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)} style={{ border: 'none', background: 'none', width: 34, height: 34, cursor: 'pointer' }} />
                      <input className="input" style={{ flex: 1, fontSize: '0.8rem' }} value={form.primary_color} onChange={e => set('primary_color', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Secondary Color Theme</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', height: 'var(--input-height)' }}>
                      <input type="color" value={form.secondary_color} onChange={e => set('secondary_color', e.target.value)} style={{ border: 'none', background: 'none', width: 34, height: 34, cursor: 'pointer' }} />
                      <input className="input" style={{ flex: 1, fontSize: '0.8rem' }} value={form.secondary_color} onChange={e => set('secondary_color', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="grid-2" style={{ marginBottom: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">SEO Meta Title</label>
                      <input className="input" style={{ fontSize: '0.8rem' }} value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="e.g. The Finest Oud Perfumes in India" />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">SEO Meta Description</label>
                      <input className="input" style={{ fontSize: '0.8rem' }} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="A sensory brand meta description..." />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">SEO Keywords (Comma separated)</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="luxury, oud, perfume, france" />
                  </div>
                </div>

                {/* ── SECTION: LOGISTICS & TAX (THE ERP BRAIN) ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>📄 Legal, Logistics & Tax (The ERP Brain)</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Trademark / Reg. Number</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.trademark_number} onChange={e => set('trademark_number', e.target.value)} placeholder="e.g. TM-908722" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Brand Marketplace Commission %</label>
                    <input className="input" type="number" style={{ fontSize: '0.8rem' }} value={form.brand_commission} onChange={e => set('brand_commission', e.target.value)} placeholder="e.g. 15" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Brand Tier</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.brand_tier} onChange={e => set('brand_tier', e.target.value)}>
                      <option value="Niche">Niche Perfumery (Ultra Premium)</option>
                      <option value="Designer">Designer Label (Luxury Fashion)</option>
                      <option value="Indie">Indie (Artisanal Small-batch)</option>
                      <option value="Mass Market">Mass Market (Commercial)</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tax / GST Category</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.gst_category} onChange={e => set('gst_category', e.target.value)}>
                      <option value="Perfumes (18% GST)">Fragrances / Cosmetics (18% GST)</option>
                      <option value="Samples (12% GST)">Promotional Handouts (12% GST)</option>
                      <option value="Exempt">Exempt / Duty Free</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer', color: 'var(--gold)' }}>
                      <input type="checkbox" checked={form.exclusivity_toggle} onChange={e => set('exclusivity_toggle', e.target.checked)} />
                      🤝 Exclusive Partner Brand to Platform
                    </label>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Manufacturer Contact / Factory Address</label>
                  <textarea className="textarea" value={form.manufacturer_info} onChange={e => set('manufacturer_info', e.target.value)} rows={2} placeholder="Factory address, warehouse contacts, and supply chain notes..." />
                </div>

                {/* ── SECTION: SOCIAL & AI BRAND VIBE ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>📈 Social Media & AI Creative Assets</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Brand Vibe Keywords</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.brand_keywords} onChange={e => set('brand_keywords', e.target.value)} placeholder="Minimalist, Bold, Dark, Royal" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Typography Preference</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.font_preference} onChange={e => set('font_preference', e.target.value)}>
                      <option value="Serif">Elegant Serif (Classic Heritage)</option>
                      <option value="Sans-Serif">Modern Sans-Serif (Clean Minimalist)</option>
                      <option value="Display">Artistic Display (Bold / Avant-garde)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Default Social Hashtags</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.default_hashtags} onChange={e => set('default_hashtags', e.target.value)} placeholder="#LuxuryScent #BrandName" />
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">General Description</label>
              <textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Tell the legacy story of the perfume house..." />
            </div>

            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <input type="checkbox" id="brand-active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
              <label htmlFor="brand-active" className="form-label" style={{ marginBottom: 0 }}>Active</label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Brand')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewBrandModal({ brand, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">👁️ Brand Legacy Quick View — {brand.name}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {brand.logo_url && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <img src={getMediaUrl(brand.logo_url)} alt={brand.name} style={{ maxHeight: 60, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }} />
            </div>
          )}
          <div style={{ background: 'rgba(201,168,76,0.06)', padding: 14, borderRadius: 8, border: '1px solid rgba(201,168,76,0.2)' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>ORIGIN COUNTRY / REGION</span>
            <strong>🌍 {brand.origin_country || 'Global Scents House'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>LEGACY DESCRIPTION</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              {brand.description || 'No legacy description provided for this luxury perfume house.'}
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close Brand View</button>
        </div>
      </div>
    </div>
  )
}

export default function Brands({ hideHeader }) {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | brand object
  const [viewModal, setViewModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/brands', { params: { search: search || undefined } })
      .then(r => setBrands(r.data))
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const handleToggleActive = async (brand) => {
    const newStatus = !brand.is_active
    if (!newStatus) {
      if (!confirm(`Deactivating "${brand.name}" will also deactivate all its products. Continue?`)) return
    }
    
    try {
      await api.patch(`/brands/${brand.id}`, { is_active: newStatus })
      toast.success(newStatus ? 'Brand activated' : 'Brand and all its products deactivated')
      load()
    } catch (err) {
      toast.error('Failed to update brand status')
    }
  }

  const handleDelete = async (brand) => {
    if (!confirm(`Delete "${brand.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/brands/${brand.id}`)
      toast.success('Brand deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title">Brands</div>
            <div className="page-subtitle">Manage your perfume house catalog</div>
          </div>
          <button id="btn-new-brand" className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={14} /> New Brand
          </button>
        </div>
      )}


      {/* Dynamic KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Total Brands <InfoButton text="Aggregated summary of corporate corporate perfume creator entities." /></span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{brands.length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Registered perfume houses</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Active Houses <InfoButton text="Authorized and listed brands having status set to online." /></span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 4 }}>{brands.filter(b => b.is_active).length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Currently active on catalog</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Avg Products / House <InfoButton text="Mathematical standard density of merchandise catalog size divided by total volume of brand entries." /></span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{brands.length ? Math.round(brands.reduce((acc, b) => acc + (b.product_count || 0), 0) / brands.length) : 0}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Mean density per brand</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Global Origins <InfoButton text="Count of geopolitical sovereign states referenced across brand origin designations." /></span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{new Set(brands.map(b => b.origin_country).filter(Boolean)).size || 'Global'}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Sovereign countries represented</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search className="search-icon" />
            <input className="input" placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{brands.length} brands</span>
            {hideHeader && (
              <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}><Plus size={14} /> New Brand</button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Origin</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="table-empty">Loading…</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No brands found. Add your first brand!</td></tr>
            ) : brands.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.slug}</div>
                </td>
                <td>
                  {b.origin_country
                    ? <span className="flex items-center gap-2"><Globe size={12} color="var(--text-muted)" />{b.origin_country}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td><span className="badge badge-info">{b.product_count}</span></td>
                <td>
                  <button 
                    onClick={() => handleToggleActive(b)}
                    className={`badge ${b.is_active ? 'badge-success' : 'badge-neutral'}`}
                    style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                  >
                    {b.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewModal(b)} title="View"><Eye size={13} style={{ color: 'var(--text-muted)' }} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(b)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(b)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewModal && (
        <ViewBrandModal brand={viewModal} onClose={() => setViewModal(null)} />
      )}

      {modal && (
        <BrandModal
          brand={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
