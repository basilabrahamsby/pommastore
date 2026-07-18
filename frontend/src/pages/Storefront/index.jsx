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



    { image: '/hero-1.png', image_mobile: '', title: '', title_ar: '', subtitle: '', subtitle_ar: '', desc: '', desc_ar: '', cta: '', cta_ar: '', link_type: 'default', product_id: '', product_slug: '', offer_id: '', custom_link: '' }



  ])



  const [splitBanners, setSplitBanners] = useState({



    men: '/banner-men.png',



    men_mobile: '',



    women: '/banner-women.png',



    women_mobile: ''



  })



  const [midQuote, setMidQuote] = useState({



    text: '',



    text_ar: '',



    author: '',



    author_ar: ''



  })



  const [loginBgImage, setLoginBgImage] = useState('')



  const [houseFavorites, setHouseFavorites] = useState([



    { img: '/arch-1.png', name: 'YVES SAINT LAURENT', name_ar: '' },



    { img: '/arch-2.png', name: 'CALVIN KLEIN', name_ar: '' },



    { img: '/arch-3.png', name: 'MUGLER', name_ar: '' },



    { img: '/arch-4.png', name: 'RALPH LAUREN', name_ar: '' },



    { img: '/arch-5.png', name: 'VIKTOR & ROLF', name_ar: '' }



  ])



  const [footerSettings, setFooterSettings] = useState({



    aboutText: 'Your destination for 100% original luxury fragrances. We bring international perfumes directly to India, ensuring premium quality and authenticity with every single spray.',



    aboutText_ar: '',



    phone: '+91 99999 99999',



    email: 'support@kozmocart.com',



    facebook: '#',



    instagram: '#',



    twitter: '#',



    youtube: '#'



  })



  const [trustBadges, setTrustBadges] = useState([



    { title: '100% AUTHENTIC', title_ar: '', sub: 'Directly from Brands', sub_ar: '' },



    { title: 'EASY RETURNS', title_ar: '', sub: '7 Days Return Policy', sub_ar: '' },



    { title: 'SECURE PAYMENT', title_ar: '', sub: 'Safe transactions', sub_ar: '' },



    { title: 'FREE SHIPPING', title_ar: '', sub: 'On orders above AED 999', sub_ar: '' }



  ])



  const [freeShippingLimit, setFreeShippingLimit] = useState(999)



  const [products, setProducts] = useState([])



  const [offers, setOffers] = useState([])



  const [gridAds1, setGridAds1] = useState([



    {



      left_image: '',



      left_image_mobile: '',



      left_title: '',



      left_title_ar: '',



      left_subtitle: '',



      left_subtitle_ar: '',



      left_desc: '',



      left_desc_ar: '',



      left_product_id: '',



      right_image: '',



      right_image_mobile: '',



      right_title: '',



      right_title_ar: '',



      right_subtitle: '',



      right_subtitle_ar: '',



      right_desc: '',



      right_desc_ar: '',



      right_product_id: ''



    }



  ])



  const [gridAds2, setGridAds2] = useState([



    {



      image: '',



      image_mobile: '',



      title: '',



      title_ar: '',



      subtitle: '',



      subtitle_ar: '',



      desc: '',



      desc_ar: '',



      product_id: ''



    }



  ])



  const [gridAds3, setGridAds3] = useState([



    {



      left_image: '',



      left_image_mobile: '',



      left_title: '',



      left_title_ar: '',



      left_subtitle: '',



      left_subtitle_ar: '',



      left_desc: '',



      left_desc_ar: '',



      left_product_id: '',



      right_image: '',



      right_image_mobile: '',



      right_title: '',



      right_title_ar: '',



      right_subtitle: '',



      right_subtitle_ar: '',



      right_desc: '',



      right_desc_ar: '',



      right_product_id: ''



    }



  ])







  useEffect(() => {



    fetchLayout()



    fetchProducts()



    fetchOffers()



  }, [])







  const fetchProducts = async () => {



    try {



      const res = await api.get('/products?limit=200')



      setProducts(res.data)



    } catch (err) {



      console.warn("Failed to load products for ad link selector")



    }



  }







  const fetchOffers = async () => {



    try {



      const res = await api.get('/offers')



      setOffers(res.data || [])



    } catch (err) {



      console.warn("Failed to load offers for selector")



    }



  }







  const handleTranslateField = async (text, callback) => {



    if (!text || !text.trim()) {



      toast.error('Please enter English text first!')



      return



    }



    const loadingToast = toast.loading('Translating to Arabic...')



    try {



      const res = await api.get('/translate', {



        params: { text: text, sl: 'en', tl: 'ar' }



      })



      callback(res.data.translated_text)



      toast.success('Translated successfully!', { id: loadingToast })



    } catch (err) {



      toast.error('Translation failed', { id: loadingToast })



    }



  }







  const fetchLayout = async () => {



    try {



      const res = await api.get('/settings')



      const layout = res.data.storefront_layout



      if (layout) {



        if (layout.hero_slides) {



          setHeroSlides(layout.hero_slides.map(slide => ({



            image: slide.image || '',



            image_mobile: slide.image_mobile || '',



            title: slide.title || '',



            title_ar: slide.title_ar || '',



            subtitle: slide.subtitle || '',



            subtitle_ar: slide.subtitle_ar || '',



            desc: slide.desc || '',



            desc_ar: slide.desc_ar || '',



            cta: slide.cta || '',



            cta_ar: slide.cta_ar || '',



            link_type: slide.link_type || 'default',



            product_id: slide.product_id || '',



            product_slug: slide.product_slug || '',



            offer_id: slide.offer_id || '',



            custom_link: slide.custom_link || ''



          })))



        }



        if (layout.split_banners) {



          setSplitBanners({



            men: layout.split_banners.men || '',



            men_mobile: layout.split_banners.men_mobile || '',



            women: layout.split_banners.women || '',



            women_mobile: layout.split_banners.women_mobile || ''



          })



        }



        if (layout.mid_quote) setMidQuote({



            text: layout.mid_quote.text || '',



            text_ar: layout.mid_quote.text_ar || '',



            author: layout.mid_quote.author || '',



            author_ar: layout.mid_quote.author_ar || ''



        })



        if (layout.login_bg_image) setLoginBgImage(layout.login_bg_image)



        if (layout.house_favorites) setHouseFavorites(layout.house_favorites.map(item => ({



            img: item.img || '',



            name: item.name || '',



            name_ar: item.name_ar || ''



        })))



        if (layout.footer_settings) setFooterSettings(prev => ({ ...prev, ...layout.footer_settings }))



        if (layout.trust_badges) setTrustBadges(layout.trust_badges.map(badge => ({



            title: badge.title || '',



            title_ar: badge.title_ar || '',



            sub: badge.sub || '',



            sub_ar: badge.sub_ar || ''



        })))



        if (layout.free_shipping_limit !== undefined) setFreeShippingLimit(layout.free_shipping_limit)



        if (layout.grid_ads_1) {



          const ads1 = Array.isArray(layout.grid_ads_1) ? layout.grid_ads_1 : [layout.grid_ads_1]



          setGridAds1(ads1.map(slide => ({



            left_image: slide.left_image || '',



            left_image_mobile: slide.left_image_mobile || '',



            left_title: slide.left_title || '',



            left_title_ar: slide.left_title_ar || '',



            left_subtitle: slide.left_subtitle || '',



            left_subtitle_ar: slide.left_subtitle_ar || '',



            left_desc: slide.left_desc || '',



            left_desc_ar: slide.left_desc_ar || '',



            left_product_id: slide.left_product_id || '',



            right_image: slide.right_image || '',



            right_image_mobile: slide.right_image_mobile || '',



            right_title: slide.right_title || '',



            right_title_ar: slide.right_title_ar || '',



            right_subtitle: slide.right_subtitle || '',



            right_subtitle_ar: slide.right_subtitle_ar || '',



            right_desc: slide.right_desc || '',



            right_desc_ar: slide.right_desc_ar || '',



            right_product_id: slide.right_product_id || ''



          })))



        }



        if (layout.grid_ads_2) {



          const ads2 = Array.isArray(layout.grid_ads_2) ? layout.grid_ads_2 : [layout.grid_ads_2]



          setGridAds2(ads2.map(slide => ({



            image: slide.image || '',



            image_mobile: slide.image_mobile || '',



            title: slide.title || '',



            title_ar: slide.title_ar || '',



            subtitle: slide.subtitle || '',



            subtitle_ar: slide.subtitle_ar || '',



            desc: slide.desc || '',



            desc_ar: slide.desc_ar || '',



            product_id: slide.product_id || ''



          })))



        }



        if (layout.grid_ads_3) {



          const ads3 = Array.isArray(layout.grid_ads_3) ? layout.grid_ads_3 : [layout.grid_ads_3]



          setGridAds3(ads3.map(slide => ({



            left_image: slide.left_image || '',



            left_image_mobile: slide.left_image_mobile || '',



            left_title: slide.left_title || '',



            left_title_ar: slide.left_title_ar || '',



            left_subtitle: slide.left_subtitle || '',



            left_subtitle_ar: slide.left_subtitle_ar || '',



            left_desc: slide.left_desc || '',



            left_desc_ar: slide.left_desc_ar || '',



            left_product_id: slide.left_product_id || '',



            right_image: slide.right_image || '',



            right_image_mobile: slide.right_image_mobile || '',



            right_title: slide.right_title || '',



            right_title_ar: slide.right_title_ar || '',



            right_subtitle: slide.right_subtitle || '',



            right_subtitle_ar: slide.right_subtitle_ar || '',



            right_desc: slide.right_desc || '',



            right_desc_ar: slide.right_desc_ar || '',



            right_product_id: slide.right_product_id || ''



          })))



        }



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



    setHeroSlides([...heroSlides, { 



      image: '', 



      image_mobile: '', 



      title: '', 



      title_ar: '',



      subtitle: '', 



      subtitle_ar: '',



      desc: '', 



      desc_ar: '',



      cta: '',



      cta_ar: '',



      link_type: 'default',



      product_id: '',



      product_slug: '',



      offer_id: '',



      custom_link: ''



    }])



  }







  const removeHeroSlide = (index) => {



    setHeroSlides(heroSlides.filter((_, i) => i !== index))



  }







  const updateHeroSlide = (index, field, val) => {



    const copy = [...heroSlides]



    copy[index][field] = val



    setHeroSlides(copy)



  }











  const addGridAds1Slide = () => {



    setGridAds1([...gridAds1, {



      left_image: '',



      left_image_mobile: '',



      left_title: '',



      left_title_ar: '',



      left_subtitle: '',



      left_subtitle_ar: '',



      left_desc: '',



      left_desc_ar: '',



      left_product_id: '',



      right_image: '',



      right_image_mobile: '',



      right_title: '',



      right_title_ar: '',



      right_subtitle: '',



      right_subtitle_ar: '',



      right_desc: '',



      right_desc_ar: '',



      right_product_id: ''



    }])



  }







  const removeGridAds1Slide = (index) => {



    if (gridAds1.length <= 1) {



      toast.error('Must maintain at least one slide.')



      return



    }



    setGridAds1(gridAds1.filter((_, i) => i !== index))



  }







  const updateGridAds1Slide = (index, field, val) => {



    const copy = [...gridAds1]



    copy[index][field] = val



    setGridAds1(copy)



  }







  const addGridAds2Slide = () => {



    setGridAds2([...gridAds2, {



      image: '',



      image_mobile: '',



      title: '',



      title_ar: '',



      subtitle: '',



      subtitle_ar: '',



      desc: '',



      desc_ar: '',



      product_id: ''



    }])



  }







  const removeGridAds2Slide = (index) => {



    if (gridAds2.length <= 1) {



      toast.error('Must maintain at least one slide.')



      return



    }



    setGridAds2(gridAds2.filter((_, i) => i !== index))



  }







  const updateGridAds2Slide = (index, field, val) => {



    const copy = [...gridAds2]



    copy[index][field] = val



    setGridAds2(copy)



  }







  const addGridAds3Slide = () => {



    setGridAds3([...gridAds3, {



      left_image: '',



      left_image_mobile: '',



      left_title: '',



      left_title_ar: '',



      left_subtitle: '',



      left_subtitle_ar: '',



      left_desc: '',



      left_desc_ar: '',



      left_product_id: '',



      right_image: '',



      right_image_mobile: '',



      right_title: '',



      right_title_ar: '',



      right_subtitle: '',



      right_subtitle_ar: '',



      right_desc: '',



      right_desc_ar: '',



      right_product_id: ''



    }])



  }







  const removeGridAds3Slide = (index) => {



    if (gridAds3.length <= 1) {



      toast.error('Must maintain at least one slide.')



      return



    }



    setGridAds3(gridAds3.filter((_, i) => i !== index))



  }







  const updateGridAds3Slide = (index, field, val) => {



    const copy = [...gridAds3]



    copy[index][field] = val



    setGridAds3(copy)



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



          free_shipping_limit: freeShippingLimit,



          grid_ads_1: gridAds1,



          grid_ads_2: gridAds2,



          grid_ads_3: gridAds3,



          login_bg_image: loginBgImage,



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



                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>



                         <div>



                            <label className="form-label">Web Image (Recommended 1920x1080 / 21:9)</label>



                            <div style={{ height: 140, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                               {slide.image ? (



                                  <>



                                     <img src={getMediaUrl(slide.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                     <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                        <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4 }}>



                                           Change Web Image



                                           <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image', url))} />



                                        </label>



                                     </div>



                                  </>



                               ) : (



                                  <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                     <ImageIcon size={24} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                                     <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Upload Web</div>



                                     <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image', url))} />



                                  </label>



                               )}



                            </div>



                         </div>



                         <div>



                            <label className="form-label">Mobile Image (Recommended 1080x1440 / 3:4)</label>



                            <div style={{ height: 140, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                               {slide.image_mobile ? (



                                  <>



                                     <img src={getMediaUrl(slide.image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                     <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                        <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4 }}>



                                           Change Mobile Image



                                           <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image_mobile', url))} />



                                        </label>



                                     </div>



                                  </>



                               ) : (



                                  <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                     <ImageIcon size={24} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                                     <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Upload Mobile</div>



                                     <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateHeroSlide(index, 'image_mobile', url))} />



                                  </label>



                               )}



                            </div>



                         </div>



                      </div>



                      



                      {/* Fields column */}



                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>



                         <div className="form-group" style={{ margin: 0 }}>



                            <label className="form-label">Subtitle Accent (EN)</label>



                            <input className="input input-sm" placeholder="e.g. PREMIUM COLLECTION" value={slide.subtitle} onChange={e => updateHeroSlide(index, 'subtitle', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                               <label className="form-label">Subtitle Accent (AR)</label>



                               <button type="button" onClick={() => handleTranslateField(slide.subtitle, (val) => updateHeroSlide(index, 'subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                            </div>



                            <input className="input input-sm" placeholder="مثال: مجموعة مميزة" dir="rtl" style={{ textAlign: 'right' }} value={slide.subtitle_ar || ''} onChange={e => updateHeroSlide(index, 'subtitle_ar', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                            <label className="form-label">Display Headline (EN)</label>



                            <input className="input input-sm" style={{ fontWeight: 700 }} placeholder="The Signature Scent" value={slide.title} onChange={e => updateHeroSlide(index, 'title', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                               <label className="form-label">Display Headline (AR)</label>



                               <button type="button" onClick={() => handleTranslateField(slide.title, (val) => updateHeroSlide(index, 'title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                            </div>



                            <input className="input input-sm" placeholder="مثال: رائحة مميزة" dir="rtl" style={{ textAlign: 'right' }} value={slide.title_ar || ''} onChange={e => updateHeroSlide(index, 'title_ar', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                            <label className="form-label">Explanatory Narrative (EN)</label>



                            <input className="input input-sm" placeholder="Short description for client readability" value={slide.desc} onChange={e => updateHeroSlide(index, 'desc', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                               <label className="form-label">Explanatory Narrative (AR)</label>



                               <button type="button" onClick={() => handleTranslateField(slide.desc, (val) => updateHeroSlide(index, 'desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                            </div>



                            <input className="input input-sm" placeholder="مثال: وصف قصير" dir="rtl" style={{ textAlign: 'right' }} value={slide.desc_ar || ''} onChange={e => updateHeroSlide(index, 'desc_ar', e.target.value)} />



                         </div>



                         <div className="form-group" style={{ margin: 0 }}>



                             <label className="form-label">Call to Action Label (EN)</label>



                             <input className="input input-sm" placeholder="Explore Now" value={slide.cta} onChange={e => updateHeroSlide(index, 'cta', e.target.value)} />



                          </div>



                          <div className="form-group" style={{ margin: 0 }}>



                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                <label className="form-label">Call to Action Label (AR)</label>



                                <button type="button" onClick={() => handleTranslateField(slide.cta, (val) => updateHeroSlide(index, 'cta_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                             </div>



                             <input className="input input-sm" placeholder="مثال: تسوق الآن" dir="rtl" style={{ textAlign: 'right' }} value={slide.cta_ar || ''} onChange={e => updateHeroSlide(index, 'cta_ar', e.target.value)} />



                          </div>



                          <div className="form-group" style={{ margin: 0 }}>



                             <label className="form-label">Link Destination Type</label>



                             <select className="input input-sm" value={slide.link_type || 'default'} onChange={e => {



                               const type = e.target.value;



                               updateHeroSlide(index, 'link_type', type);



                               if (type !== 'product') {



                                 updateHeroSlide(index, 'product_id', '');



                                 updateHeroSlide(index, 'product_slug', '');



                               }



                               if (type !== 'offer') {



                                 updateHeroSlide(index, 'offer_id', '');



                               }



                               if (type !== 'custom') {



                                 updateHeroSlide(index, 'custom_link', '');



                               }



                             }}>



                               <option value="default">Default Fallback (/shop or /offers)</option>



                               <option value="product">Redirect to Specified Product</option>



                               <option value="offer">Redirect to Offers Page / Specific Offer</option>



                               <option value="custom">Custom URL Path</option>



                             </select>



                          </div>



                          {slide.link_type === 'product' && (



                             <div className="form-group" style={{ margin: 0 }}>



                               <label className="form-label">Select Target Product</label>



                               <select className="input input-sm" value={slide.product_id || ''} onChange={e => {



                                 const selectedId = e.target.value;



                                 const prodObj = products.find(p => p.id === selectedId);



                                 const slug = prodObj ? prodObj.slug : '';



                                 updateHeroSlide(index, 'product_id', selectedId);



                                 updateHeroSlide(index, 'product_slug', slug);



                               }}>



                                 <option value="">Select a product...</option>



                                 {products.map(p => (



                                   <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                 ))}



                               </select>



                             </div>



                          )}



                          {slide.link_type === 'offer' && (



                             <div className="form-group" style={{ margin: 0 }}>



                               <label className="form-label">Select Target Offer</label>



                               <select className="input input-sm" value={slide.offer_id || ''} onChange={e => updateHeroSlide(index, 'offer_id', e.target.value)}>



                                 <option value="">All Offers Page (/offers)</option>



                                 {offers.map(o => (



                                   <option key={o.id} value={o.id}>{o.title} (CODE: {o.code})</option>



                                 ))}



                               </select>



                             </div>



                          )}



                          {slide.link_type === 'custom' && (



                             <div className="form-group" style={{ margin: 0 }}>



                               <label className="form-label">Custom Link Path (e.g. /rewards)</label>



                               <input className="input input-sm" placeholder="e.g. /shop or /rewards" value={slide.custom_link || ''} onChange={e => updateHeroSlide(index, 'custom_link', e.target.value)} />



                             </div>



                          )}



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



              



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>



                 <div>



                    <label className="form-label">Web (Recommended 1200x800 / 3:2)</label>



                    <div style={{ height: 180, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                       {splitBanners.men ? (



                          <>



                             <img src={getMediaUrl(splitBanners.men)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                             <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>



                                <Upload size={12} /> Web



                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men: url })))} />



                             </label>



                          </>



                       ) : (



                          <label style={{ height: '100%', display: 'flex', flexDirection: 'column', fontWeight: 700, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>



                             <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                             <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Select Web</div>



                             <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men: url })))} />



                          </label>



                       )}



                    </div>



                 </div>



                 <div>



                    <label className="form-label">Mobile (Recommended 800x1200 / 2:3)</label>



                    <div style={{ height: 180, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                       {splitBanners.men_mobile ? (



                          <>



                             <img src={getMediaUrl(splitBanners.men_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                             <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>



                                <Upload size={12} /> Mobile



                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men_mobile: url })))} />



                             </label>



                          </>



                       ) : (



                          <label style={{ height: '100%', display: 'flex', flexDirection: 'column', fontWeight: 700, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>



                             <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                             <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Select Mobile</div>



                             <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, men_mobile: url })))} />



                          </label>



                       )}



                    </div>



                 </div>



              </div>



           </div>







           {/* WOMEN */}



           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>



              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>



                 <ImageIcon size={20} style={{ color: 'var(--gold)' }} />



                 <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Gender Splice: Feminine</h3>



              </div>



              



              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>



                 <div>



                    <label className="form-label">Web (Recommended 1200x800 / 3:2)</label>



                    <div style={{ height: 180, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                       {splitBanners.women ? (



                          <>



                             <img src={getMediaUrl(splitBanners.women)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                             <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>



                                <Upload size={12} /> Web



                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women: url })))} />



                             </label>



                          </>



                       ) : (



                          <label style={{ height: '100%', display: 'flex', flexDirection: 'column', fontWeight: 700, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>



                             <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                             <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Select Web</div>



                             <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women: url })))} />



                          </label>



                       )}



                    </div>



                 </div>



                 <div>



                    <label className="form-label">Mobile (Recommended 800x1200 / 2:3)</label>



                    <div style={{ height: 180, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                       {splitBanners.women_mobile ? (



                          <>



                             <img src={getMediaUrl(splitBanners.women_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                             <label style={{ position: 'absolute', bottom: 12, right: 12, background: 'var(--gold)', color: '#000', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>



                                <Upload size={12} /> Mobile



                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women_mobile: url })))} />



                             </label>



                          </>



                       ) : (



                          <label style={{ height: '100%', display: 'flex', flexDirection: 'column', fontWeight: 700, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>



                             <Upload size={20} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                             <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Select Mobile</div>



                             <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setSplitBanners(prev => ({ ...prev, women_mobile: url })))} />



                          </label>



                       )}



                    </div>



                 </div>



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

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>

                       <input 

                          className="input input-sm" 

                          style={{ textAlign: 'right', fontSize: '0.7rem', flex: 1 }}

                          dir="rtl"

                          value={item.name_ar || ''}

                          placeholder="الاسم بالعربية"

                          onChange={e => {

                             const copy = [...houseFavorites]

                             copy[idx].name_ar = e.target.value

                             setHouseFavorites(copy)

                          }}

                       />

                       <button type="button" onClick={() => handleTranslateField(item.name, (val) => {

                          const copy = [...houseFavorites]

                          copy[idx].name_ar = val

                          setHouseFavorites(copy)

                       })} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>ترجم</button>

                    </div>



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

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  <div className="form-group" style={{ margin: 0 }}>

                     <label className="form-label">Primary Thematic Copy (EN)</label>

                     <textarea 

                       className="textarea" 

                       rows={3} 

                       style={{ fontStyle: 'italic', fontSize: '1rem', letterSpacing: '0.02em' }}

                       placeholder="Enter stylistic narrative quote..."

                       value={midQuote.text}

                       onChange={e => setMidQuote(prev => ({ ...prev, text: e.target.value }))}

                     />

                  </div>

                  <div className="form-group" style={{ margin: 0 }}>

                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        <label className="form-label">Primary Thematic Copy (AR)</label>

                        <button type="button" onClick={() => handleTranslateField(midQuote.text, (val) => setMidQuote(prev => ({ ...prev, text_ar: val })))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>

                     </div>

                     <textarea 

                       className="textarea" 

                       rows={3} 

                       style={{ fontSize: '1rem', letterSpacing: '0.02em', textAlign: 'right' }}

                       dir="rtl"

                       placeholder="اكتب الاقتباس الجمالي هنا..."

                       value={midQuote.text_ar || ''}

                       onChange={e => setMidQuote(prev => ({ ...prev, text_ar: e.target.value }))}

                     />

                  </div>

               </div>

               

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  <div className="form-group" style={{ margin: 0 }}>

                     <label className="form-label">Authorship Signature (EN)</label>

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

                  <div className="form-group" style={{ margin: 0 }}>

                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        <label className="form-label">Authorship Signature (AR)</label>

                        <button type="button" onClick={() => handleTranslateField(midQuote.author, (val) => setMidQuote(prev => ({ ...prev, author_ar: val })))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>

                     </div>

                     <input 

                       className="input" 

                       style={{ textAlign: 'right' }}

                       dir="rtl"

                       placeholder="مثال: جوهر الجمال"

                       value={midQuote.author_ar || ''}

                       onChange={e => setMidQuote(prev => ({ ...prev, author_ar: e.target.value }))}

                     />

                  </div>

               </div>

            </div>



        </div>







         {/* SECTION 4.5: LOGIN PAGE VISUALS */}



         <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>



            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>



               <ImageIcon size={20} style={{ color: 'var(--gold)' }} />



               <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Login Page Art of Fragrance Background</h3>



            </div>



            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>



               <label className="form-label">Art of Fragrance Background Image (Recommended 1080x1440 / 3:4)</label>



               <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                  {loginBgImage ? (



                     <>



                        <img src={getMediaUrl(loginBgImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                           <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4 }}>



                              Change Background Image



                              <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setLoginBgImage(url))} />



                           </label>



                        </div>



                     </>



                  ) : (



                     <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                        <ImageIcon size={24} style={{ color: 'var(--text-muted)', marginBottom: 6 }} />



                        <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Upload Background</div>



                        <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => setLoginBgImage(url))} />



                     </label>



                  )}



               </div>



            </div>



         </div>







         {/* SECTION 5: GRID AD BANNERS */}



         <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>



            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>



               <LayoutTemplate size={20} style={{ color: 'var(--gold)' }} />



               <h3 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>Grid Ad Banners (Homepage Inserts)</h3>



            </div>







            {/* BLOCK 1: Side-by-Side Ad Banners */}



            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 24 }}>



               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Block 1: Split Ad Banners (Two Columns)</h4>



                  <button className="btn btn-sm" onClick={addGridAds1Slide} style={{ gap: 6, display: 'flex', alignItems: 'center' }}>



                     <Plus size={14} /> Add Slide Pair



                  </button>



               </div>



               



               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



                  {gridAds1.map((slide, index) => (



                     <div key={index} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>



                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                           <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>Slide Pair #{index + 1}</span>



                           {gridAds1.length > 1 && (



                              <button className="btn btn-sm btn-text" onClick={() => removeGridAds1Slide(index)} style={{ color: '#ff4d4f', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>



                                 <Trash2 size={14} /> Delete Pair



                              </button>



                           )}



                        </div>



                        



                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>



                           {/* Left Ad Banner */}



                           <div style={{ background: 'rgba(0,0,0,0.15)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>



                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Left Banner Card</span>



                              



                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Web (Recommended 1000x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.left_image ? (



                                             <>



                                                <img src={getMediaUrl(slide.left_image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Web



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'left_image', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Web</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'left_image', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Mobile (Recommended 800x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.left_image_mobile ? (



                                             <>



                                                <img src={getMediaUrl(slide.left_image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Mobile



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'left_image_mobile', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Mobile</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'left_image_mobile', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                 </div>







                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Subtitle (Accent) (EN)</label>



                                    <input className="input input-sm" placeholder="Exquisite Collection" value={slide.left_subtitle || ''} onChange={e => updateGridAds1Slide(index, 'left_subtitle', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Subtitle (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_subtitle, (val) => updateGridAds1Slide(index, 'left_subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_subtitle_ar || ''} onChange={e => updateGridAds1Slide(index, 'left_subtitle_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Display Headline (EN)</label>



                                    <input className="input input-sm" placeholder="Exclusive Fragrance" value={slide.left_title || ''} onChange={e => updateGridAds1Slide(index, 'left_title', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Headline (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_title, (val) => updateGridAds1Slide(index, 'left_title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_title_ar || ''} onChange={e => updateGridAds1Slide(index, 'left_title_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Description (EN)</label>



                                    <input className="input input-sm" placeholder="Short description copy..." value={slide.left_desc || ''} onChange={e => updateGridAds1Slide(index, 'left_desc', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Description (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_desc, (val) => updateGridAds1Slide(index, 'left_desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_desc_ar || ''} onChange={e => updateGridAds1Slide(index, 'left_desc_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Linked Product Target</label>



                                    <select className="input input-sm" value={slide.left_product_id || ''} onChange={e => updateGridAds1Slide(index, 'left_product_id', e.target.value)}>



                                       <option value="">None / External Link</option>



                                       {products.map(p => (



                                          <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                       ))}



                                    </select>



                                 </div>



                              </div>



                           </div>







                           {/* Right Ad Banner */}



                           <div style={{ background: 'rgba(0,0,0,0.15)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>



                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Right Banner Card</span>



                              



                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Web (Recommended 1000x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.right_image ? (



                                             <>



                                                <img src={getMediaUrl(slide.right_image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Web



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'right_image', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Web</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'right_image', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Mobile (Recommended 800x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.right_image_mobile ? (



                                             <>



                                                <img src={getMediaUrl(slide.right_image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Mobile



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'right_image_mobile', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Mobile</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds1Slide(index, 'right_image_mobile', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                 </div>







                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Subtitle (Accent) (EN)</label>



                                    <input className="input input-sm" placeholder="Prestige Selection" value={slide.right_subtitle || ''} onChange={e => updateGridAds1Slide(index, 'right_subtitle', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Subtitle (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_subtitle, (val) => updateGridAds1Slide(index, 'right_subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_subtitle_ar || ''} onChange={e => updateGridAds1Slide(index, 'right_subtitle_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Display Headline (EN)</label>



                                    <input className="input input-sm" placeholder="Premium Fragrances" value={slide.right_title || ''} onChange={e => updateGridAds1Slide(index, 'right_title', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Headline (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_title, (val) => updateGridAds1Slide(index, 'right_title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_title_ar || ''} onChange={e => updateGridAds1Slide(index, 'right_title_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Description (EN)</label>



                                    <input className="input input-sm" placeholder="Short description copy..." value={slide.right_desc || ''} onChange={e => updateGridAds1Slide(index, 'right_desc', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Description (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_desc, (val) => updateGridAds1Slide(index, 'right_desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_desc_ar || ''} onChange={e => updateGridAds1Slide(index, 'right_desc_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Linked Product Target</label>



                                    <select className="input input-sm" value={slide.right_product_id || ''} onChange={e => updateGridAds1Slide(index, 'right_product_id', e.target.value)}>



                                       <option value="">None / External Link</option>



                                       {products.map(p => (



                                          <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                       ))}



                                    </select>



                                 </div>



                              </div>



                           </div>



                        </div>



                     </div>



                  ))}



               </div>



            </div>







            {/* BLOCK 2: Full-Width Ad Banner */}



            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 24 }}>



               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Block 2: Widescreen Ad Banner (Full Width)</h4>



                  <button className="btn btn-sm" onClick={addGridAds2Slide} style={{ gap: 6, display: 'flex', alignItems: 'center' }}>



                     <Plus size={14} /> Add Widescreen Slide



                  </button>



               </div>



               



               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



                  {gridAds2.map((slide, index) => (



                     <div key={index} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>



                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                           <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>Widescreen Slide #{index + 1}</span>



                           {gridAds2.length > 1 && (



                              <button className="btn btn-sm btn-text" onClick={() => removeGridAds2Slide(index)} style={{ color: '#ff4d4f', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>



                                 <Trash2 size={14} /> Delete Slide



                              </button>



                           )}



                        </div>







                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>



                           {/* Left: Fields */}



                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                              <div className="form-group" style={{ margin: 0 }}>



                                 <label className="form-label">Subtitle (Accent) (EN)</label>



                                    <input className="input input-sm" placeholder="Prestige Selection" value={slide.subtitle || ''} onChange={e => updateGridAds2Slide(index, 'subtitle', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Subtitle (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.subtitle, (val) => updateGridAds2Slide(index, 'subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.subtitle_ar || ''} onChange={e => updateGridAds2Slide(index, 'subtitle_ar', e.target.value)} />



                              </div>



                              <div className="form-group" style={{ margin: 0 }}>



                                 <label className="form-label">Display Headline (EN)</label>



                                    <input className="input input-sm" placeholder="Top Curated Fragrances" value={slide.title || ''} onChange={e => updateGridAds2Slide(index, 'title', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Headline (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.title, (val) => updateGridAds2Slide(index, 'title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.title_ar || ''} onChange={e => updateGridAds2Slide(index, 'title_ar', e.target.value)} />



                              </div>



                              <div className="form-group" style={{ margin: 0 }}>



                                 <label className="form-label">Description Copy (EN)</label>



                                    <textarea className="textarea" rows={3} placeholder="Detailed explanation copy..." value={slide.desc || ''} onChange={e => updateGridAds2Slide(index, 'desc', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Description Copy (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.desc, (val) => updateGridAds2Slide(index, 'desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <textarea className="textarea" rows={3} style={{ textAlign: 'right' }} dir="rtl" placeholder="الترجمة" value={slide.desc_ar || ''} onChange={e => updateGridAds2Slide(index, 'desc_ar', e.target.value)} />



                              </div>



                              <div className="form-group" style={{ margin: 0 }}>



                                 <label className="form-label">Linked Product Target</label>



                                 <select className="input input-sm" value={slide.product_id || ''} onChange={e => updateGridAds2Slide(index, 'product_id', e.target.value)}>



                                    <option value="">None / External Link</option>



                                    {products.map(p => (



                                       <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                    ))}



                                 </select>



                              </div>



                           </div>







                           {/* Right: Widescreen Image */}



                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                              <div>



                                 <label className="form-label">Web Image (Recommended 1200x500 / 24:10)</label>



                                 <div style={{ height: 110, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                    {slide.image ? (



                                       <>



                                          <img src={getMediaUrl(slide.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                             <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4 }}>



                                                Web Image



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds2Slide(index, 'image', url))} />



                                             </label>



                                          </div>



                                       </>



                                    ) : (



                                       <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                          <ImageIcon size={20} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />



                                          <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Upload Web Image</div>



                                          <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds2Slide(index, 'image', url))} />



                                       </label>



                                    )}



                                 </div>



                              </div>



                              <div>



                                 <label className="form-label">Mobile Image (Recommended 800x800 or 800x1000)</label>



                                 <div style={{ height: 110, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                    {slide.image_mobile ? (



                                       <>



                                          <img src={getMediaUrl(slide.image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                             <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.75rem', fontWeight: 700, borderRadius: 4 }}>



                                                Mobile Image



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds2Slide(index, 'image_mobile', url))} />



                                             </label>



                                          </div>



                                       </>



                                    ) : (



                                       <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                          <ImageIcon size={20} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />



                                          <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Upload Mobile Image</div>



                                          <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds2Slide(index, 'image_mobile', url))} />



                                       </label>



                                    )}



                                 </div>



                              </div>



                           </div>



                        </div>



                     </div>



                  ))}



               </div>



            </div>







            {/* BLOCK 3: Brand Spotlight Ad Banners (Above Elite Perfumery) */}



            <div style={{ borderBottom: 'none' }}>



               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Block 3: Brand Spotlight Ad Banners (Two Columns - Above Elite Perfumery)</h4>



                  <button className="btn btn-sm" onClick={addGridAds3Slide} style={{ gap: 6, display: 'flex', alignItems: 'center' }}>



                     <Plus size={14} /> Add Slide Pair



                  </button>



               </div>



               



               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



                  {gridAds3.map((slide, index) => (



                     <div key={index} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>



                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>



                           <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>Slide Pair #{index + 1}</span>



                           {gridAds3.length > 1 && (



                              <button className="btn btn-sm btn-text" onClick={() => removeGridAds3Slide(index)} style={{ color: '#ff4d4f', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>



                                 <Trash2 size={14} /> Delete Pair



                              </button>



                           )}



                        </div>







                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>



                           {/* Left Ad Banner */}



                           <div style={{ background: 'rgba(0,0,0,0.15)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>



                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Left Banner Card</span>



                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Web (Recommended 1000x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.left_image ? (



                                             <>



                                                <img src={getMediaUrl(slide.left_image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Web



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'left_image', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Web</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'left_image', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Mobile (Recommended 800x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.left_image_mobile ? (



                                             <>



                                                <img src={getMediaUrl(slide.left_image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Mobile



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'left_image_mobile', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Mobile</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'left_image_mobile', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Subtitle (Accent) (EN)</label>



                                    <input className="input input-sm" placeholder="Exquisite Collection" value={slide.left_subtitle || ''} onChange={e => updateGridAds3Slide(index, 'left_subtitle', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Subtitle (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_subtitle, (val) => updateGridAds3Slide(index, 'left_subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_subtitle_ar || ''} onChange={e => updateGridAds3Slide(index, 'left_subtitle_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Display Headline (EN)</label>



                                    <input className="input input-sm" placeholder="Exclusive Fragrance" value={slide.left_title || ''} onChange={e => updateGridAds3Slide(index, 'left_title', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Headline (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_title, (val) => updateGridAds3Slide(index, 'left_title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_title_ar || ''} onChange={e => updateGridAds3Slide(index, 'left_title_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Description (EN)</label>



                                    <input className="input input-sm" placeholder="Short description copy..." value={slide.left_desc || ''} onChange={e => updateGridAds3Slide(index, 'left_desc', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Description (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.left_desc, (val) => updateGridAds3Slide(index, 'left_desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.left_desc_ar || ''} onChange={e => updateGridAds3Slide(index, 'left_desc_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Linked Product Target</label>



                                    <select className="input input-sm" value={slide.left_product_id || ''} onChange={e => updateGridAds3Slide(index, 'left_product_id', e.target.value)}>



                                       <option value="">None / External Link</option>



                                       {products.map(p => (



                                          <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                       ))}



                                    </select>



                                 </div>



                              </div>



                           </div>







                           {/* Right Ad Banner */}



                           <div style={{ background: 'rgba(0,0,0,0.15)', padding: 18, borderRadius: 12, border: '1px solid var(--border)' }}>



                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Right Banner Card</span>



                              



                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Web (Recommended 1000x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.right_image ? (



                                             <>



                                                <img src={getMediaUrl(slide.right_image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Web



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'right_image', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Web</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'right_image', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                    <div>



                                       <label className="form-label" style={{ fontSize: '0.65rem' }}>Mobile (Recommended 800x1000)</label>



                                       <div style={{ height: 100, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px dashed var(--border)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>



                                          {slide.right_image_mobile ? (



                                             <>



                                                <img src={getMediaUrl(slide.right_image_mobile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />



                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', opacity: 0, transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-overlay">



                                                   <label style={{ cursor: 'pointer', padding: '4px 8px', background: '#fff', color: '#000', fontSize: '0.65rem', fontWeight: 700, borderRadius: 4 }}>



                                                      Mobile



                                                      <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'right_image_mobile', url))} />



                                                   </label>



                                                </div>



                                             </>



                                          ) : (



                                             <label style={{ cursor: 'pointer', textAlign: 'center' }}>



                                                <ImageIcon size={18} style={{ color: 'var(--text-muted)', marginBottom: 2 }} />



                                                <div style={{ fontSize: '0.65rem', color: 'var(--gold)' }}>Mobile</div>



                                                <input type="file" hidden onChange={(e) => handleFileUpload(e, (url) => updateGridAds3Slide(index, 'right_image_mobile', url))} />



                                             </label>



                                          )}



                                       </div>



                                    </div>



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Subtitle (Accent) (EN)</label>



                                    <input className="input input-sm" placeholder="Prestige Selection" value={slide.right_subtitle || ''} onChange={e => updateGridAds3Slide(index, 'right_subtitle', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Subtitle (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_subtitle, (val) => updateGridAds3Slide(index, 'right_subtitle_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_subtitle_ar || ''} onChange={e => updateGridAds3Slide(index, 'right_subtitle_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Display Headline (EN)</label>



                                    <input className="input input-sm" placeholder="Premium Fragrances" value={slide.right_title || ''} onChange={e => updateGridAds3Slide(index, 'right_title', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Headline (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_title, (val) => updateGridAds3Slide(index, 'right_title_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_title_ar || ''} onChange={e => updateGridAds3Slide(index, 'right_title_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Description (EN)</label>



                                    <input className="input input-sm" placeholder="Short description copy..." value={slide.right_desc || ''} onChange={e => updateGridAds3Slide(index, 'right_desc', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                       <label className="form-label">Description (AR)</label>



                                       <button type="button" onClick={() => handleTranslateField(slide.right_desc, (val) => updateGridAds3Slide(index, 'right_desc_ar', val))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                    </div>



                                    <input className="input input-sm" placeholder="الترجمة" dir="rtl" style={{ textAlign: 'right' }} value={slide.right_desc_ar || ''} onChange={e => updateGridAds3Slide(index, 'right_desc_ar', e.target.value)} />



                                 </div>



                                 <div className="form-group" style={{ margin: 0 }}>



                                    <label className="form-label">Linked Product Target</label>



                                    <select className="input input-sm" value={slide.right_product_id || ''} onChange={e => updateGridAds3Slide(index, 'right_product_id', e.target.value)}>



                                       <option value="">None / External Link</option>



                                       {products.map(p => (



                                          <option key={p.id} value={p.id}>{p.name} ({p.brand_name || 'Exquisite House'})</option>



                                       ))}



                                    </select>



                                 </div>



                              </div>



                           </div>



                        </div>



                     </div>



                  ))}



               </div>



            </div>



         </div>







         {/* SECTION 6: TRUST BADGES & SHIPPING POLICY */}



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



                             <label className="form-label">Badge Title (EN)</label>



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



                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                    <label className="form-label">Badge Title (AR)</label>



                                    <button type="button" onClick={() => handleTranslateField(badge.title, (val) => {



                                       const copy = [...trustBadges]



                                       copy[idx].title_ar = val



                                       setTrustBadges(copy)



                                    })} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                 </div>



                                 <input 



                                    className="input input-sm" 



                                    dir="rtl" style={{ textAlign: 'right' }}



                                    value={badge.title_ar || ''} 



                                    onChange={e => {



                                       const copy = [...trustBadges]



                                       copy[idx].title_ar = e.target.value



                                       setTrustBadges(copy)



                                    }} 



                                 />



                          </div>



                          <div className="form-group" style={{ margin: 0 }}>



                             <label className="form-label">Subtitle Description (EN)</label>



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



                              <div className="form-group" style={{ margin: 0 }}>



                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                                    <label className="form-label">Subtitle Description (AR)</label>



                                    <button type="button" onClick={() => handleTranslateField(badge.sub, (val) => {



                                       const copy = [...trustBadges]



                                       copy[idx].sub_ar = val



                                       setTrustBadges(copy)



                                    })} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                                 </div>



                                 <input 



                                    className="input input-sm" 



                                    dir="rtl" style={{ textAlign: 'right' }}



                                    value={badge.sub_ar || ''} 



                                    onChange={e => {



                                       const copy = [...trustBadges]



                                       copy[idx].sub_ar = e.target.value



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



                       <label className="form-label">Free Shipping Minimum Amount (AED )</label>



                       <div style={{ position: 'relative' }}>



                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>AED </span>



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



                    <label className="form-label">Footer 'About' Narrative (EN)</label>



                        <textarea 



                           className="textarea" 



                           rows={3}



                           value={footerSettings.aboutText} 



                           onChange={e => setFooterSettings(prev => ({ ...prev, aboutText: e.target.value }))}



                        />



                     </div>



                     <div className="form-group" style={{ margin: 0 }}>



                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>



                           <label className="form-label">Footer 'About' Narrative (AR)</label>



                           <button type="button" onClick={() => handleTranslateField(footerSettings.aboutText, (val) => setFooterSettings(prev => ({ ...prev, aboutText_ar: val })))} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Translate</button>



                        </div>



                        <textarea 



                           className="textarea" 



                           rows={3}



                           style={{ textAlign: 'right' }}



                           dir="rtl"



                           value={footerSettings.aboutText_ar || ''} 



                           onChange={e => setFooterSettings(prev => ({ ...prev, aboutText_ar: e.target.value }))}



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



