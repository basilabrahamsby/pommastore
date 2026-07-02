'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  ArrowLeft, 
  Lock, 
  MapPin, 
  Plus, 
  Calendar, 
  Smartphone,
  ShieldAlert
} from 'lucide-react';

export default function Checkout() {
  const { items, clearCart, totalPrice } = useCartStore();
  const { customer, token } = useAuthStore();
  const router = useRouter();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [cmsLayout, setCmsLayout] = useState<any>(null);
  const [contactForm, setContactForm] = useState({
    email: '',
    phone: '',
    full_name: ''
  });
  const [updatingContact, setUpdatingContact] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  // Automatically evaluate and apply best eligible active offer
  useEffect(() => {
    const autoApplyOffers = async () => {
      try {
        const res = await api.get('/storefront/offers');
        const offers = res.data || [];
        
        let bestOffer: any = null;
        let bestDiscount = 0;
        
        for (const offer of offers) {
          const status = offer.status || 'Active';
          if (status.toLowerCase() !== 'active') continue;
          
          let discount = 0;
          const combinedSkus = (offer.target_skus || []).concat(offer.buy_skus || []).concat(offer.get_skus || []);
          
          if (offer.target_scope === 'skus' || offer.target_scope === 'items') {
            items.forEach(item => {
              if (combinedSkus.includes(item.variantName)) {
                if (offer.discount_percentage) {
                  discount += (item.price * item.quantity) * (Number(offer.discount_percentage) / 100);
                } else if (offer.flat_discount_amount) {
                  discount += Number(offer.flat_discount_amount) * item.quantity;
                }
              }
            });
          } else {
            if (offer.discount_percentage) {
              discount = totalPrice() * (Number(offer.discount_percentage) / 100);
            } else if (offer.flat_discount_amount) {
              discount = Number(offer.flat_discount_amount);
            }
          }
          
          // Select the offer that yields the highest savings
          if (discount > bestDiscount) {
            bestDiscount = discount;
            bestOffer = offer;
          }
        }
        
        if (bestOffer && bestDiscount > 0) {
          setPromoDiscount(Math.round(bestDiscount));
          setAppliedPromo(bestOffer);
        } else {
          setPromoDiscount(0);
          setAppliedPromo(null);
        }
      } catch (err) {
        console.warn('Failed to auto-evaluate active campaigns', err);
      }
    };
    
    if (items.length > 0) {
      autoApplyOffers();
    }
  }, [items, totalPrice]);

  useEffect(() => {
    if (customer) {
      setContactForm({
        email: customer.email || '',
        phone: customer.phone || '',
        full_name: customer.full_name || ''
      });
    }
  }, [customer]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.phone) {
      alert('Email and mobile number are compulsory fields.');
      return;
    }
    setUpdatingContact(true);
    try {
      const res = await api.patch('/account/me', {
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        full_name: contactForm.full_name.trim()
      });
      useAuthStore.setState({ customer: res.data });
      alert('Contact details updated successfully!');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Failed to update contact details.');
    } finally {
      setUpdatingContact(false);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    // Fetch global layout for shipping limit
    api.get('/settings/storefront_layout')
      .then(res => setCmsLayout(res.data))
      .catch(err => console.warn('Checkout failed to fetch layout', err));
  }, []);

  const [addressForm, setAddressForm] = useState({
    label: 'Delivery Address',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    country: 'India'
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push('/login');
      return;
    }

    if (items.length === 0 && !orderSuccess) {
      router.push('/cart');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const res = await api.get('/account/addresses');
        setAddresses(res.data);
        // Select default address if available
        const defaultAddr = res.data.find((a: any) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (res.data.length > 0) {
          setSelectedAddressId(res.data[0].id);
        }
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error('Failed to fetch addresses', err);
        } else {
          useAuthStore.setState({ token: null, customer: null });
          router.push('/login?expired=true');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [token, items.length, router, orderSuccess, isHydrated]);

  useEffect(() => {
    // Load Razorpay Script for Demo
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);

    try {
      // Determine final delivery address metadata
      let shippingAddressData = {};
      if (selectedAddressId === 'new') {
        // Validate new address
        if (!addressForm.address_line1 || !addressForm.city || !addressForm.pincode) {
          alert('Please complete the new delivery address details.');
          setPlacingOrder(false);
          return;
        }
        shippingAddressData = { ...addressForm };
      } else {
        const matched = addresses.find((a) => a.id === selectedAddressId);
        shippingAddressData = matched ? {
          label: matched.label,
          address_line1: matched.address_line1,
          address_line2: matched.address_line2,
          city: matched.city,
          state: matched.state,
          pincode: matched.pincode,
          phone: matched.phone,
          country: matched.country
        } : {};
      }

      const orderItems = items.map(item => ({
        variant_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: 0.0
      }));

      const shippingLimit = cmsLayout?.free_shipping_limit || 999;
      const shippingFee = totalPrice() >= shippingLimit ? 0 : 150; 
      const pointsToRedeem = useLoyaltyPoints ? Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)) : 0;
      const finalAmount = Math.max(0, totalPrice() + shippingFee - pointsToRedeem - promoDiscount);

      // ================= RAZORPAY INTEGRATION =================
      if (paymentMethod === 'card' || paymentMethod === 'upi') {
        let rzpOrderData: any = null;
        try {
          const createRes = await api.post('/orders/razorpay/create', {
            payment_method: paymentMethod,
            shipping_address: shippingAddressData,
            billing_address: shippingAddressData,
            payment_status: 'pending',
            items: orderItems,
            loyalty_points_used: pointsToRedeem,
            shipping_amount: shippingFee,
            tax_amount: 0.0,
            discount_amount: promoDiscount,
            coupon_code: appliedPromo ? appliedPromo.code : null
          });
          rzpOrderData = createRes.data;
        } catch (err: any) {
          const detail = err.response?.data?.detail;
          setCheckoutError(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Failed to initialize payment.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPlacingOrder(false);
          return;
        }

        const options = {
          // Note: In production, this can also be loaded via settings from the backend
          key: 'rzp_test_demokey12345', 
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency,
          name: 'Kozmocart',
          description: 'Luxury Fragrance Curations',
          image: '/kozmocart/placeholder-perfume.png',
          order_id: rzpOrderData.razorpay_order_id,
          handler: async function (response: any) {
            try {
              // Wait 1.5 seconds for the webhook to execute and process the order payment
              await new Promise(resolve => setTimeout(resolve, 1500));
              const trackRes = await api.post('/orders/track', {
                order_number: rzpOrderData.order_number,
                contact: customer?.email || contactForm.email || 'client@kozmocart.com'
              });
              setOrderSuccess(trackRes.data);
              clearCart();
            } catch (err: any) {
              // Fallback to local success screen state if tracking is slow
              setOrderSuccess({
                order_number: rzpOrderData.order_number,
                total_amount: finalAmount,
                shipping_address: shippingAddressData
              });
              clearCart();
            } finally {
              setPlacingOrder(false);
            }
          },
          prefill: {
            name: customer?.full_name || 'Valued Client',
            email: customer?.email || 'client@kozmocart.com',
            contact: customer?.phone || '9999999999'
          },
          theme: {
            color: '#000000'
          },
          modal: {
            ondismiss: function () {
              setPlacingOrder(false);
            }
          }
        };

        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
          setCheckoutError('Payment Failed: ' + (response.error?.description || 'Oops! Something went wrong. Please check your credentials and try again.'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPlacingOrder(false);
        });
        rzp1.open();
        return; // Halt execution and wait for Razorpay handler
      }
      // ============================================================

      throw new Error('Selected payment method is not supported.');
      clearCart();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : (detail ? JSON.stringify(detail) : (err.message || 'Order placement failed. Please review stock and try again.'));
      setCheckoutError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPlacingOrder(false);
    }
  };

  if ((!isHydrated || loading) && !orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // DELIGHTFUL LUXURY ORDER SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-32 mt-20 text-center animate-in fade-in duration-700">
        <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-black text-white scale-up-animation">
          <CheckCircle2 size={40} strokeWidth={1.5} />
        </div>
        <p className="text-xs font-black tracking-[0.3em] text-neutral-400 uppercase mb-3">Thank you for your purchase</p>
        <h1 className="text-4xl md:text-5xl font-serif text-neutral-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8 leading-relaxed">
          Your signature fragrance curations are being prepared. We've sent order confirmations and real-time tracking updates to your inbox.
        </p>

        <div className="bg-neutral-50 p-8 border border-neutral-100 text-left mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs uppercase font-black tracking-widest">
            <div>
              <p className="text-neutral-400 mb-1">Order Reference</p>
              <p className="text-sm text-neutral-900 font-serif normal-case tracking-normal font-bold">{orderSuccess.order_number}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-1">Total Paid</p>
              <p className="text-sm text-neutral-900">₹{orderSuccess.total_amount?.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-neutral-400 mb-1">Delivery Destination</p>
              <p className="text-sm text-neutral-900 tracking-normal normal-case font-medium line-clamp-2 mt-0.5">
                {orderSuccess.shipping_address?.address_line1}, {orderSuccess.shipping_address?.city}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 mb-1">Estimated Dispatch</p>
              <p className="text-sm text-green-600 flex items-center mt-0.5">
                <Truck size={14} className="mr-1.5" /> Within 24 Hours
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/account"
            className="bg-black text-white px-8 py-5 text-xs font-black tracking-widest hover:bg-neutral-800 transition-all uppercase w-full sm:w-auto inline-block"
          >
            View in Dashboard
          </Link>
          <Link 
            href="/shop"
            className="border border-neutral-300 text-neutral-700 px-8 py-5 text-xs font-black tracking-widest hover:border-black transition-all uppercase w-full sm:w-auto inline-block"
          >
            Continue Curating
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20">
      
      {checkoutError && (
        <div className="mb-10 p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-rose-950/60 text-white animate-fadeIn shadow-2xl relative overflow-hidden rounded-sm">
          {/* Visual gradient light beam in backdrop */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] font-black tracking-[0.3em] text-rose-500 uppercase block mb-1">Fulfillment Alert</span>
                <p className="text-neutral-200 font-medium text-xs tracking-wide leading-relaxed">
                  {checkoutError}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setCheckoutError(null)} 
              className="px-4 py-2 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white text-[9px] font-black tracking-widest uppercase transition-all shrink-0 rounded-sm hover:bg-neutral-900"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 mb-12 border-b border-neutral-100 pb-6">
        <Link href="/cart" className="text-neutral-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-serif text-neutral-900 flex-1">Secure Checkout</h1>
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-neutral-400 font-bold tracking-widest uppercase">
          <Lock size={14} />
          <span>SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-16">
        {/* Left Col: Shipping & Payment */}
        <div className="w-full lg:w-2/3 space-y-12">
          
          {/* SECTION 1: CONTACT DETAILS */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">1</div>
              <h2 className="text-xl font-serif text-neutral-900">Verify Contact Credentials</h2>
            </div>

            <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-5 mb-10">
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider leading-relaxed">
                🚨 Mobile and email are required to complete your checkout and receive real-time dispatch and delivery tracking notifications.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    value={contactForm.full_name}
                    onChange={(e) => setContactForm({...contactForm, full_name: e.target.value})}
                    className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none bg-white text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Email Address *</label>
                  <input 
                    required
                    type="email"
                    placeholder="name@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none bg-white text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Mobile Number *</label>
                  <input 
                    required
                    type="tel"
                    placeholder="9988776655"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none bg-white text-black font-semibold"
                  />
                </div>
              </div>
              
              <button
                type="button"
                disabled={updatingContact}
                onClick={handleUpdateContact}
                className="bg-black text-white px-6 py-3.5 text-[10px] font-black tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {updatingContact ? 'Saving Changes...' : 'Save & Update Profile'}
              </button>
            </div>
          </div>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <div>
            <div className="flex items-center space-x-3 mb-8 border-t border-neutral-100 pt-12">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">2</div>
              <h2 className="text-xl font-serif text-neutral-900">Select Delivery Destination</h2>
            </div>
{selectedAddressId !== 'new' && (
  <div className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50 animate-in fade-in">
    <p className="font-black text-sm text-neutral-900 mb-1">Selected Delivery Address</p>
    <p className="text-xs text-neutral-600">
      {(() => {
        const addr = addresses.find((a) => a.id === selectedAddressId);
        if (!addr) return null;
        return (
          <>
            <span className="block">{addr.label}</span>
            <span className="block">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</span>
            <span className="block">{addr.city}, {addr.state} - {addr.pincode}</span>
            <span className="block flex items-center"><Smartphone size={10} className="mr-1"/>{addr.phone}</span>
          </>
        );
      })()}
    </p>
  </div>
)}
            {addresses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {addresses.map((a) => (
                  <label 
                    key={a.id}
                    className={`border p-5 flex items-start space-x-3 cursor-pointer transition-all duration-200 ${
                      selectedAddressId === a.id ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <input 
                      type="radio"
                      name="address_selection"
                      className="mt-1 accent-black"
                      checked={selectedAddressId === a.id}
                      onChange={() => setSelectedAddressId(a.id)}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-black tracking-widest uppercase text-neutral-900 mb-1 flex items-center justify-between">
                        <span>{a.label}</span>
                        {a.is_default && <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded tracking-widest">DEFAULT</span>}
                      </p>
                      <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                        {a.address_line1}<br />
                        {a.address_line2 && <>{a.address_line2}<br /></>}
                        {a.city}, {a.state} - {a.pincode}<br />
                        {a.phone && <span className="flex items-center mt-1"><Smartphone size={10} className="mr-1" /> {a.phone}</span>}
                      </p>
                    </div>
                  </label>
                ))}

                <label 
                  className={`border p-5 flex items-start space-x-3 cursor-pointer transition-all duration-200 ${
                    selectedAddressId === 'new' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <input 
                    type="radio"
                    name="address_selection"
                    className="mt-1 accent-black"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black tracking-widest uppercase text-neutral-900 mb-1 flex items-center">
                        <Plus size={12} className="mr-1" /> Ship to a New Address
                      </p>
                      <p className="text-xs text-neutral-500">Provide tailored destination logistics below</p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* NEW ADDRESS DYNAMIC FORM */}
            {selectedAddressId === 'new' && (
              <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Address Line 1</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="text"
                      placeholder="Apartment, street, locale"
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Address Line 2 (Optional)</label>
                    <input 
                      type="text"
                      placeholder="Landmark, block, suite"
                      value={addressForm.address_line2}
                      onChange={(e) => setAddressForm({...addressForm, address_line2: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">City</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="text"
                      placeholder="E.g., Mumbai"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">State</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="text"
                      placeholder="Maharashtra"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Pincode</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="text"
                      placeholder="400001"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Delivery Contact Number</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="tel"
                      placeholder="+91 9988776655"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PAYMENT LOGISTICS */}
          <div className="border-t border-neutral-100 pt-12">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">3</div>
              <h2 className="text-xl font-serif text-neutral-900">Select Payment Engine</h2>
            </div>

            <div className="space-y-4">
              <label 
                className={`border p-5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'card' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    name="payment_mode" 
                    className="accent-black"
                    checked={paymentMethod === 'card'} 
                    onChange={() => setPaymentMethod('card')} 
                  />
                  <div>
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-900">Debit / Credit Card</p>
                    <p className="text-[10px] text-neutral-400 font-medium">Visa, Mastercard, Amex Secure Transactions</p>
                  </div>
                </div>
                <CreditCard size={20} className="text-neutral-400" />
              </label>

              {paymentMethod === 'card' && (
                <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-4 animate-in slide-in-from-top-2 duration-200 ml-6">
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Card Number</label>
                    <input type="text" placeholder="4111 2222 3333 4444" className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">CVV</label>
                      <input type="text" placeholder="123" className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <label 
                className={`border p-5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'upi' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    name="payment_mode" 
                    className="accent-black"
                    checked={paymentMethod === 'upi'} 
                    onChange={() => setPaymentMethod('upi')} 
                  />
                  <div>
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-900">UPI Instant Payment</p>
                    <p className="text-[10px] text-neutral-400 font-medium">PhonePe, Google Pay, Paytm, Any UPI ID</p>
                  </div>
                </div>
                <Smartphone size={20} className="text-neutral-400" />
              </label>

              {paymentMethod === 'upi' && (
                <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-4 animate-in slide-in-from-top-2 duration-200 ml-6">
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Virtual Payment Address (VPA)</label>
                  <input type="text" placeholder="username@bank" className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none" />
                </div>
              )}


            </div>
          </div>
        </div>

        {/* Right Col: Sticky Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-neutral-50 p-8 sticky top-32 border border-neutral-100">
            <h2 className="text-lg font-serif mb-6 border-b border-neutral-200 pb-4">Summary of Curation</h2>
            
            {/* Loyalty Rewards Redemption */}
            {customer && customer.loyalty_points > 0 && (
              <div className="mb-6 p-4 bg-white border border-neutral-100 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">Loyalty Rewards</span>
                  <span className="text-[10px] font-black text-black bg-yellow-400 px-2 py-0.5 rounded tracking-widest uppercase">{customer.loyalty_tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{customer.loyalty_points} Points Available</p>
                    <p className="text-[9px] text-neutral-400 uppercase tracking-tight">1 Point = ₹1 Discount</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all ${
                      useLoyaltyPoints ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {useLoyaltyPoints ? 'Redeeming' : 'Redeem'}
                  </button>
                </div>
              </div>
            )}

            {/* Automatically Applied Offer Badge */}
            {appliedPromo && promoDiscount > 0 && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 animate-in fade-in duration-500 rounded-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-800 flex items-center gap-1">
                    <Sparkles size={10} className="fill-emerald-600 text-emerald-600 animate-pulse" />
                    Special Offer Applied
                  </span>
                  <span className="text-[8px] font-black text-white bg-emerald-600 px-1.5 py-0.5 rounded tracking-widest uppercase font-mono">
                    {appliedPromo.code}
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-900 leading-snug">{appliedPromo.title}</p>
                <p className="text-[9.5px] text-emerald-700 font-bold uppercase tracking-wide mt-1.5">
                  🎉 Auto-saved ₹{promoDiscount.toLocaleString('en-IN')} on items
                </p>
              </div>
            )}

            {/* Display Items */}
            <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-12 bg-white flex items-center justify-center border border-neutral-100 p-1 flex-shrink-0">
                      <img src={item.image} className="max-h-full object-contain mix-blend-multiply" alt={item.name} />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 line-clamp-1 uppercase tracking-wide">{item.name}</p>
                      <p className="text-neutral-400 mt-0.5 uppercase font-black tracking-widest text-[9px]">{item.sizeMl}ML × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 whitespace-nowrap">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

             <div className="space-y-4 pt-4 border-t border-neutral-200 text-xs uppercase font-black tracking-widest mb-6">
               <div className="flex justify-between text-neutral-500">
                 <span>Subtotal</span>
                 <span className="text-neutral-900">₹{totalPrice().toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-neutral-500">
                 <span>Logistics (Standard)</span>
                 <span className={totalPrice() >= (cmsLayout?.free_shipping_limit || 999) ? "text-green-600 font-bold" : "text-neutral-900 font-bold"}>
                   {totalPrice() >= (cmsLayout?.free_shipping_limit || 999) ? 'FREE' : `₹${150}`}
                 </span>
               </div>
               {appliedPromo && promoDiscount > 0 && (
                 <div className="flex justify-between text-green-600 animate-in slide-in-from-left-2 duration-300">
                   <span>Promo Discount</span>
                   <span>-₹{promoDiscount.toLocaleString('en-IN')}</span>
                 </div>
               )}
               {useLoyaltyPoints && (
                 <div className="flex justify-between text-yellow-600 animate-in slide-in-from-left-2 duration-300">
                   <span>Loyalty Redemption</span>
                   <span>-₹{Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)).toLocaleString('en-IN')}</span>
                 </div>
               )}
               <div className="flex justify-between text-neutral-900 border-t border-neutral-200 pt-4 text-sm">
                 <span className="font-serif normal-case font-bold tracking-normal text-base">Grand Total</span>
                 <span className="font-bold text-lg font-serif normal-case tracking-normal">
                   ₹{Math.max(0, totalPrice() + (totalPrice() >= (cmsLayout?.free_shipping_limit || 999) ? 0 : 150) - promoDiscount - (useLoyaltyPoints ? Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)) : 0)).toLocaleString('en-IN')}
                 </span>
               </div>
             </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full bg-black text-white py-5 text-xs font-black tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center justify-center uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placingOrder ? 'Processing Secure Transfer...' : 'CONFIRM & PLACE ORDER'}
            </button>

            <div className="mt-4 text-[9px] text-neutral-400 font-bold text-center tracking-widest uppercase flex items-center justify-center">
              <CheckCircle2 size={12} className="mr-1" /> Total security assured by Kozmocart Vaults
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
