'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Star, RefreshCw } from 'lucide-react';
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

  // Products state for the active category
  const [catProducts, setCatProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const activeCategory = categories[currentCatIdx];
  const slideDuration = 5000; // 5 seconds per slide
  const timerInterval = 50; // 50ms ticks for smooth animation

  // Mark category as seen when it becomes active
  useEffect(() => {
    if (activeCategory && onMarkAsSeen) {
      onMarkAsSeen(activeCategory.id);
    }
  }, [currentCatIdx, activeCategory, onMarkAsSeen]);

  // Fetch category products: checks local products array first, then requests API if needed.
  useEffect(() => {
    if (!activeCategory) return;

    // Filter from pre-fetched products if available
    const matched = allProducts.filter((p: any) => 
      p.category_name?.toLowerCase() === activeCategory.name?.toLowerCase() ||
      p.category_id === activeCategory.id
    );

    if (matched.length > 0) {
      setCatProducts(matched.slice(0, 2));
      setLoadingProducts(false);
    } else {
      // Fallback: fetch dynamically from API using category filter
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          const res = await api.get(`/products?category_id=${activeCategory.id}&limit=10`);
          setCatProducts(res.data.slice(0, 2));
        } catch (err) {
          console.error('Failed to fetch story products', err);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }
    
    // Reset slide and progress on category change
    setCurrentSlideIdx(0);
    setProgress(0);
  }, [currentCatIdx, activeCategory, allProducts]);

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
        setCurrentSlideIdx(0);
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
        setCurrentSlideIdx(1);
      } else {
        // First slide of first category -> reset progress
        setProgress(0);
      }
    }
  };

  if (!activeCategory) return null;

  const categoryImageUrl = getMediaUrl(activeCategory.image_url || activeCategory.banner_url);
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Absolute background close area */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Story Viewport (Sized like a premium phone screen) */}
      <div 
        className="relative w-full h-full md:max-w-[430px] md:h-[80vh] md:max-h-[850px] md:rounded-2xl overflow-hidden bg-neutral-950 shadow-2xl flex flex-col justify-between select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* Top Story Header & Progress Indicators */}
        <div className="relative z-30 w-full pt-4 px-4 flex flex-col gap-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-10">
          
          {/* Progress Bars */}
          <div className="flex gap-1.5 w-full">
            {[0, 1].map((idx) => {
              let barProgress = 0;
              if (idx < currentSlideIdx) barProgress = 100;
              else if (idx === currentSlideIdx) barProgress = progress;
              
              return (
                <div key={idx} className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-[50ms] ease-linear"
                    style={{ width: `${barProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Profile / Category Info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 p-[1px] bg-white/10">
                <img 
                  src={categoryImageUrl} 
                  alt={activeCategory.name} 
                  className="w-full h-full object-cover rounded-full"
                  onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-white tracking-wider uppercase font-sans">
                  {activeCategory.name}
                </h3>
                <span className="text-[8px] md:text-[9px] text-white/50 tracking-wider uppercase font-sans">
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
              className="p-1.5 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tap targets for navigation (left 30% / right 70%) */}
        <div className="absolute inset-x-0 top-24 bottom-24 z-20 flex pointer-events-auto">
          <div className="w-[30%] h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="w-[70%] h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
        </div>

        {/* Story Body Panel */}
        <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
          
          {/* SLIDE 0: Category Welcome / Intro Banner */}
          {currentSlideIdx === 0 && (
            <div className="w-full h-full relative">
              <img 
                src={categoryImageUrl} 
                alt={activeCategory.name} 
                className="w-full h-full object-cover opacity-90 animate-out scale-105"
                onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
              
              <div className="absolute inset-x-0 bottom-28 px-8 text-left z-20">
                <span className="text-[9px] font-medium tracking-[0.25em] text-accent uppercase mb-1.5 block font-sans">
                  Discover Signature
                </span>
                <h1 className="text-xs font-semibold tracking-[0.2em] text-white/95 uppercase mb-3 font-sans">
                  {activeCategory.name}
                </h1>
                <p className="text-xs text-neutral-300 leading-relaxed tracking-wide font-light max-w-sm mb-5">
                  {cleanDescription(activeCategory.description) || 'Explore a masterfully curated selection of premium fragrances, hand-selected to elevate your signature scent profile.'}
                </p>
                <div className="flex items-center gap-2 text-white/50 text-[9px] tracking-wider font-bold uppercase font-sans animate-pulse">
                  <span>Swipe or tap to explore</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Featured Category Product */}
          {currentSlideIdx === 1 && (
            <div className="w-full h-full flex flex-col justify-center px-6 pt-24 pb-28 relative bg-[#0a0a0f]">
              
              {/* Blurred background thumbnail for depth */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img 
                  src={categoryImageUrl} 
                  alt="" 
                  className="w-full h-full object-cover opacity-10 blur-2xl scale-125"
                />
                <div className="absolute inset-0 bg-black/60" />
              </div>

              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center gap-4 text-white z-30">
                  <RefreshCw size={24} className="animate-spin text-accent" />
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400">Loading Featured scent...</span>
                </div>
              ) : featuredProduct ? (
                <div className="z-30 w-full flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <span className="text-[8px] md:text-[9px] font-medium tracking-wider text-accent uppercase mb-2 font-sans">
                    Bestseller In {activeCategory.name}
                  </span>
                  
                  {/* Glassmorphic Product Card */}
                  <div className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-5 mb-6 flex flex-col items-center">
                    
                    {/* Image */}
                    <div className="relative w-44 h-44 bg-white/95 rounded-lg overflow-hidden flex items-center justify-center shadow-lg p-4 mb-4 select-none pointer-events-none">
                      <img 
                        src={getMediaUrl(featuredProduct.images?.[0])} 
                        alt={featuredProduct.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                      />
                    </div>

                    {/* Brand & Name */}
                    <span className="text-[9px] font-medium tracking-wider text-neutral-400 uppercase mb-1 font-sans">
                      {featuredProduct.brand_name}
                    </span>
                    <h2 className="text-base font-semibold text-white uppercase tracking-wide mb-2 font-nelphim line-clamp-1 max-w-[280px]">
                      {featuredProduct.name}
                    </h2>

                    {/* Scent notes */}
                    {featuredProduct.scent_notes?.top && (
                      <div className="flex items-center justify-center gap-2 mb-3">
                        {featuredProduct.scent_notes.top.slice(0, 3).map((note: string, nidx: number) => (
                          <span key={nidx} className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[7.5px] font-medium text-neutral-300 uppercase tracking-wider font-sans">
                            <span>{getNoteEmoji(note)}</span>
                            <span>{note}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4 text-xs">
                      <Star size={12} className="fill-rating text-rating" />
                      <span className="text-white font-semibold text-[10px] font-sans">4.8</span>
                      <span className="text-neutral-500 font-sans">|</span>
                      <span className="text-[10px] text-neutral-400 font-sans">Featured</span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-xl font-semibold text-white font-sans">
                        ₹{primaryVariant?.selling_price?.toLocaleString('en-IN')}
                      </span>
                      {primaryVariant?.compare_at_price > primaryVariant?.selling_price && (
                        <span className="text-xs text-neutral-500 line-through font-sans">
                          ₹{primaryVariant.compare_at_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Action buttons inside the story */}
                    <div className="w-full flex gap-3 pointer-events-auto">
                      <Link 
                        href={`/product/${featuredProduct.slug}`}
                        onClick={onClose}
                        className="flex-1 border border-white/20 bg-transparent hover:bg-white/10 text-white py-3 text-[9px] font-semibold tracking-wider transition-all duration-300 uppercase text-center rounded font-sans"
                      >
                        View Details
                      </Link>
                      
                      {primaryVariant && (
                        cartItem ? (
                          <div className="flex-1 flex items-center justify-between border border-white/10 bg-white/5 h-[40px] rounded overflow-hidden">
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
                            <span className="text-[8px] font-semibold tracking-wider uppercase text-white font-sans">
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
                            className="flex-1 bg-accent hover:bg-accent/90 text-white py-3 text-[9px] font-semibold tracking-wider transition-all duration-300 uppercase rounded font-sans shadow-[0_2px_8px_rgba(210,22,141,0.2)]"
                          >
                            Add to Bag
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-white z-30 pointer-events-auto">
                  <p className="text-neutral-400 text-xs italic font-serif mb-4">No featured products available.</p>
                  <Link 
                    href={`/shop?category=${activeCategory.slug || activeCategory.id}`}
                    onClick={onClose}
                    className="border border-white/20 px-6 py-2.5 rounded text-[10px] font-black tracking-widest uppercase text-white"
                  >
                    View Collection
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Swipe Up/Tap to Shop Footer (Static link at bottom) */}
        <div className="relative z-30 w-full px-6 pb-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-12 flex flex-col items-center pointer-events-auto">
          <Link 
            href={`/shop?category=${activeCategory.slug || activeCategory.id}`}
            onClick={onClose}
            className="w-full py-4 bg-white hover:bg-accent text-black hover:text-white text-[9px] font-bold tracking-[0.15em] uppercase rounded-sm text-center flex items-center justify-center gap-2 transition-all duration-500 shadow-2xl font-sans"
          >
            <span>Shop Full {activeCategory.name} Collection</span>
            <ChevronRight size={14} />
          </Link>
        </div>

      </div>

      {/* Desktop Prev/Next absolute arrows outside phone layout */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-8 lg:left-24 z-40">
        <button 
          onClick={handlePrev}
          disabled={currentCatIdx === 0 && currentSlideIdx === 0}
          className="w-14 h-14 rounded-full border border-white/20 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-8 lg:right-24 z-40">
        <button 
          onClick={handleNext}
          disabled={currentCatIdx === categories.length - 1 && currentSlideIdx === 1}
          className="w-14 h-14 rounded-full border border-white/20 bg-black/40 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
}
