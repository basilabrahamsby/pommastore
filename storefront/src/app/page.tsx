'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { getMediaUrl } from '@/services/media';
import ProductCard from '@/components/ProductCard';
import StoryViewer from '@/components/StoryViewer';
import { 
  ChevronRight, 
  ShoppingBag, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  RefreshCw, 
  CreditCard,
  ChevronLeft,
  ArrowUpRight
} from 'lucide-react';

const getSkuProductName = (sku: string, products: any[]) => {
   for (const prod of products) {
      if (prod.variants?.some((v: any) => v.sku === sku)) {
         return prod.name;
      }
   }
   return sku;
};

export default function Home() {
   const [newArrivals, setNewArrivals] = useState([]);
   const [bestsellers, setBestsellers] = useState([]);
   const [homepageOffers, setHomepageOffers] = useState([]);
   const [categories, setCategories] = useState([]);
   const [loyaltyRewards, setLoyaltyRewards] = useState([]);
   const [brands, setBrands] = useState([]);
   const [loading, setLoading] = useState(true);
   const [currentSlide, setCurrentSlide] = useState(0);
   const [currentPromoIdx, setCurrentPromoIdx] = useState(0);
   const [cmsLayout, setCmsLayout] = useState<any>(null);
   const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
   const [seenCategories, setSeenCategories] = useState<string[]>([]);
   const [currentAds1, setCurrentAds1] = useState(0);
   const [currentAds2, setCurrentAds2] = useState(0);
   const [currentAds3, setCurrentAds3] = useState(0);

   useEffect(() => {
      if (typeof window !== 'undefined') {
         try {
            const seen = JSON.parse(sessionStorage.getItem('seen_stories') || '[]');
            setSeenCategories(seen);
         } catch (e) {
            console.error('Failed to load seen stories', e);
         }
      }
   }, []);

   const markCategoryAsSeen = (catId: string) => {
      setSeenCategories((prev) => {
         if (prev.includes(catId)) return prev;
         const updated = [...prev, catId];
         if (typeof window !== 'undefined') {
            sessionStorage.setItem('seen_stories', JSON.stringify(updated));
         }
         return updated;
      });
   };

   const activeSlides = cmsLayout?.hero_slides?.length ? cmsLayout.hero_slides : [];
   const heroSlidesToUse = activeSlides.length > 0 ? activeSlides : homepageOffers;

   useEffect(() => {
      if (heroSlidesToUse.length === 0) return;
      const interval = setInterval(() => {
         setCurrentSlide((prev) => (prev + 1) % heroSlidesToUse.length);
      }, 6000);
      return () => clearInterval(interval);
   }, [heroSlidesToUse]);

   useEffect(() => {
      const len = Array.isArray(cmsLayout?.grid_ads_1) ? cmsLayout.grid_ads_1.length : 1;
      if (len <= 1) return;
      const interval = setInterval(() => {
         setCurrentAds1((prev) => (prev + 1) % len);
      }, 6000);
      return () => clearInterval(interval);
   }, [cmsLayout?.grid_ads_1]);

   useEffect(() => {
      const len = Array.isArray(cmsLayout?.grid_ads_2) ? cmsLayout.grid_ads_2.length : 1;
      if (len <= 1) return;
      const interval = setInterval(() => {
         setCurrentAds2((prev) => (prev + 1) % len);
      }, 6000);
      return () => clearInterval(interval);
   }, [cmsLayout?.grid_ads_2]);

   useEffect(() => {
      const len = Array.isArray(cmsLayout?.grid_ads_3) ? cmsLayout.grid_ads_3.length : 1;
      if (len <= 1) return;
      const interval = setInterval(() => {
         setCurrentAds3((prev) => (prev + 1) % len);
      }, 6000);
      return () => clearInterval(interval);
   }, [cmsLayout?.grid_ads_3]);

   useEffect(() => {
      const fetchHomeData = async () => {
         try {
            const [resNew, resFeatured, resCats, resOffers, resLayout, resRewards, resBrands] = await Promise.all([
               api.get('/products?limit=200'),
               api.get('/products?is_featured=true&limit=10'),
               api.get('/categories'),
               api.get('/offers'),
               api.get('/settings/storefront_layout'),
               api.get('/loyalty/rewards'),
               api.get('/brands')
            ]);
            setNewArrivals(resNew.data);
            setBestsellers(resFeatured.data);
            setCategories(resCats.data);
            setHomepageOffers(resOffers.data);
            setCmsLayout(resLayout.data);
            setLoyaltyRewards(resRewards.data);
            setBrands(resBrands.data);
         } catch (err) {
            console.error('Failed to fetch home data', err);
         } finally {
            setLoading(false);
         }
      };
      fetchHomeData();
   }, []);

   if (loading) {
      return (
         <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center font-sans">
            <div className="relative mb-8 text-center">
               <img src="/kozmocart/logo.png" alt="Kozmocart Logo" className="h-16 md:h-20 object-contain animate-pulse mx-auto" />
               <div className="absolute -bottom-4 left-0 w-full h-[1px] bg-neutral-100 overflow-hidden">
                  <div className="h-full bg-accent animate-[loading_2s_ease-in-out_infinite]" />
               </div>
            </div>
            <span className="text-[10px] font-bold tracking-[0.4em] text-neutral-400 uppercase animate-pulse">Establishing Connection...</span>
            <style jsx>{`
               @keyframes loading {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
               }
            `}</style>
         </div>
      );
   }

   const getProductRedirectUrl = (productId: string | null | undefined): string => {
      if (!productId) return '/shop';
      const match: any = newArrivals.find((p: any) => p.id === productId);
      if (match) return `/product/${match.slug}`;
      return `/shop?product_id=${productId}`;
   };

    // Resolve array layout for Grid Ads 1
    const gridAds1Raw = cmsLayout?.grid_ads_1;
    const gridAds1List: any[] = Array.isArray(gridAds1Raw) 
       ? gridAds1Raw 
       : (gridAds1Raw && typeof gridAds1Raw === 'object' && Object.keys(gridAds1Raw).length > 0)
          ? [gridAds1Raw] 
          : [];
    
    const gridAds1ToUse = gridAds1List.length > 0 ? gridAds1List.map((item: any) => ({
       left_image: item.left_image || '/model-banner-1.png',
       left_title: item.left_title || 'Exclusive Fragrance',
       left_subtitle: item.left_subtitle || 'Exquisite Collection',
       left_desc: item.left_desc || 'We offer the best niche fragrances on the market selected by our team of experts.',
       left_product_id: item.left_product_id || '',
       right_image: item.right_image || '/model-banner-2.png',
       right_title: item.right_title || 'Premium Fragrances',
       right_subtitle: item.right_subtitle || 'Prestige Selection',
       right_desc: item.right_desc || 'We offer the best niche fragrances on the market selected by our team of experts.',
       right_product_id: item.right_product_id || ''
    })) : [{
       left_image: '/model-banner-1.png',
       left_title: 'Exclusive Fragrance',
       left_subtitle: 'Exquisite Collection',
       left_desc: 'We offer the best niche fragrances on the market selected by our team of experts.',
       left_product_id: '',
       right_image: '/model-banner-2.png',
       right_title: 'Premium Fragrances',
       right_subtitle: 'Prestige Selection',
       right_desc: 'We offer the best niche fragrances on the market selected by our team of experts.',
       right_product_id: ''
    }];

    // Resolve array layout for Grid Ads 2
    const gridAds2Raw = cmsLayout?.grid_ads_2;
    const gridAds2List: any[] = Array.isArray(gridAds2Raw) 
       ? gridAds2Raw 
       : (gridAds2Raw && typeof gridAds2Raw === 'object' && Object.keys(gridAds2Raw).length > 0)
          ? [gridAds2Raw] 
          : [];

    const gridAds2ToUse = gridAds2List.length > 0 ? gridAds2List.map((item: any) => ({
       image: item.image || '/model-banner-3.png',
       title: item.title || 'Top Curated Fragrances',
       subtitle: item.subtitle || 'Prestige Selection',
       desc: item.desc || 'We offer the best niche fragrances on the market selected by our team of experts. Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.',
       product_id: item.product_id || ''
    })) : [{
       image: '/model-banner-3.png',
       title: 'Top Curated Fragrances',
       subtitle: 'Prestige Selection',
       desc: 'We offer the best niche fragrances on the market selected by our team of experts. Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.',
       product_id: ''
    }];

    // Resolve array layout for Grid Ads 3
    const gridAds3Raw = cmsLayout?.grid_ads_3;
    const gridAds3List: any[] = Array.isArray(gridAds3Raw) 
       ? gridAds3Raw 
       : (gridAds3Raw && typeof gridAds3Raw === 'object' && Object.keys(gridAds3Raw).length > 0)
          ? [gridAds3Raw] 
          : [];

    const gridAds3ToUse = gridAds3List.length > 0 ? gridAds3List.map((item: any) => ({
       left_image: item.left_image || '/model-banner-1.png',
       left_title: item.left_title || 'Top Curated Fragrances',
       left_subtitle: item.left_subtitle || 'Exquisite Collection',
       left_desc: item.left_desc || 'We offer the best niche fragrances on the market selected by our team of experts.',
       left_product_id: item.left_product_id || '',
       right_image: item.right_image || '/model-banner-3.png',
       right_title: item.right_title || 'Top Curated Fragrances',
       right_subtitle: item.right_subtitle || 'Prestige Selection',
       right_desc: item.right_desc || 'We offer the best niche fragrances on the market selected by our team of experts.',
       right_product_id: item.right_product_id || ''
    })) : [{
       left_image: '/model-banner-1.png',
       left_title: 'Top Curated Fragrances',
       left_subtitle: 'Exquisite Collection',
       left_desc: 'We offer the best niche fragrances on the market selected by our team of experts.',
       left_product_id: '',
       right_image: '/model-banner-3.png',
       right_title: 'Top Curated Fragrances',
       right_subtitle: 'Prestige Selection',
       right_desc: 'We offer the best niche fragrances on the market selected by our team of experts.',
       right_product_id: ''
    }];

   return (
      <div className="flex flex-col w-full bg-white">

         {/* Main Hero Banner Slider - only shown if CMS hero slides or active offer banners are configured */}
         {heroSlidesToUse.length > 0 && (
         <section className="relative w-full h-[240px] sm:h-[350px] md:h-[420px] lg:h-[480px] bg-black overflow-hidden">
            {heroSlidesToUse.map((slide: any, idx: number) => {
               const isPromo = !!slide.discount_type;
               const slideImage = getMediaUrl(slide.banner_url || slide.image);
               const slideTitle = slide.title;
               const slideSubtitle = isPromo ? `${slide.discount_type} • CODE: ${slide.code}` : slide.subtitle;
               const slideDesc = isPromo ? (slide.subtitle || 'Exclusive fragrance savings & curated collections.') : slide.desc;
               const slideCta = isPromo ? 'Claim Offer' : (slide.cta || 'Shop Collection');
               const slideLink = isPromo ? '/offers' : '/shop';
               
               return (
                  <div
                     key={idx}
                     className={`absolute inset-0 w-full h-full transition-all duration-[1500ms] ease-in-out transform ${idx === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                        }`}
                  >
                     <img
                        src={slideImage}
                        alt={slideTitle}
                        className="absolute inset-0 w-full h-full object-contain md:object-cover object-center"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                     <div className="absolute inset-0 flex items-end pb-4 sm:pb-8 md:pb-12">
                        <div className="max-w-[1400px] mx-auto w-full px-6 md:px-20 flex flex-col items-start text-left">
                           <span className={`text-[9px] md:text-xs font-semibold tracking-[0.3em] text-accent uppercase mb-1 md:mb-3 transition-all duration-1000 delay-300 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                              } font-montserrat`}>
                              {slideSubtitle}
                           </span>
                           <h1 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal text-[#d4af37] leading-tight md:leading-none tracking-wide mb-2 md:mb-4 uppercase transition-all duration-1000 delay-500 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                              }`}>
                              {slideTitle}
                           </h1>
                           <p className={`hidden sm:block text-neutral-100 font-light font-montserrat text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.4em] max-w-sm md:max-w-xl mb-4 md:mb-6 transition-all duration-1000 delay-700 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                              }`}>
                              {slideDesc}
                           </p>
                           <Link 
                              href={slideLink} 
                              className={`bg-transparent border border-white/80 hover:bg-white text-white hover:text-black px-5 py-2.5 md:px-6 md:py-2.5 text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-700 delay-900 transform ${idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} font-montserrat rounded-full`}
                           >
                              {slideCta}
                           </Link>
                        </div>
                     </div>
                  </div>
               );
            })}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-3">
               {heroSlidesToUse.map((_: any, idx: number) => (
                  <button
                     key={idx}
                     onClick={() => setCurrentSlide(idx)}
                     className={`w-12 h-0.5 transition-all duration-500 ${idx === currentSlide ? 'bg-accent' : 'bg-white/30 hover:bg-white/60'
                        }`}
                  />
               ))}
            </div>
         </section>
         )}

         {/* Trust Badges - always visible */}
         <section className="bg-neutral-50 py-5 border-b border-neutral-100">
            <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-2 md:flex md:flex-wrap md:justify-between gap-x-4 gap-y-5 justify-items-center">
               {(cmsLayout?.trust_badges?.length > 0 ? cmsLayout.trust_badges : [
                 { title: 'Free Shipping', sub: 'On orders over ₹999/-', icon: '🚚' },
                 { title: '100% Authentic', sub: 'Genuine & original products only', icon: '✅' },
                 { title: 'Easy Returns', sub: '7-day hassle-free return policy', icon: '🔄' },
                 { title: 'Secure Payments', sub: 'UPI, Cards, Razorpay accepted', icon: '🔒' },
               ]).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 min-w-[140px] sm:min-w-[190px]">
                     <div className="text-xl flex-shrink-0">{item.icon || '★'}</div>
                     <div>
                        <p className="text-[10px] font-black tracking-widest uppercase text-black">{item.title}</p>
                        <p className="text-[9px] font-medium text-neutral-500 tracking-wider">{item.sub}</p>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Signature Categories (Instagram Story Mode) */}
         {categories.length > 0 && (
         <section className="pt-12 pb-6 bg-white border-b border-neutral-50 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center mb-4">
               <span className="text-[9px] font-medium tracking-[0.25em] text-neutral-400 uppercase mb-2 block">Discover More</span>
               <h2 className="text-2xl md:text-3xl font-nelphim font-medium text-black leading-none inline-block uppercase tracking-wide">
                  Signature Categories
               </h2>
               <div className="w-12 h-[2.5px] bg-accent mx-auto mt-2.5" />
            </div>

            <div className="relative w-full overflow-hidden">
               <div className="flex gap-6 md:gap-10 overflow-x-auto py-2 px-6 md:px-12 scrollbar-hide select-none w-full justify-start md:justify-center">
                  {categories.map((cat: any, idx: number) => {
                     const name = cat.name;
                     const image = getMediaUrl(cat.image_url || cat.banner_url);
                     const isSeen = seenCategories.includes(cat.id);
                     
                     return (
                        <button
                           key={cat.id || idx}
                           onClick={() => setActiveStoryIdx(idx)}
                           className="group/cat flex flex-col items-center space-y-3 flex-shrink-0 cursor-pointer focus:outline-none"
                        >
                           {/* Outer Ring: gradient for unseen, simple light gray border for seen */}
                           <div className={`relative p-[3px] rounded-full transition-all duration-500 transform group-hover/cat:scale-105 active:scale-95 ${
                              isSeen 
                                 ? 'bg-neutral-200 hover:bg-neutral-300' 
                                 : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-accent'
                           }`}>
                              {/* White Spacer Gap */}
                              <div className="p-[2px] bg-white rounded-full">
                                 {/* Circular Image wrapper */}
                                 <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-neutral-50 flex items-center justify-center border border-neutral-100/80 shadow-sm group-hover/cat:shadow-md transition-all duration-700">
                                    <img 
                                       src={image} 
                                       alt={name} 
                                       loading="lazy"
                                       decoding="async"
                                       className="w-full h-full object-cover group-hover/cat:scale-110 transition-transform duration-[1.5s]" 
                                       onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png' }}
                                    />
                                 </div>
                              </div>
                              
                              {/* Glowing Pulse Dot for Unseen Stories */}
                              {!isSeen && (
                                 <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse shadow-md" />
                              )}
                           </div>
                           
                           {/* Text label */}
                           <span className="text-[9px] md:text-[10px] font-medium tracking-wider text-neutral-700 uppercase transition-all group-hover/cat:text-accent font-sans whitespace-nowrap">
                              {name}
                           </span>
                        </button>
                     );
                  })}
               </div>
               
               {/* Left/Right fading edges for long scrollable content */}
               {categories.length >= 6 && (
                  <>
                     <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                     <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                  </>
               )}
            </div>

            {/* Immersive Modal overlay */}
            {activeStoryIdx !== null && (
               <StoryViewer
                  categories={categories}
                  initialCategoryIndex={activeStoryIdx}
                  allProducts={[...newArrivals, ...bestsellers]}
                  onClose={() => setActiveStoryIdx(null)}
                  onMarkAsSeen={markCategoryAsSeen}
               />
            )}
         </section>
         )}

         {/* Bestsellers Grid */}
         <section className="py-24 bg-neutral-50 border-t border-b border-neutral-100">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
               <div className="flex justify-between items-end mb-16">
                  <div>
                     <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-3 block">Store Favorites</span>
                     <h2 className="text-2xl md:text-3xl font-serif font-normal text-black leading-none uppercase tracking-wide">Popular Picks</h2>
                  </div>
                  <Link href="/shop" className="group flex items-center space-x-3 text-[11px] font-bold tracking-widest text-black uppercase hover:text-accent transition-colors font-sans">
                     <span>Explore All</span>
                     <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform text-accent" />
                  </Link>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {loading ? (
                     [...Array(5)].map((_, i) => <div key={i} className="aspect-[3/4] bg-white animate-pulse rounded-sm border border-neutral-100" />)
                  ) : (
                     bestsellers.slice(0, 10).map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                     ))
                  )}
               </div>
            </div>
          </section>

          {/* Cinematic Hero Slider for Flash Offers */}
          {homepageOffers.length > 0 && (
             <section className="relative h-[680px] sm:h-[580px] lg:h-[480px] xl:h-[520px] bg-neutral-950 overflow-hidden group border-b border-neutral-900">
                {/* Background Slider Engine */}
                <div className="absolute inset-0">
                   {homepageOffers.map((promo: any, idx: number) => (
                     <div 
                       key={promo.id} 
                       className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentPromoIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
                     >
                        <Link href="/offers" className="absolute inset-0 block cursor-pointer">
                           <img
                              src={promo.banner_url ? getMediaUrl(promo.banner_url) : 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=1000'}
                              alt={promo.title}
                              className="absolute inset-0 w-full h-full object-cover object-[80%_center] md:object-center opacity-50 group-hover:scale-[1.02] transition-transform duration-[3s]"
                           />
                        </Link>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
                        
                        <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 lg:gap-12">
                           {/* Text Content */}
                           <div className="lg:w-1/2 text-white pt-12 sm:pt-16 lg:pt-0 z-10">
                              <div className="flex items-center gap-4 mb-3 sm:mb-5">
                                 <span className="h-[1.5px] w-12 bg-accent" />
                                 <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase font-sans">{promo.discount_type}</span>
                              </div>
                              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal mb-3 sm:mb-4 leading-none tracking-wide uppercase">
                                 {promo.title}
                              </h2>
                              <p className="text-xs sm:text-[13px] md:text-sm text-neutral-300 max-w-md mb-3 sm:mb-4 leading-relaxed font-light tracking-wide opacity-80 line-clamp-2">
                                 {promo.subtitle || 'Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.'}
                              </p>

                              {/* Dynamic Offer Rules / Details Block */}
                              <div className="mb-3 sm:mb-5 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-sm max-w-md backdrop-blur-md">
                                 <div className="text-[10px] font-black tracking-widest text-yellow-500 uppercase mb-2">Offer Rules & Details</div>
                                 <div className="flex flex-col gap-2.5 text-xs">
                                    {promo.discount_type?.toLowerCase().includes('bogo') ? (
                                       <>
                                          <div className="flex items-start">
                                             <span className="text-neutral-400 font-bold uppercase w-20 flex-shrink-0">Buy:</span>
                                             <span className="text-white font-medium uppercase tracking-wide">{promo.buy_skus?.map((sku: string) => getSkuProductName(sku, promo.products || [])).join(', ')}</span>
                                          </div>
                                          <div className="flex items-start">
                                             <span className="text-green-400 font-bold uppercase w-20 flex-shrink-0">Get Free:</span>
                                             <span className="text-white font-medium uppercase tracking-wide">{promo.get_skus?.map((sku: string) => getSkuProductName(sku, promo.products || [])).join(', ')}</span>
                                          </div>
                                       </>
                                    ) : promo.discount_type?.toLowerCase().includes('percent') || promo.discount_type?.includes('%') ? (
                                       <>
                                          <div className="flex items-start">
                                             <span className="text-neutral-400 font-bold uppercase w-28 flex-shrink-0">Benefit:</span>
                                             <span className="text-white font-medium">{promo.discount_percentage}% OFF</span>
                                          </div>
                                          {promo.min_purchase_amount > 0 && (
                                             <div className="flex items-start">
                                                <span className="text-neutral-400 font-bold uppercase w-28 flex-shrink-0">Min Purchase:</span>
                                                <span className="text-white font-medium">₹{promo.min_purchase_amount.toLocaleString()}</span>
                                             </div>
                                          )}
                                       </>
                                    ) : (
                                       <>
                                          <div className="flex items-start">
                                             <span className="text-neutral-400 font-bold uppercase w-28 flex-shrink-0">Benefit:</span>
                                             <span className="text-white font-medium">Flat ₹{promo.flat_discount_amount?.toLocaleString()} OFF</span>
                                          </div>
                                          {promo.min_purchase_amount > 0 && (
                                             <div className="flex items-start">
                                                <span className="text-neutral-400 font-bold uppercase w-28 flex-shrink-0">Min Purchase:</span>
                                                <span className="text-white font-medium">₹{promo.min_purchase_amount.toLocaleString()}</span>
                                             </div>
                                          )}
                                       </>
                                    )}
                                 </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 sm:gap-8 font-sans">
                                 <Link 
                                    href="/offers"
                                    className="group flex items-center gap-3 bg-white hover:bg-accent text-black hover:text-white px-5 py-2.5 sm:px-8 sm:py-3.5 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-500 shadow-2xl"
                                 >
                                    Explore Curation
                                    <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                 </Link>
                                 <div className="text-[9px] sm:text-[11px] font-black tracking-[0.4em] text-neutral-400">
                                    PROMO: <span className="text-white border-b border-white/20 pb-1 ml-2 sm:ml-3 font-mono">{promo.code}</span>
                                 </div>
                              </div>
                           </div>
                           
                           {/* Product Cards Shelf — compact */}
                           <div className="lg:w-[45%] w-full flex items-center justify-end z-10 relative">
                              <div className="flex gap-3 overflow-x-auto lg:overflow-visible scrollbar-hide py-6 px-3">
                                 {(promo.products && promo.products.length > 0 ? promo.products : newArrivals)?.slice(0, 4).map((product: any, pidx: number) => {
                                    const variant = product.variants?.[0];
                                    const hasDiscount = variant?.compare_at_price > variant?.selling_price;
                                    const discPct = hasDiscount ? Math.round(((variant.compare_at_price - variant.selling_price) / variant.compare_at_price) * 100) : 0;
                                    return (
                                    <Link
                                       href={`/product/${product.slug}`}
                                       key={product.id}
                                       className="min-w-[155px] max-w-[155px] bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-sm transform transition-all duration-500 hover:-translate-y-3 hover:bg-white/[0.15] shadow-xl block text-left group/card flex-shrink-0 overflow-hidden"
                                       style={{ transitionDelay: `${pidx * 100}ms` }}
                                    >
                                       {/* Image */}
                                       <div className="relative bg-white/95 mx-2 mt-2 rounded-sm overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                          <img
                                             src={getMediaUrl(product.images?.[0]) || '/kozmocart/placeholder-perfume.png'}
                                             alt={product.name}
                                             className="w-full h-full object-contain p-3 group-hover/card:scale-105 transition-transform duration-500"
                                             onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                                          />
                                          {hasDiscount ? (
                                             <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[7px] font-black px-1.5 py-0.5 tracking-widest uppercase">{discPct}%</div>
                                          ) : (
                                             <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[7px] font-black px-1.5 py-0.5 tracking-widest uppercase">New</div>
                                          )}
                                       </div>
                                       {/* Info */}
                                       <div className="px-3 pb-3 pt-2">
                                          <p className="text-[7px] font-black text-white/35 uppercase tracking-[0.2em] mb-0.5 truncate">{product.brand_name}</p>
                                          <h4 className="text-[10px] font-bold text-white/85 uppercase truncate mb-2 tracking-wide group-hover/card:text-yellow-400 transition-colors leading-tight">{product.name}</h4>
                                          <div className="flex items-baseline gap-1.5 flex-wrap">
                                             <span className="text-white font-black text-[13px]">₹{variant?.selling_price?.toLocaleString('en-IN')}</span>
                                             {hasDiscount && <span className="text-white/30 text-[9px] line-through">₹{variant.compare_at_price.toLocaleString('en-IN')}</span>}
                                          </div>
                                          {variant?.size_ml && <p className="text-white/25 text-[7px] uppercase tracking-widest font-bold mt-1">{variant.size_ml}ml</p>}
                                       </div>
                                    </Link>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

               {/* Navigation Controls & Counter */}
               <div className="absolute bottom-6 left-6 lg:left-12 flex items-center gap-6 sm:gap-12 z-20 font-sans">
                  <div className="flex items-center gap-3 sm:gap-4">
                     {homepageOffers.map((_: any, idx: number) => (
                        <button 
                           key={idx}
                           onClick={() => setCurrentPromoIdx(idx)}
                           className={`h-0.5 transition-all duration-1000 ${idx === currentPromoIdx ? 'w-12 sm:w-20 bg-accent' : 'w-6 sm:w-8 bg-white/20'}`}
                        />
                     ))}
                  </div>
                  <span className="text-[10px] sm:text-[12px] font-black tracking-[0.5em] text-white/60">
                     <span className="text-white">0{currentPromoIdx + 1}</span> / 0{homepageOffers.length}
                  </span>
               </div>

               <div className="absolute bottom-6 right-6 lg:right-12 flex gap-2 sm:gap-4 z-20">
                  <button 
                     onClick={() => setCurrentPromoIdx(p => (p === 0 ? homepageOffers.length - 1 : p - 1))}
                     className="w-10 h-10 sm:w-12 sm:h-12 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-700 backdrop-blur-xl"
                  >
                     <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1} />
                  </button>
                  <button 
                     onClick={() => setCurrentPromoIdx(p => (p === homepageOffers.length - 1 ? 0 : p + 1))}
                     className="w-10 h-10 sm:w-12 sm:h-12 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-700 backdrop-blur-xl"
                  >
                     <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1} />
                  </button>
               </div>
            </section>
         )}

         {/* New Arrivals Grid */}
         <section className="py-24 md:py-32 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
               <div className="flex justify-between items-end mb-16">
                  <div>
                     <span className="text-[9px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-3 block">Just Arrived</span>
                     <h2 className="text-2xl md:text-3xl font-serif font-normal text-black leading-none uppercase tracking-wide">New Arrivals</h2>
                  </div>
                  <Link href="/shop" className="group flex items-center space-x-3 text-[11px] font-bold tracking-widest text-black uppercase hover:text-accent transition-colors font-sans">
                     <span>View Collection</span>
                     <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform text-accent" />
                  </Link>
               </div>

               {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                     {[...Array(5)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-50 animate-pulse border border-neutral-100" />)}
                  </div>
               ) : (
                  <div className="flex flex-col">
                     {/* First 2 rows (Products 1-10) */}
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16">
                        {newArrivals.slice(0, 10).map((product: any) => (
                           <ProductCard key={product.id} product={product} />
                        ))}
                     </div>

                     {/* Dynamic Block 1: Side-by-Side Ad Banners Carousel */}
                     {newArrivals.length > 0 && (
                        <div className="relative w-full h-[470px] md:h-[300px] mb-16 overflow-hidden">
                           {gridAds1ToUse.map((slide: any, idx: number) => (
                              <div 
                                 key={idx} 
                                 className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ease-in-out grid grid-cols-1 md:grid-cols-2 gap-8 font-sans ${
                                    idx === currentAds1 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-98 z-0 pointer-events-none'
                                 }`}
                              >
                                 {/* Left Ad Banner */}
                                 <div className="relative overflow-hidden group rounded-sm border border-neutral-100 flex h-[220px] sm:h-[260px] md:h-[300px]">
                                    {/* Left half: Image */}
                                    <div className="w-[45%] h-full relative overflow-hidden bg-neutral-50">
                                       <img 
                                          src={getMediaUrl(slide.left_image)} 
                                          alt={slide.left_title} 
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                                          onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                                       />
                                    </div>
                                    {/* Right half: Text Content */}
                                    <div className="w-[55%] bg-[#a5682a] p-4 sm:p-6 md:p-8 flex flex-col justify-center text-left text-white">
                                       <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-white/75 uppercase mb-1 sm:mb-2">{slide.left_subtitle}</span>
                                       <h3 className="text-base sm:text-lg md:text-2xl font-serif tracking-wide uppercase leading-tight mb-2 truncate">{slide.left_title}</h3>
                                       <p className="text-[10px] text-white/80 leading-relaxed font-light mb-4 sm:mb-6 tracking-wide line-clamp-2 md:line-clamp-3">
                                          {slide.left_desc}
                                       </p>
                                       <Link 
                                          href={getProductRedirectUrl(slide.left_product_id)} 
                                          className="bg-black hover:bg-neutral-900 text-white text-[9px] font-bold tracking-[0.2em] uppercase py-2.5 px-5 sm:py-3 sm:px-6 text-center max-w-[130px] transition-all duration-300 rounded-sm"
                                       >
                                          Buy Now
                                       </Link>
                                    </div>
                                 </div>

                                 {/* Right Ad Banner */}
                                 <div className="relative overflow-hidden group rounded-sm border border-neutral-100 flex h-[220px] sm:h-[260px] md:h-[300px]">
                                    {/* Left half: Image */}
                                    <div className="w-[45%] h-full relative overflow-hidden bg-neutral-50">
                                       <img 
                                          src={getMediaUrl(slide.right_image)} 
                                          alt={slide.right_title} 
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                                          onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                                       />
                                    </div>
                                    {/* Right half: Text Content */}
                                    <div className="w-[55%] bg-[#5c4033] p-4 sm:p-6 md:p-8 flex flex-col justify-center text-left text-white">
                                       <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-white/75 uppercase mb-1 sm:mb-2">{slide.right_subtitle}</span>
                                       <h3 className="text-base sm:text-lg md:text-2xl font-serif tracking-wide uppercase leading-tight mb-2 truncate">{slide.right_title}</h3>
                                       <p className="text-[10px] text-white/80 leading-relaxed font-light mb-4 sm:mb-6 tracking-wide line-clamp-2 md:line-clamp-3">
                                          {slide.right_desc}
                                       </p>
                                       <Link 
                                          href={getProductRedirectUrl(slide.right_product_id)} 
                                          className="bg-black hover:bg-neutral-900 text-white text-[9px] font-bold tracking-[0.2em] uppercase py-2.5 px-5 sm:py-3 sm:px-6 text-center max-w-[130px] transition-all duration-300 rounded-sm"
                                       >
                                          Buy Now
                                       </Link>
                                    </div>
                                 </div>
                              </div>
                           ))}

                           {/* Navigation Indicators */}
                           {gridAds1ToUse.length > 1 && (
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                                 {gridAds1ToUse.map((_: any, idx: number) => (
                                    <button
                                       key={idx}
                                       onClick={() => setCurrentAds1(idx)}
                                       className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                          idx === currentAds1 ? 'bg-accent w-4' : 'bg-neutral-300 hover:bg-neutral-400'
                                       }`}
                                    />
                                 ))}
                               </div>
                           )}
                        </div>
                     )}

                     {/* Second 2 rows (Products 11-20) */}
                     {newArrivals.length > 10 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16">
                           {newArrivals.slice(10, 20).map((product: any) => (
                              <ProductCard key={product.id} product={product} />
                           ))}
                        </div>
                     )}

                     {/* Dynamic Block 2: Full-Width Ad Banner Carousel */}
                     {newArrivals.length > 10 && (
                        <div className="relative w-full min-h-[440px] md:min-h-0 md:h-[320px] mb-16 overflow-hidden">
                           {gridAds2ToUse.map((slide: any, idx: number) => (
                              <div
                                 key={idx}
                                 className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ease-in-out w-full relative min-h-[440px] md:min-h-0 md:h-full bg-neutral-900 overflow-hidden group rounded-sm flex flex-col md:flex-row border border-neutral-800 ${
                                    idx === currentAds2 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-98 z-0 pointer-events-none'
                                 }`}
                              >
                                 {/* Left: Text Content */}
                                 <div className="w-full md:w-[60%] bg-[#8b5a2b] p-6 sm:p-10 md:p-12 flex flex-col justify-center text-left text-white">
                                    <span className="text-[8px] sm:text-[9px] font-black tracking-[0.25em] text-white/75 uppercase mb-2 block font-sans">{slide.subtitle}</span>
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif tracking-wide uppercase leading-none mb-3">{slide.title}</h2>
                                    <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-light mb-5 sm:mb-6 tracking-wide max-w-xl line-clamp-3">
                                       {slide.desc}
                                    </p>
                                    <Link 
                                       href={getProductRedirectUrl(slide.product_id)} 
                                       className="bg-black hover:bg-neutral-900 text-white text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase py-2.5 px-6 sm:py-3.5 sm:px-8 text-center max-w-[150px] sm:max-w-[180px] transition-all duration-300 rounded-sm font-sans"
                                    >
                                       Buy Now
                                    </Link>
                                 </div>
                                 {/* Right: Large Image */}
                                 <div className="w-full md:w-[40%] h-[180px] sm:h-[220px] md:h-full relative overflow-hidden bg-neutral-950">
                                    <img 
                                       src={getMediaUrl(slide.image)} 
                                       alt={slide.title} 
                                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
                                       onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                                    />
                                 </div>
                              </div>
                           ))}

                           {/* Navigation Indicators */}
                           {gridAds2ToUse.length > 1 && (
                              <div className="absolute bottom-4 left-6 z-20 flex space-x-2">
                                 {gridAds2ToUse.map((_: any, idx: number) => (
                                    <button
                                       key={idx}
                                       onClick={() => setCurrentAds2(idx)}
                                       className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                          idx === currentAds2 ? 'bg-accent w-4' : 'bg-white/40 hover:bg-white/60'
                                       }`}
                                    />
                                 ))}
                              </div>
                           )}
                        </div>
                     )}

                     {/* Remaining products (Products 21+) */}
                     {newArrivals.length > 20 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                           {newArrivals.slice(20).map((product: any) => (
                              <ProductCard key={product.id} product={product} />
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </section>

         {/* Dynamic Block 3: Brand Spotlight Ad Banners (Above Brands) */}
         <section className="pb-16 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
               <div className="relative w-full h-[470px] md:h-[300px] overflow-hidden">
                  {gridAds3ToUse.map((slide: any, idx: number) => (
                     <div 
                        key={idx} 
                        className={`absolute inset-0 w-full h-full transition-all duration-[1200ms] ease-in-out grid grid-cols-1 md:grid-cols-2 gap-8 font-sans ${
                           idx === currentAds3 ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-98 z-0 pointer-events-none'
                        }`}
                     >
                        {/* Left Ad Banner */}
                        <div className="relative overflow-hidden group rounded-sm border border-neutral-100 flex h-[220px] sm:h-[260px] md:h-[300px]">
                           {/* Left half: Image */}
                           <div className="w-[45%] h-full relative overflow-hidden bg-neutral-50">
                              <img 
                                 src={getMediaUrl(slide.left_image)} 
                                 alt={slide.left_title} 
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                                 onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                              />
                           </div>
                           {/* Right half: Text Content */}
                           <div className="w-[55%] bg-[#8c5a2b] p-4 sm:p-6 md:p-8 flex flex-col justify-center text-left text-white">
                              <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-white/75 uppercase mb-1 sm:mb-2">{slide.left_subtitle}</span>
                              <h3 className="text-base sm:text-lg md:text-2xl font-serif tracking-wide uppercase leading-tight mb-2 truncate">{slide.left_title}</h3>
                              <p className="text-[10px] text-white/80 leading-relaxed font-light mb-4 sm:mb-6 tracking-wide line-clamp-2 md:line-clamp-3">
                                 {slide.left_desc}
                              </p>
                              <Link 
                                 href={getProductRedirectUrl(slide.left_product_id)} 
                                 className="bg-black hover:bg-neutral-900 text-white text-[9px] font-bold tracking-[0.2em] uppercase py-2.5 px-5 sm:py-3 sm:px-6 text-center max-w-[130px] transition-all duration-300 rounded-sm"
                              >
                                 Buy Now
                              </Link>
                           </div>
                        </div>

                        {/* Right Ad Banner */}
                        <div className="relative overflow-hidden group rounded-sm border border-neutral-100 flex h-[220px] sm:h-[260px] md:h-[300px]">
                           {/* Left half: Image */}
                           <div className="w-[45%] h-full relative overflow-hidden bg-neutral-50">
                              <img 
                                 src={getMediaUrl(slide.right_image)} 
                                 alt={slide.right_title} 
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
                                 onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                              />
                           </div>
                           {/* Right half: Text Content */}
                           <div className="w-[55%] bg-[#1b3b22] p-4 sm:p-6 md:p-8 flex flex-col justify-center text-left text-white">
                              <span className="text-[8px] sm:text-[9px] font-black tracking-[0.2em] text-white/75 uppercase mb-1 sm:mb-2">{slide.right_subtitle}</span>
                              <h3 className="text-base sm:text-lg md:text-2xl font-serif tracking-wide uppercase leading-tight mb-2 truncate">{slide.right_title}</h3>
                              <p className="text-[10px] text-white/80 leading-relaxed font-light mb-4 sm:mb-6 tracking-wide line-clamp-2 md:line-clamp-3">
                                 {slide.right_desc}
                              </p>
                              <Link 
                                 href={getProductRedirectUrl(slide.right_product_id)} 
                                 className="bg-black hover:bg-neutral-900 text-white text-[9px] font-bold tracking-[0.2em] uppercase py-2.5 px-5 sm:py-3 sm:px-6 text-center max-w-[130px] transition-all duration-300 rounded-sm"
                              >
                                 Buy Now
                              </Link>
                           </div>
                        </div>
                     </div>
                  ))}

                  {/* Navigation Indicators */}
                  {gridAds3ToUse.length > 1 && (
                     <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                        {gridAds3ToUse.map((_: any, idx: number) => (
                           <button
                              key={idx}
                              onClick={() => setCurrentAds3(idx)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                 idx === currentAds3 ? 'bg-accent w-4' : 'bg-neutral-300 hover:bg-neutral-400'
                              }`}
                           />
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </section>

          {/* Elite Brand Houses */}
          {brands.length > 0 && (
          <section className="py-10 md:py-12 bg-[#0a0a0f] relative overflow-hidden">
             <div className="max-w-[1400px] mx-auto px-8 mb-6 flex justify-between items-end font-sans">
                <div>
                   <span className="text-[9px] font-medium tracking-[0.2em] text-accent uppercase mb-3 block">The Global Houses</span>
                   <h2 className="text-2xl md:text-3xl font-serif font-normal text-white leading-none uppercase tracking-wide">Elite Perfumery</h2>
                </div>
                <Link href="/brands" className="text-white text-[11px] font-medium tracking-[0.2em] uppercase border-b border-white/20 pb-2 hover:border-accent hover:text-accent transition-all duration-700">
                   Explore All Houses
                </Link>
             </div>

             {brands.length <= 2 ? (
                 /* Premium Luxury Spotlight circles for 1-2 Brands */
                 <div className="max-w-[1400px] mx-auto px-8">
                    <div className="flex flex-col md:flex-row gap-6 items-stretch w-full justify-center">
                       {brands.map((brand: any, idx: number) => {
                          const DEFAULT_BANNERS = [
                             "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
                             "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800"
                          ];
                          const image = brand.brand_banner 
                             ? getMediaUrl(brand.brand_banner) 
                             : (brand.banner_url 
                                ? getMediaUrl(brand.banner_url) 
                                : DEFAULT_BANNERS[idx % DEFAULT_BANNERS.length]);
                          const desc = brand.description || `Discover the signature collections and exclusive raw extractions crafted by the luxury house of ${brand.name}.`;
                          
                          return (
                             <Link
                                key={brand.id || idx}
                                href={`/shop?brand=${brand.id}`}
                                className="group relative flex-1 bg-gradient-to-b from-[#111116] to-[#07070a] rounded-lg border border-white/[0.04] hover:border-accent/40 p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-700 hover:-translate-y-1.5 shadow-2xl overflow-hidden"
                             >
                                {/* Subtle spotlight gradient on hover */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                                {/* Circular image showcase container */}
                                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-accent/20 p-1 group-hover:border-accent transition-all duration-700 mb-4 mx-auto">
                                   <img
                                      src={image}
                                      alt={brand.name}
                                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-[2.5s] ease-out"
                                      onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                                   />
                                </div>

                                {/* Logo Badge with mix-blend-multiply */}
                                {brand.logo_url && (
                                   <div className="w-12 h-12 bg-white flex items-center justify-center p-2 rounded-full shadow-md border border-white/10 mb-3 group-hover:border-accent/40 transition-all duration-700 mx-auto">
                                      <img
                                         src={getMediaUrl(brand.logo_url)}
                                         alt={`${brand.name} logo`}
                                         className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                      />
                                   </div>
                                )}

                                <span className="text-[9px] font-bold tracking-[0.25em] text-accent uppercase mb-2 block font-sans">
                                   Signature House
                                </span>

                                <h3 className="text-xl sm:text-2xl font-serif font-normal text-white uppercase tracking-wider mb-2 leading-none group-hover:text-accent transition-colors">
                                   {brand.name}
                                </h3>

                                <p className="text-[11px] text-neutral-400 leading-relaxed font-light max-w-sm mb-4 tracking-wide line-clamp-2">
                                   {desc}
                                </p>

                                <div className="bg-transparent border border-white/20 group-hover:border-accent group-hover:bg-accent text-white py-2 px-5 text-[9px] font-bold tracking-[0.25em] uppercase transition-all duration-500 rounded-full flex items-center gap-2 mt-auto">
                                   <span>Explore House</span>
                                   <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                             </Link>
                          );
                       })}
                    </div>
                 </div>
              ) : (
                /* Horizontal Grid Layout for 3+ Brands */
                <div className="relative w-full overflow-hidden">
                   <div className="flex gap-6 md:gap-8 overflow-x-auto py-3 px-8 scrollbar-hide select-none w-full justify-start md:justify-center">
                      {brands.map((brand: any, idx: number) => {
                         const hasBanner = !!brand.brand_banner;
                         return hasBanner ? (
                            <Link 
                               key={brand.id || idx} 
                               href={`/shop?brand=${brand.id}`}
                               className="group/brand relative w-[140px] h-[140px] flex-shrink-0 overflow-hidden bg-neutral-900 shadow-xl hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-700 rounded-sm"
                            >
                               <img 
                                  src={getMediaUrl(brand.brand_banner)} 
                                  alt={brand.name} 
                                  loading="lazy"
                                  decoding="async"
                                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2s] ease-out ${
                                     idx % 3 === 0 ? 'animate-kenburns-1' : idx % 3 === 1 ? 'animate-kenburns-2' : 'animate-kenburns-3'
                                  }`} 
                                  onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }} 
                               />
                               {brand.logo_url && (
                                  <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/10 group-hover/brand:bg-black/5 transition-all duration-700">
                                     <img 
                                        src={getMediaUrl(brand.logo_url)} 
                                        alt={`${brand.name} logo`} 
                                        className="max-w-[75%] max-h-[35%] object-contain filter invert brightness-0" 
                                     />
                                  </div>
                               )}
                               <div className="brand-card-shine" />
                               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10 group-hover/brand:via-black/25 transition-all duration-700" />
                               <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent scale-x-0 group-hover/brand:scale-x-100 transition-transform duration-700 origin-left z-20" />
                               <div className="absolute bottom-0 left-0 right-0 p-3 z-10 text-center">
                                  <span className="block text-[9px] font-medium tracking-[0.25em] text-white uppercase group-hover/brand:text-accent transition-all duration-700 leading-none">{brand.name}</span>
                               </div>
                               <div className="absolute inset-0 border border-white/0 group-hover/brand:border-accent/30 transition-all duration-700 pointer-events-none z-20" />
                            </Link>
                         ) : (
                            <Link 
                               key={brand.id || idx} 
                               href={`/shop?brand=${brand.id}`}
                               className="group/brand relative w-[140px] h-[140px] flex-shrink-0 overflow-hidden bg-gradient-to-b from-[#141419] to-[#09090d] border border-white/[0.06] shadow-xl hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-700 flex flex-col items-center justify-center p-3 rounded-sm"
                            >
                               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_65%)] opacity-0 group-hover/brand:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                               
                               <div className="w-[76px] h-[76px] bg-white flex items-center justify-center p-2 rounded-xs shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] border border-white/10 group-hover/brand:border-accent/30 transition-all duration-700 mb-2">
                                  {brand.logo_url ? (
                                     <img 
                                        src={getMediaUrl(brand.logo_url)} 
                                        alt={brand.name} 
                                        loading="lazy"
                                        decoding="async"
                                        className="max-w-full max-h-full object-contain mix-blend-multiply group-hover/brand:scale-105 transition-transform duration-500"
                                        onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }} 
                                     />
                                  ) : (
                                     <span className="font-serif italic font-black text-lg uppercase tracking-tight text-neutral-800">
                                        {brand.name.substring(0, 2)}
                                     </span>
                                  )}
                               </div>
                               
                               <span className="block text-[9px] font-medium tracking-[0.2em] text-neutral-300 group-hover/brand:text-accent transition-all duration-700 leading-none text-center">{brand.name}</span>
                               <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent scale-x-0 group-hover/brand:scale-x-100 transition-transform duration-700 origin-center z-20" />
                               <div className="absolute inset-0 border border-transparent group-hover/brand:border-accent/30 transition-all duration-700 pointer-events-none z-20" />
                            </Link>
                         );
                      })}
                   </div>
                </div>
             )}
          </section>
          )}


          {/* Combined Gender and Privilege Collection Editorial Section */}
          {loyaltyRewards.length > 0 ? (
             <section className="bg-white py-12 md:py-16">
               <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                     
                     {/* Column 1: For Him */}
                     <div className="relative h-[340px] sm:h-[380px] md:h-[420px] group overflow-hidden bg-neutral-900 rounded shadow-xl">
                        <img 
                           src={getMediaUrl(cmsLayout?.split_banners?.men)} 
                           alt="Shop Men" 
                           className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2.5s] ease-out" 
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors duration-1000" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center pb-12">
                           <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-300 mb-2 font-sans">Refined & Bold</h3>
                           <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-wider mb-6 uppercase text-white">For Him</h2>
                           <Link 
                              href="/shop?gender=Men" 
                              className="bg-transparent border border-white hover:bg-white text-white hover:text-black text-[10px] font-bold tracking-[0.2em] uppercase px-8 py-3.5 transition-all duration-700 rounded-full font-sans"
                           >
                              Shop Men
                           </Link>
                        </div>
                     </div>

                     {/* Column 2: The Privilege Collection */}
                     <div className="bg-neutral-50 border border-neutral-100/80 rounded shadow-sm p-6 sm:p-8 flex flex-col justify-between items-center text-center h-[340px] sm:h-[380px] md:h-[420px]">
                        <div className="w-full">
                           <span className="text-[9px] font-bold tracking-[0.3em] text-neutral-400 uppercase mb-2 block">Kozmo Rewards</span>
                           <h3 className="text-xl md:text-2xl font-nelphim font-black text-neutral-900 uppercase tracking-wider mb-2">The Privilege Collection.</h3>
                           <div className="w-8 h-[1.5px] bg-accent mx-auto mb-6" />
                        </div>

                        {/* Central Reward card */}
                        <div className="w-full max-w-[270px] flex-grow flex items-center justify-center">
                           {loyaltyRewards.slice(0, 1).map((reward: any, i: number) => (
                              <Link 
                                 key={reward.id || i} 
                                 href={`/rewards#${reward.id}`}
                                 className="group relative w-full h-[150px] sm:h-[175px] md:h-[195px] overflow-hidden bg-neutral-900 shadow-md hover:-translate-y-2 transition-all duration-700 block text-left rounded-sm"
                              >
                                 <img
                                    src={getMediaUrl(reward.image_url)}
                                    alt={reward.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-[2.5s] ease-out"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                 <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                    <div>
                                       <span className="text-[8px] font-black tracking-[0.3em] text-yellow-500 uppercase block mb-1">{reward.reward_type}</span>
                                       <h3 className="text-sm font-serif italic text-white mb-2 tracking-tight line-clamp-1">{reward.name}</h3>
                                       <p className="text-[10px] text-neutral-300 leading-relaxed font-light opacity-80 group-hover:opacity-100 transition-opacity duration-700 line-clamp-2">
                                          {reward.description}
                                       </p>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[9px] font-black tracking-[0.2em] text-white mt-3 border-t border-white/10 pt-3 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                       <span>{reward.point_cost ? `${reward.point_cost} POINTS` : 'EXPLORE'}</span>
                                       <ArrowRight size={10} className="group-hover:translate-x-1.5 transition-transform duration-500" />
                                    </div>
                                 </div>
                              </Link>
                           ))}
                        </div>

                        <Link
                           href="/rewards"
                           className="text-[9px] font-black tracking-[0.3em] uppercase border-b border-neutral-950/20 hover:border-neutral-950 pb-1 hover:text-accent transition-all duration-500 mt-6"
                        >
                           View Full Gallery
                        </Link>
                     </div>

                     {/* Column 3: For Her */}
                     <div className="relative h-[340px] sm:h-[380px] md:h-[420px] group overflow-hidden bg-neutral-900 rounded shadow-xl">
                        <img 
                           src={getMediaUrl(cmsLayout?.split_banners?.women)} 
                           alt="Shop Women" 
                           className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2.5s] ease-out" 
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors duration-1000" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center pb-12">
                           <h3 className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-300 mb-2 font-sans">Elegant & Sweet</h3>
                           <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-wider mb-6 uppercase text-white">For Her</h2>
                           <Link 
                              href="/shop?gender=Women" 
                              className="bg-transparent border border-white hover:bg-white text-white hover:text-black text-[10px] font-bold tracking-[0.2em] uppercase px-8 py-3.5 transition-all duration-700 rounded-full font-sans"
                           >
                              Shop Women
                           </Link>
                        </div>
                     </div>

                  </div>
               </div>
            </section>
         ) : (
            /* Fallback Split Banner Promos when no loyalty rewards are available */
            <section className="grid grid-cols-1 md:grid-cols-2 gap-1 py-1 bg-white">
               <div className="relative h-[500px] md:h-[600px] group overflow-hidden bg-neutral-900">
                  <img src={getMediaUrl(cmsLayout?.split_banners?.men)} alt="Shop Men" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2s]" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
                     <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-300 mb-3 font-sans">Refined & Bold</h3>
                     <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-wide mb-6 uppercase">For Him</h2>
                     <Link href="/shop?gender=Men" className="bg-white hover:bg-accent text-black hover:text-white text-[11px] font-bold tracking-[0.25em] uppercase px-12 py-4 transition-all duration-700 shadow-2xl font-sans">
                        Shop Men
                     </Link>
                  </div>
               </div>

               <div className="relative h-[500px] md:h-[600px] group overflow-hidden bg-neutral-900">
                  <img src={getMediaUrl(cmsLayout?.split_banners?.women)} alt="Shop Women" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[2s]" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
                     <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-300 mb-3 font-sans">Elegant & Sweet</h3>
                     <h2 className="text-4xl md:text-5xl font-serif font-normal tracking-wide mb-6 uppercase">For Her</h2>
                     <Link href="/shop?gender=Women" className="bg-white hover:bg-accent text-black hover:text-white text-[11px] font-bold tracking-[0.25em] uppercase px-12 py-4 transition-all duration-700 shadow-2xl font-sans">
                        Shop Women
                     </Link>
                  </div>
               </div>
            </section>
         )}

         {/* Mid Quote Banner */}
         <section className="bg-black text-white py-16 md:py-20 relative overflow-hidden flex items-center justify-center text-center">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none overflow-hidden">
               <img src="/kozmocart/logo.png" alt="Kozmocart Logo Watermark" className="w-[60vw] max-w-[700px] object-contain" />
            </div>
            <div className="relative z-10 max-w-3xl px-8">
               <h3 className="text-xs font-bold tracking-[0.3em] text-accent uppercase mb-4 font-sans">
                  {cmsLayout?.mid_quote?.author || 'The Essence of Beauty'}
               </h3>
               <blockquote className="text-2xl md:text-4xl font-serif italic tracking-wide mb-6 text-white/90 leading-tight">
                  &ldquo;{cmsLayout?.mid_quote?.text || "Perfume follows you; it chases you and lingers behind you. It's a reference mark."}&rdquo;
               </blockquote>
               <div className="w-16 h-[2px] bg-white mx-auto mb-4" />
               <p className="text-[12px] font-black tracking-[0.3em] uppercase text-neutral-500">Authentic Fragrances Only</p>
            </div>
         </section>


         {/* House Favorites Arches - only shown if configured in Storefront CMS */}
         {cmsLayout?.house_favorites?.length > 0 && (
         <section className="relative w-full bg-[#fcfcfc] py-12 md:py-16 overflow-hidden border-t border-neutral-100">
            <div className="max-w-[1400px] mx-auto px-8 text-center mb-8 md:mb-10 relative z-20">
               <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase mb-3 block">The Elite List</span>
               <h2 className="text-3xl md:text-4xl font-nelphim font-black text-black leading-normal uppercase tracking-wider">House Favorites</h2>
               <div className="w-12 h-[2px] bg-accent mx-auto mt-3" />
            </div>

            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full text-center pointer-events-none">
               <h2 className="text-white text-5xl md:text-[7rem] font-black tracking-[0.2em] leading-none mix-blend-overlay uppercase filter drop-shadow-2xl opacity-70">
                  LEGENDARY
               </h2>
            </div>

            <div className="max-w-[1700px] mx-auto w-full h-full flex md:grid md:grid-cols-5 gap-6 md:gap-8 overflow-x-auto md:overflow-visible scrollbar-hide px-6 md:px-12 relative z-10 pt-0 items-end">
               {cmsLayout.house_favorites.map((item: any, idx: number) => (
                  <div
                     key={idx}
                     className="group relative flex flex-col justify-end overflow-hidden flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-auto h-[55vh] md:h-[75vh] rounded-t-full shadow-2xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-1000 hover:-translate-y-6 border border-neutral-100"
                  >
                     <img
                        src={getMediaUrl(item.img)}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out"
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />

                     <div className="relative z-10 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-6 text-center flex justify-center items-center min-h-[80px] border-t border-white/5 backdrop-blur-[2px]">
                        <span className="text-white font-black text-[12px] tracking-[0.2em] uppercase group-hover:tracking-[0.4em] transition-all duration-700">
                           {item.name}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         </section>
         )}
      </div>
   );
}
