import { useState, useEffect } from 'react'
import { 
  Monitor, Image as ImageIcon, Upload, Trash2, Plus, Save, Sparkles, 
  LayoutTemplate, Type, AlignLeft, Link as LinkIcon, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { getMediaUrl } from '../../services/media'


const API_BASE = import.meta.env.VITE_API_URL || ''

export default function StorefrontCMS() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Composite CMS state
  const [heroSlides, setHeroSlides] = useState([
    { image: '/hero-1.png', title: '', subtitle: '', desc: '', cta: '' }
  ])
  const [splitBanners, setSplitBanners] = useState({
    men: '/banner-men.png',
    women: '/banner-women.png'
  })
  const [midQuote, setMidQuote] = useState({
    text: '',
    author: ''
  })
  const [houseFavorites, setHouseFavorites] = useState([
    { img: '/arch-1.png', name: 'YVES SAINT LAURENT' },
    { img: '/arch-2.png', name: 'CALVIN KLEIN' },
    { img: '/arch-3.png', name: 'MUGLER' },
    { img: '/arch-4.png', name: 'RALPH LAUREN' },
    { img: '/arch-5.png', name: 'VIKTOR & ROLF' }
  ])
  const [footerSettings, setFooterSettings] = useState({
    aboutText: 'Your destination for 100% original luxury fragrances. We bring international perfumes directly to India, ensuring premium quality and authenticity with every single spray.',
    phone: '+91 99999 99999',
    email: 'support@kozmocart.com',
    facebook: '#',
    instagram: '#',
    twitter: '#',
    youtube: '#'
  })
  const [trustBadges, setTrustBadges] = useState([
    { title: '100% AUTHENTIC', sub: 'Directly from Brands' },
    { title: 'EASY RETURNS', sub: '7 Days Return Policy' },
    { title: 'SECURE PAYMENT', sub: 'Safe transactions' },
    { title: 'FREE SHIPPING', sub: 'On orders above ₹999' }
  ])
  const [freeShippingLimit, setFreeShippingLimit] = useState(999)

  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      const res = await api.get('/settings')
      const layout = res.data.storefront_layout
      if (layout) {
        if (layout.hero_slides) setHeroSlides(layout.hero_slides)
        if (layout.split_banners) setSplitBanners(layout.split_banners)
        if (layout.mid_quote) setMidQuote(layout.mid_quote)
        if (layout.house_favorites) setHouseFavorites(layout.house_favorites)
        if (layout.footer_settings) setFooterSettings(prev => ({ ...prev, ...layout.footer_settings }))
        if (layout.trust_badges) setTrustBadges(layout.trust_badges)
        if (layout.free_shipping_limit !== undefined) setFreeShippingLimit(layout.free_shipping_limit)
      }
    } catch (err) {
      console.warn("Settings defaults fallback engaged.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e, callback) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    const toastId = toast.loading('Transmitting high-fidelity asset...')
    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Construct absolute URL to prevent cross-port breaking if needed, 
      // or relative if handled correctly by user config. Let's inject API origin.
      const finalUrl = res.data.url.startsWith('http') ? res.data.url : `${API_BASE}${res.data.url}`
      callback(finalUrl)
      toast.success('Media asset serialized successfully!', { id: toastId })
    } catch (error) {
      toast.error('Transmission failed. Please verify cluster uplink.', { id: toastId })
    }
  }

  const addHeroSlide = () => {
    setHeroSlides([...heroSlides, { image: '', title: '', subtitle: '', desc: '', cta: '' }])
  }

  const removeHeroSlide = (index) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== index))
  }

  const updateHeroSlide = (index, field, val) => {
    const copy = [...heroSlides]
    copy[index][field] = val
    setHeroSlides(copy)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        storefront_layout: {
          hero_slides: heroSlides,
          split_banners: splitBanners,
          mid_quote: midQuote,
          house_favorites: houseFavorites,
          footer_settings: footerSettings,
          trust_badges: trustBadges,
          free_shipping_limit: freeShippingLimit
        }
      }
      await api.patch('/settings', payload)
      toast.success('Storefront rendering pipeline re-cached successfully!', {
        icon: '💎',
        style: { background: '#111', color: '#fff', border: '1px solid var(--gold)' }
      })
    } catch (err) {
      toast.error('Failed to commit layout synchronization.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted">Synchronizing visual node stream...</div>
  }

  return (
    <div style={{ maxWidth: 1000, paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Monitor size={28} style={{ color: 'var(--gold)' }} />
            Storefront Theme CMS
          </h1>
          <p className="page-subtitle">Control native customer assets, thematic banners, and dynamic typographic statements</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 8, padding: '10px 24px', fontWeight: 700 }}>
          <Save size={16} /> {saving ? 'Synchronizing...' : 'Push Live Render'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        
        {/* SECTION 1: HERO ROTATOR */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutTemplate size={20} style={{ color: 'var(--gold)' }} />
                <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Primary Hero Cine-Rotator</h3>
             </div>
             <button onClick={addHeroSlide} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
                <Plus size={14} /> Add Slide Step
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             {heroSlides.map((slide, index) => (
                <div key={index} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative' }}>
                   <div className="grid-2" style={{ gap: 24 }}>
                      {/* Image column */}
                      <div>
                         <label className="form-label">Asset Backdrop (Recommended 1920x1080)</label>
                         <div style={{ height: 180, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', group: 'hover' }}>
                            {slide.image ? (
                               <>
                                  <img src={getMediaUrl(slide.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">
                                     <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#fff', color: '#000', fontSize: '0.8rem', fontWeight: 700, borderRadius: 4 }}>
                                        Change Image
                                        <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image', url))} />
                                     </label>
                                  </div>
                               </>
                            ) : (
                               <label style={{ cursor: 'pointer', textAlign: 'center' }}>
                                  <ImageIcon size={30} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                  <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Upload Asset Binary</div>
                                  <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image', url))} />
                               </label>
                            )}
                         </div>
                      </div>
                      
                      {/* Fields column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                         <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Subtitle Accent</label>
                            <input className="input input-sm" placeholder="e.g. PREMIUM COLLECTION" value={slide.subtitle} onChange={e => updateHeroSlide(index, 'subtitle', e.target.value)} />
                         </div>
                         <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Display Headline</label>
                            <input className="input input-sm" style={{ fontWeight: 700 }} placeholder="The Signature Scent" value={slide.title} onChange={e => updateHeroSlide(index, 'title', e.target.value)} />
                         </div>
                         <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Explanatory Narrative</label>
                            <input className="input input-sm" placeholder="Short description for client readability" value={slide.desc} onChange={e => updateHeroSlide(index, 'desc', e.target.value)} />
                         </div>
                         <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Call to Action Label</label>
                            <input className="input input-sm" placeholder="Explore Now" value={slide.cta} onChange={e => updateHeroSlide(index, 'cta', e.target.value)} />
                         </div>
                      </div>
                   </div>

                   {heroSlides.length > 1 && (
                      <button onClick={() => removeHeroSlide(index)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }} title="Deprecate Slide">
                         <Trash2 size={16} />
                      </button>
                   )}
                </div>
             ))}
          </div>
        </div>

        {/* SECTION 2: CATEGORY SPLIT BANNER GENDERS */}
        <div className="grid-2" style={{ gap: 30 }}>
           {/* MEN */}
           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                 <ImageIcon size={20} style={{ color: 'var(--gold)' }} />
                 <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Gender Splice: Masculine</h3>
              </div>
              
              <div style={{ height: 250, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden' }}>
                 {splitBanners.men ? (
                    <>
                       <img src={getMediaUrl(splitBanners.men)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={12} /> Override Image
                          <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men: url })))} />
                       </label>
                    </>
                 ) : (
                    <label style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                       <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                       <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Select File Binary</div>
                       <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men: url })))} />
                    </label>
                 )}
              </div>
           </div>

           {/* WOMEN */}
           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                 <ImageIcon size={20} style={{ color: 'var(--gold)' }} />
                 <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Gender Splice: Feminine</h3>
              </div>
              
              <div style={{ height: 250, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden' }}>
                 {splitBanners.women ? (
                    <>
                       <img src={getMediaUrl(splitBanners.women)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={12} /> Override Image
                          <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women: url })))} />
                       </label>
                    </>
                 ) : (
                    <label style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                       <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                       <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Select File Binary</div>
                       <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women: url })))} />
                    </label>
                 )}
              </div>
           </div>
        </div>

        {/* SECTION 3: HOUSE FAVORITES ARCHES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} />
              <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Iconic House Favorites (Bottom Arches)</h3>
           </div>
           
           <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {houseFavorites.map((item, idx) => (
                 <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                    <div style={{ height: 140, borderRadius: '70px 70px 0 0', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.05)', marginBottom: 10 }}>
                       {item.img ? (
                          <>
                             <img src={getMediaUrl(item.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             <label style={{ position: 'absolute', inset: 0, opacity: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', cursor: 'pointer' }} className="hover-overlay">
                                <Upload size={16} style={{ color: '#fff' }} />
                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => {
                                   const copy = [...houseFavorites]
                                   copy[idx].img = url
                                   setHouseFavorites(copy)
                                })} />
                             </label>
                          </>
                       ) : (
                          <label style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                             <Upload size={16} style={{ color: 'var(--gold)' }} />
                             <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => {
                                const copy = [...houseFavorites]
                                copy[idx].img = url
                                setHouseFavorites(copy)
                             })} />
                          </label>
                       )}
                    </div>
                    <input 
                       className="input input-sm" 
                       style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}
                       value={item.name}
                       placeholder={`House ${idx+1}`}
                       onChange={e => {
                          const copy = [...houseFavorites]
                          copy[idx].name = e.target.value
                          setHouseFavorites(copy)
                       }}
                    />
                 </div>
              ))}
           </div>
        </div>

        {/* SECTION 4: ESSENCE OF BEAUTY QUOTE */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} />
              <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Central Aesthetic Statement (Essence of Beauty)</h3>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                 <label className="form-label">Primary Thematic Copy</label>
                 <textarea 
                   className="textarea" 
                   rows={3} 
                   style={{ fontStyle: 'italic', fontSize: '1rem', letterSpacing: '0.02em' }}
                   placeholder="Enter stylistic narrative quote..."
                   value={midQuote.text}
                   onChange={e => setMidQuote(prev => ({ ...prev, text: e.target.value }))}
                 />
              </div>
              <div className="form-group" style={{ margin: 0, maxWidth: 350 }}>
                 <label className="form-label">Authorship Signature</label>
                 <div style={{ position: 'relative' }}>
                    <Type size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      className="input" 
                      style={{ paddingLeft: 38 }}
                      placeholder="The Essence of Beauty"
                      value={midQuote.author}
                      onChange={e => setMidQuote(prev => ({ ...prev, author: e.target.value }))}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 5: TRUST BADGES & SHIPPING POLICY */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <ShieldCheck size={20} style={{ color: 'var(--gold)' }} />
              <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Trust Badges & Shipping Policy</h3>
           </div>

           <div className="grid-2" style={{ gap: 30 }}>
              {/* Trust Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Badges Content</span>
                 {trustBadges.map((badge, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.15)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                       <div className="grid-2" style={{ gap: 12 }}>
                          <div className="form-group" style={{ margin: 0 }}>
                             <label className="form-label">Badge Title</label>
                             <input 
                                className="input input-sm" 
                                value={badge.title} 
                                onChange={e => {
                                   const copy = [...trustBadges]
                                   copy[idx].title = e.target.value
                                   setTrustBadges(copy)
                                }} 
                             />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                             <label className="form-label">Subtitle Description</label>
                             <input 
                                className="input input-sm" 
                                value={badge.sub} 
                                onChange={e => {
                                   const copy = [...trustBadges]
                                   copy[idx].sub = e.target.value
                                   setTrustBadges(copy)
                                }} 
                             />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Shipping Limit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Thresholds</span>
                 <div style={{ background: 'rgba(0,0,0,0.15)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                       <label className="form-label">Free Shipping Minimum Amount (₹)</label>
                       <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>₹</span>
                          <input 
                             type="number"
                             className="input" 
                             style={{ paddingLeft: 30 }}
                             value={freeShippingLimit} 
                             onChange={e => setFreeShippingLimit(Number(e.target.value))} 
                          />
                       </div>
                       <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
                          This value will update the top bar announcement and the shipping badge description automatically.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 6: FOOTER COMPOSITION */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <AlignLeft size={20} style={{ color: 'var(--gold)' }} />
              <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Global Footer Configuration</h3>
           </div>

           <div className="grid-2" style={{ gap: 30 }}>
              {/* About & Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                 <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Footer 'About' Narrative</label>
                    <textarea 
                       className="textarea" 
                       rows={3}
                       value={footerSettings.aboutText} 
                       onChange={e => setFooterSettings(prev => ({ ...prev, aboutText: e.target.value }))}
                    />
                 </div>
                 <div className="grid-2" style={{ gap: 16 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                       <label className="form-label">Support Hotline</label>
                       <input className="input input-sm" value={footerSettings.phone} onChange={e => setFooterSettings(prev => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                       <label className="form-label">Support Email</label>
                       <input className="input input-sm" value={footerSettings.email} onChange={e => setFooterSettings(prev => ({ ...prev, email: e.target.value }))} />
                    </div>
                 </div>
              </div>

              {/* Social Feeds */}
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: 20, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social Channels (URLs)</span>
                 {['facebook', 'instagram', 'twitter', 'youtube'].map(social => (
                    <div key={social} className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                       <label className="form-label" style={{ width: 80, marginBottom: 0, textTransform: 'capitalize' }}>{social}</label>
                       <div style={{ position: 'relative', flex: 1 }}>
                          <LinkIcon size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input 
                             className="input input-sm" 
                             style={{ paddingLeft: 30 }}
                             value={footerSettings[social]} 
                             placeholder="https://..."
                             onChange={e => setFooterSettings(prev => ({ ...prev, [social]: e.target.value }))} 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      <style>{`
        .hover-overlay:hover { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
