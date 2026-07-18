'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { ChevronRight, Search } from 'lucide-react';
import { getMediaUrl } from '@/services/media';
import { useTranslation } from '@/locales/i18nContext';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  product_count: number;
  description?: string;
  brand_banner?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  origin_country?: string;
  founding_year?: string;
  lead_perfumer?: string;
  philosophy?: string;
  instagram_url?: string;
  tiktok_url?: string;
  fragrantica_url?: string;
  brand_tier?: string;
}

export default function BrandsPage() {
  const { t, locale } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBrandsAndProducts = async () => {
      try {
        const [resBrands, resProducts] = await Promise.allSettled([
          api.get(`/brands?lang=${locale}`, { headers: { 'Accept-Language': locale } }),
          api.get(`/products?limit=60&lang=${locale}`, { headers: { 'Accept-Language': locale } })
        ]);
        
        if (resBrands.status === 'fulfilled') {
          setBrands(resBrands.value.data);
        }
        if (resProducts.status === 'fulfilled') {
          setProducts(resProducts.value.data);
        }
      } catch (err) {
        console.error('Failed to load brands and products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrandsAndProducts();
  }, [locale]);

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get first 2 brands for the split collage hero
  const heroBrands = brands.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
      {/* Dynamic Moving Product / Ken Burns css */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes slowZoom {
          0% { transform: scale(1.02); }
          50% { transform: scale(1.08) translate(5px, 2px); }
          100% { transform: scale(1.02); }
        }
        .animate-slowzoom {
          animation: slowZoom 25s ease-in-out infinite;
        }
      `}} />

      {/* Split Collage Hero Banner */}
      <div className="w-full h-[320px] md:h-[480px] relative overflow-hidden flex flex-col md:flex-row bg-neutral-900 border-b border-neutral-200/50">
         {heroBrands.map((brand, idx) => {
            const banner = brand.brand_banner 
              ? getMediaUrl(brand.brand_banner) 
              : brand.banner_url 
              ? getMediaUrl(brand.banner_url) 
              : '/placeholder-perfume.png';
            return (
               <div key={`hero-split-${brand.id || idx}`} className="flex-1 h-full relative overflow-hidden group/split border-r last:border-r-0 border-white/10">
                  <img 
                     src={banner} 
                     alt={brand.name} 
                     className="w-full h-full object-cover animate-slowzoom opacity-50 group-hover/split:opacity-65 transition-opacity duration-700"
                     onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Subtle brand floating tag on their side */}
                  <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 flex items-center gap-3 z-10 pointer-events-none">
                     {brand.logo_url && (
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 border border-white/20 shadow-md">
                           <img 
                              src={getMediaUrl(brand.logo_url)} 
                              alt={brand.name} 
                              className="max-w-full max-h-full object-contain mix-blend-multiply" 
                           />
                        </div>
                     )}
                     <span className="text-xs font-serif text-white tracking-widest uppercase leading-none">{brand.name}</span>
                  </div>
               </div>
            );
         })}

         {/* Centered Glassmorphic Info Card */}
         <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-6">
            <div className="bg-white/85 backdrop-blur-md border border-white/20 p-8 md:p-12 shadow-2xl text-center rounded-xl max-w-xl">
               <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase mb-2 block font-sans">
                  The Global Houses
               </span>
               <h1 className="text-3xl md:text-5xl font-serif font-normal text-neutral-900 uppercase tracking-wider mb-3 leading-none">
                  World of Fragrance
               </h1>
               <p className="text-xs md:text-sm text-neutral-600 font-light tracking-wide max-w-md mx-auto leading-relaxed font-sans">
                  Explore our curated universe of the finest, 100% authentic global perfume houses.
               </p>
            </div>
         </div>
      </div>

      {/* Main Listing Grid - 1 Row, 2 Cards Layout */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        {/* Search row (placed below Hero Banner) */}
        <div className="max-w-lg mx-auto relative shadow-sm rounded-lg overflow-hidden border border-neutral-200 bg-white mb-16">
           <div className="absolute inset-y-0 left-4 flex items-center text-neutral-400 pointer-events-none">
              <Search size={18} />
           </div>
           <input 
             type="text"
             placeholder="Search for your favorite brand..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-white pl-12 pr-4 py-4 font-light text-neutral-800 focus:outline-none transition-colors"
           />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {[...Array(2)].map((_, i) => (
                <div key={i} className="h-96 bg-neutral-100 animate-pulse rounded-lg" />
             ))}
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {filteredBrands.map((brand) => {
              const bannerImg = brand.brand_banner 
                ? getMediaUrl(brand.brand_banner) 
                : brand.banner_url 
                ? getMediaUrl(brand.banner_url) 
                : null;
              const hasBanner = !!bannerImg;
              const desc = brand.description || `Discover the exclusive fragrance collections and olfactory philosophy of the house of ${brand.name}.`;

              // Dynamically extract product categories for this brand
              const brandProducts = products.filter(p => p.brand_id === brand.id || p.brand_name === brand.name || p.brand === brand.name || p.brand === brand.id);
              const categories = Array.from(new Set(brandProducts.map(p => p.category_name).filter(Boolean))) as string[];

              return (
                <div 
                  key={brand.id}
                  className="group/brand relative bg-white rounded-xl border border-neutral-200/50 hover:border-accent/40 shadow-md hover:shadow-xl transition-all duration-700 flex flex-col overflow-hidden"
                >
                  {/* Top Banner Image Container */}
                  <div className="w-full h-48 md:h-64 relative overflow-hidden bg-neutral-100 flex-shrink-0">
                     {hasBanner ? (
                        <img 
                           src={bannerImg} 
                           alt={`${brand.name} banner`} 
                           className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover/brand:scale-105 ease-out"
                           onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                        />
                     ) : (
                        <div 
                           className="w-full h-full" 
                           style={{ 
                              background: brand.primary_color 
                                 ? `linear-gradient(135deg, ${brand.primary_color}25, ${brand.primary_color}05)` 
                                 : 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' 
                           }} 
                        />
                     )}
                     <div className="absolute inset-0 bg-black/[0.04] group-hover/brand:bg-transparent transition-colors duration-700" />
                  </div>

                  {/* Floating Brand Logo Avatar */}
                  <div className="relative -mt-12 mb-3 w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-md z-10 flex items-center justify-center group-hover/brand:border-accent transition-all duration-700 mx-auto">
                     {brand.logo_url ? (
                        <img 
                           src={getMediaUrl(brand.logo_url)} 
                           alt={`${brand.name} logo`} 
                           className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply group-hover/brand:scale-105 transition-transform duration-500"
                           onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                        />
                     ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                           <span className="text-accent text-2xl font-serif italic">{brand.name?.[0] || '✦'}</span>
                        </div>
                     )}
                  </div>

                  {/* Card details */}
                  <div className="p-8 pt-1 pb-10 flex flex-col flex-1 w-full px-6 md:px-10">
                     <span className="text-[8px] font-bold tracking-[0.25em] text-accent uppercase mb-2 block font-sans text-center">
                        {brand.brand_tier || 'Signature House'}
                     </span>

                     <h3 className="text-xl sm:text-2xl font-serif font-normal text-neutral-900 uppercase tracking-wider mb-3 leading-none group-hover/brand:text-accent transition-colors text-center">
                        {brand.name}
                     </h3>

                     <p className="text-[11px] text-neutral-600 leading-relaxed font-light mb-5 tracking-wide text-center max-w-md mx-auto">
                        {desc}
                     </p>

                     {/* Philosophy Quote */}
                     {brand.philosophy && (
                       <blockquote className="text-xs text-neutral-500 italic max-w-md mb-5 px-6 font-serif border-l-2 border-accent/30 py-0.5 my-1 text-center mx-auto">
                         "{brand.philosophy}"
                       </blockquote>
                     )}

                     {/* Specification Details Grid */}
                     {(brand.origin_country || brand.founding_year || brand.lead_perfumer) && (
                       <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[10px] text-left w-full border-t border-neutral-100 pt-4 pb-3 mb-4 max-w-md mx-auto">
                          {brand.origin_country && (
                            <div>
                              <span className="block text-[7.5px] uppercase tracking-wider text-neutral-400 font-sans">Origin</span>
                              <span className="font-medium text-neutral-800">{brand.origin_country}</span>
                            </div>
                          )}
                          {brand.founding_year && (
                            <div>
                              <span className="block text-[7.5px] uppercase tracking-wider text-neutral-400 font-sans">Est. Year</span>
                              <span className="font-medium text-neutral-800">{brand.founding_year}</span>
                            </div>
                          )}
                          {brand.lead_perfumer && (
                            <div className="col-span-2">
                              <span className="block text-[7.5px] uppercase tracking-wider text-neutral-400 font-sans">Lead Nose / Perfumer</span>
                              <span className="font-medium text-neutral-800">{brand.lead_perfumer}</span>
                            </div>
                          )}
                       </div>
                     )}

                     {/* Brand Product Categories pills */}
                     {categories.length > 0 && (
                       <div className="w-full border-t border-neutral-100 pt-4 mb-5 max-w-md mx-auto">
                          <span className="block text-[7.5px] uppercase tracking-wider text-neutral-400 text-left mb-2.5 font-sans">Olfactory Families</span>
                          <div className="flex flex-wrap gap-1.5 justify-start">
                            {categories.map((catName) => (
                              <span key={catName} className="text-[8px] font-bold tracking-wider bg-[#FAF8F5] text-neutral-600 border border-neutral-200/60 px-2.5 py-1 rounded font-sans uppercase">
                                {catName}
                              </span>
                            ))}
                          </div>
                       </div>
                     )}

                     {/* Embedded Brand Products Horizontal Row */}
                     {brandProducts.length > 0 && (
                       <div className="w-full border-t border-neutral-100 pt-5 mt-auto">
                          <span className="block text-[8px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-3.5 font-sans text-left">
                             Signature Collection
                          </span>
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x select-none justify-start">
                             {brandProducts.map((product: any, pIdx: number) => {
                                const pImg = product.images?.[0] 
                                  ? getMediaUrl(product.images[0]) 
                                  : (product.image ? getMediaUrl(product.image) : '/placeholder-perfume.png');
                                const pPrice = product.variants?.[0]?.selling_price;
                                
                                return (
                                   <Link 
                                      key={product.id || pIdx} 
                                      href={`/product/${product.slug}`}
                                      className="group/prod flex flex-col items-center w-[120px] sm:w-[130px] flex-shrink-0 bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] border border-neutral-150/70 hover:border-accent/40 rounded-lg p-3 transition-all duration-500 snap-start"
                                   >
                                      <div className="w-full aspect-square bg-white rounded overflow-hidden flex items-center justify-center p-1.5 border border-neutral-100 relative mb-2">
                                         <img 
                                            src={pImg} 
                                            alt={product.name} 
                                            className="max-w-full max-h-full object-contain group-hover/prod:scale-105 transition-transform duration-500"
                                            onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                                         />
                                      </div>
                                      <h5 className="text-[10px] font-serif font-normal text-neutral-800 tracking-wide line-clamp-1 mb-1 uppercase w-full text-center leading-none">
                                         {product.name}
                                       </h5>
                                      {pPrice && (
                                         <span className="text-[10px] text-neutral-900 font-semibold font-sans leading-none">
                                            AED {pPrice.toLocaleString('en-IN')}
                                         </span>
                                      )}
                                   </Link>
                                );
                             })}
                          </div>
                       </div>
                     )}

                     {/* Social Links Row */}
                     {(brand.instagram_url || brand.tiktok_url || brand.fragrantica_url) && (
                       <div className="flex gap-5 justify-center mb-5 mt-6 border-t border-neutral-100 pt-4">
                          {brand.instagram_url && (
                            <a href={brand.instagram_url} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-neutral-400 hover:text-accent tracking-widest uppercase font-sans">
                              Instagram
                            </a>
                          )}
                          {brand.tiktok_url && (
                            <a href={brand.tiktok_url} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-neutral-400 hover:text-accent tracking-widest uppercase font-sans">
                              TikTok
                            </a>
                          )}
                          {brand.fragrantica_url && (
                            <a href={brand.fragrantica_url} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-neutral-400 hover:text-accent tracking-widest uppercase font-sans">
                              Fragrantica
                            </a>
                          )}
                       </div>
                     )}

                     <Link 
                       href={`/shop?brand=${brand.id}`}
                       className="w-full bg-transparent border border-neutral-200 group-hover/brand:border-accent group-hover/brand:bg-accent text-neutral-800 group-hover/brand:text-white py-3 px-6 text-[9.5px] font-bold tracking-[0.25em] uppercase transition-all duration-500 rounded-md flex items-center justify-center gap-2 mt-4 font-sans"
                     >
                       <span>Explore Full House ({brand.product_count} Products)</span>
                       <ChevronRight size={10} className="group-hover/brand:translate-x-1 transition-transform" />
                     </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-32 text-center">
            <p className="text-neutral-400 font-serif italic text-xl mb-4">No luxury houses found matching '{searchTerm}'</p>
            <button onClick={() => setSearchTerm('')} className="text-xs font-black tracking-[0.3em] uppercase border-b-2 border-black pb-1 hover:text-neutral-500 transition-colors">
              View All Brands
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
