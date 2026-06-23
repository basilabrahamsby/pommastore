'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { ChevronRight, Search } from 'lucide-react';
import { getMediaUrl } from '@/services/media';

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
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBrandsAndProducts = async () => {
      try {
        const [resBrands, resProducts] = await Promise.allSettled([
          api.get('/brands'),
          api.get('/products?limit=40')
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
  }, []);

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group brands by alphabet
  const groupedBrands = filteredBrands.reduce((acc: Record<string, Brand[]>, brand) => {
    const letter = brand.name.charAt(0).toUpperCase();
    const key = /^[A-Z]$/.test(letter) ? letter : '#';
    if (!acc[key]) acc[key] = [];
    acc[key].push(brand);
    return acc;
  }, {});

  const alphabet = Object.keys(groupedBrands).sort();

  const displayProducts = products.filter(p => 
    brands.some(b => b.id === p.brand_id || b.name === p.brand_name)
  ).length > 0 ? products.filter(p => 
    brands.some(b => b.id === p.brand_id || b.name === p.brand_name)
  ) : products;

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
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
      `}} />
      {/* Banner / Header */}
      <div className="bg-[#FAF8F5] py-24 border-b border-neutral-200/50 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center relative z-10">
          <div className="flex items-center justify-center space-x-2 text-[9px] font-bold tracking-[0.3em] text-accent uppercase mb-4">
             <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
             <ChevronRight size={10} />
             <span className="text-neutral-900">Brands</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-normal text-neutral-900 leading-tight uppercase tracking-wider mb-2">
            World of Fragrance
          </h1>
          <p className="mt-4 text-neutral-500 max-w-xl mx-auto font-light tracking-wide text-sm leading-relaxed">
            Explore our curated universe of the finest, 100% authentic global perfume houses.
          </p>
          
          {/* Filter & Search row */}
          <div className="mt-12 max-w-lg mx-auto relative shadow-sm rounded-lg overflow-hidden border border-neutral-200 bg-white">
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
        </div>
      </div>

      {/* Dynamic Moving Product Showcase Banner */}
      {displayProducts.length > 0 && (
        <div className="w-full bg-[#FAF8F5] border-t border-b border-neutral-200/50 py-6 overflow-hidden relative">
          <div className="max-w-[1400px] mx-auto px-6 mb-4 flex flex-col items-start font-sans">
             <span className="text-[8px] font-bold tracking-[0.25em] text-accent uppercase mb-1">Featured Creations</span>
             <h2 className="text-lg font-serif font-normal text-neutral-900 uppercase tracking-wider leading-none">Olfactory Exhibition</h2>
          </div>
          
          <div className="w-full relative overflow-hidden flex">
            <div className="animate-marquee flex gap-6">
              {/* First loop */}
              {displayProducts.map((product: any, idx: number) => {
                const imgUrl = product.images?.[0] 
                  ? getMediaUrl(product.images[0]) 
                  : (product.image ? getMediaUrl(product.image) : '/kozmocart/placeholder-perfume.png');
                const price = product.variants?.[0]?.selling_price;
                
                return (
                  <Link 
                    key={`m1-${product.id || idx}`} 
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-4 p-3 bg-white border border-neutral-200/60 rounded-lg hover:border-accent/60 shadow-sm transition-all duration-300 w-[280px] flex-shrink-0 cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-neutral-50 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-100">
                      <img 
                        src={imgUrl} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-cover hover:scale-105 transition-transform duration-500" 
                        onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7.5px] font-bold text-accent tracking-[0.2em] uppercase leading-none mb-1">
                        {product.brand_name || 'Brand House'}
                      </span>
                      <h4 className="text-xs font-serif font-normal text-neutral-800 tracking-wide line-clamp-1 leading-tight mb-1 uppercase">
                        {product.name}
                      </h4>
                      {price && (
                        <span className="text-[11px] text-neutral-900 font-semibold font-sans leading-none">
                          ₹{price.toLocaleString('en-IN')}/-
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {/* Duplicate loop for seamless scroll */}
              {displayProducts.map((product: any, idx: number) => {
                const imgUrl = product.images?.[0] 
                  ? getMediaUrl(product.images[0]) 
                  : (product.image ? getMediaUrl(product.image) : '/kozmocart/placeholder-perfume.png');
                const price = product.variants?.[0]?.selling_price;
                
                return (
                  <Link 
                    key={`m2-${product.id || idx}`} 
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-4 p-3 bg-white border border-neutral-200/60 rounded-lg hover:border-accent/60 shadow-sm transition-all duration-300 w-[280px] flex-shrink-0 cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-neutral-50 rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-neutral-100">
                      <img 
                        src={imgUrl} 
                        alt={product.name} 
                        className="max-w-full max-h-full object-cover hover:scale-105 transition-transform duration-500" 
                        onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7.5px] font-bold text-accent tracking-[0.2em] uppercase leading-none mb-1">
                        {product.brand_name || 'Brand House'}
                      </span>
                      <h4 className="text-xs font-serif font-normal text-neutral-800 tracking-wide line-clamp-1 leading-tight mb-1 uppercase">
                        {product.name}
                      </h4>
                      {price && (
                        <span className="text-[11px] text-neutral-900 font-semibold font-sans leading-none">
                          ₹{price.toLocaleString('en-IN')}/-
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Listing Grid */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-neutral-100 animate-pulse rounded-lg" />
             ))}
          </div>
        ) : filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {filteredBrands.map((brand) => {
              const bannerImg = brand.brand_banner 
                ? getMediaUrl(brand.brand_banner) 
                : brand.banner_url 
                ? getMediaUrl(brand.banner_url) 
                : null;
              const hasBanner = !!bannerImg;
              const desc = brand.description || `Discover the exclusive fragrance collections and olfactory philosophy of the house of ${brand.name}.`;

              return (
                <Link 
                  key={brand.id} 
                  href={`/shop?brand=${brand.id}`}
                  className="group relative bg-white rounded-lg border border-neutral-200/50 hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-700 hover:-translate-y-1.5 overflow-hidden flex flex-col items-center text-center"
                >
                  {/* Top Banner Image Container */}
                  <div className="w-full h-36 relative overflow-hidden bg-neutral-100 flex-shrink-0">
                     {hasBanner ? (
                        <img 
                           src={bannerImg} 
                           alt={`${brand.name} banner`} 
                           className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-105 ease-out"
                           onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
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
                     <div className="absolute inset-0 bg-black/[0.04] group-hover:bg-transparent transition-colors duration-700" />
                  </div>

                  {/* Floating Brand Logo Avatar */}
                  <div className="relative -mt-10 mb-3 w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-md z-10 flex items-center justify-center group-hover:border-accent transition-all duration-700">
                     {brand.logo_url ? (
                        <img 
                           src={getMediaUrl(brand.logo_url)} 
                           alt={`${brand.name} logo`} 
                           className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                           onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                        />
                     ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                           <span className="text-accent text-xl font-serif italic">{brand.name?.[0] || '✦'}</span>
                        </div>
                     )}
                  </div>

                  {/* Card details */}
                  <div className="p-6 pt-1 pb-8 flex flex-col items-center text-center flex-1 w-full">
                     <span className="text-[8px] font-bold tracking-[0.25em] text-accent uppercase mb-2 block font-sans">
                        {brand.origin_country || 'Signature House'}
                     </span>

                     <h3 className="text-base sm:text-lg font-serif font-normal text-neutral-900 uppercase tracking-wider mb-2 leading-none group-hover:text-accent transition-colors">
                        {brand.name}
                     </h3>

                     <p className="text-[11px] text-neutral-600 leading-relaxed font-light max-w-xs mb-4 tracking-wide line-clamp-2">
                        {desc}
                     </p>

                     <div className="mt-auto flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-neutral-400 group-hover:text-accent transition-colors duration-300 uppercase font-sans">
                        <span>{brand.product_count} Products</span>
                        <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                     </div>
                  </div>
                </Link>
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
  );}
