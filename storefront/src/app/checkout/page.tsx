'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useCartStore, syncCartItemPrices } from '@/store/cartStore';
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
  ShieldAlert,
  Sparkles,
  Banknote
} from 'lucide-react';

import { useTranslation } from '@/locales/i18nContext';

export default function Checkout() {
  const { t, locale } = useTranslation();
  const { items, clearCart, totalPrice } = useCartStore();
  const { customer, token } = useAuthStore();
  const router = useRouter();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
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

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  // Stripe Integration States
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState('');
  const [stripeOrderNumber, setStripeOrderNumber] = useState('');
  const [stripeAmount, setStripeAmount] = useState(0);
  const [stripeCardNum, setStripeCardNum] = useState('4242 4242 4242 4242');
  const [stripeCardExpiry, setStripeCardExpiry] = useState('12/29');
  const [stripeCardCvc, setStripeCardCvc] = useState('123');
  const [stripeCardName, setStripeCardName] = useState('');
  const [processingStripe, setProcessingStripe] = useState(false);
  const [stripeModalError, setStripeModalError] = useState<string | null>(null);
  const [verifyingOtps, setVerifyingOtps] = useState(false);
  const [verifyEmailNeeded, setVerifyEmailNeeded] = useState(false);
  const [verifyPhoneNeeded, setVerifyPhoneNeeded] = useState(false);

  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  // Automatically evaluate and apply best eligible active offer
  useEffect(() => {
    const autoApplyOffers = async () => {
      try {
        const res = await api.get('/offers');
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

    const emailChanged = contactForm.email.trim().toLowerCase() !== (customer?.email || '').trim().toLowerCase();
    const phoneChanged = contactForm.phone.trim() !== (customer?.phone || '').trim();

    if (emailChanged || phoneChanged) {
      setUpdatingContact(true);
      try {
        if (phoneChanged) {
          const patchRes = await api.patch('/account/me', { phone: contactForm.phone.trim() });
          useAuthStore.setState({ customer: patchRes.data });
        }

        if (emailChanged) {
          await api.post('/account/verify/send', {
            email: contactForm.email.trim()
          });
          setVerifyEmailNeeded(true);
          setVerifyPhoneNeeded(false);
          setEmailOtp('');
          setPhoneOtp('');
          setShowVerifyModal(true);
        } else {
          // If only phone was updated
          alert('Phone number updated successfully!');
        }
      } catch (err: any) {
        const detail = err.response?.data?.detail;
        alert(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Failed to update contact details.');
      } finally {
        setUpdatingContact(false);
      }
    } else {
      // If only name changed (or nothing changed)
      setUpdatingContact(true);
      try {
        const res = await api.patch('/account/me', {
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
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyEmailNeeded && !emailOtp.trim()) {
      alert('Please enter the Email verification code.');
      return;
    }
    if (verifyPhoneNeeded && !phoneOtp.trim()) {
      alert('Please enter the Mobile verification code.');
      return;
    }

    setVerifyingOtps(true);
    try {
      const res = await api.post('/account/verify/confirm', {
        email_otp: verifyEmailNeeded ? emailOtp.trim() : undefined,
        phone_otp: verifyPhoneNeeded ? phoneOtp.trim() : undefined,
        full_name: contactForm.full_name.trim()
      });
      useAuthStore.setState({ 
        customer: res.data.customer,
        token: res.data.access_token
      });
      setShowVerifyModal(false);
      setEmailOtp('');
      setPhoneOtp('');
      alert('Contact details verified and merged successfully!');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Verification failed. Please try again.');
    } finally {
      setVerifyingOtps(false);
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    syncCartItemPrices();
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

  const [shippingFee, setShippingFee] = useState(17);

  useEffect(() => {
    const updateShippingRate = async () => {
      let targetCity = '';
      let targetPin = '';
      if (selectedAddressId === 'new') {
        targetCity = addressForm.city || addressForm.state || '';
        targetPin = addressForm.pincode || '';
      } else {
        const addr = addresses.find(a => a.id === selectedAddressId);
        if (addr) {
          targetCity = addr.city || addr.state || '';
          targetPin = addr.pincode || '';
        }
      }

      const clean = targetCity.toLowerCase().trim();
      if (clean.includes('abu dhabi') || clean.includes('al ain') || clean.includes('remote')) {
        setShippingFee(25);
      } else {
        setShippingFee(17);
      }

      if (targetCity || targetPin) {
        try {
          const res = await api.get(`/orders/shipping/verify-pincode?city=${encodeURIComponent(targetCity)}&pincode=${encodeURIComponent(targetPin)}`);
          if (res.data && res.data.shipping_fee) {
            setShippingFee(res.data.shipping_fee);
          }
        } catch (err) {
          console.warn('Failed to verify shipping fee', err);
        }
      }
    };

    updateShippingRate();
  }, [selectedAddressId, addressForm.city, addressForm.state, addressForm.pincode, addresses]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Automatic verification when returning from Stripe Hosted Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const isSuccess = urlParams.get('success');

    if (sessionId && isSuccess === 'true') {
      const verifyStripePaymentOnReturn = async () => {
        try {
          const res = await api.post('/orders/stripe/verify', {
            stripe_session_id: sessionId
          });
          if (res.data && res.data.order) {
            setOrderSuccess(res.data.order);
            clearCart();
          }
        } catch (err) {
          console.error('Failed to verify Stripe return payment:', err);
        }
      };
      verifyStripePaymentOnReturn();
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Don't redirect if returning from Stripe payment (let the verify useEffect handle it)
    const urlParams2 = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isStripeReturn = !!(urlParams2?.get('session_id') && urlParams2?.get('success') === 'true');

    if (isStripeReturn) {
      // On Stripe return, just show loading — the verify useEffect will set orderSuccess
      setLoading(false);
      return;
    }

    if (!token) {
      router.push('/login');
      return;
    }

    const hasStripeReturn = urlParams2?.get('session_id');

    if (items.length === 0 && !orderSuccess && !hasStripeReturn) {
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
        // Validate new address for UAE
        if (!addressForm.address_line1 || !addressForm.city) {
          alert('Please complete the delivery address details (Address line 1 & Emirate/City).');
          setPlacingOrder(false);
          return;
        }
        shippingAddressData = { 
          ...addressForm, 
          country: addressForm.country || 'United Arab Emirates',
          pincode: addressForm.pincode || '00000',
          state: addressForm.state || addressForm.city
        };
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
        variant_id: item.id || (item as any).variant_id,
        quantity: item.quantity,
        unit_price: item.price,
        discount_amount: 0.0
      }));

      // Calculate Exclusive Tax portion to add to final order amount
      const vatRate = 0.05;
      let exclusiveTaxAdded = 0;
      items.forEach(item => {
        const lineTotal = item.price * item.quantity;
        const tt = ((item as any).taxType || (item as any).tax_type || 'Inclusive').toLowerCase();
        if (tt === 'exclusive') {
          exclusiveTaxAdded += lineTotal * vatRate;
        }
      });
      const discountRatio = totalPrice() > 0 ? Math.min(1, promoDiscount / totalPrice()) : 0;
      const netExclusiveTaxAdded = Math.max(0, exclusiveTaxAdded * (1 - discountRatio));

      const shippingLimit = cmsLayout?.free_shipping_limit ?? 100;
      const finalShippingFee = totalPrice() >= shippingLimit ? 0 : shippingFee; 
      const pointsToRedeem = useLoyaltyPoints ? Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)) : 0;
      const finalAmount = Math.max(0, totalPrice() + netExclusiveTaxAdded + finalShippingFee - pointsToRedeem - promoDiscount);

      // ================= STRIPE INTEGRATION =================
      if (paymentMethod === 'card') {
        let stripeSessionData: any = null;
        try {
          const createRes = await api.post('/orders/stripe/create', {
            payment_method: 'stripe',
            customer_name: contactForm.full_name || customer?.full_name,
            customer_email: contactForm.email || customer?.email,
            customer_phone: contactForm.phone || customer?.phone,
            shipping_address: shippingAddressData,
            billing_address: shippingAddressData,
            payment_status: 'pending',
            items: orderItems,
            loyalty_points_used: pointsToRedeem,
            shipping_amount: finalShippingFee,
            tax_amount: netExclusiveTaxAdded,
            discount_amount: promoDiscount,
            coupon_code: appliedPromo ? appliedPromo.code : null
          });
          stripeSessionData = createRes.data;
        } catch (err: any) {
          const detail = err.response?.data?.detail;
          setCheckoutError(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Failed to initialize payment.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPlacingOrder(false);
          return;
        }

        const sessionId = stripeSessionData.stripe_session_id;
        const stripeUrl = stripeSessionData.url;
        const publishableKey = stripeSessionData.stripe_publishable_key;

        // If real Stripe Session URL returned by backend (live Stripe key configured)
        if (stripeUrl) {
          window.location.href = stripeUrl;
          return;
        }

        // If real Stripe keys are configured
        if (publishableKey && publishableKey !== 'pk_test_placeholder') {
          try {
            const stripe = (window as any).Stripe(publishableKey);
            const { error } = await stripe.redirectToCheckout({
              sessionId: sessionId
            });
            if (error) {
              setCheckoutError(error.message || 'Stripe redirect failed.');
              setPlacingOrder(false);
            }
          } catch (err: any) {
            setCheckoutError('Stripe JS load error. Please check configuration.');
            setPlacingOrder(false);
          }
          return;
        }

        // If mock keys, open our custom simulated Stripe modal overlay!
        setStripeSessionId(sessionId);
        setStripeOrderNumber(stripeSessionData.order_number);
        setStripeAmount(finalAmount);
        setStripeCardName(customer?.full_name || '');
        setStripeModalError(null);
        setShowStripeModal(true);
        setPlacingOrder(false);
        return; // Halt execution and wait for modal handler
      }
      // ============================================================

      // ================= CASH ON DELIVERY (COD) INTEGRATION =================
      if (paymentMethod === 'cod') {
        try {
          const createRes = await api.post('/orders/checkout', {
            payment_method: 'cod',
            customer_name: contactForm.full_name || customer?.full_name,
            customer_email: contactForm.email || customer?.email,
            customer_phone: contactForm.phone || customer?.phone,
            shipping_address: shippingAddressData,
            billing_address: shippingAddressData,
            payment_status: 'pending',
            items: orderItems,
            loyalty_points_used: pointsToRedeem,
            shipping_amount: finalShippingFee,
            tax_amount: netExclusiveTaxAdded,
            discount_amount: promoDiscount,
            coupon_code: appliedPromo ? appliedPromo.code : null,
            notes: 'Cash on Delivery'
          });
          setOrderSuccess(createRes.data);
          clearCart();
          setPlacingOrder(false);
          return;
        } catch (err: any) {
          const detail = err.response?.data?.detail;
          setCheckoutError(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Failed to place Cash on Delivery order.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setPlacingOrder(false);
          return;
        }
      }

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
              <p className="text-sm text-neutral-900">AED {orderSuccess.total_amount?.toLocaleString('en-US')}</p>
            </div>
            {(orderSuccess.transaction_id) && (
              <div className="md:col-span-2">
                <p className="text-neutral-400 mb-1">Payment Reference (Stripe)</p>
                <p className="text-xs text-neutral-700 normal-case tracking-normal font-mono font-medium">{orderSuccess.transaction_id}</p>
              </div>
            )}
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
              <h2 className="text-xl font-serif text-neutral-900">{t('checkout_secure_curation')}</h2>
            </div>

            <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-5 mb-10">
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider leading-relaxed">
                {t('checkout_sub_desc')}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">{t('checkout_full_name')}</label>
                  <input 
                    type="text"
                    value={contactForm.full_name}
                    onChange={(e) => setContactForm({...contactForm, full_name: e.target.value})}
                    className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none bg-white text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">{t('checkout_email')}</label>
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
                  <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">{t('checkout_mobile')}</label>
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
                {updatingContact ? t('checkout_saving') : t('checkout_save_profile')}
              </button>
            </div>
          </div>

          {/* SECTION 2: DELIVERY ADDRESS */}
          <div>
            <div className="flex items-center space-x-3 mb-8 border-t border-neutral-100 pt-12">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-serif text-sm">2</div>
              <h2 className="text-xl font-serif text-neutral-900">{t('checkout_delivery_title')}</h2>
            </div>
{selectedAddressId !== 'new' && (
  <div className="mb-6 p-4 border border-neutral-200 rounded-lg bg-neutral-50 animate-in fade-in">
    <p className="font-black text-sm text-neutral-900 mb-1">{t('checkout_selected_address')}</p>
    <p className="text-xs text-neutral-600">
      {(() => {
        const addr = addresses.find((a) => a.id === selectedAddressId);
        if (!addr) return null;
        return (
          <>
            <span className="block">{addr.label}</span>
            <span className="block">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</span>
            <span className="block">{[addr.city, addr.state && addr.state !== addr.city ? addr.state : ''].filter(Boolean).join(', ')}{addr.pincode && addr.pincode !== '00000' && addr.pincode !== '0' ? ` - ${addr.pincode}` : ''}</span>
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
                        {a.is_default && <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded tracking-widest">{locale === 'ar' ? 'افتراضي' : 'DEFAULT'}</span>}
                      </p>
                      <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                        {a.address_line1}<br />
                        {a.address_line2 && <>{a.address_line2}<br /></>}
                        {[a.city, a.state && a.state !== a.city ? a.state : ''].filter(Boolean).join(', ')}{a.pincode && a.pincode !== '00000' && a.pincode !== '0' ? ` - ${a.pincode}` : ''}<br />
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
                        <Plus size={12} className="mr-1" /> {t('checkout_ship_new')}
                      </p>
                      <p className="text-xs text-neutral-500">{t('checkout_ship_new_desc')}</p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* NEW ADDRESS DYNAMIC FORM (UAE Tailored) */}
            {selectedAddressId === 'new' && (
              <div className="p-6 bg-neutral-50 border border-neutral-100 space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">{t('checkout_address1')}</label>
                    <input 
                      required={selectedAddressId === 'new'}
                      type="text"
                      placeholder="Building / Villa / House No., Street Address"
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">Area / Location / Landmark (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Al Karama / Business Bay / Near Park"
                      value={addressForm.address_line2}
                      onChange={(e) => setAddressForm({...addressForm, address_line2: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">{t('checkout_city')} / Emirate</label>
                    {(() => {
                      const isFreeEligible = totalPrice() >= (cmsLayout?.free_shipping_limit ?? 100);
                      return (
                        <select 
                          required={selectedAddressId === 'new'}
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value, state: e.target.value, country: 'United Arab Emirates'})}
                          className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none bg-white font-medium"
                        >
                          <option value="">Select Emirate / City...</option>
                          <option value="Dubai">Dubai ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Abu Dhabi">Abu Dhabi ({isFreeEligible ? 'FREE' : 'AED 25.00'})</option>
                          <option value="Al Ain">Al Ain ({isFreeEligible ? 'FREE' : 'AED 25.00'})</option>
                          <option value="Sharjah">Sharjah ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Ajman">Ajman ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Ras Al Khaimah">Ras Al Khaimah ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Fujairah">Fujairah ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Umm Al Quwain">Umm Al Quwain ({isFreeEligible ? 'FREE' : 'AED 17.00'})</option>
                          <option value="Remote Area">Abu Dhabi Remote Area ({isFreeEligible ? 'FREE' : 'AED 25.00'})</option>
                        </select>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-[9px] font-black tracking-widest text-neutral-400 uppercase mb-1.5">P.O. Box / Postal Code (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 00000 or P.O. Box"
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
                      placeholder="e.g. +971 50 123 4567"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                      className="w-full border border-neutral-200 px-4 py-3 text-xs focus:border-black outline-none font-mono"
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
              <h2 className="text-xl font-serif text-neutral-900">{t('checkout_payment_title')}</h2>
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
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-900">{t('checkout_card_title')}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">{t('checkout_card_desc')}</p>
                  </div>
                </div>
                <CreditCard size={20} className="text-neutral-400" />
              </label>

              <label 
                className={`border p-5 flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'cod' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    name="payment_mode" 
                    className="accent-black"
                    checked={paymentMethod === 'cod'} 
                    onChange={() => setPaymentMethod('cod')} 
                  />
                  <div>
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-900">{t('checkout_cod_title')}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">{t('checkout_cod_desc')}</p>
                  </div>
                </div>
                <Banknote size={20} className="text-neutral-400" />
              </label>


            </div>
          </div>
        </div>

        {/* Right Col: Sticky Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-neutral-50 p-8 sticky top-32 border border-neutral-100">
            <h2 className="text-lg font-serif mb-6 border-b border-neutral-200 pb-4">{t('checkout_summary_title')}</h2>
            
            {/* Loyalty Rewards Redemption */}
            {customer && customer.loyalty_points > 0 && (
              <div className="mb-6 p-4 bg-white border border-neutral-100 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{t('checkout_loyalty_rewards')}</span>
                  <span className="text-[10px] font-black text-black bg-yellow-400 px-2 py-0.5 rounded tracking-widest uppercase">{customer.loyalty_tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{t('checkout_points_available').replace('{points}', String(customer.loyalty_points))}</p>
                    <p className="text-[9px] text-neutral-400 uppercase tracking-tight">{t('checkout_point_value')}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setUseLoyaltyPoints(!useLoyaltyPoints)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all ${
                      useLoyaltyPoints ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {useLoyaltyPoints ? t('checkout_redeeming') : t('checkout_redeem')}
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
                    {t('checkout_promo_applied')}
                  </span>
                  <span className="text-[8px] font-black text-white bg-emerald-600 px-1.5 py-0.5 rounded tracking-widest uppercase font-mono">
                    {appliedPromo.code}
                  </span>
                </div>
                <p className="text-xs font-bold text-neutral-900 leading-snug">{locale === 'ar' ? (appliedPromo.title_ar || appliedPromo.title) : appliedPromo.title}</p>
                <p className="text-[9.5px] text-emerald-700 font-bold uppercase tracking-wide mt-1.5">
                  {t('checkout_auto_saved').replace('{amount}', promoDiscount.toLocaleString('en-IN'))}
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
                  <span className="font-bold text-neutral-900 whitespace-nowrap">AED {(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

             <div className="space-y-4 pt-4 border-t border-neutral-200 text-xs uppercase font-black tracking-widest mb-6">
               <div className="flex justify-between text-neutral-500">
                 <span>{t('checkout_subtotal')}</span>
                 <span className="text-neutral-900">AED {totalPrice().toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-neutral-500">
                 <span>{t('checkout_logistics')}</span>
                 <span className={totalPrice() >= (cmsLayout?.free_shipping_limit ?? 100) ? "text-green-600 font-bold" : "text-neutral-900 font-bold"}>
                   {totalPrice() >= (cmsLayout?.free_shipping_limit ?? 100) ? t('free') : `AED ${shippingFee}`}
                 </span>
               </div>
               {appliedPromo && promoDiscount > 0 && (
                 <div className="flex justify-between text-green-600 animate-in slide-in-from-left-2 duration-300">
                   <span>{t('checkout_promo_discount')}</span>
                   <span>-AED {promoDiscount.toLocaleString('en-IN')}</span>
                 </div>
               )}
               {useLoyaltyPoints && (
                 <div className="flex justify-between text-yellow-600 animate-in slide-in-from-left-2 duration-300">
                   <span>{t('checkout_loyalty_redemption')}</span>
                   <span>-AED {Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)).toLocaleString('en-IN')}</span>
                 </div>
               )}

                {/* UAE VAT 5% Tax Breakdown (Inclusive vs Exclusive Aware) */}
                {(() => {
                  const vatRate = 0.05;
                  let totalTaxable = 0;
                  let totalVat = 0;
                  let exclusiveTaxAdded = 0;
                  let inclusiveCount = 0;
                  let exclusiveCount = 0;

                  items.forEach(item => {
                    const lineTotal = item.price * item.quantity;
                    const tt = ((item as any).taxType || (item as any).tax_type || 'Inclusive').toLowerCase();
                    if (tt === 'exclusive') {
                      exclusiveCount++;
                      totalTaxable += lineTotal;
                      const vat = lineTotal * vatRate;
                      totalVat += vat;
                      exclusiveTaxAdded += vat;
                    } else if (tt === 'zero-rated') {
                      totalTaxable += lineTotal;
                    } else {
                      // Inclusive (default)
                      inclusiveCount++;
                      const taxable = lineTotal / (1 + vatRate);
                      const vat = lineTotal - taxable;
                      totalTaxable += taxable;
                      totalVat += vat;
                    }
                  });

                  const discountRatio = totalPrice() > 0 ? Math.min(1, promoDiscount / totalPrice()) : 0;
                  const netTaxable = Math.max(0, totalTaxable * (1 - discountRatio));
                  const netVat = Math.max(0, totalVat * (1 - discountRatio));

                  const isAllInclusive = exclusiveCount === 0;
                  const isAllExclusive = inclusiveCount === 0 && exclusiveCount > 0;

                  const taxLabel = isAllInclusive 
                    ? "UAE VAT (5.0% Included)" 
                    : isAllExclusive 
                    ? "UAE VAT (5.0% Exclusive)" 
                    : "UAE VAT (5.0% Combined)";

                  return (
                    <div className="bg-neutral-50 border border-neutral-200/80 rounded-sm p-3.5 space-y-2 normal-case font-sans tracking-normal">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-500 font-medium uppercase tracking-wider">Taxable Amount (Base)</span>
                        <span className="text-neutral-800 font-bold">AED {netTaxable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-500 font-medium uppercase tracking-wider">{taxLabel}</span>
                        <span className="text-neutral-900 font-black">AED {netVat.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-neutral-900 text-sm">
                    <span className="font-serif normal-case font-bold tracking-normal text-base">{t('checkout_grand_total')}</span>
                    <span className="font-light text-xl font-serif normal-case tracking-wide text-neutral-800">
                      AED {(() => {
                        const vatRate = 0.05;
                        let exclusiveTaxAdded = 0;
                        items.forEach(item => {
                          const lineTotal = item.price * item.quantity;
                          const tt = ((item as any).taxType || (item as any).tax_type || 'Inclusive').toLowerCase();
                          if (tt === 'exclusive') {
                            exclusiveTaxAdded += lineTotal * vatRate;
                          }
                        });
                        const discountRatio = totalPrice() > 0 ? Math.min(1, promoDiscount / totalPrice()) : 0;
                        const netExclusiveTaxAdded = Math.max(0, exclusiveTaxAdded * (1 - discountRatio));
                        const finalShippingFee = totalPrice() >= (cmsLayout?.free_shipping_limit ?? 100) ? 0 : shippingFee;
                        const pointsToRedeem = useLoyaltyPoints ? Math.min(customer?.loyalty_points || 0, Math.floor(totalPrice() - promoDiscount)) : 0;
                        const grandTotal = Math.max(0, totalPrice() + netExclusiveTaxAdded + finalShippingFee - promoDiscount - pointsToRedeem);
                        return grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider text-right mt-1">
                    {(() => {
                      let inclusiveCount = 0;
                      let exclusiveCount = 0;
                      items.forEach(item => {
                        const tt = ((item as any).taxType || (item as any).tax_type || 'Inclusive').toLowerCase();
                        if (tt === 'exclusive') exclusiveCount++;
                        else inclusiveCount++;
                      });
                      if (exclusiveCount === 0) return "VAT INCLUSIVE (5% INCLUDED IN PRODUCT PRICE)";
                      if (inclusiveCount === 0) return "VAT EXCLUSIVE (5% ON PRODUCT PRICE)";
                      return "VAT (5% COMBINED INCLUSIVE & EXCLUSIVE)";
                    })()}
                  </p>
                </div>
             </div>

            <button
              type="submit"
              disabled={placingOrder}
              className="w-full bg-black text-white py-5 text-xs font-black tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center justify-center uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placingOrder ? t('checkout_confirm_processing') : t('checkout_confirm_btn')}
            </button>

            <div className="mt-4 text-[9px] text-neutral-400 font-bold text-center tracking-widest uppercase flex items-center justify-center">
              <CheckCircle2 size={12} className="mr-1" /> {t('checkout_security_assured')}
            </div>
          </div>
        </div>
      </form>

      {/* VERIFY CONTACT DETAILS MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-8 md:p-10 shadow-2xl relative">
            <h3 className="text-xl font-serif italic text-neutral-900 mb-2">{t('checkout_verify_title')}</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">
              {t('checkout_verify_desc')}
            </p>

            <form onSubmit={handleConfirmVerification} className="space-y-6">
              {verifyEmailNeeded && (
                <div>
                  <label className="block text-[9px] font-black text-neutral-900 uppercase tracking-[0.2em] mb-2">
                    {t('checkout_email_code').replace('{email}', contactForm.email)}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="w-full border-b border-neutral-300 py-2.5 px-0 text-sm focus:border-black outline-none tracking-widest font-mono text-center rounded-none"
                  />
                </div>
              )}

              {verifyPhoneNeeded && (
                <div>
                  <label className="block text-[9px] font-black text-neutral-900 uppercase tracking-[0.2em] mb-2">
                    {t('checkout_phone_code').replace('{phone}', contactForm.phone)}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    className="w-full border-b border-neutral-300 py-2.5 px-0 text-sm focus:border-black outline-none tracking-widest font-mono text-center rounded-none"
                  />
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 bg-transparent border border-neutral-200 text-neutral-900 py-4 text-xs font-black tracking-widest hover:border-black transition-colors uppercase rounded-none"
                >
                  {t('checkout_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtps}
                  className="flex-1 bg-black text-white py-4 text-xs font-black tracking-widest hover:bg-neutral-800 transition-colors uppercase rounded-none disabled:opacity-50"
                >
                  {verifyingOtps ? t('checkout_verifying_btn') : t('checkout_verify_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stripe Payment Simulation Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md shadow-2xl p-6 md:p-8 animate-fadeIn flex flex-col font-sans border border-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="bg-[#635BFF] text-white p-1.5 rounded-sm flex items-center justify-center">
                  <CreditCard size={16} />
                </span>
                <span className="text-sm font-bold text-neutral-900 tracking-wider">Stripe Payment Gateway</span>
              </div>
              <span className="bg-amber-50 text-amber-800 text-[9px] font-black tracking-widest px-2 py-0.5 uppercase border border-amber-200">
                Test Mode
              </span>
            </div>

            {stripeModalError && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 mb-6 border border-red-200 font-semibold">
                {stripeModalError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setProcessingStripe(true);
                setStripeModalError(null);
                
                try {
                  // Simulate Stripe processing delay
                  await new Promise(r => setTimeout(r, 2000));
                  
                  // Call verify endpoint
                  const verifyRes = await api.post('/orders/stripe/verify', {
                    stripe_session_id: stripeSessionId,
                    order_number: stripeOrderNumber,
                    transaction_id: `ch_mock_stripe_${Math.random().toString(36).substring(2, 16)}`
                  });
                  
                  // Clear cart and show order confirmation screen
                  setOrderSuccess(verifyRes.data.order);
                  clearCart();
                  setShowStripeModal(false);
                } catch (err: any) {
                  const detail = err.response?.data?.detail;
                  setStripeModalError(detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : 'Simulated Stripe Payment failed. Please try again.');
                } finally {
                  setProcessingStripe(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={stripeCardName}
                  onChange={(e) => setStripeCardName(e.target.value)}
                  placeholder="Cardholder Name"
                  className="w-full border border-neutral-300 py-3 px-4 text-sm focus:border-black outline-none rounded-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={stripeCardNum}
                    onChange={(e) => setStripeCardNum(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full border border-neutral-300 py-3 pl-4 pr-10 text-sm focus:border-black outline-none font-mono tracking-wider rounded-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    🔒
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={stripeCardExpiry}
                    onChange={(e) => setStripeCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full border border-neutral-300 py-3 px-4 text-sm focus:border-black outline-none font-mono text-center rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-2">CVC</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={stripeCardCvc}
                    onChange={(e) => setStripeCardCvc(e.target.value)}
                    placeholder="CVC"
                    className="w-full border border-neutral-300 py-3 px-4 text-sm focus:border-black outline-none font-mono text-center rounded-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-neutral-500 py-2 border-t border-neutral-100 mt-6">
                <span className="text-[#635BFF]">⚡</span>
                <span>Powered by Stripe. Payment details are encrypted and secured.</span>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={processingStripe}
                  onClick={async () => {
                    setShowStripeModal(false);
                    try {
                      await api.post('/orders/stripe/cancel', {
                        order_number: stripeOrderNumber
                      });
                    } catch (err) {}
                  }}
                  className="flex-1 bg-transparent border border-neutral-200 text-neutral-900 py-4 text-xs font-black tracking-widest hover:border-black transition-colors uppercase rounded-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingStripe}
                  className="flex-1 bg-black text-white py-4 text-xs font-black tracking-widest hover:bg-neutral-800 transition-colors uppercase rounded-none disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processingStripe ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Pay AED {stripeAmount.toFixed(2)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
