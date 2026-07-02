'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Star, RefreshCw, Flame, Heart, Sparkles, MoveUp, Play } from 'lucide-react';
import api from '@/services/api';
import { getMediaUrl } from '@/services/media';
import { useCartStore } from '@/store/cartStore';

interface StoryViewerProps {
  categories: any[];
  initialCategoryIndex: number;
  allProducts: any[];
  onClose: () => void;
  onMarkAsSeen?: (categoryId: string) => void;
}

const getNoteEmoji = (note: string) => {
  const n = note.toLowerCase();
  if (n.includes('bergamot')) return '🍊';
  if (n.includes('lemon')) return '🍋';
  if (n.includes('orange') || n.includes('mandarin') || n.includes('clementine') || n.includes('neroli')) return '🍊';
  if (n.includes('citrus') || n.includes('lime') || n.includes('grapefruit') || n.includes('yuzu')) return '🍋';
  if (n.includes('jasmine') || n.includes('nerium') || n.includes('oleander') || n.includes('gardenia') || n.includes('tuberose')) return '🌼';
  if (n.includes('rose') || n.includes('geranium') || n.includes('peony') || n.includes('floral')) return '🌹';
  if (n.includes('lavender') || n.includes('violet') || n.includes('iris') || n.includes('lilac')) return '🌸';
  if (n.includes('vanilla') || n.includes('tonka') || n.includes('cacao') || n.includes('chocolate') || n.includes('sweet')) return '🍦';
  if (n.includes('cedar') || n.includes('sandal') || n.includes('pine') || n.includes('cypress') || n.includes('juniper')) return '🪵';
  if (n.includes('wood') || n.includes('agarwood') || n.includes('oud')) return '🪵';
  if (n.includes('patchouli') || n.includes('vetiver') || n.includes('oakmoss') || n.includes('moss') || n.includes('mint') || n.includes('basil') || n.includes('sage')) return '🌿';
  if (n.includes('amber') || n.includes('resin') || n.includes('myrrh') || n.includes('incense') || n.includes('benzoin')) return '⚱️';
  if (n.includes('musk') || n.includes('civet') || n.includes('ambergris')) return '🪵';
  if (n.includes('cinnamon') || n.includes('clove') || n.includes('nutmeg') || n.includes('ginger') || n.includes('cardamom') || n.includes('pepper') || n.includes('spice') || n.includes('saffron')) return '🌶️';
  if (n.includes('leather') || n.includes('suede') || n.includes('tobacco') || n.includes('smoke')) return '💼';
  if (n.includes('plum') || n.includes('cherry') || n.includes('berry') || n.includes('cassis') || n.includes('blackcurrant') || n.includes('fruity')) return '🍇';
  if (n.includes('apple') || n.includes('pear') || n.includes('peach') || n.includes('apricot') || n.includes('fig') || n.includes('pineapple') || n.includes('coconut')) return '🍎';
  return '🍃';
};

export default function StoryViewer({
  categories,
  initialCategoryIndex,
  allProducts = [],
  onClose,
  onMarkAsSeen
}: StoryViewerProps) {
  const [currentCatIdx, setCurrentCatIdx] = useState(initialCategoryIndex);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Visual feedback overlay triggers
  const [showTapLeft, setShowTapLeft] = useState(false);
  const [showTapRight, setShowTapRight] = useState(false);

  // Products state for the active category
  const [catProducts, setCatProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const activeCategory = categories[currentCatIdx];
  const slideDuration = 5500; // 5.5 seconds per slide
  const timerInterval = 40; // 40ms ticks

  const allProductsRef = useRef(allProducts);
  useEffect(() => {
    allProductsRef.current = allProducts;
  }, [allProducts]);

  // Mark category as seen when it becomes active
  useEffect(() => {
    if (activeCategory && onMarkAsSeen) {
      onMarkAsSeen(activeCategory.id);
    }
  }, [currentCatIdx, activeCategory, onMarkAsSeen]);

  // Reset slide and progress on category change
  useEffect(() => {
    setCurrentSlideIdx(0);
    setProgress(0);
  }, [currentCatIdx]);

  // Fetch category products: checks local products array first, then requests API if needed.
  useEffect(() => {
    if (!activeCategory) return;

    // Filter from pre-fetched products if available
    const matched = allProductsRef.current.filter((p: any) => 
      p.category_name?.toLowerCase() === activeCategory.name?.toLowerCase() ||
      p.category_id === activeCategory.id
    );

    if (matched.length > 0) {
      // Shuffle the matched list to suggest a different product each time
      const shuffled = [...matched].sort(() => Math.random() - 0.5);
      setCatProducts(shuffled);
      setLoadingProducts(false);
    } else {
      // Fallback: fetch dynamically from API using category filter
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          // Fetch more products to have a good pool for randomization
          const res = await api.get(`/products?category_id=${activeCategory.id}&limit=40`);
          const shuffled = (res.data || []).sort(() => Math.random() - 0.5);
          setCatProducts(shuffled);
        } catch (err) {
          console.error('Failed to fetch story products', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [currentCatIdx, activeCategory]);

  // Main story progress timer hook
  useEffect(() => {
    if (isPaused || loadingProducts) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + (timerInterval / slideDuration) * 100;
      });
    }, timerInterval);

    return () => clearInterval(interval);
  }, [isPaused, loadingProducts, currentCatIdx, currentSlideIdx]);

  // Handle slide transition when progress reaches 100
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
    }
  }, [progress, currentSlideIdx, currentCatIdx]);

  // Keyboard navigation listener (Escape, Left Arrow, Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCatIdx, currentSlideIdx, categories]);

  const handleNext = () => {
    setProgress(0);
    if (currentSlideIdx < 1) {
      // Go to second slide of current category
      setCurrentSlideIdx(1);
    } else {
      // Go to first slide of next category
      if (currentCatIdx < categories.length - 1) {
        setCurrentCatIdx((prev) => prev + 1);
      } else {
        // Last slide of last category -> close stories
        onClose();
      }
    }
  };

  const handlePrev = () => {
    setProgress(0);
    if (currentSlideIdx > 0) {
      // Go back to first slide of current category
      setCurrentSlideIdx(0);
    } else {
      // Go to second slide of previous category
      if (currentCatIdx > 0) {
        setCurrentCatIdx((prev) => prev - 1);
        // We set slide idx to 1 inside the category reset or directly:
        // Wait, to set it to 1, we can do it after the cat index update
        setTimeout(() => setCurrentSlideIdx(1), 0);
      } else {
        // First slide of first category -> reset progress
        setProgress(0);
      }
    }
  };

  if (!activeCategory) return null;

  const categoryImageUrl = getMediaUrl(activeCategory.image_url || activeCategory.images?.[0] || activeCategory.banner_url);
  const featuredProduct = catProducts[0];
  const primaryVariant = featuredProduct?.variants?.[0];
  const cartItem = primaryVariant ? cartItems.find((i) => i.id === primaryVariant.id) : null;

  const cleanDescription = (desc: string) => {
    if (!desc) return '';
    let clean = desc.replace(/\t/g, '  |  ');
    const prefix = activeCategory.name + '.';
    if (clean.toUpperCase().startsWith(prefix.toUpperCase())) {
      clean = clean.substring(prefix.length).trim();
    }
    const prefix2 = activeCategory.name;
    if (clean.toUpperCase().startsWith(prefix2.toUpperCase())) {
      clean = clean.substring(prefix2.length).trim();
      if (clean.startsWith('.') || clean.startsWith('-') || clean.startsWith('–')) {
        clean = clean.substring(1).trim();
      }
    }
    return clean;
  };

  const triggerTapLeft = () => {
    setShowTapLeft(true);
    setTimeout(() => setShowTapLeft(false), 200);
    handlePrev();
  };

  const triggerTapRight = () => {
    setShowTapRight(true);
    setTimeout(() => setShowTapRight(false), 200);
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950/95 md:bg-neutral-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Absolute background close area */}
      <div className="absolute inset-0 cursor-pointer hidden md:block" onClick={onClose} />

      {/* Story Viewport (Phone border frame wrapper for true Instagram feel) */}
      <div 
        className="relative w-full h-full md:max-w-[412px] md:h-[84vh] md:max-h-[820px] md:rounded-[40px] md:border-[10px] md:border-neutral-900 overflow-hidden bg-[#070709] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col justify-between select-none md:ring-[5px] md:ring-neutral-800/30"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* Dynamic Island Notch - adds to phone aesthetic */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-40 hidden md:block" />

        {/* Top Story Header & Progress Indicators */}
        <div className="relative z-30 w-full pt-4 md:pt-6 px-4 flex flex-col gap-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent pb-14">
          
          {/* Progress Bars */}
          <div className="flex gap-1.2 w-full px-1">
            {[0, 1].map((idx) => {
              let barProgress = 0;
              if (idx < currentSlideIdx) barProgress = 100;
              else if (idx === currentSlideIdx) barProgress = progress;
              
              return (
                <div key={idx} className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-[40ms] ease-linear shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    style={{ width: `${barProgress}%` }}
                  />
                </div>
              );
            })}
          </div>
 
          {/* User Profile / Category Info */}
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden p-[1.5px] bg-gradient-to-tr from-amber-400 to-accent">
                <div className="w-full h-full rounded-full border border-black/20 overflow-hidden bg-neutral-800">
                  <img 
                    src={categoryImageUrl} 
                    alt={activeCategory.name} 
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-black text-white tracking-[0.1em] uppercase font-sans">
                  {activeCategory.name}
                </h3>
                <span className="text-[8px] font-bold text-accent tracking-[0.15em] uppercase font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Featured Curation
                </span>
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 rounded-full text-white/80 hover:text-white bg-black/30 hover:bg-black/50 border border-white/5 transition-all duration-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tap targets for navigation (left 30% / right 70%) */}
        <div className="absolute inset-x-0 top-24 bottom-28 z-20 flex pointer-events-auto">
          <div className="w-[30%] h-full cursor-pointer relative" onClick={(e) => { e.stopPropagation(); triggerTapLeft(); }}>
            {/* Tap indicator flash */}
            <div className={`absolute inset-0 bg-white/5 transition-opacity duration-200 pointer-events-none ${showTapLeft ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="w-[70%] h-full cursor-pointer relative" onClick={(e) => { e.stopPropagation(); triggerTapRight(); }}>
            {/* Tap indicator flash */}
            <div className={`absolute inset-0 bg-white/5 transition-opacity duration-200 pointer-events-none ${showTapRight ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>

        {/* Hold/Pause visual indicator */}
        {isPaused && (
          <div className="absolute top-20 right-6 z-40 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 animate-pulse">
            <Play size={10} className="text-white fill-white" />
            <span className="text-[8px] font-bold tracking-widest text-white uppercase">PAUSED</span>
          </div>
        )}

        {/* Story Body Panel */}
        <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
          
          {/* SLIDE 0: Category Welcome / Intro Banner */}
          {currentSlideIdx === 0 && (
            <div className="w-full h-full relative flex items-center justify-center bg-[#070709] animate-in fade-in zoom-in-95 duration-500">
              {/* Blurred background image for luxury depth */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <img 
                  src={categoryImageUrl} 
                  alt="" 
                  className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
                  onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Foreground main image - responsive and fully visible */}
              <img 
                src={categoryImageUrl} 
                alt={activeCategory.name} 
                className="w-full h-full object-contain opacity-95 z-10 relative"
                onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
              />
              {/* Vignette overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 z-20 pointer-events-none" />
              
              {/* Instagram style overlay banner */}
              <div className="absolute inset-x-4 bottom-28 z-20 bg-black/30 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-left shadow-xl">
                <span className="text-[9px] font-black tracking-[0.25em] text-accent uppercase mb-1.5 block font-sans">
                  Discover Signature
                </span>
                <h1 className="text-xl font-bold tracking-[0.1em] text-white uppercase mb-3 font-sans leading-tight">
                  {activeCategory.name}
                </h1>
                <p className="text-[11px] text-neutral-300 leading-relaxed tracking-wide font-medium max-w-sm mb-5 italic">
                  {cleanDescription(activeCategory.description) || 'Explore a masterfully curated selection of premium fragrances, hand-selected to elevate your signature scent profile.'}
                </p>
                <div className="flex items-center gap-2 text-white/60 text-[8px] tracking-widest font-black uppercase font-sans animate-pulse">
                  <span>Tap on the right to discover</span>
                  <ChevronRight size={10} className="text-accent" />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Featured Category Product (Interactive Product Sticker) */}
          {currentSlideIdx === 1 && (
            <div className="w-full h-full flex flex-col justify-center px-4 pt-24 pb-28 relative bg-[#070709] animate-in fade-in zoom-in-95 duration-500">
              
              {/* Blurred background image for luxury depth */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img 
                  src={categoryImageUrl} 
                  alt="" 
                  className="w-full h-full object-cover opacity-[0.12] blur-xl scale-110"
                />
                <div className="absolute inset-0 bg-neutral-950/70" />
              </div>

              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center gap-4 text-white z-30">
                  <RefreshCw size={24} className="animate-spin text-accent" />
                  <span className="text-[9px] font-black tracking-widest uppercase text-neutral-400">Loading Curation...</span>
                </div>
              ) : featuredProduct ? (
                <div className="z-30 w-full flex flex-col items-center text-center px-2">
                  <span className="text-[9px] font-black tracking-[0.2em] text-accent uppercase mb-4 font-sans animate-pulse">
                    ★ Bestseller Curation ★
                  </span>
                  
                  {/* Glassmorphic Product Sticker Card */}
                  <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 mb-3 flex flex-col items-center shadow-2xl hover:border-white/20 transition-all duration-300">
                    
                    {/* Interactive Product Image Container */}
                    <div className="relative w-40 h-40 bg-white/95 rounded-2xl overflow-hidden flex items-center justify-center shadow-md p-4 mb-4 select-none pointer-events-none">
                      <img 
                        src={getMediaUrl(featuredProduct.images?.[0])} 
                        alt={featuredProduct.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e: any) => { e.target.src = '/placeholder-perfume.png'; }}
                      />
                    </div>

                    {/* Brand */}
                    <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1 font-sans">
                      {featuredProduct.brand_name}
                    </span>
                    
                    {/* Product Name */}
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-2.5 font-nelphim line-clamp-1 max-w-[280px]">
                      {featuredProduct.name}
                    </h2>

                    {/* Scent note badges */}
                    {featuredProduct.scent_notes?.top && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                        {featuredProduct.scent_notes.top.slice(0, 2).map((note: string, nidx: number) => (
                          <span key={nidx} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[8px] font-bold text-neutral-300 uppercase tracking-widest font-sans">
                            <span>{getNoteEmoji(note)}</span>
                            <span>{note}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mb-5">
                      <span className="text-lg font-bold text-white font-sans">
                        ₹{primaryVariant?.selling_price?.toLocaleString('en-IN')}
                      </span>
                      {primaryVariant?.compare_at_price > primaryVariant?.selling_price && (
                        <span className="text-[10px] text-neutral-500 line-through font-sans">
                          ₹{primaryVariant.compare_at_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Sticker Action buttons inside the story */}
                    <div className="w-full flex gap-3 pointer-events-auto">
                      <Link 
                        href={`/product/${featuredProduct.slug}`}
                        onClick={onClose}
                        className="flex-1 border border-white/10 bg-white/5 hover:bg-white/10 text-white py-3 text-[8.5px] font-bold tracking-widest transition-all duration-300 uppercase text-center rounded-xl font-sans"
                      >
                        View Details
                      </Link>
                      
                      {primaryVariant && (
                        cartItem ? (
                          <div className="flex-1 flex items-center justify-between border border-white/10 bg-white/5 h-[38px] rounded-xl overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateQuantity(cartItem.id, cartItem.quantity - 1);
                              }}
                              className="w-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors font-bold text-xs h-full"
                            >
                              -
                            </button>
                            <span className="text-[7.5px] font-black tracking-widest uppercase text-accent font-sans">
                              {cartItem.quantity} In Bag
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateQuantity(cartItem.id, cartItem.quantity + 1);
                              }}
                              className="w-8 flex items-center justify-center text-white hover:bg-white/10 transition-colors font-bold text-xs h-full"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem({
                                id: primaryVariant.id,
                                productId: featuredProduct.id,
                                name: featuredProduct.name,
                                variantName: primaryVariant.sku,
                                price: primaryVariant.selling_price,
                                image: getMediaUrl(featuredProduct.images?.[0]),
                                quantity: 1,
                                sizeMl: primaryVariant.size_ml,
                                loyaltyPoints: primaryVariant.loyalty_points,
                              });
                            }}
                            className="flex-1 bg-accent hover:bg-accent/90 text-white py-3 text-[8.5px] font-bold tracking-widest transition-all duration-300 uppercase rounded-xl font-sans shadow-[0_2px_12px_rgba(210,22,141,0.3)]"
                          >
                            Add to Bag
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-white z-30 pointer-events-auto px-4">
                  <p className="text-neutral-400 text-xs italic font-serif mb-4">No featured products available.</p>
                  <Link 
                    href={`/shop?category=${activeCategory.slug || activeCategory.id}`}
                    onClick={onClose}
                    className="border border-white/20 px-6 py-2.5 rounded-full text-[9px] font-black tracking-widest uppercase text-white"
                  >
                    View Collection
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swipe Up/Tap to Shop Footer (Static link at bottom) */}
        <div className="relative z-30 w-full px-4 pb-6 bg-gradient-to-t from-black via-black/20 to-transparent pt-12 flex flex-col items-center pointer-events-auto">
          <Link 
            href={`/shop?category=${activeCategory.slug || activeCategory.id}`}
            onClick={onClose}
            className="w-full py-3.5 bg-white/10 hover:bg-white text-white hover:text-black text-[9px] font-black tracking-[0.15em] uppercase rounded-full text-center flex items-center justify-center gap-2 transition-all duration-500 shadow-2xl border border-white/20 font-sans"
          >
            <MoveUp size={10} className="animate-bounce" />
            <span>Swipe Up to shop full collection</span>
          </Link>
        </div>

      </div>

      {/* Desktop Prev/Next absolute arrows outside phone layout */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-8 lg:left-24 z-40">
        <button 
          onClick={handlePrev}
          disabled={currentCatIdx === 0 && currentSlideIdx === 0}
          className="w-12 h-12 rounded-full border border-white/10 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-8 lg:right-24 z-40">
        <button 
          onClick={handleNext}
          disabled={currentCatIdx === categories.length - 1 && currentSlideIdx === 1}
          className="w-12 h-12 rounded-full border border-white/10 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronRight size={20} />
        </button>
      </div>

    </div>
  );
}
