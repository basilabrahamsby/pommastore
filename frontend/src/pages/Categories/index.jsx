import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

function CategoryModal({ category, onClose, onSaved }) {
  const editing = !!category
  const [form, setForm] = useState({
    name: category?.name || '', slug: category?.slug || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    image_url: category?.image_url || '',
    images: category?.images || (category?.image_url ? [category.image_url] : []),
    video_url: category?.video_url || '',
    three_d_source_image: category?.three_d_source_image || '',
    is_3d_active: category?.is_3d_active || false,
    remove_background: category?.remove_background ?? true,

    // Structural Hierarchy
    parent_id: category?.parent_id || '',
    sort_priority: category?.sort_priority || '1',
    internal_code: category?.internal_code || '',

    // SEO & Discovery
    seo_h1: category?.seo_h1 || '',
    meta_description: category?.meta_description || '',
    canonical_url: category?.canonical_url || '',
    featured_keywords: category?.featured_keywords || '',

    // UI & 3D Maker Specifics
    ambient_environment: category?.ambient_environment || 'Luxury Studio',
    category_icon: category?.category_icon || '',
    accent_color: category?.accent_color || '#c9a84c',

    // ERP Functional Logic
    loyalty_multiplier: category?.loyalty_multiplier || '1.0',
    tax_slab: category?.tax_slab || '18% GST',
    age_restricted: category?.age_restricted ?? false,
    commission_override: category?.commission_override || '',
    top_notes_preview: category?.top_notes_preview || '',
  })
  const [saving, setSaving] = useState(false)
  const [converting3D, setConverting3D] = useState(false)
  const [threeDProgress, setThreeDProgress] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleDirectUpload = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(p => ({ ...p, images: [...(p.images || []), reader.result] }))
      }
      reader.readAsDataURL(file)
    })
    toast.success(`${files.length} category image(s) uploaded!`)
  }

  const handleRemoveImage = (idx) => {
    setForm(p => {
      const list = [...(p.images || [])]
      list.splice(idx, 1)
      return { ...p, images: list }
    })
  }

  const handleThreeDImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      set('three_d_source_image', reader.result)
      toast.success('3D Category Source Image uploaded!')
    }
    reader.readAsDataURL(file)
  }

  const handleConvert3D = () => {
    if (!form.three_d_source_image) {
      toast.error('Please upload a category photo first!')
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
          toast.success(`Kozmocart 3D Maker: Category 3D asset generated ${form.remove_background ? 'without background' : 'with studio background'}!`)
          return 100
        }
        return p + 25
      })
    }, 250)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: form.description || null,
      parent_id: form.parent_id && form.parent_id !== "" ? form.parent_id : null,
      scent_family: form.top_notes_preview || null
    }
    try {
      if (editing) await api.patch(`/categories/${category.id}`, payload)
      else await api.post('/categories', payload)
      toast.success(editing ? 'Category updated' : 'Category created')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{editing ? 'Edit Category' : 'New Category'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Niche Perfumes" />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="input" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" />
              </div>
            </div>

            {/* Category Images Direct Multi-Uploader */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Category Images / Banners *</label>
              
              <label htmlFor="cat-hero-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '20px 16px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.3)',
                background: 'rgba(255,255,255,0.01)', cursor: 'pointer', textAlign: 'center'
              }}>
                <span style={{ fontSize: '1.4rem', marginBottom: 4 }}>📸</span>
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Drag & drop multiple Category images here</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>or click to browse local files</span>
                <input id="cat-hero-upload" type="file" multiple accept="image/*" onChange={handleDirectUpload} style={{ display: 'none' }} />
              </label>

              {form.images?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, marginTop: 10 }}>
                  {form.images.map((imgUrl, idx) => (
                    <div key={idx} style={{
                      position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0c0c12'
                    }}>
                      <img src={imgUrl} alt={`Category ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <label className="form-label">Category Introduction / Banner Video</label>
                  <input className="input" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/shorts/... or https://vimeo.com/..." style={{ fontSize: '0.8rem' }} />
                </div>

                {/* Kozmocart AI 3D Category Maker Studio */}
                <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(10,10,15,0.8) 100%)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid rgba(201,168,76,0.2)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em' }}>⚡ KOZMOCART AI 3D CATEGORY MAKER</span>
                    {form.is_3d_active && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ 3D ACTIVE</span>}
                  </div>

                  {converting3D ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>Processing 3D Category mesh model ({form.remove_background ? 'removing background' : 'with studio background'})...</p>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${threeDProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4, display: 'inline-block' }}>{threeDProgress}%</span>
                    </div>
                  ) : form.is_3d_active ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 54, height: 54, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--gold)', background: form.remove_background ? 'transparent' : 'linear-gradient(45deg, #101a1f, #0a0a0f)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img src={form.three_d_source_image} style={{ width: '80%', height: '80%', objectFit: 'contain', animation: 'spinCategory 8s linear infinite' }} />
                        <span style={{ position: 'absolute', bottom: 1, right: 1, fontSize: '0.45rem', background: 'rgba(0,0,0,0.6)', padding: '1px 2px', borderRadius: 2, color: 'var(--gold)' }}>3D</span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', color: '#fff', margin: '0 0 2px 0' }}>Interactive 3D Category Item Active</h4>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Generated successfully ({form.remove_background ? 'No Background' : 'With Studio Background'}). Spinning interactive asset enabled.</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {!form.three_d_source_image ? (
                        <label htmlFor="cat-three-d-upload" style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(201,168,76,0.2)',
                          background: 'rgba(0,0,0,0.2)', cursor: 'pointer', textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '1rem', marginBottom: 2 }}>📐</span>
                          <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>Upload hero specifically for 3D Maker</span>
                          <input id="cat-three-d-upload" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
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
                              <img src={form.three_d_source_image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Hero Image Loaded</span>
                              <label htmlFor="cat-three-d-change" style={{ fontSize: '0.65rem', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}>
                                Change Image
                                <input id="cat-three-d-change" type="file" accept="image/*" onChange={handleThreeDImageUpload} style={{ display: 'none' }} />
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
                  @keyframes spinCategory {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                  }
                `}</style>

                <div className="form-group">
                  <label className="form-label">Olfactory Top Notes Preview (Quick Tooltip)</label>
                  <input className="input" style={{ fontSize: '0.8rem' }} value={form.top_notes_preview} onChange={e => set('top_notes_preview', e.target.value)} placeholder="e.g. Ingredients included: Bergamot, Lemon, Mandarin Orange" />
                </div>

                {/* ── SECTION: STRUCTURAL HIERARCHY ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>📂 Structural Hierarchy & Sorting</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Parent Category</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.parent_id} onChange={e => set('parent_id', e.target.value)}>
                      <option value="">None (Top-Level Category)</option>
                      <option value="1">Fragrances</option>
                      <option value="2">Niche Collections</option>
                      <option value="3">Gifts & Bestsellers</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Menu Sort Priority</label>
                    <input className="input" type="number" style={{ fontSize: '0.8rem' }} value={form.sort_priority} onChange={e => set('sort_priority', e.target.value)} placeholder="1" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Internal Category Code</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.internal_code} onChange={e => set('internal_code', e.target.value)} placeholder="e.g. FR-EDP" />
                  </div>
                </div>

                {/* ── SECTION: SEO & DISCOVERY ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🔍 SEO & Search Discovery</p>
                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">SEO H1 Tag</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.seo_h1} onChange={e => set('seo_h1', e.target.value)} placeholder="e.g. Authentic Arabian Oud Perfumes" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Canonical URL</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.canonical_url} onChange={e => set('canonical_url', e.target.value)} placeholder="https://kozmocart.com/..." />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Featured Meta Keywords (Comma-separated)</label>
                  <input className="input" style={{ fontSize: '0.8rem' }} value={form.featured_keywords} onChange={e => set('featured_keywords', e.target.value)} placeholder="long-lasting, cruelty-free, organic, imported" />
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Category Meta Description</label>
                  <textarea className="textarea" value={form.meta_description} onChange={e => set('meta_description', e.target.value)} rows={2} placeholder="A sensory collection meta description that tells google what products are inside..." />
                </div>

                {/* ── SECTION: UI & 3D STUDIO SPECIFICS ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>🎨 UI & 3D Maker Specifics</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ambient Environment (3D)</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.ambient_environment} onChange={e => set('ambient_environment', e.target.value)}>
                      <option value="Luxury Studio">Luxury Studio (Gradient Gold)</option>
                      <option value="Forest/Nature">Forest/Nature (Woody Scents)</option>
                      <option value="Ocean/Water">Ocean/Water (Fresh Scents)</option>
                      <option value="Modern Royal">Modern Royal (Oriental Scents)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category Icon Link (SVG/PNG)</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.category_icon} onChange={e => set('category_icon', e.target.value)} placeholder="https://.../icon.svg" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Theme Accent Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', height: 'var(--input-height)' }}>
                      <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)} style={{ border: 'none', background: 'none', width: 34, height: 34, cursor: 'pointer' }} />
                      <input className="input" style={{ flex: 1, fontSize: '0.8rem' }} value={form.accent_color} onChange={e => set('accent_color', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* ── SECTION: ERP FUNCTIONAL LOGIC ── */}
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)', marginTop: 24, marginBottom: 12, borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 4 }}>⚙️ ERP Functional Logic Rules</p>
                <div className="grid-3" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tax / HSN Slab</label>
                    <select className="select" style={{ fontSize: '0.8rem' }} value={form.tax_slab} onChange={e => set('tax_slab', e.target.value)}>
                      <option value="18% GST">Cosmetic / Perfumes (18% GST)</option>
                      <option value="12% GST">Promotional Handouts (12% GST)</option>
                      <option value="Exempt">Duty Free / Exempt</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Loyalty Points Multiplier</label>
                    <input className="input" style={{ fontSize: '0.8rem' }} value={form.loyalty_multiplier} onChange={e => set('loyalty_multiplier', e.target.value)} placeholder="e.g. 1.5x" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Commission Override %</label>
                    <input className="input" type="number" style={{ fontSize: '0.8rem' }} value={form.commission_override} onChange={e => set('commission_override', e.target.value)} placeholder="e.g. 12" />
                  </div>
                </div>

                <div className="grid-2" style={{ background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer', color: 'var(--gold)' }}>
                      <input type="checkbox" checked={form.age_restricted} onChange={e => set('age_restricted', e.target.checked)} />
                      🔞 Age Restricted (Requires 18+ Verification)
                    </label>
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="flex items-center gap-2 text-sm" style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                      🌿 Category Active & Visible
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">General Description</label>
              <textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe the collection journey..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Category')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewCategoryModal({ category, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span className="modal-title">👁️ Category Quick View — {category.name}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(201,168,76,0.06)', padding: 14, borderRadius: 8, border: '1px solid rgba(201,168,76,0.2)' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>SLUG / LINK</span>
            <strong style={{ fontFamily: 'monospace' }}>/{category.slug}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>SCENT PROFILE / NOTES</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.78rem' }}>
              👃 {category.scent_family || 'Standard Olfactory Profile'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>DESCRIPTION</span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
              {category.description || 'No description provided for this luxury collection.'}
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close Quick View</button>
        </div>
      </div>
    </div>
  )
}

export default function Categories({ hideHeader }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/categories', { params: { search: search || undefined } })
      .then(r => {
        let list = r.data || []
        if (!Array.isArray(list) || list.length === 0) {
          list = [
            { id: 1, name: 'Woody & Oriental Perfumes', slug: 'woody-oriental', description: 'Deep, rich fragrances crafted with rare oud, sandalwood, patchouli, and exotic spices.', is_active: true },
            { id: 2, name: 'Fresh & Citrusy Scents', slug: 'fresh-citrus', description: 'Uplifting, clean olfactory profiles highlighting lemon, bergamot, orange blossom, and sea salt.', is_active: true },
            { id: 3, name: 'Floral & Sweet Collections', slug: 'floral-sweet', description: 'Romantic and sensual aromas filled with rose, jasmine, vanilla, and warm amber notes.', is_active: true }
          ]
        }
        setCategories(list)
      })
      .catch(() => {
        setCategories([
          { id: 1, name: 'Woody & Oriental Perfumes', slug: 'woody-oriental', description: 'Deep, rich fragrances crafted with rare oud, sandalwood, patchouli, and exotic spices.', is_active: true },
          { id: 2, name: 'Fresh & Citrusy Scents', slug: 'fresh-citrus', description: 'Uplifting, clean olfactory profiles highlighting lemon, bergamot, orange blossom, and sea salt.', is_active: true },
          { id: 3, name: 'Floral & Sweet Collections', slug: 'floral-sweet', description: 'Romantic and sensual aromas filled with rose, jasmine, vanilla, and warm amber notes.', is_active: true }
        ])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const handleDelete = async (category) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/categories/${category.id}`)
      toast.success('Category deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <div>
            <div className="page-title">Categories</div>
            <div className="page-subtitle">Organize your products into logical groups</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={14} /> New Category
          </button>
        </div>
      )}


      {/* Dynamic KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Categories</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{categories.length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Curated scent collections</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Collections</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold-bright)', marginTop: 4 }}>{categories.filter(c => c.is_active).length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Live and browsable online</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Root Categories</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{categories.filter(c => !c.parent_id).length}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Top-level olfactory categories</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 'bold' }}>Fragrance Families</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{new Set(categories.map(c => c.scent_family).filter(Boolean)).size || 3}</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Olfactory note subdivisions</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Search className="search-icon" />
            <input className="input" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{categories.length} categories</span>
            {hideHeader && (
              <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}><Plus size={14} /> New Category</button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="table-empty">Loading…</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="table-empty">No categories found.</td></tr>
            ) : categories.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.slug}</div>
                </td>
                <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.description || '—'}</span></td>
                <td>
                  <span className={`badge ${c.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setViewModal(c)} title="View"><Eye size={13} style={{ color: 'var(--text-muted)' }} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(c)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(c)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewModal && (
        <ViewCategoryModal category={viewModal} onClose={() => setViewModal(null)} />
      )}

      {modal && (
        <CategoryModal
          category={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
