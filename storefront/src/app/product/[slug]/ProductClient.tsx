'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getMediaUrl } from '@/services/media';
import ProductCard from '@/components/ProductCard';
import { 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Heart,
  Droplet,
  Hourglass,
  Wind,
  User,
  Sparkles,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  MapPin
} from 'lucide-react';


export default function ProductClient({ 
  slug, 
  initialProduct, 
  initialOffers 
}: { 
  slug: string; 
  initialProduct: any; 
  initialOffers: any[]; 
}) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<any>(initialProduct?.variants?.[0] || null);
  const [activeImage, setActiveImage] = useState<string>(initialProduct?.images?.[0] || '');
  const [loading, setLoading] = useState(!initialProduct);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Delhivery Pincode Checker State
  const [pincode, setPincode] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle' | 'checking' | 'serviceable' | 'unserviceable' | 'error'>('idle');
  const [pinResult, setPinResult] = useState<any>(null);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || !/^\d+$/.test(pincode.trim())) {
      alert('Please enter a valid 6-digit pincode.');
      return;
    }
    setPinStatus('checking');
    try {
      const res = await api.get(`/orders/shipping/verify-pincode?pincode=${pincode.trim()}`);
      if (res.data && res.data.serviceable) {
        setPinResult(res.data);
        setPinStatus('serviceable');
      } else {
        setPinStatus('unserviceable');
      }
    } catch (err) {
      console.error(err);
      setPinStatus('error');
    }
  };

  // Gallery Lightbox State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Lightbox Keyboard navigation
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev - 1 + (product?.gallery_images?.length || 0)) % (product?.gallery_images?.length || 1) : null
        );
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => 
          prev !== null ? (prev + 1) % (product?.gallery_images?.length || 1) : null
        );
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, product?.gallery_images]);

  // Offers State
  const [matchingOffers, setMatchingOffers] = useState<any[]>(initialOffers || []);

  // Recommendations States
  const [sameCategoryProducts, setSameCategoryProducts] = useState<any[]>([]);
  const [sameBrandProducts, setSameBrandProducts] = useState<any[]>([]);
  const [samePriceProducts, setSamePriceProducts] = useState<any[]>([]);
  const [bundleProducts, setBundleProducts] = useState<any[]>([]);
  const [checkedBundleIds, setCheckedBundleIds] = useState<string[]>([]);
  const [bundleAdded, setBundleAdded] = useState(false);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [cmsLayout, setCmsLayout] = useState<any>(null);
  
  useEffect(() => {
    setIsHydrated(true);
    // Fetch global layout for trust badges/shipping limit
    api.get('/settings/storefront_layout')
      .then(res => setCmsLayout(res.data))
      .catch(err => console.warn('Product page failed to fetch layout', err));
  }, []);

  const cartItem = (isHydrated && selectedVariant) ? cartItems.find((i) => i.id === selectedVariant.id) : null;
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addItem);
  const removeFromWishlist = useWishlistStore((state) => state.removeItem);

  const isWishlisted = product ? wishlistItems.some((i: any) => i.id === product.id) : false;

  useEffect(() => {
    const fetchProductAndRecs = async () => {
      try {
        if (!product) {
          setLoading(true);
        }
        const res = await api.get(`/products/${slug}`);
        const prod = res.data;
        setProduct(prod);
        
        if (prod.images && prod.images.length > 0) {
          if (!activeImage || !prod.images.includes(activeImage)) {
            setActiveImage(prod.images[0]);
          }
        } else {
          setActiveImage('');
        }

        if (prod.variants && prod.variants.length > 0) {
          if (!selectedVariant || !prod.variants.some((v: any) => v.id === selectedVariant.id)) {
            setSelectedVariant(prod.variants[0]);
          }
        }

        // Fetch active storefront offers and filter
        try {
          const offersRes = await api.get('/offers');
          const productSkus = prod.variants?.map((v: any) => v.sku) || [];
          const matches = offersRes.data.filter((off: any) => {
            const inProductsList = off.products?.some((p: any) => p.id === prod.id);
            if (inProductsList) return true;

            const combinedSkus = [...(off.buy_skus || []), ...(off.get_skus || []), ...(off.target_skus || [])];
            return combinedSkus.some((sku: string) => productSkus.includes(sku));
          });
          setMatchingOffers(matches);
        } catch (oErr) {
          console.warn('Failed to fetch storefront offers', oErr);
        }

        // Fetch recommendations dynamically based on category, brand, and price
        try {
          const allRes = await api.get('/products', { params: { limit: 120 } });
          const allProducts = allRes.data.filter((p: any) => p.id !== prod.id);

          // 1. Same Brand Products
          if (prod.brand_id) {
            const sameBrand = allProducts.filter((p: any) => p.brand_id === prod.brand_id);
            setSameBrandProducts(sameBrand);
          }

          // 2. Same Price Products (closest in price)
          const currentPrice = prod.variants?.[0]?.selling_price || 0;
          const sortedByPrice = [...allProducts].sort((a, b) => {
            const priceA = a.variants?.[0]?.selling_price || 0;
            const priceB = b.variants?.[0]?.selling_price || 0;
            return Math.abs(priceA - currentPrice) - Math.abs(priceB - currentPrice);
          });
          setSamePriceProducts(sortedByPrice.slice(0, 4));

          // 3. Same Category Products (for bundle calculations)
          const sameCategory = allProducts.filter((p: any) => p.category_id === prod.category_id);
          setSameCategoryProducts(sameCategory);

          // 4. Pick Bundle Products
          const bundleList: any[] = [];
          const catMatch = sameCategory[0] || null;
          if (catMatch) {
            bundleList.push(catMatch);
          }
          const diffCatMatch = allProducts.find((p: any) => 
            p.category_id !== prod.category_id && 
            (!catMatch || p.id !== catMatch.id)
          );
          if (diffCatMatch) {
            bundleList.push(diffCatMatch);
          }
          // Fallback if less than 2 items
          if (bundleList.length < 2) {
            const fallback = allProducts.find((p: any) => !bundleList.some((b: any) => b.id === p.id));
            if (fallback) {
              bundleList.push(fallback);
            }
          }
          setBundleProducts(bundleList);
          setCheckedBundleIds([prod.id, ...bundleList.map(p => p.id)]);
        } catch (recErr) {
          console.warn('Failed to fetch recommendations', recErr);
        }
      } catch (err) {
        console.error('Failed to fetch product or recommendations', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductAndRecs();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="relative mb-6">
          <img src="/logo.png" alt="Kozmocart Logo" className="h-12 object-contain animate-pulse" />
        </div>
        <span className="text-[9px] font-black tracking-[0.4em] text-neutral-400 uppercase animate-pulse">Revealing Olfactory Masterpiece...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-6">
        <h2 className="text-2xl font-serif italic mb-2">Creation Not Found</h2>
        <p className="text-xs text-neutral-500 tracking-wider uppercase mb-8">The requested fragrance does not exist in our curations.</p>
        <Link href="/shop" className="border border-black px-8 py-3 text-[10px] font-black tracking-widest uppercase hover:bg-black hover:text-white transition-colors">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      id: selectedVariant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: selectedVariant.sku,
      price: selectedVariant.selling_price,
      image: getMediaUrl(product.images?.[0]) || '/placeholder-perfume.png',
      quantity: 1,
      sizeMl: selectedVariant.size_ml,
      loyaltyPoints: selectedVariant.loyalty_points,
    });
  };

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    if (!cartItem) {
      addItem({
        id: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: selectedVariant.sku,
        price: selectedVariant.selling_price,
        image: getMediaUrl(product.images?.[0]) || '/placeholder-perfume.png',
        quantity: 1,
        sizeMl: selectedVariant.size_ml,
        loyaltyPoints: selectedVariant.loyalty_points,
      });
    }
    router.push('/checkout');
  };

  const handleAddBundleToBag = () => {
    const itemsToAdd = [product, ...bundleProducts].filter(p => checkedBundleIds.includes(p.id));
    if (itemsToAdd.length === 0) return;

    const isBundle = itemsToAdd.length > 1;

    itemsToAdd.forEach((itemObj) => {
      const isCurrentProduct = itemObj.id === product.id;
      const variant = isCurrentProduct ? selectedVariant : (itemObj.variants?.[0] || null);
      if (!variant) return;

      addItem({
        id: variant.id,
        productId: itemObj.id,
        slug: itemObj.slug,
        name: itemObj.name,
        variantName: variant.sku,
        price: isBundle ? Math.round(variant.selling_price * 0.9) : variant.selling_price,
        image: getMediaUrl(itemObj.images?.[0]) || '/placeholder-perfume.png',
        quantity: 1,
        sizeMl: variant.size_ml,
        loyaltyPoints: variant.loyalty_points,
      });
    });

    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };

  const getOfferTermsText = (offer: any) => {
    if (!offer) return '';
    if (offer.discount_type?.toLowerCase().includes('bogo') || offer.discount_type?.toLowerCase().includes('pairing')) {
      const buySkus = offer.buy_skus || [];
      const getSkus = offer.get_skus || [];
      const products = offer.products || [];
      
      const getBuyProductNames = () => {
        if (buySkus.length === 0 && products.length > 0) return products.map((p: any) => p.name).join(', ');
        return buySkus.map((sku: string) => {
          const match = products.find((p: any) => p.variants?.some((v: any) => v.sku === sku));
          return match ? match.name : sku;
        }).join(', ') || 'qualifying item(s)';
      };

      const getGetProductNames = () => {
        if (getSkus.length === 0 && products.length > 0) return products.map((p: any) => p.name).join(', ');
        return getSkus.map((sku: string) => {
          const match = products.find((p: any) => p.variants?.some((v: any) => v.sku === sku));
          return match ? match.name : sku;
        }).join(', ') || 'a free item';
      };

      return `Buy: ${getBuyProductNames()} → Get FREE: ${getGetProductNames()}`;
    }
    if (offer.discount_percentage) {
      return `Get ${offer.discount_percentage}% off on your purchase.`;
    }
    if (offer.flat_discount_amount) {
      return `Flat ₹${offer.flat_discount_amount} off on qualifying items.`;
    }
    return '';
  };

  // Luxury Fallbacks for Empty/Fresh DB entries to keep UI looking extremely premium
  const olfactoryFamilyTag = product.occasion_tags?.find((t: string) => t.startsWith('family:'));
  const olfactoryFamily = olfactoryFamilyTag 
    ? olfactoryFamilyTag.replace('family:', '') 
    : (product.olfactory_family || 'Woody Fresh Spice');

  const longevityText = product.longevity_hours ? `${product.longevity_hours} Hours` : '8-12 Hours (Ultra Long-Lasting)';

  const sillageMap: Record<number, string> = {
    1: 'Intimate Projection',
    2: 'Moderate Projection',
    3: 'Strong Projection',
    4: 'Enormous Projection'
  };
  const sillageText = product.sillage_rating 
    ? sillageMap[product.sillage_rating] || `${product.sillage_rating}/4 Projection`
    : 'Intense / Room-filling';
    
  const targetGender = product.gender || 'Unisex';
  
  const topNotes = product.scent_notes?.top?.length > 0 
    ? product.scent_notes.top.join(', ') 
    : 'Sicilian Bergamot, Grapefruit Zest, Pink Peppercorn';
  
  const heartNotes = product.scent_notes?.heart?.length > 0 
    ? product.scent_notes.heart.join(', ') 
    : 'Damask Rose, French Lavender, Warm Cardamom';
  
  const baseNotes = product.scent_notes?.base?.length > 0 
    ? product.scent_notes.base.join(', ') 
    : 'Madagascar Vanilla, Patchouli Essence, Ambergris, White Musk';

  const defaultDescription = `An immersive sensory journey crafted by world-class perfumers. This signature masterpiece balances rare raw extracts with cutting-edge molecular engineering, producing a timeless scent trail that adapts dynamically to your skin chemistry. Designed for connoisseurs of authentic luxury.`;

  return (
    <div className="bg-white text-black selection:bg-neutral-900 selection:text-white min-h-screen">
      
      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-24 lg:py-32">
        
        {/* Upper Layout: Gallery & Basic Info */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start mb-24">
          
          {/* LEFT: Premium Image Gallery */}
          <div className="w-full lg:w-[55%] flex flex-col items-center">
            
            {/* Main Image Container */}
            <div className="w-full bg-neutral-50 border border-neutral-100 rounded-lg flex items-center justify-center p-2 relative overflow-hidden group shadow-sm">
              <img
                src={getMediaUrl(activeImage) || '/placeholder-perfume.png'}
                alt={product.name}
                className="w-full h-auto object-contain rounded transition-transform duration-[1000ms] group-hover:scale-105"
                onError={(e: any) => { e.target.src = '/placeholder-perfume.png' }}
              />
              <div className="absolute inset-0 bg-neutral-950/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              {/* Luxury Ribbon */}
              <span className="absolute top-4 left-4 bg-black text-white text-[8px] font-black tracking-[0.25em] px-3 py-1.5 uppercase shadow-sm">
                100% Authentic
              </span>
            </div>

            {/* Thumbnail Row - rendered if multiple images exist */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-wrap gap-3 mt-6 justify-center w-full">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 border rounded bg-neutral-50 p-2 transition-all duration-300 ${
                      activeImage === img 
                        ? 'border-black scale-105 shadow-sm' 
                        : 'border-neutral-200 opacity-60 hover:opacity-100 hover:border-neutral-400'
                    }`}
                  >
                    <img
                      src={getMediaUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                      onError={(e: any) => { e.target.src = '/placeholder-perfume.png' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Perfume Specification Details */}
          <div className="w-full lg:w-[45%] flex flex-col">
            
            {/* Breadcrumb / Brand */}
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-[10px] tracking-[0.35em] font-black text-neutral-400 uppercase">{product.brand_name || "Exquisite House"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              {product.category_name && (
                <span className="text-[10px] tracking-[0.2em] font-bold text-neutral-400 uppercase">{product.category_name}</span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans font-semibold tracking-wide text-neutral-900 leading-tight mb-4 uppercase">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="flex items-end space-x-4 mb-8">
              <span className="text-3xl font-bold text-black">
                ₹{selectedVariant?.selling_price?.toLocaleString('en-IN')}/-
              </span>
              {selectedVariant?.compare_at_price > selectedVariant?.selling_price && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg text-neutral-400 line-through font-semibold">
                    ₹{selectedVariant.compare_at_price.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-100 text-red-600 text-[9px] font-semibold tracking-wider px-2 py-0.5 uppercase rounded">
                    {Math.round(((selectedVariant.compare_at_price - selectedVariant.selling_price) / selectedVariant.compare_at_price) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Loyalty points banner */}
            {selectedVariant?.loyalty_points > 0 && (
              <div className="flex items-center space-x-3 mb-8 bg-neutral-50 px-4 py-3 border border-neutral-100 rounded-md shadow-2xs self-start">
                <Award size={16} className="text-neutral-900 fill-current" />
                <span className="text-[9px] font-black tracking-[0.2em] text-neutral-900 uppercase">
                  Earn {selectedVariant.loyalty_points} exclusive loyalty points with this purchase
                </span>
              </div>
            )}

            {/* Micro details */}
            <div className="text-neutral-600 text-sm leading-relaxed mb-8 font-medium whitespace-pre-wrap">
              {product.short_description || defaultDescription}
            </div>

            {/* ACTIVE OFFERS BANNER */}
            {matchingOffers.map((off: any) => {
              const products = off.products || [];
              const isBogo = off.discount_type?.toLowerCase().includes('bogo') || off.discount_type?.toLowerCase().includes('pairing');
              
              const getBuyProductNames = () => {
                if (!isBogo) return null;
                const skus = off.buy_skus || [];
                if (skus.length === 0 && products.length > 0) return products.map((p: any) => p.name).join(', ');
                return skus.map((sku: string) => {
                  const match = products.find((p: any) => p.variants?.some((v: any) => v.sku === sku));
                  return match ? match.name : sku;
                }).join(', ') || 'qualifying items';
              };

              const getGetProductNames = () => {
                if (!isBogo) return null;
                const skus = off.get_skus || [];
                if (skus.length === 0 && products.length > 0) return products.map((p: any) => p.name).join(', ');
                return skus.map((sku: string) => {
                  const match = products.find((p: any) => p.variants?.some((v: any) => v.sku === sku));
                  return match ? match.name : sku;
                }).join(', ') || 'a free item';
              };

              const bannerUrl = off.images?.[0] || off.banner_url;

              return (
              <Link key={off.id} href={`/offers`} className="block mb-8 group">
                <div 
                  className="p-5 text-white rounded-lg shadow-sm border border-neutral-800 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-neutral-700 bg-neutral-900"
                  style={{
                    backgroundImage: bannerUrl ? `url(${getMediaUrl(bannerUrl)})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Dark transparent overlay to keep text highly readable and premium */}
                  {bannerUrl && (
                    <div className="absolute inset-0 bg-neutral-950/75 group-hover:bg-neutral-950/65 transition-colors duration-300 z-0" />
                  )}
                  {/* Background pattern */}
                  <div className="absolute right-0 bottom-0 opacity-10 font-black text-5xl select-none font-serif italic pointer-events-none -mr-3 -mb-3 z-5">
                    {off.discount_type?.split(' ')[0] || 'OFFER'}
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-2 relative z-10">
                    <span className="bg-amber-400 text-black text-[9px] font-black tracking-widest px-2 py-0.5 uppercase rounded-sm">
                      Active Campaign
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      {off.discount_type}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-serif font-black italic tracking-wide text-white mb-1 relative z-10 group-hover:text-amber-300 transition-colors">
                    {off.title}
                  </h3>
                  
                  <p className="text-neutral-300 text-xs leading-relaxed font-medium mb-3 relative z-10">
                    {off.subtitle || "Exclusive campaign active for this product."}
                  </p>

                  {/* BOGO breakdown */}
                  {isBogo ? (
                    <div className="bg-neutral-800/50 border border-neutral-700/50 p-3 rounded mb-3 relative z-10 space-y-2">
                      <p className="text-[9px] font-black tracking-widest text-amber-400 uppercase mb-2">Deal Breakdown:</p>
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-black text-neutral-400 uppercase w-16 flex-shrink-0 mt-0.5">Buy:</span>
                        <span className="text-white text-xs font-semibold leading-tight">{getBuyProductNames()}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-black text-green-400 uppercase w-16 flex-shrink-0 mt-0.5">Get Free:</span>
                        <span className="text-green-400 text-xs font-bold leading-tight">{getGetProductNames()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-neutral-800/50 border border-neutral-700/50 p-3 rounded mb-3 relative z-10">
                      <p className="text-[9px] font-black tracking-widest text-amber-400 uppercase mb-1">
                        Offer Rules:
                      </p>
                      <p className="text-neutral-200 text-xs font-semibold leading-relaxed">
                        {getOfferTermsText(off)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-800 pt-3 relative z-10">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-black tracking-widest text-neutral-400 uppercase">Promo Code:</span>
                      <span className="bg-neutral-800 border border-neutral-700 text-amber-300 text-xs font-mono font-bold px-2 py-0.5 rounded">
                        {off.code}
                      </span>
                    </div>
                    
                    <span className="text-[9px] font-black tracking-[0.2em] text-white group-hover:text-amber-300 transition-colors uppercase flex items-center">
                      View Campaign Details &rarr;
                    </span>
                  </div>
                </div>
              </Link>
              );
            })}

            {/* SELECT SIZE */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-semibold tracking-[0.25em] text-neutral-900 uppercase">Select Size</h3>
                <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">In Stock</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants && product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-6 py-3 border text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded ${
                      selectedVariant?.id === v.id
                        ? 'border-black bg-black text-white shadow-md'
                        : 'border-neutral-200 text-neutral-600 hover:border-black bg-neutral-50/50'
                    }`}
                  >
                    {v.size_ml}ML
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS: Cart & Wishlist */}
            <div className="flex gap-4 mb-10 h-14">
              {cartItem ? (
                <div className="flex-1 flex border border-black rounded overflow-hidden">
                  <button
                    onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                    className="w-10 flex items-center justify-center text-black hover:bg-neutral-50 transition-colors font-bold text-lg"
                  >
                    -
                  </button>
                  <div className="flex-1 flex items-center justify-center text-[9px] font-semibold tracking-[0.15em] bg-neutral-50/50 text-black uppercase text-center px-1">
                    {cartItem.quantity} In Bag
                  </div>
                  <button
                    onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                    className="w-10 flex items-center justify-center text-black hover:bg-neutral-50 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white text-[9px] font-semibold tracking-[0.15em] hover:bg-neutral-900 transition-colors flex items-center justify-center space-x-2 h-full rounded shadow-sm hover:shadow-md duration-300"
                >
                  <ShoppingBag size={14} />
                  <span>ADD TO BAG</span>
                </button>
              )}
              
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-amber-500 text-black text-[9px] font-black tracking-[0.15em] hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 h-full rounded shadow-sm hover:shadow-md duration-300"
              >
                <span>BUY NOW</span>
              </button>
              
              <button
                onClick={() => {
                  if (!product) return;
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist({
                      id: product.id,
                      name: product.name,
                      brand: product.brand_name,
                      price: selectedVariant?.selling_price || 0,
                      image: getMediaUrl(product.images?.[0]) || '/placeholder-perfume.png',
                      slug: product.slug
                    });
                  }
                }}
                className={`w-14 h-full border flex items-center justify-center transition-all duration-300 rounded ${
                  isWishlisted 
                    ? 'border-red-500 text-red-500 bg-red-50/80 shadow-xs' 
                    : 'border-neutral-200 text-neutral-400 hover:border-black hover:text-black bg-neutral-50/20'
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>

            {/* PINCODE CHECKER WIDGET */}
            <div className="border-t border-neutral-100 pt-6 mt-6">
              <div className="flex items-center space-x-2 text-neutral-900 font-serif text-sm mb-1.5">
                <MapPin size={16} className="text-neutral-500" />
                <span>DELIVERY DETAILS</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase mb-3">
                Enter pin to get correct delivery charge or know delivery details
              </p>
              
              <form onSubmit={handleCheckPincode} className="flex space-x-2 max-w-xs">
                <input 
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 border border-neutral-200 px-3 py-2 text-xs focus:border-black outline-none rounded bg-white text-black"
                />
                <button 
                  type="submit"
                  disabled={pinStatus === 'checking'}
                  className="bg-black text-white px-4 py-2 text-xs font-semibold tracking-wider hover:bg-neutral-800 transition-colors rounded"
                >
                  {pinStatus === 'checking' ? 'CHECKING...' : 'CHECK'}
                </button>
              </form>

              {pinStatus === 'serviceable' && pinResult && (
                <div className="mt-3 text-xs text-green-700 bg-green-50/80 p-3 rounded border border-green-100 flex items-start space-x-2 animate-in fade-in duration-300">
                  <div className="font-semibold">✓</div>
                  <div>
                    <p className="font-bold">Serviceable by Delhivery</p>
                    <p className="text-[11px] text-green-800 mt-0.5">
                      Destination: {pinResult.district}, {pinResult.state || 'India'}
                    </p>
                    <p className="text-[11px] text-green-800 mt-1">
                      • Shipping Fee: {selectedVariant && selectedVariant.selling_price >= (cmsLayout?.free_shipping_limit || 999) ? 'FREE' : '₹' + (pinResult.shipping_fee || 150) + ' (FREE on orders over ₹' + (cmsLayout?.free_shipping_limit || 999) + ')'}
                    </p>
                  </div>
                </div>
              )}

              {pinStatus === 'unserviceable' && (
                <div className="mt-3 text-xs text-red-700 bg-red-50/80 p-3 rounded border border-red-100 flex items-start space-x-2 animate-in fade-in duration-300">
                  <div className="font-semibold">✗</div>
                  <div>
                    <p className="font-bold">Not Serviceable</p>
                    <p className="text-[11px] text-red-800 mt-0.5">We do not ship to this pincode via Delhivery.</p>
                  </div>
                </div>
              )}

              {pinStatus === 'error' && (
                <p className="text-xs text-amber-600 mt-2">Could not verify pincode. Please try again later.</p>
              )}
            </div>

            {/* TRUST BADGES SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-8 mt-6">
              <div className="flex items-center space-x-3">
                <ShieldCheck size={18} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-900 font-semibold tracking-widest uppercase">100% Genuine</p>
                  <p className="text-[8px] text-neutral-400 font-medium tracking-wider uppercase mt-0.5">Brand Direct</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Truck size={18} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-900 font-semibold tracking-widest uppercase">Free Shipping</p>
                  <p className="text-[8px] text-neutral-400 font-medium tracking-wider uppercase mt-0.5">Orders &gt; ₹{cmsLayout?.free_shipping_limit || '999'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw size={18} className="text-neutral-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-900 font-semibold tracking-widest uppercase">Easy Returns</p>
                  <p className="text-[8px] text-neutral-400 font-medium tracking-wider uppercase mt-0.5">7-Day Return Policy</p>
                </div>
              </div>
            </div>

            {/* COLLAPSIBLE DETAILS Accordion */}
            {product.full_description && (
              <div className="border-t border-neutral-100 pt-6 mt-6">
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-neutral-50/30 hover:bg-neutral-50/80 transition-colors select-none text-left"
                  >
                    <span className="text-[10px] font-black tracking-[0.2em] text-neutral-900 uppercase">
                      Creation Narrative (Click to view details)
                    </span>
                    {isDescriptionExpanded ? (
                      <ChevronUp size={16} className="text-neutral-900" />
                    ) : (
                      <ChevronDown size={16} className="text-neutral-400" />
                    )}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isDescriptionExpanded ? 'max-h-[1000px] opacity-100 border-t border-neutral-100 bg-white' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-4 text-neutral-600 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                      {product.full_description}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Sensory Profile & Specifications Grid */}
        <section className="mb-24 bg-neutral-50/50 border border-neutral-100 p-8 rounded-lg shadow-2xs">
          <span className="text-[9px] font-semibold tracking-[0.3em] text-neutral-400 uppercase mb-2 block">Specifications</span>
          <h2 className="text-2xl font-serif italic text-black mb-8">Sensory Profile & Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 border border-neutral-100 rounded shadow-3xs">
              <div className="flex items-center space-x-3 mb-3 text-neutral-400">
                <Droplet size={18} />
                <span className="text-[9px] font-semibold tracking-widest uppercase">Olfactory Family</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">{olfactoryFamily}</p>
            </div>
            
            <div className="bg-white p-5 border border-neutral-100 rounded shadow-3xs">
              <div className="flex items-center space-x-3 mb-3 text-neutral-400">
                <Wind size={18} />
                <span className="text-[9px] font-semibold tracking-widest uppercase">Sillage Projection</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">{sillageText}</p>
            </div>
            
            <div className="bg-white p-5 border border-neutral-100 rounded shadow-3xs">
              <div className="flex items-center space-x-3 mb-3 text-neutral-400">
                <User size={18} />
                <span className="text-[9px] font-semibold tracking-widest uppercase">Fragrance Gender</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">{targetGender}</p>
            </div>
          </div>
        </section>

        {/* Olfactory Journey Section (Horizontal) */}
        <section className="mb-24">
          <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase mb-2 block">Composition</span>
          <h2 className="text-2xl font-serif italic text-black mb-8 border-b border-neutral-100 pb-3">Olfactory Journey</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="flex flex-col items-start bg-neutral-50/50 p-6 border border-neutral-100 rounded-lg hover:border-black/10 transition-colors duration-300">
              <div className="bg-neutral-100 text-neutral-900 p-2.5 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <Flame size={18} />
              </div>
              <h4 className="text-[10px] font-black tracking-widest uppercase text-neutral-400 mb-2">Top Notes (Opening)</h4>
              <p className="text-sm font-bold text-neutral-800 leading-relaxed mb-1">{topNotes}</p>
              <p className="text-[9px] text-neutral-400 font-medium tracking-wide">First 15-30 minutes of initial impression.</p>
            </div>

            <div className="flex flex-col items-start bg-neutral-50/50 p-6 border border-neutral-100 rounded-lg hover:border-black/10 transition-colors duration-300">
              <div className="bg-neutral-100 text-neutral-900 p-2.5 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <Heart size={18} />
              </div>
              <h4 className="text-[10px] font-black tracking-widest uppercase text-neutral-400 mb-2">Heart Notes (Core Profile)</h4>
              <p className="text-sm font-bold text-neutral-800 leading-relaxed mb-1">{heartNotes}</p>
              <p className="text-[9px] text-neutral-400 font-medium tracking-wide">Main olfactory signature lasting 2-4 hours.</p>
            </div>

            <div className="flex flex-col items-start bg-neutral-50/50 p-6 border border-neutral-100 rounded-lg hover:border-black/10 transition-colors duration-300">
              <div className="bg-neutral-100 text-neutral-900 p-2.5 rounded-full flex items-center justify-center mb-4 flex-shrink-0">
                <Sparkles size={18} />
              </div>
              <h4 className="text-[10px] font-black tracking-widest uppercase text-neutral-400 mb-2">Base Notes (Dry Down)</h4>
              <p className="text-sm font-bold text-neutral-800 leading-relaxed mb-1">{baseNotes}</p>
              <p className="text-[9px] text-neutral-400 font-medium tracking-wide">Deep, rich foundational notes lasting 8+ hours.</p>
            </div>

          </div>
        </section>

        {/* Visual Gallery Grid Section */}
        {product?.gallery_images?.length > 0 && (
          <section className="bg-white py-16 md:py-24 border-t border-neutral-100 mt-16 w-full">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center mb-12">
              <span className="text-[10px] font-black tracking-[0.35em] text-neutral-400 uppercase mb-3 block">Olfactory Vignettes</span>
              <h2 className="text-3xl md:text-5xl font-serif text-black uppercase tracking-widest font-light">The Visual Gallery</h2>
              <div className="w-12 h-[1px] bg-neutral-300 mx-auto mt-5" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {product.gallery_images.map((item: any, idx: number) => {
                  const imageUrl = getMediaUrl(item.image);
                  const itemLink = item.link || '';
                  const isExternal = itemLink.startsWith('http') || itemLink.startsWith('//');
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setActiveLightboxIndex(idx)}
                      className="group relative aspect-square overflow-hidden bg-neutral-950 border border-neutral-100/60 hover:shadow-2xl transition-all duration-700 cursor-pointer rounded-md shadow-xs"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Gallery Image ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 group-hover:opacity-85"
                        onError={(e: any) => { e.target.src = '/placeholder-perfume.png' }}
                      />
                      
                      {/* Luxury frame border overlay on hover */}
                      <div className="absolute inset-3 border border-amber-500/0 group-hover:border-amber-500/20 transition-all duration-700 pointer-events-none" />

                      {/* Glassmorphic Dark Overlay with explicit Enlarge and Shop buttons */}
                      <div className="absolute inset-0 bg-neutral-950/0 group-hover:bg-neutral-950/40 transition-all duration-500 flex flex-col items-center justify-center p-4">
                        <div className="flex items-center space-x-3 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 transform translate-y-3 group-hover:translate-y-0">
                          {/* Full Screen View Icon Button */}
                          <div 
                            className="bg-black/80 hover:bg-white hover:text-black border border-white/20 p-3 rounded-full text-white transition-all duration-300 shadow-md hover:scale-110 flex items-center justify-center"
                            title="Fullscreen View"
                          >
                            <Maximize2 size={16} />
                          </div>

                          {/* Redirect Shop Link Icon Button */}
                          {itemLink && (
                            <div onClick={(e) => e.stopPropagation()} className="flex">
                              {isExternal ? (
                                <a 
                                  href={itemLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="bg-amber-500 text-black hover:bg-white border border-amber-400 p-3 rounded-full transition-all duration-300 shadow-md hover:scale-110 flex items-center justify-center"
                                  title="Shop the Look"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              ) : (
                                <Link 
                                  href={itemLink} 
                                  className="bg-amber-500 text-black hover:bg-white border border-amber-400 p-3 rounded-full transition-all duration-300 shadow-md hover:scale-110 flex items-center justify-center"
                                  title="Shop the Look"
                                >
                                  <ExternalLink size={16} />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <span className="text-white text-[8px] font-black tracking-[0.25em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 mt-3 block">
                          {itemLink ? 'Discover & Shop' : 'View Fullscreen'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Fullscreen Lightbox Modal */}
        {activeLightboxIndex !== null && product?.gallery_images?.[activeLightboxIndex] && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-500"
            onClick={() => setActiveLightboxIndex(null)}
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveLightboxIndex(null)} 
              className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-colors duration-300 p-2 z-55"
              aria-label="Close Lightbox"
            >
              <X size={28} />
            </button>

            {/* Left Control Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) => 
                  prev !== null ? (prev - 1 + product.gallery_images.length) % product.gallery_images.length : null
                );
              }}
              className="absolute left-4 md:left-8 text-neutral-400 hover:text-white transition-colors duration-300 p-3 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-full z-55"
              aria-label="Previous Image"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Main Lightbox Content Container */}
            <div 
              className="max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={getMediaUrl(product.gallery_images[activeLightboxIndex].image)}
                alt={`Gallery View ${activeLightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain border border-neutral-800 rounded shadow-2xl transition-all duration-500"
                onError={(e: any) => { e.target.src = '/placeholder-perfume.png' }}
              />
              
              {/* Footer details bar */}
              <div className="w-full mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <span className="text-[10px] font-black font-montserrat tracking-[0.25em] text-neutral-400 uppercase">
                  Image {String(activeLightboxIndex + 1).padStart(2, '0')} / {String(product.gallery_images.length).padStart(2, '0')}
                </span>

                {product.gallery_images[activeLightboxIndex].link && (
                  <div>
                    {product.gallery_images[activeLightboxIndex].link.startsWith('http') || product.gallery_images[activeLightboxIndex].link.startsWith('//') ? (
                      <a 
                        href={product.gallery_images[activeLightboxIndex].link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black transition-all duration-300 px-6 py-2.5 rounded text-[9px] font-bold tracking-[0.2em] uppercase"
                      >
                        <span>Shop the Look</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <Link 
                        href={product.gallery_images[activeLightboxIndex].link}
                        className="inline-flex items-center space-x-2 border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black transition-all duration-300 px-6 py-2.5 rounded text-[9px] font-bold tracking-[0.2em] uppercase"
                      >
                        <span>Shop the Look</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Control Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) => 
                  prev !== null ? (prev + 1) % product.gallery_images.length : null
                );
              }}
              className="absolute right-4 md:right-8 text-neutral-400 hover:text-white transition-colors duration-300 p-3 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-full z-55"
              aria-label="Next Image"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}

        {/* DYNAMIC RECOMMENDATIONS SECTION 0: Suggest Same Category Items */}
        {sameCategoryProducts.length > 0 && (
          <section className="mb-20 border-t border-neutral-100 pt-16">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left gap-4">
              <div>
                <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">Curation Suggestions</span>
                <h2 className="text-3xl font-serif italic text-black">Suggest Same Category Items</h2>
              </div>
              <Link href={`/shop?category=${product.category_id}`} className="text-[10px] font-black tracking-widest uppercase hover:underline flex items-center">
                Explore All Category Items &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {sameCategoryProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="h-full">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DYNAMIC RECOMMENDATIONS SECTION 1: Suggest Same Brand Items */}
        {sameBrandProducts.length > 0 && (
          <section className="mb-20 border-t border-neutral-100 pt-16">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left gap-4">
              <div>
                <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">Brand Legacy</span>
                <h2 className="text-3xl font-serif italic text-black">Suggest Same Brand Items</h2>
              </div>
              <Link href={`/shop?brand=${product.brand_id}`} className="text-[10px] font-black tracking-widest uppercase hover:underline flex items-center">
                Explore All Brand Items &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {sameBrandProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="h-full">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DYNAMIC RECOMMENDATIONS SECTION 2: Same Price Level Items */}
        {samePriceProducts.length > 0 && (
          <section className="mb-20 border-t border-neutral-100 pt-16">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left gap-4">
              <div>
                <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">Affordable Luxuries</span>
                <h2 className="text-3xl font-serif italic text-black">Same Price Level Items</h2>
              </div>
              <Link href={`/shop`} className="text-[10px] font-black tracking-widest uppercase hover:underline flex items-center">
                Explore All Curations &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {samePriceProducts.map((p) => (
                <div key={p.id} className="h-full">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DYNAMIC RECOMMENDATIONS SECTION 3: Frequently Bought Together */}
        {bundleProducts.length > 0 && (
          <section className="mb-20 border-t border-neutral-100 pt-16">
            <div className="mb-10">
              <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase block mb-1">Frequently Bought Together</span>
              <h2 className="text-3xl font-serif italic text-black">Complete the Olfactory Set</h2>
            </div>

            <div className="bg-neutral-50/50 border border-neutral-100 p-6 md:p-8 rounded-lg flex flex-col xl:flex-row gap-8 items-stretch justify-between shadow-2xs">
              
              {/* Left Side: Product Bundle Row */}
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 flex-1 w-full justify-start">
                
                {/* Active Product */}
                <div className="flex items-center space-x-4 bg-white p-4 border border-neutral-100 rounded shadow-3xs w-full md:w-auto md:min-w-[240px]">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="w-4 h-4 accent-black rounded cursor-not-allowed bg-neutral-200 border-neutral-300"
                  />
                  <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 flex-shrink-0 flex items-center justify-center p-1 rounded">
                    <img
                      src={getMediaUrl(product.images?.[0]) || '/placeholder-perfume.png'}
                      alt={product.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black tracking-[0.2em] text-neutral-400 uppercase mb-0.5">{product.brand_name || "Brand Legacy"}</p>
                    <h4 className="text-xs font-bold text-black truncate">{product.name}</h4>
                    <p className="text-xs font-black text-black mt-1">₹{(selectedVariant?.selling_price || 0).toLocaleString('en-IN')}</p>
                    <span className="inline-block bg-neutral-100 text-neutral-600 text-[8px] font-black tracking-widest px-1.5 py-0.5 uppercase mt-1 rounded-sm">
                      {selectedVariant?.size_ml || 50}ML
                    </span>
                  </div>
                </div>

                {/* Bundle Item 1 */}
                {bundleProducts[0] && (
                  <>
                    <span className="text-neutral-400 font-bold text-lg select-none">+</span>
                    <div className="flex items-center space-x-4 bg-white p-4 border border-neutral-100 rounded shadow-3xs w-full md:w-auto md:min-w-[240px]">
                      <input
                        type="checkbox"
                        checked={checkedBundleIds.includes(bundleProducts[0].id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckedBundleIds([...checkedBundleIds, bundleProducts[0].id]);
                          } else {
                            setCheckedBundleIds(checkedBundleIds.filter(id => id !== bundleProducts[0].id));
                          }
                        }}
                        className="w-4 h-4 accent-black rounded cursor-pointer"
                        id={`bundle-check-${bundleProducts[0].id}`}
                      />
                      <label htmlFor={`bundle-check-${bundleProducts[0].id}`} className="flex items-center space-x-4 cursor-pointer flex-1 min-w-0">
                        <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 flex-shrink-0 flex items-center justify-center p-1 rounded">
                          <img
                            src={getMediaUrl(bundleProducts[0].images?.[0]) || '/placeholder-perfume.png'}
                            alt={bundleProducts[0].name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black tracking-[0.2em] text-neutral-400 uppercase mb-0.5">{bundleProducts[0].brand_name || "Brand Legacy"}</p>
                          <h4 className="text-xs font-bold text-black truncate">{bundleProducts[0].name}</h4>
                          <p className="text-xs font-black text-black mt-1">₹{(bundleProducts[0].variants?.[0]?.selling_price || 0).toLocaleString('en-IN')}</p>
                          <span className="inline-block bg-neutral-100 text-neutral-600 text-[8px] font-black tracking-widest px-1.5 py-0.5 uppercase mt-1 rounded-sm">
                            {bundleProducts[0].variants?.[0]?.size_ml || 50}ML
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}

                {/* Bundle Item 2 */}
                {bundleProducts[1] && (
                  <>
                    <span className="text-neutral-400 font-bold text-lg select-none">+</span>
                    <div className="flex items-center space-x-4 bg-white p-4 border border-neutral-100 rounded shadow-3xs w-full md:w-auto md:min-w-[240px]">
                      <input
                        type="checkbox"
                        checked={checkedBundleIds.includes(bundleProducts[1].id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCheckedBundleIds([...checkedBundleIds, bundleProducts[1].id]);
                          } else {
                            setCheckedBundleIds(checkedBundleIds.filter(id => id !== bundleProducts[1].id));
                          }
                        }}
                        className="w-4 h-4 accent-black rounded cursor-pointer"
                        id={`bundle-check-${bundleProducts[1].id}`}
                      />
                      <label htmlFor={`bundle-check-${bundleProducts[1].id}`} className="flex items-center space-x-4 cursor-pointer flex-1 min-w-0">
                        <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 flex-shrink-0 flex items-center justify-center p-1 rounded">
                          <img
                            src={getMediaUrl(bundleProducts[1].images?.[0]) || '/placeholder-perfume.png'}
                            alt={bundleProducts[1].name}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black tracking-[0.2em] text-neutral-400 uppercase mb-0.5">{bundleProducts[1].brand_name || "Brand Legacy"}</p>
                          <h4 className="text-xs font-bold text-black truncate">{bundleProducts[1].name}</h4>
                          <p className="text-xs font-black text-black mt-1">₹{(bundleProducts[1].variants?.[0]?.selling_price || 0).toLocaleString('en-IN')}</p>
                          <span className="inline-block bg-neutral-100 text-neutral-600 text-[8px] font-black tracking-widest px-1.5 py-0.5 uppercase mt-1 rounded-sm">
                            {bundleProducts[1].variants?.[0]?.size_ml || 50}ML
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}

              </div>

              {/* Right Side: Total Summary & Checkout Button */}
              <div className="w-full xl:w-[320px] bg-white border border-neutral-100 p-6 rounded shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-3">Selected Bundle Items</h4>
                  <ul className="space-y-2 mb-6">
                    <li className="text-xs flex justify-between font-bold text-black">
                      <span className="truncate max-w-[200px]">{product.name} (Active)</span>
                      <span>₹{(selectedVariant?.selling_price || 0).toLocaleString('en-IN')}</span>
                    </li>
                    {bundleProducts.map((p) => {
                      if (!checkedBundleIds.includes(p.id)) return null;
                      return (
                        <li key={p.id} className="text-xs flex justify-between text-neutral-600 font-semibold">
                          <span className="truncate max-w-[200px]">{p.name}</span>
                          <span>₹{(p.variants?.[0]?.selling_price || 0).toLocaleString('en-IN')}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-t border-neutral-100 pt-4 mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Subtotal:</span>
                      <span className={`text-sm text-neutral-500 font-bold ${checkedBundleIds.length > 1 ? 'line-through' : ''}`}>
                        ₹{[product, ...bundleProducts].filter(p => checkedBundleIds.includes(p.id)).reduce((sum, p) => sum + (p.id === product.id ? (selectedVariant?.selling_price || 0) : (p.variants?.[0]?.selling_price || 0)), 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {checkedBundleIds.length > 1 && (
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase block mb-1">
                            10% Bundle Discount Applied
                          </span>
                          <span className="text-xs text-black font-black uppercase tracking-wider">Bundle Total:</span>
                        </div>
                        <span className="text-xl font-black text-black">
                          ₹{Math.round([product, ...bundleProducts].filter(p => checkedBundleIds.includes(p.id)).reduce((sum, p) => sum + (p.id === product.id ? (selectedVariant?.selling_price || 0) : (p.variants?.[0]?.selling_price || 0)), 0) * 0.9).toLocaleString('en-IN')}/-
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAddBundleToBag}
                    className="w-full bg-black text-white text-[10px] font-black tracking-[0.25em] hover:bg-neutral-900 transition-colors flex items-center justify-center space-x-2 py-4 rounded shadow-sm hover:shadow-md duration-300"
                  >
                    <ShoppingBag size={14} />
                    <span>ADD BUNDLE TO BAG</span>
                  </button>

                  {bundleAdded && (
                    <div className="text-[9px] font-black tracking-widest text-center text-green-600 bg-green-50 border border-green-100 py-2 rounded uppercase animate-pulse">
                      Items successfully added to bag!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}


      </div>
    </div>
  );
}
