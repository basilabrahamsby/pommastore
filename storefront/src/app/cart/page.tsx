'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const [cmsLayout, setCmsLayout] = React.useState<any>(null);

  React.useEffect(() => {
    import('@/services/api').then(m => m.default.get('/settings/storefront_layout'))
      .then(res => setCmsLayout(res.data))
      .catch(err => console.warn('Cart failed to fetch layout', err));
  }, []);

  const shippingLimit = cmsLayout?.free_shipping_limit || 999;
  const isFreeShipping = totalPrice() >= shippingLimit;
  const amountToFreeShipping = shippingLimit - totalPrice();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mt-20 text-center">
        <h1 className="text-3xl font-serif mb-6">Your bag is empty</h1>
        <p className="text-gray-500 mb-8 text-sm">Looks like you haven't added any fragrances yet.</p>
        <Link href="/shop" className="bg-black text-white px-8 py-4 text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20">
      <div className="flex items-center space-x-2 mb-12">
        <Link href="/shop" className="text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-serif text-gray-900">Your Shopping Bag</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left: Items */}
        <div className="w-full lg:w-2/3">
          <div className="border-t border-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row py-6 sm:py-8 border-b border-gray-100 gap-4 sm:gap-8 items-start sm:items-center">
                <div className="h-28 w-20 sm:h-32 sm:w-24 bg-gray-50 flex-shrink-0 flex items-center justify-center p-3 sm:p-4 self-center sm:self-auto">
                  <img src={item.image} alt={item.name} className="max-h-full mix-blend-multiply" />
                </div>
                <div className="flex-grow w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{item.sizeMl}ML</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-black transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-4 sm:mt-6">
                    <div className="flex items-center border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-50 text-gray-500"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-4 text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-50 text-gray-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-gray-50 p-8 sticky top-32">
            <h2 className="text-lg font-serif mb-8 border-b border-gray-200 pb-4">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">₹{totalPrice().toLocaleString('en-IN')}</span>
              </div>
              <div className="py-4 border-y border-gray-100 my-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span>Shipping</span>
                  <span className={isFreeShipping ? "text-green-600" : "text-gray-400"}>
                    {isFreeShipping ? 'ELIGIBLE FOR FREE SHIPPING' : `₹${150}`}
                  </span>
                </div>
                {!isFreeShipping && (
                  <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-black transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalPrice() / shippingLimit) * 100)}%` }}
                    />
                  </div>
                )}
                {!isFreeShipping && (
                  <p className="text-[9px] text-gray-500 mt-2 font-bold tracking-tight uppercase">
                    Add ₹{amountToFreeShipping.toLocaleString('en-IN')} more to unlock <span className="text-black">Free Standard Delivery</span>
                  </p>
                )}
              </div>
              {useCartStore.getState().totalLoyaltyPoints() > 0 && (
                <div className="flex justify-between text-sm bg-yellow-50 p-2 border border-yellow-100">
                  <span className="text-yellow-800 font-bold uppercase text-[9px] tracking-widest">Points to be earned</span>
                  <span className="font-black text-yellow-800 text-xs">+{useCartStore.getState().totalLoyaltyPoints()} PTS</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-lg">₹{(totalPrice() + (isFreeShipping ? 0 : 150)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <Link 
              href="/checkout"
              className="w-full bg-black text-white py-5 text-xs font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              PROCEED TO CHECKOUT
            </Link>
            <p className="text-[10px] text-gray-400 text-center mt-4 tracking-wider uppercase">
              Secure checkout guaranteed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
