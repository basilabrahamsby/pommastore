'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getMediaUrl } from '@/services/media';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand_name: string;
    images?: string[];
    variants: any[];
    scent_notes?: any;
  };
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

const getRating = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.0 + (Math.abs(hash) % 10) / 10;
  const reviews = 5 + (Math.abs(hash) % 95);
  return { rating: rating.toFixed(1), reviews };
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    if (!product.images || product.images.length <= 1) return;

    // Stable stagger offset based on product ID to make cards cycle out of sync
    let hash = 0;
    for (let i = 0; i < product.id.length; i++) {
      hash = product.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const staggerDelay = Math.abs(hash) % 1500;

    let intervalId: any;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
      }, 3000);
    }, staggerDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [product.images, product.id]);
  
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);
  
  const isWishlisted = wishlistItems.some(i => i.id === product.id);
  
  const primaryVariant = product.variants[0];
  const hasDiscount = primaryVariant?.compare_at_price > primaryVariant?.selling_price;
  
  const cartItem = (isHydrated && primaryVariant) ? cartItems.find((i) => i.id === primaryVariant.id) : null;
  
  const discountPercentage = hasDiscount 
    ? Math.round(((primaryVariant.compare_at_price - primaryVariant.selling_price) / primaryVariant.compare_at_price) * 100)
    : 0;

  const getNotes = () => {
    if (product.scent_notes) {
      const notesList: string[] = [];
      const top = product.scent_notes.top || [];
      const heart = product.scent_notes.heart || [];
      const base = product.scent_notes.base || [];
      const all = [...top, ...heart, ...base];
      if (all.length > 0) {
        return Array.from(new Set(all)).slice(0, 4);
      }
    }
    
    // Stable hash fallback notes based on product name
    let hash = 0;
    for (let i = 0; i < product.name.length; i++) {
      hash = product.name.charCodeAt(i) + ((hash << 5) - hash);
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!primaryVariant) return;

    addItem({
      id: primaryVariant.id,
      productId: product.id,
      name: product.name,
      variantName: primaryVariant.sku,
      price: primaryVariant.selling_price,
      image: getMediaUrl(product.images?.[0]),
      quantity: 1,
      sizeMl: primaryVariant.size_ml,
      loyaltyPoints: primaryVariant.loyalty_points,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!primaryVariant) return;

    if (!cartItem) {
      addItem({
        id: primaryVariant.id,
        productId: product.id,
        name: product.name,
        variantName: primaryVariant.sku,
        price: primaryVariant.selling_price,
        image: getMediaUrl(product.images?.[0]),
        quantity: 1,
        sizeMl: primaryVariant.size_ml,
        loyaltyPoints: primaryVariant.loyalty_points,
      });
    }
    
    router.push('/checkout');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        brand: product.brand_name,
        price: primaryVariant?.selling_price || 0,
        image: getMediaUrl(product.images?.[0])
      });
    }
  };

  const { rating, reviews } = getRating(product.id);

  return (
    <div className="group relative bg-white border border-neutral-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 flex flex-col h-full overflow-hidden rounded">
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="bg-accent text-white text-[8px] font-bold tracking-widest px-2 py-0.5 uppercase rounded-sm">
            {discountPercentage}% OFF
          </span>
        )}
        {primaryVariant?.loyalty_points > 0 && (
          <span className="bg-amber-500 text-white text-[8px] font-bold tracking-widest px-2 py-0.5 uppercase rounded-sm">
            +{primaryVariant.loyalty_points} PTS
          </span>
        )}
      </div>

      {/* Wishlist Icon */}
      <button 
        onClick={handleWishlist}
        className={`absolute right-3 top-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-neutral-100 transition-all duration-300 hover:scale-110 ${isWishlisted ? 'text-accent' : 'text-neutral-400 hover:text-accent'}`}
      >
        <Heart size={15} className={isWishlisted ? 'fill-current' : ''} />
      </button>

      <Link href={`/product/${product.slug}`} className="flex-grow block">
        <div className="relative aspect-square w-full bg-neutral-50/50 overflow-hidden">
          {product.images && product.images.length > 0 ? (
            product.images.map((img, idx) => (
              <img
                key={idx}
                src={getMediaUrl(img)}
                alt={`${product.name} ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 h-full w-full object-contain mix-blend-multiply transition-all duration-[1200ms] ease-in-out p-6 group-hover:scale-105 z-0 ${
                  idx === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
                onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png' }}
              />
            ))
          ) : (
            <img
              src="/kozmocart/placeholder-perfume.png"
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 p-6"
            />
          )}
          <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

          {/* Image Pagination Indicators */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
              {product.images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentImageIndex ? 'w-3 bg-accent' : 'w-1 bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          )}
          
          {/* Scent Profile Hover Panel */}
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-500 ease-out z-20">
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

          {/* Myntra-style Ratings Overlay Badge */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-neutral-200/60 py-0.5 px-2 rounded-full text-[9px] font-bold text-black flex items-center space-x-1 shadow-sm font-sans z-10">
            <span className="font-black text-black">{rating}</span>
            <Star size={8} className="fill-rating text-rating" />
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-500">{reviews}</span>
          </div>
        </div>

        <div className="p-4 flex flex-col">
          <p className="text-[10px] tracking-[0.1em] text-black font-nelphim font-black uppercase mb-1">
            {product.brand_name}
          </p>
          <h3 className="text-[11px] font-medium text-neutral-600 uppercase tracking-wide line-clamp-1 h-4 mb-2 leading-tight w-full overflow-hidden text-ellipsis font-serif">
            {product.name}
          </h3>

          <div className="flex items-center space-x-1.5 mt-1 font-sans">
            <span className="text-[13px] font-bold text-black">
              ₹{primaryVariant?.selling_price?.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <span className="text-[10px] text-neutral-400 line-through font-medium">
                  ₹{primaryVariant.compare_at_price.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-accent font-bold">
                  ({discountPercentage}% OFF)
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom Action Button inside Group Hover */}
      <div className="px-4 pb-4 mt-auto">
         {cartItem ? (
           <div className="flex items-center gap-2 w-full">
             <div className="flex-1 flex items-center justify-between border border-neutral-200 bg-neutral-50 h-[36px] rounded overflow-hidden">
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   updateQuantity(cartItem.id, cartItem.quantity - 1);
                 }}
                 className="w-8 flex items-center justify-center text-black hover:bg-neutral-200 transition-colors font-bold text-xs h-full"
               >
                 -
               </button>
               <div className="flex-1 flex items-center justify-center text-[8px] font-black tracking-wider uppercase text-black h-full font-sans">
                 {cartItem.quantity} In Bag
               </div>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   updateQuantity(cartItem.id, cartItem.quantity + 1);
                 }}
                 className="w-8 flex items-center justify-center text-black hover:bg-neutral-200 transition-colors font-bold text-xs h-full"
               >
                 +
               </button>
             </div>
             <button
               onClick={handleBuyNow}
               className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded shadow-[0_2px_8px_rgba(210,22,141,0.2)]"
             >
               Buy Now
             </button>
           </div>
         ) : (
           <div className="flex items-center gap-2 w-full">
             <button
               onClick={handleAddToCart}
               className="flex-1 border border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-900 py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded"
             >
               Add to Bag
             </button>
             <button
               onClick={handleBuyNow}
               className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded shadow-[0_2px_8px_rgba(210,22,141,0.2)]"
             >
               Buy Now
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

export default ProductCard;

