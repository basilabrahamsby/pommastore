'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { ChevronRight, Search } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  product_count: number;
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
    <div className="min-h-screen bg-white">
      {/* Banner / Header */}
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <div className="flex items-center justify-center space-x-2 text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase mb-4">
             <Link href="/" className="hover:text-black transition-colors">Home</Link>
             <ChevronRight size={12} />
             <span className="text-black">Brands</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic font-black tracking-tight text-neutral-900">
            World of Fragrance
          </h1>
          <p className="mt-4 text-neutral-500 max-w-xl mx-auto font-medium tracking-wide">
            Explore our curated universe of the finest, 100% authentic global perfume houses.
          </p>
          
          {/* Alphabet Filter & Search row */}
          <div className="mt-12 max-w-lg mx-auto relative">
             <div className="absolute inset-y-0 left-4 flex items-center text-neutral-400 pointer-events-none">
                <Search size={18} />
             </div>
             <input 
               type="text"
               placeholder="Search for your favorite brand..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white border border-neutral-200 pl-12 pr-4 py-4 font-medium focus:outline-none focus:border-black transition-colors shadow-sm"
             />
          </div>
        </div>
      </div>

      {/* Alphabetical Jump Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-neutral-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-5 overflow-x-auto">
          <div className="flex items-center justify-center space-x-2 min-w-max">
            {alphabet.map((letter) => (
              <a 
                key={letter}
                href={`#letter-${letter}`}
                className="w-9 h-9 flex items-center justify-center text-[10px] font-black tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300 text-neutral-500 border border-transparent hover:border-black"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {[...Array(8)].map((_, i) => (
               <div key={i} className="h-20 bg-neutral-100 animate-pulse rounded" />
             ))}
          </div>
        ) : alphabet.length > 0 ? (
          <div className="space-y-24">
            {alphabet.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-32 relative">
                {/* Large Background Letter for Luxury depth effect */}
                <div className="absolute -top-12 left-0 text-[10rem] md:text-[12rem] font-serif font-black italic text-neutral-100/40 -z-10 select-none pointer-events-none">
                   {letter}
                </div>
                
                <div className="flex items-end space-x-6 border-b border-neutral-200 pb-6 mb-12 relative z-10">
                  <span className="text-5xl md:text-6xl font-serif font-black italic text-neutral-900 leading-none tracking-tight">{letter}</span>
                  <div className="flex-grow h-px bg-neutral-100 hidden md:block" />
                  <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase">
                     {groupedBrands[letter].length} Brands
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 relative z-10">
                  {groupedBrands[letter].map((brand) => (
                    <Link 
                      key={brand.id} 
                      href={`/shop?brand=${brand.id}`}
                      className="group relative bg-white border border-neutral-100 p-8 flex flex-col items-center text-center hover:border-black hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                    >
                      {/* Dynamic Luxury Placeholder/Monogram */}
                      <div className="w-16 h-16 rounded-full border border-neutral-100 flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors duration-500">
                         <span className="font-serif italic font-black text-2xl uppercase tracking-tight">
                           {brand.name.substring(0, 2)}
                         </span>
                      </div>
                      
                      <h3 className="text-sm md:text-base font-black tracking-[0.15em] text-neutral-900 uppercase group-hover:tracking-[0.25em] transition-all duration-500 leading-tight mb-2">
                        {brand.name}
                      </h3>
                      
                      <div className="mt-2 flex items-center text-[9px] font-bold tracking-[0.2em] text-neutral-400 uppercase group-hover:text-black transition-colors">
                         <span>{brand.product_count} Products</span>
                         <ChevronRight size={12} className="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>

                      {/* Hover accent line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-black group-hover:w-1/2 transition-all duration-500" />
                    </Link>
                  ))}
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
  );
}
