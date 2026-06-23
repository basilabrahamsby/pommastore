'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { getMediaUrl } from '@/services/media';
import api from '@/services/api';
import { Trash2, ArrowLeft, Heart, Star } from 'lucide-react';

export default function Wishlist() {
  const router = useRouter();
  const { items, removeItem } = useWishlistStore();
  const addItemToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch complete product details for each wishlist item to get accurate variant data
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const detailsMap: Record<string, any> = {};
        await Promise.all(
          items.map(async (item) => {
            try {
              // Try slug first, otherwise generate slug fallback from name
              const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const res = await api.get(`/products/${slug}`);
              if (res.data) {
                detailsMap[item.id] = res.data;
              }
            } catch (e) {
              console.warn(`Failed to fetch product details for ${item.name}`, e);
            }
          })
        );
        setProductDetails(detailsMap);
      } catch (err) {
        console.error('Wishlist failed to fetch details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [items, isHydrated]);

  const handleAddToCart = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we have fetched details
    const fullProduct = productDetails[item.id];
    const variant = fullProduct?.variants?.[0];

    if (variant) {
      addItemToCart({
        id: variant.id,
        productId: fullProduct.id,
        name: fullProduct.name,
        variantName: variant.sku,
        price: variant.selling_price,
        image: getMediaUrl(fullProduct.images?.[0]) || item.image,
        quantity: 1,
        sizeMl: variant.size_ml,
        loyaltyPoints: variant.loyalty_points,
      });
    } else {
      // Fallback if details API fails
      addItemToCart({
        id: `${item.id}-default`,
        productId: item.id,
        name: item.name,
        variantName: '100ml',
        price: item.price,
        image: item.image,
        quantity: 1,
        sizeMl: 100,
        loyaltyPoints: 0,
      });
    }
  };

  const handleBuyNow = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();

    const fullProduct = productDetails[item.id];
    const variant = fullProduct?.variants?.[0];
    const vId = variant ? variant.id : `${item.id}-default`;
    const cartItem = cartItems.find((c) => c.id === vId);

    if (!cartItem) {
      if (variant) {
        addItemToCart({
          id: variant.id,
          productId: fullProduct.id,
          name: fullProduct.name,
          variantName: variant.sku,
          price: variant.selling_price,
          image: getMediaUrl(fullProduct.images?.[0]) || item.image,
          quantity: 1,
          sizeMl: variant.size_ml,
          loyaltyPoints: variant.loyalty_points,
        });
      } else {
        addItemToCart({
          id: vId,
          productId: item.id,
          name: item.name,
          variantName: '100ml',
          price: item.price,
          image: item.image,
          quantity: 1,
          sizeMl: 100,
          loyaltyPoints: 0,
        });
      }
    }

    router.push('/checkout');
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse font-serif italic text-2xl text-neutral-400">Loading Wishlist...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20 text-center animate-in fade-in duration-700">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
            <Heart size={28} />
          </div>
        </div>
        <h1 className="text-3xl font-serif mb-4 uppercase tracking-[0.15em]">Your Wishlist is Empty</h1>
        <p className="text-gray-400 mb-8 text-xs uppercase tracking-widest max-w-sm mx-auto">
          Save items you love here to easily purchase or view them later.
        </p>
        <Link 
          href="/shop" 
          className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] hover:bg-neutral-800 transition-colors uppercase rounded-sm"
        >
          Explore Curation
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 border-b border-neutral-100 pb-6">
        <div className="flex items-center space-x-3">
          <Link href="/shop" className="text-gray-400 hover:text-black transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-serif font-normal uppercase tracking-[0.2em] text-neutral-900">
            My Wishlist
          </h1>
          <span className="text-[10px] font-black tracking-widest text-neutral-400 bg-neutral-50 border border-neutral-200/50 rounded-full px-2.5 py-0.5 uppercase">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
      </div>

      {/* Grid of Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {items.map((item) => {
          const fullProduct = productDetails[item.id];
          const variant = fullProduct?.variants?.[0];
          const vId = variant ? variant.id : `${item.id}-default`;
          const cartItem = cartItems.find((c) => c.id === vId);

          const hasDiscount = variant?.compare_at_price > variant?.selling_price;
          const discountPct = hasDiscount
            ? Math.round(((variant.compare_at_price - variant.selling_price) / variant.compare_at_price) * 100)
            : 0;

          // Stable hash fallback notes based on product name
          let hash = 0;
          for (let i = 0; i < item.name.length; i++) {
            hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const rating = (4.0 + (Math.abs(hash) % 10) / 10).toFixed(1);
          const reviews = 5 + (Math.abs(hash) % 95);

          const productSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

          return (
            <div key={item.id} className="group relative bg-white border border-neutral-100 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:border-neutral-200 transition-all duration-500 flex flex-col h-full overflow-hidden rounded">
              
              {/* Discount / Points Badge */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-accent text-white text-[8px] font-bold tracking-widest px-2 py-0.5 uppercase rounded-sm">
                    {discountPct}% OFF
                  </span>
                </div>
              )}

              {/* Remove Button */}
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute right-3 top-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-neutral-100 text-neutral-400 hover:text-accent hover:border-accent transition-all duration-300 hover:scale-110"
                title="Remove from wishlist"
              >
                <Trash2 size={13} />
              </button>

              <Link href={`/product/${productSlug}`} className="flex-grow block">
                <div className="relative aspect-square w-full bg-neutral-50/50 overflow-hidden flex items-center justify-center p-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full object-contain mix-blend-multiply transition-transform duration-700 p-2 group-hover:scale-105"
                    onError={(e: any) => { e.target.src = '/kozmocart/placeholder-perfume.png'; }}
                  />
                  <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                  {/* Rating Capsule */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-neutral-200/60 py-0.5 px-2 rounded-full text-[9px] font-bold text-black flex items-center space-x-1 shadow-sm font-sans z-10">
                    <span className="font-black text-black">{rating}</span>
                    <Star size={8} className="fill-amber-400 text-amber-400" />
                    <span className="text-neutral-300">|</span>
                    <span className="text-neutral-500">{reviews}</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col">
                  <h3 className="text-[11px] font-medium text-neutral-600 uppercase tracking-wide line-clamp-1 h-4 mb-1 leading-tight w-full overflow-hidden text-ellipsis font-sans">
                    {item.name}
                  </h3>
                  <p className="text-[10px] tracking-[0.1em] text-black font-nelphim font-black uppercase mb-2">
                    {item.brand || 'Luxury Fragrance'}
                  </p>

                  <div className="flex items-center space-x-1.5 mt-1 font-sans">
                    <span className="text-[13px] font-bold text-black">
                      ₹{variant?.selling_price?.toLocaleString('en-IN') || item.price.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-[10px] text-neutral-400 line-through font-medium">
                          ₹{variant.compare_at_price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-accent font-bold">
                          ({discountPct}% OFF)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="px-4 pb-4 mt-auto">
                {cartItem ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 flex items-center justify-between border border-neutral-200 bg-neutral-50 h-[36px] rounded overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
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
                          updateQuantity(cartItem.id, cartItem.quantity + 1);
                        }}
                        className="w-8 flex items-center justify-center text-black hover:bg-neutral-200 transition-colors font-bold text-xs h-full"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={(e) => handleBuyNow(e, item)}
                      className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded shadow-[0_2px_8px_rgba(210,22,141,0.2)]"
                    >
                      Buy Now
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={(e) => handleAddToCart(e, item)}
                      className="flex-1 border border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-900 py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded"
                    >
                      Add to Bag
                    </button>
                    <button
                      onClick={(e) => handleBuyNow(e, item)}
                      className="flex-1 bg-accent border border-accent hover:bg-accent/90 text-white py-2 text-[9px] font-black tracking-widest transition-all duration-300 uppercase h-[36px] font-sans rounded shadow-[0_2px_8px_rgba(210,22,141,0.2)]"
                    >
                      Buy Now
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
