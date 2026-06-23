'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { getMediaUrl } from '@/services/media';
import { Sparkles, Percent, ShoppingBag, ArrowRight, Tag, Gift, Zap, Copy, Check, ShoppingCart, Star, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

/* ── Helpers ── */
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

const getRating = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return { rating: (4.0 + (Math.abs(hash) % 10) / 10).toFixed(1), reviews: 5 + (Math.abs(hash) % 95) };
};

/* ── Enhanced Offer Product Card ── */
const OfferProductCard = ({ item, isBuyItem, isGetItem, promoCode }: {
  item: any; isBuyItem: boolean; isGetItem: boolean; promoCode?: string;
}) => {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  const variant = item.variants?.[0];
  const hasDiscount = variant?.compare_at_price > variant?.selling_price;
  const discountPct = hasDiscount
    ? Math.round(((variant.compare_at_price - variant.selling_price) / variant.compare_at_price) * 100)
    : 0;
  const cartItem = hydrated && variant ? cartItems.find(c => c.id === variant.id) : null;
  const { rating, reviews } = getRating(item.id);

  const getNotes = () => {
    if (item.scent_notes) {
      const top = item.scent_notes.top || [];
      const heart = item.scent_notes.heart || [];
      const base = item.scent_notes.base || [];
      const all = [...top, ...heart, ...base];
      if (all.length > 0) {
        return Array.from(new Set(all)).slice(0, 4);
      }
    }
    
    // Stable hash fallback notes based on product name
    let hash = 0;
    for (let i = 0; i < item.name.length; i++) {
      hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash);
    
    const presets = [
      ['Bergamot', 'Jasmine', 'Vanilla', 'Cedarwood'],
      ['Lemon', 'Rose', 'Patchouli', 'Amber'],
      ['Orange', 'Lavender', 'Musk', 'Leather'],
      ['Citrus', 'Jasmine', 'Oudh', 'Sandalwood'],
      ['Plum', 'Cinnamon', 'Vanilla', 'Amber'],
      ['Grapefruit', 'Neroli', 'Vetiver', 'Musk'],
    ];
    
    return presets[index % presets.length];
  };

  const notes = getNotes();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant) return;
    addItem({
      id: variant.id, productId: item.id, name: item.name, variantName: variant.sku,
      price: variant.selling_price, image: getMediaUrl(item.images?.[0]),
      quantity: 1, sizeMl: variant.size_ml, loyaltyPoints: variant.loyalty_points,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant) return;

    if (!cartItem) {
      addItem({
        id: variant.id, productId: item.id, name: item.name, variantName: variant.sku,
        price: variant.selling_price, image: getMediaUrl(item.images?.[0]),
        quantity: 1, sizeMl: variant.size_ml, loyaltyPoints: variant.loyalty_points,
      });
    }
    
    router.push('/checkout');
  };

  return (
    <div className="snap-start min-w-[175px] max-w-[175px] bg-white border border-neutral-100 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-500 group/item flex flex-col overflow-hidden rounded-sm h-full">
      {/* Image Area */}
      <Link href={`/product/${item.slug}`} className="block relative aspect-square bg-neutral-50 overflow-hidden">
        <img
          src={getMediaUrl(item.images?.[0]) || '/kozmocart/placeholder-perfume.png'}
          alt={item.name}
          className="w-full h-full object-contain p-3.5 mix-blend-multiply group-hover/item:scale-105 transition-transform duration-500 ease-out"
          onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/5 transition-colors duration-500" />

        {/* Scent Profile Hover Panel */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-3 opacity-0 group-hover/item:opacity-100 scale-95 group-hover/item:scale-100 transition-all duration-500 ease-out z-20">
          <span className="text-[8px] font-black tracking-[0.25em] text-neutral-400 uppercase mb-3 font-sans">
            Scent Profile
          </span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 w-full max-w-[145px]">
            {notes.map((note, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-100/80 flex items-center justify-center shadow-sm hover:border-accent hover:bg-accent/5 hover:scale-108 transition-all duration-300">
                  <span className="text-lg leading-none filter drop-shadow-sm select-none">
                    {getNoteEmoji(note)}
                  </span>
                </div>
                <span className="text-[7.5px] font-black tracking-[0.1em] text-neutral-500 uppercase mt-1 text-center truncate max-w-[68px] font-sans">
                  {note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOGO Status Badge */}
        {isBuyItem && (
          <span className="absolute top-2 left-2 bg-neutral-950 text-white text-[7px] font-black tracking-widest px-2 py-0.5 uppercase shadow-sm z-10">
            BUY
          </span>
        )}
        {isGetItem && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-[7px] font-black tracking-widest px-2 py-0.5 uppercase shadow-sm z-10 flex items-center gap-0.5">
            <Gift size={7} /> FREE
          </span>
        )}

        {/* Discount badge */}
        {hasDiscount && !isBuyItem && !isGetItem && (
          <span className="absolute top-2 right-2 bg-accent text-white text-[8px] font-black tracking-wide px-1.5 py-0.5 rounded-sm z-10">
            {discountPct}% OFF
          </span>
        )}

        {/* Rating capsule */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm border border-neutral-200/60 py-0.5 px-1.5 rounded-full text-[8px] font-bold text-black flex items-center gap-0.5 shadow-sm z-10">
          <span className="font-black">{rating}</span>
          <Star size={7} className="fill-amber-400 text-amber-400" />
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-500">{reviews}</span>
        </div>
      </Link>

      {/* Info Area */}
      <div className="p-3 flex flex-col grow">
        <Link href={`/product/${item.slug}`}>
          <p className="text-[8px] font-black tracking-[0.15em] uppercase text-neutral-400 mb-0.5 truncate">{item.brand_name}</p>
          <h4 className="text-[10px] font-bold text-black uppercase tracking-tight mb-2 group-hover/item:text-accent transition-colors line-clamp-2 h-7 leading-tight">
            {item.name}
          </h4>
        </Link>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
          <span className="text-xs font-black text-black">
            ₹{variant?.selling_price?.toLocaleString('en-IN') ?? '—'}
          </span>
          {hasDiscount && (
            <span className="text-[8px] text-neutral-400 line-through font-medium">
              ₹{variant.compare_at_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        
        {hasDiscount && (
          <p className="text-[8px] text-accent font-black mb-1.5 truncate">You save ₹{(variant.compare_at_price - variant.selling_price).toLocaleString('en-IN')}</p>
        )}
        {isGetItem && (
          <p className="text-[8px] text-green-600 font-black mb-1.5 truncate flex items-center gap-0.5"><Gift size={8} /> Free with purchase</p>
        )}

        {/* Size info and Loyalty Points Row */}
        <div className="flex items-center justify-between text-[8px] font-bold mb-2 flex-wrap gap-1">
          {variant?.size_ml && (
            <span className="text-neutral-400 uppercase tracking-widest">{variant.size_ml}ml</span>
          )}
          {variant?.loyalty_points > 0 && (
            <span className="text-amber-600 uppercase tracking-wide">+{variant.loyalty_points} pts</span>
          )}
        </div>

        {/* Add to Cart / Qty Control */}
        <div className="mt-auto">
          {cartItem ? (
            <div className="flex items-center gap-1.5 w-full">
              <div className="flex-1 flex items-center border border-neutral-200 rounded overflow-hidden h-8">
                <button onClick={(e) => { e.preventDefault(); updateQuantity(cartItem.id, cartItem.quantity - 1); }}
                  className="w-7 flex items-center justify-center text-black hover:bg-neutral-100 transition-colors font-bold text-xs h-full">
                  −
                </button>
                <div className="flex-1 flex items-center justify-center text-[7.5px] font-black tracking-wide uppercase text-black h-full text-center">
                  {cartItem.quantity} in bag
                </div>
                <button onClick={(e) => { e.preventDefault(); updateQuantity(cartItem.id, cartItem.quantity + 1); }}
                  className="w-7 flex items-center justify-center text-black hover:bg-neutral-100 transition-colors font-bold text-xs h-full">
                  +
                </button>
              </div>
              <button onClick={handleBuyNow}
                className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white text-[7.5px] font-black tracking-wider uppercase py-2 h-8 transition-colors duration-300 flex items-center justify-center rounded-sm shadow-[0_2px_8px_rgba(210,22,141,0.2)]">
                Buy Now
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-full">
              <button onClick={handleAdd}
                className="flex-1 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-900 text-[7.5px] font-black tracking-wider uppercase py-2 h-8 transition-colors duration-300 flex items-center justify-center gap-1">
                Add to Bag
              </button>
              <button onClick={handleBuyNow}
                className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white text-[7.5px] font-black tracking-wider uppercase py-2 h-8 transition-colors duration-300 flex items-center justify-center rounded-sm shadow-[0_2px_8px_rgba(210,22,141,0.2)]">
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Promo Code Copy Button ── */
const CopyCodeButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy}
      className={`flex items-center gap-2 border px-4 py-2.5 text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${copied ? 'border-green-500 text-green-500 bg-green-50' : 'border-white/20 text-white hover:border-white/50 hover:bg-white/5'}`}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : code}
    </button>
  );
};

/* ── Main Page ── */
export default function OffersPage() {
  const [promoCampaigns, setPromoCampaigns] = useState<any[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPromoIdx, setCurrentPromoIdx] = useState(0);

  useEffect(() => {
    if (promoCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentPromoIdx((prev) => (prev + 1) % promoCampaigns.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promoCampaigns]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [offersRes, rewardsRes] = await Promise.all([
          api.get('/offers'),
          api.get('/loyalty/rewards')
        ]);
        setPromoCampaigns(offersRes.data);
        setLoyaltyRewards(rewardsRes.data);
      } catch (err) {
        console.error('Failed to load campaign streams', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">

      {/* ─── Hero Banner Slider ─── */}
      {promoCampaigns.length > 0 ? (
        <section className="relative h-[480px] sm:h-[420px] lg:h-[380px] xl:h-[400px] bg-neutral-950 overflow-hidden group border-b border-neutral-900 mb-10">
          {/* Background Slider Engine */}
          <div className="absolute inset-0">
            {promoCampaigns.map((promo: any, idx: number) => (
              <div 
                key={promo.id} 
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentPromoIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}
              >
                <img
                  src={promo.banner_url ? getMediaUrl(promo.banner_url) : 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=1000'}
                  alt={promo.title}
                  className="absolute inset-0 w-full h-full object-cover object-[80%_center] md:object-center opacity-85 group-hover:scale-[1.02] transition-transform duration-[3s]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute inset-0 max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-start">
                  {/* Text Content */}
                  <div className="max-w-2xl text-white pt-6 z-10">
                    <div className="flex items-center gap-4 mb-2 sm:mb-3">
                      <span className="h-[1.5px] w-8 bg-accent" />
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.2em] text-accent uppercase font-sans">{promo.discount_type}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-normal mb-2 leading-tight tracking-wide uppercase">
                      {promo.title}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-neutral-300 max-w-md mb-3 leading-relaxed font-light tracking-wide opacity-80 line-clamp-2">
                      {promo.subtitle || 'Experience a masterfully curated collection of prestige fragrances, hand-selected to define your signature presence.'}
                    </p>

                    {/* Dynamic Offer Rules / Details Block */}
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/5 border border-white/10 rounded-sm max-w-xs backdrop-blur-md">
                      <div className="text-[8px] sm:text-[9px] font-bold tracking-widest text-yellow-500 uppercase mb-1.5 font-sans">Offer Rules & Details</div>
                      <div className="flex flex-col gap-1.5 text-[10px] sm:text-[11px]">
                        {promo.discount_type?.toLowerCase().includes('bogo') ? (
                          <>
                            <div className="flex items-start">
                              <span className="text-neutral-400 font-bold uppercase w-16 flex-shrink-0">Buy:</span>
                              <span className="text-white font-medium uppercase tracking-wide">Qualifying items</span>
                            </div>
                            <div className="flex items-start">
                              <span className="text-green-400 font-bold uppercase w-16 flex-shrink-0">Get Free:</span>
                              <span className="text-white font-medium uppercase tracking-wide">Free pairing item</span>
                            </div>
                          </>
                        ) : promo.discount_type?.toLowerCase().includes('percent') || promo.discount_type?.includes('%') ? (
                          <>
                            <div className="flex items-start">
                              <span className="text-neutral-400 font-bold uppercase w-24 flex-shrink-0">Benefit:</span>
                              <span className="text-white font-medium">{promo.discount_percentage}% OFF</span>
                            </div>
                            {promo.min_purchase_amount > 0 && (
                              <div className="flex items-start">
                                <span className="text-neutral-400 font-bold uppercase w-24 flex-shrink-0">Min Purchase:</span>
                                <span className="text-white font-medium">₹{promo.min_purchase_amount.toLocaleString()}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-start">
                              <span className="text-neutral-400 font-bold uppercase w-24 flex-shrink-0">Benefit:</span>
                              <span className="text-white font-medium">Flat ₹{promo.flat_discount_amount?.toLocaleString()} OFF</span>
                            </div>
                            {promo.min_purchase_amount > 0 && (
                              <div className="flex items-start">
                                <span className="text-neutral-400 font-bold uppercase w-24 flex-shrink-0">Min Purchase:</span>
                                <span className="text-white font-medium">₹{promo.min_purchase_amount.toLocaleString()}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-sans">
                      <div className="text-[10px] font-black tracking-[0.2em] text-neutral-400 uppercase">
                        PROMO CODE: <span className="text-white border border-white/20 px-2 py-1 ml-1.5 font-mono bg-white/5 rounded-sm">{promo.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls & Counter */}
          {promoCampaigns.length > 1 && (
            <>
              <div className="absolute bottom-6 left-6 lg:left-12 flex items-center gap-6 sm:gap-12 z-20 font-sans">
                <div className="flex items-center gap-3 sm:gap-4">
                  {promoCampaigns.map((_: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentPromoIdx(idx)}
                      className={`h-0.5 transition-all duration-1000 ${idx === currentPromoIdx ? 'w-12 sm:w-20 bg-accent' : 'w-6 sm:w-8 bg-white/20'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-[12px] font-black tracking-[0.5em] text-white/60">
                  <span className="text-white">0{currentPromoIdx + 1}</span> / 0{promoCampaigns.length}
                </span>
              </div>

              <div className="absolute bottom-6 right-6 lg:right-12 flex gap-2 sm:gap-4 z-20">
                <button 
                  onClick={() => setCurrentPromoIdx(p => (p === 0 ? promoCampaigns.length - 1 : p - 1))}
                  className="w-10 h-10 sm:w-12 sm:h-12 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-700 backdrop-blur-xl"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1} />
                </button>
                <button 
                  onClick={() => setCurrentPromoIdx(p => (p === promoCampaigns.length - 1 ? 0 : p + 1))}
                  className="w-10 h-10 sm:w-12 sm:h-12 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-700 backdrop-blur-xl"
                >
                  <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1} />
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        /* Fallback Static Hero Banner when loading or no active offers */
        <div className="relative w-full bg-black py-28 overflow-hidden flex items-center justify-center mb-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
          <div className="relative z-10 text-center px-6 animate-fadeIn">
            <div className="flex items-center justify-center space-x-3 text-[10px] font-black tracking-[0.5em] text-accent uppercase mb-6">
              <Sparkles size={12} className="fill-current" />
              <span>Elite Exclusives</span>
              <Sparkles size={12} className="fill-current" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-serif font-normal tracking-wide text-white uppercase mb-6 leading-none">
              The Vault
            </h1>
            <p className="text-neutral-400 text-xs md:text-sm font-medium tracking-[0.2em] uppercase max-w-xl mx-auto leading-relaxed">
              Exclusive deals &amp; curated drops — limited time, unlimited style.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 lg:px-12 relative z-20 pb-32">

        {/* ─── Loyalty Milestones ─── */}
        {loyaltyRewards.length > 0 && (
          <div className="mb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-[10px] font-black tracking-[0.4em] text-amber-600 uppercase mb-3 block">LOYALTY PRIVILEGES</span>
                <h2 className="text-2xl md:text-3xl font-serif font-normal text-black leading-none uppercase tracking-wide">Reach Point Milestones.</h2>
              </div>
              <Link href="/rewards" className="group flex items-center space-x-3 text-[10px] font-black tracking-widest uppercase text-neutral-400 hover:text-black transition-all">
                <span>View All Rewards</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loyaltyRewards.slice(0, 4).map((reward) => (
                <div key={reward.id} className="bg-gradient-to-b from-white to-neutral-50/30 border border-neutral-100/80 p-8 flex flex-col hover:shadow-[0_20px_50px_rgba(210,22,141,0.06)] hover:-translate-y-2 rounded-lg transition-all duration-500 group relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:to-accent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500">
                  <div className="absolute -right-4 -top-8 text-[120px] font-serif text-neutral-200/20 opacity-[0.25] group-hover:opacity-[0.35] transition-opacity font-bold select-none pointer-events-none">
                    {reward.point_cost / 100}
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-6 w-12 h-12 rounded-full bg-neutral-950 group-hover:bg-accent flex items-center justify-center text-amber-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-md">
                      <Sparkles size={20} />
                    </div>
                    <div className="mb-2">
                      <span className="text-[9px] font-bold tracking-[0.3em] text-neutral-400 uppercase font-sans">Requirement</span>
                      <div className="text-xl font-serif font-bold text-black">{reward.point_cost} Points</div>
                    </div>
                    <div className="w-8 h-[1px] bg-neutral-200 my-5" />
                    <h3 className="text-sm font-black text-black uppercase tracking-wide mb-2.5 font-sans group-hover:text-accent transition-colors duration-300">{reward.name}</h3>
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold mb-8 uppercase tracking-widest font-sans">{reward.description}</p>
                    <div className="mt-auto">
                      <Link href="/rewards" className="inline-flex items-center text-[9px] font-bold tracking-[0.2em] uppercase text-black border-b border-black pb-1 hover:text-accent hover:border-accent transition-all duration-300 font-sans">
                        Redeem Privilege
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Active Promo Campaigns ─── */}
        {promoCampaigns.length > 0 ? (
          <div className="flex flex-col gap-20">
            {promoCampaigns.map((promo) => {
              const isBogo = promo.discount_type?.toLowerCase().includes('bogo') || promo.discount_type?.toLowerCase().includes('pairing');
              const isPct  = !!promo.discount_percentage && !isBogo;
              const isFlat = !!promo.flat_discount_amount && !isBogo;

              return (
                <div key={promo.id} className="group bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-neutral-100 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]">

                  {/* ── Campaign Header: Banner + Details ── */}
                  <div className="flex flex-col lg:flex-row">
                    {/* Banner Image */}
                    <div className="lg:w-5/12 relative h-64 lg:h-auto min-h-[320px] overflow-hidden bg-neutral-900 shrink-0">
                      <img
                        src={promo.banner_url ? getMediaUrl(promo.banner_url) : 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=1000'}
                        alt={promo.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s] ease-out"
                        onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&q=80&w=1000'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

                      {/* Offer Type Badge */}
                      <div className="absolute top-5 left-5 flex flex-col gap-2">
                        <div className="bg-accent text-white px-4 py-2 text-[10px] font-black tracking-[0.25em] uppercase shadow-xl flex items-center gap-2">
                          <Sparkles size={10} className="fill-white" />
                          {promo.discount_type}
                        </div>
                        {isPct && (
                          <div className="bg-white text-black px-3 py-1.5 text-[11px] font-black tracking-widest uppercase shadow-md">
                            {promo.discount_percentage}% OFF
                          </div>
                        )}
                        {isFlat && (
                          <div className="bg-white text-black px-3 py-1.5 text-[11px] font-black tracking-widest uppercase shadow-md">
                            ₹{promo.flat_discount_amount?.toLocaleString()} OFF
                          </div>
                        )}
                      </div>

                      {/* Promo Code Block */}
                      {promo.code && (
                        <div className="absolute bottom-5 left-5 right-5">
                          <p className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase mb-2">Apply Code at Checkout</p>
                          <CopyCodeButton code={promo.code} />
                        </div>
                      )}
                    </div>

                    {/* Details Panel */}
                    <div className="lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center bg-white relative overflow-hidden">
                      {/* Watermark */}
                      <div className="absolute bottom-0 right-0 select-none opacity-[0.025] pointer-events-none leading-none">
                        <span className="text-[9rem] font-black tracking-tighter text-black uppercase">{promo.discount_type?.split(' ')[0]}</span>
                      </div>

                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wide text-black uppercase mb-4 leading-[1.1]">
                        {promo.title}
                      </h2>
                      <div className="w-10 h-1 bg-accent mb-5" />
                      <p className="text-neutral-500 font-medium text-base max-w-xl leading-relaxed mb-8">
                        {promo.subtitle || 'Secure this exclusive compilation, available for a limited time only.'}
                      </p>

                      {/* Offer Details Card */}
                      <div className="bg-neutral-950 rounded-lg p-5 mb-8 max-w-lg">
                        <div className="text-[9px] font-black tracking-[0.35em] text-amber-400 uppercase mb-4 flex items-center gap-2">
                          <Tag size={10} /> Campaign Details
                        </div>
                        <div className="space-y-3">
                          {/* BOGO */}
                          {isBogo && (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
                                  <ShoppingBag size={12} className="text-white" />
                                </div>
                                <div>
                                  <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase block mb-0.5">You Buy</span>
                                  <span className="text-white text-sm font-semibold uppercase tracking-wide">
                                    {promo.buy_skus?.length > 0
                                      ? promo.buy_skus.map((sku: string) => { const m = promo.products?.find((p: any) => p.variants?.some((v: any) => v.sku === sku)); return m ? m.name : sku; }).join(', ')
                                      : promo.products?.map((p: any) => p.name).join(', ') || 'Qualifying items'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
                                  <ArrowRight size={12} className="text-amber-400" />
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Then you get</span>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
                                  <Gift size={12} className="text-green-400" />
                                </div>
                                <div>
                                  <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase block mb-0.5">You Get FREE</span>
                                  <span className="text-green-400 text-sm font-bold uppercase tracking-wide">
                                    {promo.get_skus?.length > 0
                                      ? promo.get_skus.map((sku: string) => { const m = promo.products?.find((p: any) => p.variants?.some((v: any) => v.sku === sku)); return m ? m.name : sku; }).join(', ')
                                      : 'A free qualifying item'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          {/* Percentage */}
                          {isPct && (
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
                                <Zap size={12} className="text-amber-400" />
                              </div>
                              <div>
                                <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase block mb-0.5">Discount</span>
                                <span className="text-amber-400 text-sm font-bold">{promo.discount_percentage}% OFF on qualifying items</span>
                              </div>
                            </div>
                          )}
                          {/* Flat */}
                          {isFlat && (
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
                                <Tag size={12} className="text-amber-400" />
                              </div>
                              <div>
                                <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase block mb-0.5">Flat Discount</span>
                                <span className="text-amber-400 text-sm font-bold">₹{promo.flat_discount_amount?.toLocaleString()} OFF</span>
                              </div>
                            </div>
                          )}
                          {/* Min purchase */}
                          {promo.min_purchase_amount > 0 && (
                            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-white/10">
                              <span className="text-[9px] font-black tracking-widest text-neutral-500 uppercase">Min. Purchase:</span>
                              <span className="text-white text-xs font-bold">₹{promo.min_purchase_amount?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link href="/shop" className="inline-flex items-center gap-3 bg-neutral-950 hover:bg-accent text-white px-8 py-4 text-[10px] font-black tracking-[0.25em] uppercase transition-all duration-500 w-fit">
                        Shop the Collection
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>

                  {/* ── Eligible Products Tray ── */}
                  {promo.products && promo.products.length > 0 && (
                    <div className="bg-gradient-to-b from-neutral-50/80 to-white border-t border-neutral-100 px-6 lg:px-12 pt-8 pb-10">
                      {/* Tray Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                            <ShoppingBag size={14} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black tracking-[0.3em] uppercase text-black">
                              {isBogo ? 'Products in This Deal' : 'Eligible Products'} 
                              <span className="ml-2 text-neutral-400">({promo.products.length})</span>
                            </p>
                            <p className="text-[9px] text-neutral-400 font-medium uppercase tracking-widest">Add to bag &amp; promo applies at checkout</p>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Scroll to explore <ArrowRight size={12} className="ml-2" />
                        </div>
                      </div>

                      {/* Product Scroll Tray */}
                      <div className="flex flex-nowrap overflow-x-auto pb-4 -mx-2 px-2 gap-5 snap-x scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                        {promo.products.map((item: any) => {
                          const isBuy = promo.buy_skus?.some((sku: string) => item.variants?.some((v: any) => v.sku === sku));
                          const isGet = promo.get_skus?.some((sku: string) => item.variants?.some((v: any) => v.sku === sku));
                          return (
                            <OfferProductCard
                              key={item.id}
                              item={item}
                              isBuyItem={!!isBuy}
                              isGetItem={!!isGet}
                              promoCode={promo.code}
                            />
                          );
                        })}
                      </div>

                      {/* Promo code bar at bottom */}
                      {promo.code && (
                        <div className="mt-6 pt-5 border-t border-dashed border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <p className="text-[11px] text-neutral-500 font-medium">
                            💡 Use code <strong className="text-black font-mono">{promo.code}</strong> at checkout to apply this offer automatically.
                          </p>
                          <CopyCodeButton code={promo.code} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div className="bg-white p-20 text-center rounded-xl border border-neutral-100 shadow-xl">
              <Percent size={40} className="mx-auto text-neutral-200 mb-6" />
              <h3 className="font-black uppercase tracking-[0.2em] text-xl text-black">Archive Sealed</h3>
              <p className="text-neutral-400 text-sm mt-3 mb-8 max-w-xs mx-auto">There are currently no active campaigns released.</p>
              <Link href="/shop" className="bg-black text-white px-10 py-4 text-[11px] font-black tracking-widest uppercase hover:bg-neutral-800 transition-all">
                Return to Gallery
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
