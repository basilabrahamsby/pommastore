'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getMediaUrl } from '@/services/media';

const SocialFB = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>);
const SocialIG = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>);
const SocialX  = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const SocialIN = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>);

const Navbar = () => {
  const totalItems = useCartStore((state) => state.totalItems());
  const customer = useAuthStore((state) => state.customer);
  const wishlistItems = useWishlistStore((state) => state.items);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cmsLayout, setCmsLayout] = useState<any>(null);
  
  // Suggestion states
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  
  const isHome = pathname === '/';
  const isSolid = true;

  useEffect(() => {
    setIsHydrated(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Fetch layout for global settings (like free shipping limit)
    import('@/services/api').then(m => m.default.get('/settings/storefront_layout'))
      .then(res => setCmsLayout(res.data))
      .catch(err => console.warn('Navbar failed to fetch global layout', err));

    // Fetch products and brands for live suggestions
    import('@/services/api').then(m => {
      m.default.get('/products?limit=80').then(res => setProducts(res.data)).catch(() => {});
      m.default.get('/brands').then(res => setBrands(res.data)).catch(() => {});
    });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const freeShippingLimit = cmsLayout?.free_shipping_limit || 999;

  // Filter live suggestions based on searchQuery
  const filteredBrands = searchQuery.trim().length > 0
    ? brands.filter(b => b.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3)
    : [];

  const filteredProducts = searchQuery.trim().length > 0
    ? products.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.brand_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];
    
  const hasSuggestions = filteredBrands.length > 0 || filteredProducts.length > 0;

  return (
    <header className="w-full relative z-50">
      {/* Sticky Navbar Container (Main Header Area Only) */}
      <div 
        className={`
          ${(isHome && scrolled) ? 'fixed top-0 left-0 right-0 bg-white text-black shadow-sm animate-in slide-in-from-top duration-300' : 'relative bg-white text-black border-b border-gray-100'} 
          transition-all z-40 w-full
        `}
      >
        {/* Main Header Area: Left-aligned Logo, Nav Links, Central-Right Search Bar, Right Icons */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Desktop Nav Links Group */}
          <div className="flex items-center gap-8">
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
               <button onClick={() => setIsMobileMenuOpen(true)} className="p-2"><Menu size={24} /></button>
            </div>

            {/* Left Logo Area */}
            <div className="flex-shrink-0 flex items-center">
               <Link href="/" className="flex items-center">
                 <img src="/kozmocart/logo.png" alt="Kozmocart Logo" className="h-8 md:h-9 object-contain" />
               </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-[10px] font-bold tracking-[0.2em] uppercase font-serif">
               <Link href="/" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300">Home</Link>
               <Link href="/shop?gender=Men" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300">Men</Link>
               <Link href="/shop?gender=Women" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300">Women</Link>
               <Link href="/brands" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300">Brands</Link>
               <Link href="/offers" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300 text-accent">Sale</Link>
               <Link href="/shop?new=true" className="hover:text-accent border-b-2 border-transparent hover:border-accent py-1.5 transition-all duration-300">New</Link>
            </nav>
          </div>

          {/* Persistent Search Bar (Myntra/Amazon style) with Autocomplete Suggestions */}
          <form 
            ref={searchRef}
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                setShowSuggestions(false);
              }
            }} 
            className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-6 relative items-center"
          >
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search for luxury perfumes, brands..." 
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className={`w-full ${isSolid ? 'bg-neutral-100 text-black placeholder-neutral-400' : 'bg-white/10 text-white placeholder-white/50 border-white/15 focus:bg-white focus:text-black focus:placeholder-neutral-400'} border border-neutral-200 focus:border-accent/40 py-2.5 pl-4 pr-10 rounded text-[11px] font-medium tracking-wide outline-none transition-all duration-300 font-sans`}
              />
              <button type="submit" className={`absolute right-3 top-1/2 -translate-y-1/2 ${isSolid ? 'text-neutral-400 hover:text-accent' : 'text-white/60 hover:text-white'} transition-colors`}>
                <Search size={15} strokeWidth={2} />
              </button>

              {/* Suggestions Dropdown panel */}
              {showSuggestions && hasSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-100 shadow-2xl rounded-md z-50 overflow-hidden text-neutral-800 text-left font-sans animate-in fade-in slide-in-from-top-1 duration-200">
                  
                  {/* Brands List */}
                  {filteredBrands.length > 0 && (
                    <div className="p-3 border-b border-neutral-100">
                      <div className="text-[9px] font-bold text-neutral-400 tracking-wider uppercase mb-2">Suggested Brands</div>
                      <div className="flex flex-wrap gap-2">
                        {filteredBrands.map((b: any) => (
                          <Link
                            key={b.id}
                            href={`/shop?brand=${b.id}`}
                            onClick={() => {
                              setSearchQuery('');
                              setShowSuggestions(false);
                            }}
                            className="bg-neutral-50 hover:bg-accent/10 hover:text-accent border border-neutral-200/50 rounded px-2.5 py-1 text-[10px] font-bold uppercase transition-colors"
                          >
                            {b.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products List */}
                  {filteredProducts.length > 0 && (
                    <div className="py-2">
                      <div className="px-3 py-1 text-[9px] font-bold text-neutral-400 tracking-wider uppercase mb-1">Suggested Products</div>
                      {filteredProducts.map((p: any) => {
                        const price = p.variants?.[0]?.selling_price;
                        const img = p.images?.[0] ? getMediaUrl(p.images[0]) : '/kozmocart/placeholder-perfume.png';
                        return (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            onClick={() => {
                              setSearchQuery('');
                              setShowSuggestions(false);
                            }}
                            className="flex items-center px-3 py-2.5 hover:bg-neutral-50 transition-colors gap-3 border-b border-neutral-50/50 last:border-b-0"
                          >
                            <img 
                              src={img} 
                              alt={p.name} 
                              className="w-8 h-8 object-contain rounded bg-neutral-50 border border-neutral-100 p-0.5"
                              onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-bold uppercase text-neutral-400 leading-none mb-0.5">{p.brand_name}</div>
                              <div className="text-xs font-semibold text-neutral-800 truncate leading-none uppercase">{p.name}</div>
                            </div>
                            {price && (
                              <div className="text-xs font-bold text-black font-mono">
                                ₹{price.toLocaleString('en-IN')}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Right Desktop Utilities */}
          <div className="flex items-center space-x-5 md:space-x-6">
            <button onClick={() => setIsSearchOpen(true)} className="md:hidden hover:text-accent transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" className="relative hover:text-accent transition-colors flex items-center justify-center">
               <Heart size={20} strokeWidth={1.5} />
               {isHydrated && wishlistItems.length > 0 && (
                 <span className="absolute -top-1.5 -right-1.5 text-[8px] w-3.5 h-3.5 bg-accent text-white rounded-full flex items-center justify-center font-bold">
                   {wishlistItems.length}
                 </span>
               )}
            </Link>
            <Link href={isHydrated && customer ? "/account" : "/login"} className="hover:text-accent transition-colors">
               <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/cart" className="relative hover:text-accent transition-colors flex items-center justify-center">
               <ShoppingBag size={20} strokeWidth={1.5} />
               {isHydrated && totalItems > 0 && (
                 <span className={`absolute -top-1.5 -right-1.5 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-black ${isSolid ? 'bg-accent text-white' : 'bg-white text-black'}`}>
                   {totalItems}
                 </span>
               )}
            </Link>
          </div>
        </div>
      </div>

      {/* Announcement Bar & Utilities Bar Overlay */}
      {!(isHome && scrolled) && (
        <div 
          className={`
            ${isHome ? 'absolute left-0 right-0 bg-transparent text-white' : 'relative bg-white text-black border-b border-gray-100'} 
            z-30 w-full flex flex-col
          `}
        >
          {/* Announcement Bar */}
          <div className={`text-[9px] h-8 flex items-center justify-center font-black tracking-[0.25em] uppercase gap-3 ${isHome ? 'bg-black/20 backdrop-blur-sm text-white' : 'bg-neutral-950 text-white'}`}>
            <span className="w-8 h-[1px] bg-current opacity-40 hidden sm:block" />
            🚚 FREE SHIPPING ON ORDERS OVER ₹{freeShippingLimit.toLocaleString()}/- &nbsp;|&nbsp; USE CODE: <span className="text-accent font-mono ml-1">KOZMO999</span>
            <span className="w-8 h-[1px] bg-current opacity-40 hidden sm:block" />
          </div>

          {/* Top Utilities Bar */}
          <div className={`max-w-[1400px] mx-auto px-6 lg:px-12 flex justify-between items-center h-10 w-full text-[9px] font-black tracking-widest uppercase ${isHome ? 'border-t border-white/10' : 'border-t border-neutral-100'}`}>
            <div className="flex space-x-6">
               <Link href="/track-order" className="hover:opacity-70 transition-opacity">Track Your Order</Link>
               <Link href="/rewards" className="hover:opacity-70 transition-opacity">Rewards Program</Link>
            </div>
            <div className={`flex items-center gap-2.5 ${isHome ? 'text-white/70' : 'text-neutral-400'}`}>
               <a href="#" aria-label="Facebook" className="hover:opacity-100 transition-opacity"><SocialFB /></a>
               <a href="#" aria-label="Instagram" className="hover:opacity-100 transition-opacity"><SocialIG /></a>
               <a href="#" aria-label="X (Twitter)" className="hover:opacity-100 transition-opacity"><SocialX /></a>
               <a href="#" aria-label="LinkedIn" className="hover:opacity-100 transition-opacity"><SocialIN /></a>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Full Screen Search Bar */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-white/98 backdrop-blur-md flex flex-col animate-in fade-in duration-200 text-black">
          <div className="p-6 flex justify-end">
            <button onClick={() => setIsSearchOpen(false)} className="text-black p-2 hover:bg-gray-100 rounded-full">
              <X size={30} />
            </button>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 pb-32">
            <h2 className="text-[10px] font-black tracking-[0.4em] uppercase mb-8 text-neutral-400">Find your next signature scent</h2>
            <form className="w-full flex border-b-2 border-black">
              <input 
                type="text" 
                autoFocus
                placeholder="Search fragrance or brand..."
                className="flex-grow py-6 text-3xl md:text-5xl font-serif bg-transparent outline-none tracking-wide placeholder:text-neutral-200"
              />
              <button type="submit" className="p-4 hover:scale-105 transition-transform"><Search size={36} /></button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Side Drawer */}
      <div className={`fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div 
          className={`fixed inset-y-0 left-0 w-[300px] bg-white text-black shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
             <img src="/kozmocart/logo.png" alt="Kozmocart Logo" className="h-6 object-contain" />
             <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
          </div>
          <nav className="flex flex-col p-6 font-black tracking-[0.2em] uppercase text-xs space-y-6">
             <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
             <Link href="/shop?gender=Men" onClick={() => setIsMobileMenuOpen(false)}>Men</Link>
             <Link href="/shop?gender=Women" onClick={() => setIsMobileMenuOpen(false)}>Women</Link>
             <Link href="/brands" onClick={() => setIsMobileMenuOpen(false)}>Brands</Link>
             <Link href="/offers" className="text-red-600" onClick={() => setIsMobileMenuOpen(false)}>Sale</Link>
             <Link href="/shop?new=true" onClick={() => setIsMobileMenuOpen(false)}>New Arrivals</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


