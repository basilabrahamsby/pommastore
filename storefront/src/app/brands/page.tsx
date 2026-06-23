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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/brands');
        setBrands(res.data);
      } catch (err) {
        console.error('Failed to load brands', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
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

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
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
          
          {/* Alphabet Filter & Search row */}
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

      {/* Alphabetical Jump Bar */}
      <div className="sticky top-0 bg-[#FCFAF7]/95 backdrop-blur-md z-20 border-b border-neutral-200/40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex items-center justify-center space-x-3 min-w-max">
            {alphabet.map((letter) => (
              <a 
                key={letter}
                href={`#letter-${letter}`}
                className="w-9 h-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-[10px] font-bold tracking-widest uppercase hover:bg-accent hover:text-white hover:border-accent transition-all duration-300 text-neutral-600 shadow-sm"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Listing Grid */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-neutral-100 animate-pulse rounded-lg" />
             ))}
          </div>
        ) : alphabet.length > 0 ? (
          <div className="space-y-24">
            {alphabet.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-32 relative">
                {/* Large Background Letter for Luxury depth effect */}
                <div className="absolute -top-16 left-0 text-[11rem] md:text-[14rem] font-serif font-normal italic text-neutral-200/30 -z-10 select-none pointer-events-none">
                   {letter}
                </div>
                
                <div className="flex items-end space-x-6 border-b border-neutral-200 pb-4 mb-12 relative z-10">
                  <span className="text-4xl md:text-5xl font-serif font-normal italic text-neutral-900 leading-none tracking-tight">{letter}</span>
                  <div className="flex-grow h-px bg-neutral-200/60 hidden md:block" />
                  <span className="text-[9px] font-bold tracking-[0.25em] text-accent uppercase font-sans">
                     {groupedBrands[letter].length} Brands
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {groupedBrands[letter].map((brand) => {
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
              </div>
            ))}
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
