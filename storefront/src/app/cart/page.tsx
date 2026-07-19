'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore, syncCartItemPrices } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Shield, Truck, Sparkles, ChevronRight } from 'lucide-react';
import api from '@/services/api';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const { customer } = useAuthStore();
  const [cmsLayout, setCmsLayout] = React.useState<any>(null);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [shippingFee, setShippingFee] = React.useState(17);

  React.useEffect(() => {
    syncCartItemPrices();
    api.get('/settings/storefront_layout')
      .then(res => setCmsLayout(res.data))
      .catch(err => console.warn('Cart failed to fetch layout', err));
  }, []);

  React.useEffect(() => {
    const fetchDefaultAddressShipping = async () => {
      if (!customer) {
        setShippingFee(17);
        return;
      }
      try {
        const res = await api.get('/account/addresses');
        const addresses = res.data || [];
        const defaultAddr = addresses.find((a: any) => a.is_default) || addresses[0];
        if (defaultAddr && defaultAddr.pincode) {
          const verifyRes = await api.get(`/orders/shipping/verify-pincode?pincode=${defaultAddr.pincode}`);
          if (verifyRes.data && verifyRes.data.serviceable) {
            setShippingFee(verifyRes.data.shipping_fee || 17);
          } else {
            setShippingFee(17);
          }
        } else {
          setShippingFee(17);
        }
      } catch (err) {
        console.warn('Failed to verify cart shipping fee', err);
        setShippingFee(17);
      }
    };
    fetchDefaultAddressShipping();
  }, [customer]);

  const shippingLimit = cmsLayout?.free_shipping_limit || 999;
  const isFreeShipping = totalPrice() >= shippingLimit;
  const amountToFreeShipping = shippingLimit - totalPrice();
  const shippingProgressPct = Math.min(100, (totalPrice() / shippingLimit) * 100);
  const totalLoyaltyPoints = useCartStore.getState().totalLoyaltyPoints?.() || 0;

  const handleRemove = (id: string) => {
    setRemoving(id);
    setTimeout(() => {
      removeItem(id);
      setRemoving(null);
    }, 350);
  };

  // ─── Empty State ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 py-32 mt-10">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 border border-neutral-200 shadow-sm">
            <ShoppingBag size={36} className="text-neutral-300" strokeWidth={1} />
          </div>
          <span className="text-[9px] font-bold tracking-[0.35em] text-neutral-400 uppercase mb-3">Shopping Bag</span>
          <h1 className="text-2xl md:text-3xl font-serif text-black mb-4 leading-tight">Your bag is empty</h1>
          <p className="text-sm text-neutral-500 mb-10 leading-relaxed font-light">
            Looks like you haven't added any fragrances yet. Explore our curated collection.
          </p>
          <Link
            href="/shop"
            className="bg-black text-white px-10 py-4 text-[10px] font-bold tracking-[0.3em] hover:bg-neutral-800 transition-colors uppercase flex items-center gap-3 rounded-sm"
          >
            Explore Collection
            <ChevronRight size={14} />
          </Link>
          <Link href="/" className="mt-6 text-[10px] text-neutral-400 hover:text-black transition-colors tracking-widest uppercase">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── Cart Page ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 mt-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10 md:mb-14">
          <Link
            href="/shop"
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-white hover:border-black hover:bg-black hover:text-white transition-all duration-300 rounded-sm shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="text-[9px] font-bold tracking-[0.3em] text-neutral-400 uppercase block mb-0.5">Review Your Order</span>
            <h1 className="text-2xl md:text-3xl font-serif text-black leading-none">
              Shopping Bag
              <span className="ml-3 text-[11px] font-sans font-bold tracking-widest text-neutral-400 align-middle">
                ({items.length} {items.length === 1 ? 'item' : 'items'})
              </span>
            </h1>
          </div>
        </div>

        {/* Mobile: Free Shipping Banner */}
        {!isFreeShipping && (
          <div className="lg:hidden mb-6 bg-white border border-neutral-200 p-4 rounded-sm shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck size={13} className="text-neutral-500" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-600">Free Shipping Progress</span>
              </div>
              <span className="text-[10px] font-black text-black">AED {amountToFreeShipping.toLocaleString('en-IN')} away</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-700 rounded-full"
                style={{ width: `${shippingProgressPct}%` }}
              />
            </div>
          </div>
        )}
        {isFreeShipping && (
          <div className="lg:hidden mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-sm flex items-center gap-3">
            <Truck size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-700">You've unlocked Free Standard Delivery! 🎉</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">

          {/* ── Left: Cart Items ───────────────────────────────────────────── */}
          <div className="w-full lg:w-[60%] xl:w-[62%]">
            <div className="bg-white border border-neutral-200 rounded-sm shadow-sm divide-y divide-neutral-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 md:p-6 flex gap-4 md:gap-5 transition-all duration-350 ${
                    removing === item.id ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'
                  }`}
                >
                  {/* Product Image */}
                  <Link
                    href={`/product/${item.slug || (item as any).productId || ''}`}
                    className="relative flex-shrink-0 w-24 h-28 md:w-28 md:h-32 bg-neutral-50 border border-neutral-100 overflow-hidden rounded-sm group"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain mix-blend-multiply p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Item Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/product/${item.slug || (item as any)?.productId || ''}`}>
                          <h3 className="text-[11px] md:text-xs font-black text-black uppercase tracking-widest leading-tight hover:text-neutral-500 transition-colors truncate">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-[9px] md:text-[10px] text-neutral-400 mt-1 uppercase tracking-[0.2em] font-medium">
                          {(item as any).variantName || `${item.sizeMl}ml`}
                        </p>
                        {(item.loyaltyPoints ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[8px] font-black tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                            <Sparkles size={7} />
                            +{(item.loyaltyPoints ?? 0) * item.quantity} pts
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="flex-shrink-0 p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Quantity + Price Row */}
                    <div className="flex items-center justify-between mt-4 md:mt-5">
                      {/* Qty Stepper */}
                      <div className="flex items-center border border-neutral-200 rounded-sm overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-9 h-8 flex items-center justify-center text-[11px] font-black text-black border-x border-neutral-200 bg-neutral-50">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm md:text-base font-black text-black">
                          AED {(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[9px] text-neutral-400 font-medium">
                            AED {item.price.toLocaleString('en-IN')} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="mt-5 flex items-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-400 hover:text-black transition-colors uppercase"
              >
                <ArrowLeft size={13} />
                Continue Shopping
              </Link>
            </div>

            {/* Trust Badges — Desktop */}
            <div className="hidden lg:grid grid-cols-2 gap-3 mt-8">
              {[
                { icon: Shield, label: '100% Authentic', sub: 'Genuine products only' },
                { icon: Truck, label: 'Fast Delivery', sub: '2–5 working days' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-sm border border-neutral-200 shadow-sm">
                  <b.icon size={18} className="text-neutral-400 flex-shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-[9px] font-black tracking-widest uppercase text-black">{b.label}</p>
                    <p className="text-[9px] text-neutral-500 font-medium mt-0.5">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Order Summary ──────────────────────────────────────── */}
          <div className="w-full lg:w-[40%] xl:w-[38%]">
            <div className="bg-white border border-neutral-200 rounded-sm shadow-sm sticky top-28 overflow-hidden">

              {/* Summary Header */}
              <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50">
                <h2 className="text-[10px] font-black tracking-[0.35em] uppercase text-neutral-600">
                  Order Summary
                </h2>
              </div>

              <div className="px-6 py-6 space-y-5">

                {/* Line Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="min-w-0 mr-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black truncate">{item.name}</p>
                        <p className="text-[9px] text-neutral-400 font-medium">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-[11px] font-black text-black flex-shrink-0">
                        AED {(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-100" />

                {/* Subtotal Row */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">Subtotal</span>
                  <span className="text-[12px] font-black text-black">AED {totalPrice().toLocaleString('en-IN')}</span>
                </div>

                {/* Shipping Progress */}
                <div className="bg-neutral-50 border border-neutral-100 rounded-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Truck size={11} className={isFreeShipping ? 'text-emerald-600' : 'text-neutral-400'} />
                      <span className="text-[9px] font-bold tracking-widest uppercase text-neutral-500">Logistics (Base Fee)</span>
                    </div>
                    <span className={`text-[10px] font-black ${isFreeShipping ? 'text-emerald-600' : 'text-black'}`}>
                      {isFreeShipping ? 'FREE' : `AED ${shippingFee}`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isFreeShipping ? 'bg-emerald-500' : 'bg-black'}`}
                      style={{ width: `${shippingProgressPct}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-neutral-400 font-medium">
                    {isFreeShipping
                      ? '🎉 You qualify for free delivery!'
                      : `Add AED ${amountToFreeShipping.toLocaleString('en-IN')} more for free delivery`}
                  </p>
                </div>

                {/* UAE VAT 5% Tax Breakdown (per-item tax_type aware) */}
                {(() => {
                  const vatRate = 0.05;
                  // For each item:
                  // Exclusive: taxable = price, vat = price * 0.05
                  // Inclusive: taxable = price / 1.05, vat = price - (price / 1.05)
                  // Zero-Rated: vat = 0
                  let totalTaxable = 0;
                  let totalVat = 0;
                  items.forEach(item => {
                    const lineTotal = item.price * item.quantity;
                    const tt = (item.taxType || 'Exclusive').toLowerCase();
                    if (tt === 'inclusive') {
                      const taxable = lineTotal / (1 + vatRate);
                      totalTaxable += taxable;
                      totalVat += lineTotal - taxable;
                    } else if (tt === 'zero-rated') {
                      totalTaxable += lineTotal;
                      totalVat += 0;
                    } else {
                      // Exclusive (default)
                      totalTaxable += lineTotal;
                      totalVat += lineTotal * vatRate;
                    }
                  });
                  return (
                    <div className="bg-neutral-50 border border-neutral-200/80 rounded-sm p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-500 font-medium uppercase tracking-wider">Taxable Amount</span>
                        <span className="text-neutral-800 font-bold">AED {totalTaxable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-500 font-medium uppercase tracking-wider">UAE VAT (5.0%)</span>
                        <span className="text-neutral-900 font-black">AED {totalVat.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Loyalty Points */}
                {totalLoyaltyPoints > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-amber-500" />
                      <span className="text-[9px] font-black tracking-widest uppercase text-amber-700">Points to earn</span>
                    </div>
                    <span className="text-[11px] font-black text-amber-700">+{totalLoyaltyPoints} PTS</span>
                  </div>
                )}

                <div className="border-t border-neutral-100" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-black tracking-widest uppercase text-black">Total</span>
                  <span className="text-xl font-black text-black">
                    AED {(() => {
                      const vatRate = 0.05;
                      let vatSum = 0;
                      items.forEach(item => {
                        const lineTotal = item.price * item.quantity;
                        const tt = (item.taxType || 'Exclusive').toLowerCase();
                        if (tt === 'exclusive') vatSum += lineTotal * vatRate;
                        // inclusive: vat already inside price, zero-rated: no vat
                      });
                      return (totalPrice() + vatSum + (isFreeShipping ? 0 : shippingFee)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href="/checkout"
                  className="w-full bg-black text-white py-4 md:py-5 flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 hover:bg-neutral-800 rounded-sm"
                >
                  <Shield size={13} />
                  Proceed to Checkout
                </Link>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 text-[9px] text-neutral-400 font-bold tracking-widest uppercase">
                  <Shield size={10} />
                  Secure & Encrypted Checkout
                </div>

                {/* Payment methods */}
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  {['Visa', 'Mastercard', 'Stripe'].map(m => (
                    <span key={m} className="text-[8px] font-black tracking-widest text-neutral-400 border border-neutral-200 px-2.5 py-1 rounded-full uppercase bg-neutral-50">
                      {m}
                    </span>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Mobile Trust Badges */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mt-8">
          {[
            { icon: Shield, label: 'Authentic' },
            { icon: Truck, label: 'Fast Delivery' },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 bg-white rounded-sm border border-neutral-200 shadow-sm text-center">
              <b.icon size={16} className="text-neutral-400" strokeWidth={1.5} />
              <p className="text-[8px] font-black tracking-widest uppercase text-black">{b.label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
