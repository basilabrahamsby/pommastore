'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import ProductCard from '@/components/ProductCard';
import { getMediaUrl } from '@/services/media';
import { SlidersHorizontal, ChevronDown, ChevronRight, LayoutGrid, List, X } from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const brand = searchParams.get('brand');
  const genderQuery = searchParams.get('gender');
  const searchQuery = searchParams.get('search');
  const categoryQuery = searchParams.get('category');

  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Dedicated filter state to drive real-time client-side pruning
  const [selectedFilters, setSelectedFilters] = useState<{
    Gender: string[];
    Category: string[];
    Brand: string[];
    'Price Range': string[];
    'Scent Family': string[];
    Concentration: string[];
  }>({
    Gender: [],
    Category: [],
    Brand: [],
    'Price Range': [],
    'Scent Family': [],
    Concentration: []
  });

  // Initialize filters from URL parameters if provided
  useEffect(() => {
    setSelectedFilters(prev => {
      const updated = { ...prev };
      
      if (genderQuery) {
        const formattedGender = genderQuery.charAt(0).toUpperCase() + genderQuery.slice(1).toLowerCase();
        updated.Gender = [formattedGender];
      } else {
        updated.Gender = [];
      }
      
      if (brand && brandsList.length > 0) {
        const brandObj = brandsList.find((b: any) => 
          b.id === brand || 
          b.slug === brand || 
          b.name?.toLowerCase() === brand.toLowerCase()
        );
        if (brandObj) {
          updated.Brand = [brandObj.name];
        }
      } else {
        updated.Brand = [];
      }

      if (categoryQuery && categoriesList.length > 0) {
        const catObj = categoriesList.find((c: any) => 
          c.id === categoryQuery || 
          c.slug === categoryQuery || 
          c.name?.toLowerCase() === categoryQuery.toLowerCase()
        );
        if (catObj) {
          updated.Category = [catObj.name];
        }
      } else {
        updated.Category = [];
      }
      
      return updated;
    });
  }, [genderQuery, brand, brandsList, categoryQuery, categoriesList]);

  // Sync URL search query to local search state
  useEffect(() => {
    if (searchQuery) {
      setSearchVal(searchQuery);
    } else {
      setSearchVal('');
    }
  }, [searchQuery]);

  // Fetch meta data for filters
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [resBrands, resCats] = await Promise.all([
          api.get('/brands'),
          api.get('/categories')
        ]);
        setBrandsList(resBrands.data);
        setCategoriesList(resCats.data);
      } catch (err) {
        console.error('Failed to fetch filter metadata', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch the base dataset based on indexable server parameters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = '/products?limit=100'; // Fetch extended cache for frictionless client filtering
        const res = await api.get(url);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch base product dataset', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filterSections = [
    { title: "Gender" as const, options: ["Men", "Women", "Unisex"] },
    { title: "Category" as const, options: categoriesList.map((c: any) => c.name) },
    { title: "Brand" as const, options: brandsList.map((b: any) => b.name) },
    { title: "Price Range" as const, options: ["Under ₹1,000", "₹1,000 - ₹5,000", "₹5,000 - ₹10,000", "Over ₹10,000"] },
    { title: "Scent Family" as const, options: ["Floral", "Woody", "Oriental", "Fresh", "Citrus"] },
    { title: "Concentration" as const, options: ["EDP", "EDT", "Parfum", "Cologne"] }
  ];

  const toggleFilter = (section: keyof typeof selectedFilters, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[section];
      const isSelected = current.includes(option);
      return {
        ...prev,
        [section]: isSelected 
          ? current.filter(i => i !== option)
          : [...current, option]
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      Gender: [],
      Category: [],
      Brand: [],
      'Price Range': [],
      'Scent Family': [],
      Concentration: []
    });
    router.push('/shop');
  };

  const [searchVal, setSearchVal] = useState('');

  // Process high-speed client pruning using React useMemo to bypass network roundtrips
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      // 0. Discovery Search Check
      if (searchVal) {
        const query = searchVal.toLowerCase();
        const inName = (product.name || '').toLowerCase().includes(query);
        const inBrand = (product.brand_name || '').toLowerCase().includes(query);
        const inDesc = (product.short_description || '').toLowerCase().includes(query);
        if (!inName && !inBrand && !inDesc) return false;
      }

      // 1. Gender Check
      if (selectedFilters.Gender.length > 0) {
        if (!product.gender) return false;
        const prodGender = product.gender.toLowerCase();
        const match = selectedFilters.Gender.some(g => g.toLowerCase() === prodGender);
        if (!match) return false;
      }

      // 2. Category Check
      if (selectedFilters.Category.length > 0) {
        if (!product.category_name) return false;
        const matchCat = selectedFilters.Category.includes(product.category_name);
        if (!matchCat) return false;
      }

      // 3. Brand Check
      if (selectedFilters.Brand.length > 0) {
        if (!product.brand_name) return false;
        const matchBrand = selectedFilters.Brand.includes(product.brand_name);
        if (!matchBrand) return false;
      }

      // 4. Price Threshold Check
      if (selectedFilters['Price Range'].length > 0) {
        if (!product.variants || product.variants.length === 0) return false;
        const basePrice = Math.min(...product.variants.map((v: any) => v.selling_price));
        
        const matchPrice = selectedFilters['Price Range'].some(range => {
          if (range === "Under ₹1,000") return basePrice < 1000;
          if (range === "₹1,000 - ₹5,000") return basePrice >= 1000 && basePrice <= 5000;
          if (range === "₹5,000 - ₹10,000") return basePrice > 5000 && basePrice <= 10000;
          if (range === "Over ₹10,000") return basePrice > 10000;
          return false;
        });
        if (!matchPrice) return false;
      }

      // 5. Scent Palette Consistency
      if (selectedFilters['Scent Family'].length > 0) {
        const matchFamily = selectedFilters['Scent Family'].some(family => {
          const catName = (product.category_name || '').toLowerCase();
          const desc = (product.short_description || '').toLowerCase();
          return catName.includes(family.toLowerCase()) || desc.includes(family.toLowerCase());
        });
        if (!matchFamily) return false;
      }

      // 6. Material Concentration Mapping
      if (selectedFilters.Concentration.length > 0) {
        const itemConcs = (product.variants || []).map((v: any) => (v.concentration || '').toLowerCase());
        const matchConc = selectedFilters.Concentration.some(c => itemConcs.includes(c.toLowerCase()));
        if (!matchConc) return false;
      }

      return true;
    });
  }, [products, selectedFilters, searchVal]);

  const hasActiveFilters = selectedFilters.Gender.length > 0 || 
                           selectedFilters.Category.length > 0 ||
                           selectedFilters.Brand.length > 0 ||
                           selectedFilters['Price Range'].length > 0 || 
                           selectedFilters['Scent Family'].length > 0 || 
                           selectedFilters.Concentration.length > 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12 mt-20">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-8 overflow-hidden whitespace-nowrap">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
        
        {selectedFilters.Brand.length > 0 && (
          <>
            <ChevronRight size={12} />
            <span className="text-black">Brand: {selectedFilters.Brand[0]}</span>
          </>
        )}
        
        {selectedFilters.Category.length > 0 && (
          <>
            <ChevronRight size={12} />
            <span className="text-black">{selectedFilters.Category[0]}</span>
          </>
        )}

        {genderQuery && (
          <>
            <ChevronRight size={12} />
            <span className="text-black">{genderQuery}</span>
          </>
        )}

        {mounted ? (
          <span className="ml-auto text-[8px] font-black tracking-widest text-green-600 uppercase border border-green-200 px-2 py-0.5 bg-green-50 rounded hidden md:inline-block">React Hydrated</span>
        ) : (
          <span className="ml-auto text-[8px] font-black tracking-widest text-red-500 uppercase border border-red-200 px-2 py-0.5 bg-red-50 rounded hidden md:inline-block">SSR Locked</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Custom Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0 relative z-30">
          <div className="sticky top-40 pointer-events-auto">
            <div className="flex justify-between items-end mb-2 pb-4 border-b-2 border-black">
              <h2 className="text-sm font-nelphim font-black tracking-[0.2em] text-black uppercase">Filters</h2>
              {(hasActiveFilters) && (
                <button 
                  onClick={clearFilters} 
                  className="text-[9px] font-bold tracking-widest text-neutral-400 hover:text-accent transition-colors uppercase flex items-center font-sans"
                >
                  <X size={10} className="mr-1 text-accent" /> Clear
                </button>
              )}
            </div>
            
            {/* Clear Visual Sync Confirmation Badge */}
            <div className="flex items-center space-x-2 mb-8 font-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase">
                Engine v2.2 - Live Sync
              </span>
            </div>
            
            <div className="space-y-10">
              {/* Olfactory Search Input */}
              <div>
                <h3 className="text-[11px] font-serif font-black tracking-widest text-black uppercase mb-4">Discovery Search</h3>
                <div className="relative group">
                   <input 
                      type="text" 
                      placeholder="Search note or brand..."
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      className="w-full bg-neutral-50 border-b border-neutral-200 py-3 text-[10px] font-bold tracking-widest uppercase focus:border-accent transition-all outline-none font-sans"
                   />
                </div>
              </div>

              {filterSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[11px] font-serif font-black tracking-widest text-black uppercase mb-5 flex justify-between items-center">
                    {section.title}
                    <ChevronDown size={14} className="text-neutral-400" />
                  </h3>
                  <div className={`space-y-3 ${(section.title === 'Brand' || section.title === 'Category') ? 'max-h-48 overflow-y-auto pr-2 scrollbar-hide' : ''}`}>
                    {section.options.map((opt) => {
                      const isChecked = selectedFilters[section.title].includes(opt);
                      return (
                        <button 
                           type="button"
                           key={opt} 
                           onClick={() => toggleFilter(section.title, opt)}
                           className="flex items-center space-x-3 group cursor-pointer select-none w-full text-left focus:outline-none"
                        >
                           <div className={`w-4 h-4 border transition-colors flex items-center justify-center flex-shrink-0 ${
                             isChecked ? 'border-accent bg-accent' : 'border-neutral-200 group-hover:border-neutral-400'
                           }`}>
                             {isChecked && <div className="w-1.5 h-1.5 bg-white" />}
                           </div>
                           <span className={`text-[11px] font-bold transition-colors uppercase tracking-wider font-sans ${
                             isChecked ? 'text-accent font-bold' : 'text-neutral-500 group-hover:text-black'
                           }`}>
                             {opt}
                           </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Catalog Display Board */}
        <div className="flex-grow">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-100 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-nelphim text-black font-black uppercase tracking-widest">
                {selectedFilters.Brand.length > 0 
                  ? selectedFilters.Brand[0] 
                  : genderQuery 
                    ? `${genderQuery}'s Collection` 
                    : 'Explore Scent Vault'}
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mt-2 font-sans">
                {filteredProducts.length} Fragrances Match Filters
              </p>
            </div>
            
            <div className="flex items-center space-x-8 font-sans">
              <div className="flex items-center space-x-2 text-gray-400 border-r border-gray-100 pr-8">
                <button className="p-1 text-black"><LayoutGrid size={18} /></button>
                <button className="p-1 hover:text-black transition-colors"><List size={18} /></button>
              </div>
              <div className="relative group">
                <button className="flex items-center space-x-2.5 text-[10px] font-bold tracking-widest text-black uppercase hover:text-accent transition-colors">
                  <span>Sort: Global Ranked</span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Fast Categories Carousel */}
          {categoriesList.length > 0 && (
            <div className="lg:hidden w-full mb-6 overflow-x-auto scrollbar-hide py-1">
              <div className="flex gap-4 min-w-max px-1">
                {categoriesList.map((cat: any, idx: number) => {
                  const isSelected = selectedFilters.Category.includes(cat.name);
                  const image = getMediaUrl(cat.image_url || cat.images?.[0] || cat.banner_url);
                  return (
                    <button
                      key={cat.id || idx}
                      onClick={() => {
                        setSelectedFilters(prev => {
                          const isAlreadySelected = prev.Category.includes(cat.name);
                          return {
                            ...prev,
                            Category: isAlreadySelected ? [] : [cat.name]
                          };
                        });
                      }}
                      className="flex flex-col items-center space-y-2 focus:outline-none cursor-pointer"
                    >
                      {/* Outer Ring: elegant gradient border if selected, else light gray */}
                      <div className={`relative p-[2px] rounded-full transition-all duration-300 transform active:scale-95 ${
                        isSelected 
                          ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-accent scale-105 shadow-sm' 
                          : 'bg-neutral-200'
                      }`}>
                        {/* White Spacer Gap */}
                        <div className="p-[2.5px] bg-white rounded-full">
                          {/* Circular Image wrapper */}
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-50 flex items-center justify-center border border-neutral-100/80">
                            <img 
                              src={image} 
                              alt={cat.name} 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover" 
                              onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png' }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Text label */}
                      <span className={`text-[9px] font-black tracking-wider uppercase transition-colors ${
                        isSelected ? 'text-accent font-black' : 'text-neutral-500'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Fast Filters Panel */}
          <button 
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden w-full flex items-center justify-center space-x-2 border border-neutral-900 py-3.5 mb-8 text-[11px] font-bold tracking-widest uppercase hover:bg-neutral-950 hover:text-white transition-all font-sans rounded"
          >
            <SlidersHorizontal size={16} />
            <span>Interactive Filter Engine</span>
          </button>

          {/* Dynamic Loading & Presentation Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <p className="text-gray-500 italic font-medium text-sm mb-6 font-serif">We couldn't locate any curations matching those specific olfactory layers.</p>
              <button 
                onClick={clearFilters}
                className="text-[10px] font-black tracking-[0.3em] text-black border border-black px-8 py-4 hover:bg-black hover:text-white transition-all uppercase"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="mt-20 flex justify-center items-center space-x-4 border-t border-gray-50 pt-12">
              <button className="w-10 h-10 border border-black bg-black text-white text-xs font-black tracking-widest">1</button>
              <div className="text-[10px] font-black tracking-widest text-gray-300 uppercase px-4">End of Curation</div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      <div className={`fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 ${isMobileFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileFiltersOpen(false)}>
        <div 
          className={`fixed inset-y-0 right-0 w-[320px] max-w-full bg-white text-black shadow-2xl transition-transform duration-300 transform flex flex-col ${isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
             <h2 className="text-sm font-nelphim font-black tracking-[0.25em] uppercase text-black">Filters</h2>
             <button onClick={() => setIsMobileFiltersOpen(false)} className="p-1 text-black hover:text-accent"><X size={20} /></button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 space-y-10">
            {/* Olfactory Search Input */}
            <div>
              <h3 className="text-[11px] font-serif font-black tracking-widest text-black uppercase mb-4">Discovery Search</h3>
              <input 
                 type="text" 
                 placeholder="Search note or brand..."
                 value={searchVal}
                 onChange={(e) => setSearchVal(e.target.value)}
                 className="w-full bg-neutral-50 border-b border-neutral-200 py-3 text-[10px] font-bold tracking-widest uppercase focus:border-accent transition-all outline-none font-sans text-black"
              />
            </div>

            {filterSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-serif font-black tracking-widest text-black uppercase mb-5 flex justify-between items-center">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {section.options.map((opt) => {
                    const isChecked = selectedFilters[section.title].includes(opt);
                    return (
                      <button 
                         type="button"
                         key={opt} 
                         onClick={() => toggleFilter(section.title, opt)}
                         className="flex items-center space-x-3 group cursor-pointer select-none w-full text-left focus:outline-none"
                      >
                         <div className={`w-4 h-4 border transition-colors flex items-center justify-center flex-shrink-0 ${
                           isChecked ? 'border-accent bg-accent' : 'border-neutral-200'
                         }`}>
                           {isChecked && <div className="w-1.5 h-1.5 bg-white" />}
                         </div>
                         <span className={`text-[11px] font-bold transition-colors uppercase tracking-wider font-sans ${
                           isChecked ? 'text-accent font-bold' : 'text-neutral-500'
                         }`}>
                           {opt}
                         </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-100 bg-neutral-50 flex gap-4 flex-shrink-0">
             {hasActiveFilters && (
               <button 
                 onClick={() => {
                   clearFilters();
                   setIsMobileFiltersOpen(false);
                 }}
                 className="flex-1 border border-neutral-300 py-3.5 text-[10px] font-bold tracking-widest uppercase hover:bg-neutral-100 transition-colors font-sans rounded"
               >
                 Clear
               </button>
             )}
             <button 
               onClick={() => setIsMobileFiltersOpen(false)}
               className="flex-grow bg-black text-white py-3.5 text-[10px] font-black tracking-widest uppercase hover:bg-neutral-900 transition-colors font-sans rounded"
             >
               View Results ({filteredProducts.length})
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white font-black text-xs tracking-[0.3em] uppercase text-neutral-400 animate-pulse">Opening Fragrance Vault...</div>}>
      <ShopContent />
    </Suspense>
  );
}
