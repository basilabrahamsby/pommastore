'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { 
  Search, Package, CheckCircle2, Truck, Clock, 
  ExternalLink, ArrowRight, MapPin, AlertCircle, Mail, X 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function TrackOrderContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [directAwb, setDirectAwb] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  
  // Frictionless Authentication States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Logged-in customer orders states
  const { customer, token, logout } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userOrdersLoading, setUserOrdersLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!token || !customer) {
      setUserOrders([]);
      return;
    }

    const fetchUserOrders = async () => {
      setUserOrdersLoading(true);
      try {
        const res = await api.get('/account/orders');
        setUserOrders(res.data);
        // Automatically select the most recent order to track if none is selected
        if (res.data && res.data.length > 0 && !orderData) {
          setOrderData(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch user orders', err);
      } finally {
        setUserOrdersLoading(false);
      }
    };

    fetchUserOrders();
  }, [token, customer]);

  const handleGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.includes('@') || !googleEmail.includes('.')) return;
    
    setGoogleLoading(true);
    try {
      const res = await api.post('/auth/google', {
        email: googleEmail.trim(),
        name: googleName.trim() || googleEmail.split('@')[0],
        token: "simulated-v1-access-token-kms-track"
      });
      setAuth(res.data.customer, res.data.access_token);
      setShowGoogleModal(false);
      router.push('/account'); // Instant access to thier account details!
    } catch (err) {
      console.error("Simulated Google Auth Failed", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const qOrder = searchParams.get('order');
    const qContact = searchParams.get('contact');
    if (qOrder && qContact) {
      setOrderNumber(qOrder);
      setContact(qContact);
      handleAutoTrack(qOrder, qContact);
    }
  }, [searchParams]);

  const handleAutoTrack = async (o: string, c: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/storefront/orders/track', {
        order_number: o,
        contact: c
      });
      setOrderData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not retrieve order information. Verify details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setOrderData(null);
    
    try {
      const res = await api.post('/storefront/orders/track', {
        order_number: orderNumber.trim(),
        contact: contact.trim()
      });
      setOrderData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Order not found with provided details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDelhivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directAwb.trim()) return;
    window.open(`https://www.delhivery.com/track/package/${directAwb.trim()}`, '_blank');
  };

  // Order status mapping for steps
  const getStatusStep = (status: string) => {
    const steps = [
      'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'
    ];
    const index = steps.indexOf(status.toLowerCase());
    return index === -1 ? 0 : index;
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="bg-white min-h-screen py-24 md:py-36 selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Header Section */}
        <div className="text-center mb-16 md:mb-24 animate-fadeIn">
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">LOGISTICS & TRACKING</span>
          <h1 className="text-4xl md:text-6xl font-serif text-neutral-950 mb-6 font-light italic tracking-tight leading-tight">
            Follow Your <br/>Fragrance.
          </h1>
          <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-6" />
          <p className="text-neutral-500 text-xs md:text-sm max-w-md mx-auto font-medium uppercase tracking-widest leading-relaxed">
            Enter details below to retrieve real-time shipment logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-5 space-y-12">
            
            {customer ? (
              /* Personal Logistics: Logged In Customer Orders */
              <div className="bg-neutral-950 text-white p-8 md:p-12 border border-neutral-900 relative overflow-hidden group hover:border-neutral-750 transition-all duration-500 mb-12 shadow-xl">
                {/* Illuminating glow */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-neutral-800 rounded-full opacity-30 blur-3xl"></div>
                
                <span className="text-[8px] font-black tracking-[0.3em] text-yellow-500 uppercase mb-4 block z-10 relative">PERSONAL LOGISTICS</span>
                <h2 className="text-xl md:text-2xl font-serif italic font-black text-white mb-2 leading-tight z-10 relative">
                  Welcome Back,<br/>{customer.full_name || customer.email.split('@')[0]}.
                </h2>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-8 font-medium tracking-wide z-10 relative">
                  Select any of your recent orders below to inspect live delivery status and logs.
                </p>

                <div className="space-y-4 z-10 relative max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {userOrdersLoading ? (
                    <div className="space-y-3 py-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-neutral-900 animate-pulse border border-neutral-800" />
                      ))}
                    </div>
                  ) : userOrders.length > 0 ? (
                    userOrders.map((order: any) => {
                      const isSelected = orderData?.id === order.id;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setOrderData(order)}
                          className={`w-full text-left p-4 border transition-all duration-300 flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'border-white bg-white text-black' 
                              : 'border-neutral-800 bg-neutral-900 text-white hover:border-neutral-600'
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-black tracking-widest block uppercase">
                              Order #{order.order_number}
                            </span>
                            <span className={`text-[8px] font-bold tracking-widest uppercase block mt-1 ${
                              isSelected ? 'text-neutral-500' : 'text-neutral-400'
                            }`}>
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${
                              isSelected ? 'bg-neutral-100 text-black' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic py-4">No orders placed yet.</p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-between items-center z-10 relative">
                  <Link 
                    href="/account"
                    className="text-[10px] font-black tracking-widest text-neutral-300 hover:text-white uppercase flex items-center space-x-1"
                  >
                    <span>My Account</span>
                    <ArrowRight size={12} />
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      router.push('/track-order');
                    }}
                    className="text-[10px] font-black tracking-widest text-red-400 hover:text-red-500 uppercase cursor-pointer bg-transparent border-0"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              /* Box 0: Frictionless Access */
              <div className="bg-neutral-950 text-white p-8 md:p-12 border border-neutral-900 relative overflow-hidden group hover:border-neutral-750 transition-all duration-500 mb-12 shadow-xl">
                {/* Illuminating glow */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-neutral-800 rounded-full opacity-30 blur-3xl"></div>
                
                <span className="text-[8px] font-black tracking-[0.3em] text-yellow-500 uppercase mb-4 block z-10 relative">EXPRESS RETRIEVAL</span>
                <h2 className="text-xl md:text-2xl font-serif italic font-black text-white mb-4 leading-tight z-10 relative">
                  Skip the Forms.<br/>Sign In Instantly.
                </h2>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-8 font-medium tracking-wide z-10 relative max-w-xs">
                  No order number required. Authenticate with your Google profile or instant Email OTP to instantly access all account tracking logs.
                </p>
                <div className="space-y-4 z-10 relative">
                  {/* Google Sign-in Button */}
                  <button 
                    onClick={() => setShowGoogleModal(true)}
                    className="w-full py-4 bg-white text-black font-bold text-[10px] tracking-[0.15em] uppercase flex items-center justify-center space-x-3 hover:bg-neutral-100 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Gmail</span>
                  </button>
                  {/* Email OTP Direct Access */}
                  <Link 
                    href="/login"
                    className="w-full py-4 bg-transparent border border-neutral-800 text-neutral-300 font-bold text-[10px] tracking-[0.15em] uppercase flex items-center justify-center space-x-3 hover:border-neutral-600 hover:text-white transition-all duration-300"
                  >
                    <Mail className="w-4 h-4 text-neutral-500" />
                    <span>Email with OTP</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Box 1: Normal Tracking */}
            <div className="bg-neutral-50 p-8 md:p-12 border border-neutral-100">
              <h2 className="text-xs font-black tracking-[0.25em] text-black uppercase mb-8 flex items-center">
                <Package className="mr-2 h-4 w-4 text-neutral-400" />
                Track Kozmocart Order
              </h2>
              
              {error && (
                <div className="bg-black text-white p-4 text-[10px] font-bold mb-8 tracking-widest uppercase flex items-center">
                  <AlertCircle className="mr-3 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleTrack} className="space-y-8">
                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">
                    Order Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., KZM-2026-12345"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-3 px-0 text-sm focus:border-black transition-all outline-none font-bold tracking-wide placeholder:text-neutral-300 rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., customer@email.com"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-3 px-0 text-sm focus:border-black transition-all outline-none font-medium tracking-wide placeholder:text-neutral-300 rounded-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-5 text-[10px] font-black tracking-[0.3em] hover:bg-neutral-800 transition-all flex items-center justify-center space-x-2 disabled:bg-neutral-200"
                >
                  {loading ? 'RETRIEVING...' : (
                    <>
                      <span>TRACK ORDER</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Box 2: Direct Delhivery Tracker */}
            <div className="bg-neutral-950 text-white p-8 md:p-12 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black tracking-[0.25em] text-white uppercase flex items-center">
                  <Truck className="mr-2 h-4 w-4 text-neutral-400" />
                  Delhivery Express Direct
                </h2>
                <span className="text-[9px] bg-neutral-800 px-2 py-1 font-black tracking-widest text-neutral-300">PARTNER</span>
              </div>
              
              <p className="text-neutral-400 text-[11px] leading-relaxed mb-8 tracking-wide font-medium">
                Already have a tracking AWB from Delhivery? Enter it below to track directly on Delhivery's secure portal.
              </p>

              <form onSubmit={handleDirectDelhivery} className="flex flex-col space-y-6">
                <div className="relative flex">
                  <input
                    type="text"
                    placeholder="ENTER AWB NUMBER"
                    value={directAwb}
                    onChange={(e) => setDirectAwb(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-xs text-white p-4 w-full outline-none focus:border-neutral-600 tracking-widest font-bold placeholder:text-neutral-600"
                  />
                  <button 
                    type="submit"
                    className="bg-white text-black px-6 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column: Results Display */}
          <div className="lg:col-span-7">
            {orderData ? (
              <div className="border border-neutral-200 bg-white p-6 md:p-12 animate-fadeIn">
                
                {/* Top Info Banner */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 border-b border-neutral-100 pb-8 mb-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-2.5 py-1 bg-neutral-900 text-white text-[9px] font-black tracking-[0.2em] uppercase">
                        {formatStatus(orderData.status)}
                      </span>
                      <span className="text-xs font-black tracking-[0.15em] text-neutral-900">#{orderData.order_number}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest flex items-center mt-2">
                      <Clock className="inline mr-1 h-3 w-3" />
                      Placed on {new Date(orderData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  
                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Recipient</span>
                    <span className="text-sm font-bold text-black tracking-wide block uppercase">{orderData.customer_name}</span>
                  </div>
                </div>

                {/* Courier Info Section (Always Delhivery focused!) */}
                {orderData.tracking_number ? (
                  <div className="bg-neutral-50 p-6 mb-12 border border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                      <span className="text-[9px] font-black text-neutral-400 tracking-[0.2em] uppercase block mb-2">Logistics Partner</span>
                      <div className="flex items-center space-x-3">
                        <div className="font-serif italic font-bold text-lg tracking-tight">{orderData.carrier}</div>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                      <div className="mt-3 font-mono text-xs font-bold tracking-widest text-neutral-600">
                        AWB: {orderData.tracking_number}
                      </div>
                    </div>
                    <a 
                      href={`https://www.delhivery.com/track/package/${orderData.tracking_number}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="px-6 py-4 bg-black text-white text-[9px] font-black tracking-[0.25em] uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-3 text-center border border-transparent shrink-0"
                    >
                      <span>Track On Delhivery</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div className="bg-neutral-50 p-6 mb-12 border border-neutral-100 border-l-4 border-l-neutral-900">
                    <span className="text-[9px] font-black text-neutral-400 tracking-[0.2em] uppercase block mb-1">Shipment Status</span>
                    <p className="text-[11px] text-neutral-600 font-medium tracking-wide leading-relaxed">
                      Your parcel is currently being compiled at our premium warehouse. A Delhivery tracking link will activate here instantly upon handover to the courier.
                    </p>
                  </div>
                )}

                {/* Visual Steps Timeline */}
                <div className="space-y-8 relative">
                  <h3 className="text-[10px] font-black tracking-[0.3em] text-neutral-950 uppercase mb-8">Shipment Timeline</h3>
                  
                  <div className="relative">
                    {/* Timeline Connector Line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-[1.5px] bg-neutral-100"></div>

                    {/* Individual Steps */}
                    {[
                      { key: 'pending', label: 'Order Registered', desc: 'Order received and entered into compilation system.' },
                      { key: 'confirmed', label: 'Verified', desc: 'Payment verified, inventory allocation complete.' },
                      { key: 'processing', label: 'Curation', desc: 'Locating and retrieving authentic fragrances.' },
                      { key: 'packed', label: 'Quality Seal & Packaged', desc: 'Product undergoes authenticity verification and luxury boxing.' },
                      { key: 'shipped', label: 'Handover to Delhivery', desc: 'Shipment picked up by our trusted carrier partners.' },
                      { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Local Delhivery executive dispatched to your location.' },
                      { key: 'delivered', label: 'Successfully Delivered', desc: 'Package received and signed for.' }
                    ].map((s, index) => {
                      const currentStep = getStatusStep(orderData.status);
                      const isCompleted = index <= currentStep;
                      const isActive = index === currentStep;
                      
                      const historyItem = orderData.status_history?.find((h: any) => h.status === s.key);
                      const timestamp = historyItem ? historyItem.created_at : (s.key === 'shipped' ? orderData.shipped_at : (s.key === 'delivered' ? orderData.delivered_at : null));

                      return (
                        <div key={s.key} className={`flex gap-6 relative pb-10 last:pb-0 group ${isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                          
                          {/* Timeline Node indicator */}
                          <div className="relative z-10 mt-1.5">
                            <div className={`h-6 w-6 rounded-full border flex items-center justify-center bg-white transition-all duration-500 ${
                              isActive ? 'border-black ring-4 ring-neutral-100 scale-110' : 
                              isCompleted ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200'
                            }`}>
                              {isCompleted ? <CheckCircle2 size={14} /> : <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 mb-1">
                              <h4 className={`text-xs font-black uppercase tracking-[0.15em] ${isActive ? 'text-black' : isCompleted ? 'text-neutral-700' : 'text-neutral-400'}`}>
                                {s.label}
                              </h4>
                              {timestamp && isCompleted && (
                                <span className="text-[10px] font-bold font-mono tracking-wider text-neutral-400 bg-neutral-50 px-2 py-0.5">
                                  {new Date(timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed tracking-wide font-medium">
                              {s.desc}
                            </p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary Section */}
                <div className="mt-16 pt-16 border-t border-neutral-100">
                  <h3 className="text-[10px] font-black tracking-[0.3em] text-neutral-950 uppercase mb-8">Order Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    {/* Shipping info */}
                    <div>
                      <span className="text-[9px] font-black text-neutral-400 tracking-[0.2em] uppercase block mb-4">Shipping Destination</span>
                      <div className="text-xs text-neutral-600 space-y-1 font-medium tracking-wide">
                        <p className="font-bold text-black uppercase">{orderData.shipping_address?.name || orderData.customer_name}</p>
                        <p>{orderData.shipping_address?.address_line1}</p>
                        {orderData.shipping_address?.address_line2 && <p>{orderData.shipping_address?.address_line2}</p>}
                        <p>{orderData.shipping_address?.city}, {orderData.shipping_address?.state} {orderData.shipping_address?.pincode}</p>
                        <p>India</p>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div>
                      <span className="text-[9px] font-black text-neutral-400 tracking-[0.2em] uppercase block mb-4">Billing Snapshot</span>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-medium tracking-wide">
                          <span className="text-neutral-500 uppercase">Subtotal</span>
                          <span className="text-black">₹{Number(orderData.subtotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {orderData.discount_amount > 0 && (
                          <div className="flex justify-between text-[11px] font-medium tracking-wide">
                            <span className="text-red-500 uppercase">Discount</span>
                            <span className="text-red-500">-₹{Number(orderData.discount_amount).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] font-medium tracking-wide">
                          <span className="text-neutral-500 uppercase">Shipping</span>
                          <span className="text-black">₹{Number(orderData.shipping_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black pt-3 border-t border-neutral-100">
                          <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
                          <span className="text-black">₹{Number(orderData.total_amount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-neutral-400 tracking-[0.2em] uppercase block mb-4">Curated Items ({orderData.items?.length || 0})</span>
                    {orderData.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4 items-center py-4 border-b border-neutral-50 last:border-0">
                        <div className="w-14 h-14 bg-neutral-50 flex-shrink-0 border border-neutral-100 overflow-hidden">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-300 font-bold uppercase tracking-tighter text-center p-1">
                              Image Pending
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[11px] font-black text-black uppercase tracking-tight leading-tight">{item.product_name || 'Premium Fragrance'}</p>
                              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                                {item.size_ml ? `${item.size_ml}ML` : 'Standard'} • QTY: {item.quantity}
                              </p>
                            </div>
                            <p className="text-xs font-black text-black">₹{item.total_price.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mb-6 text-neutral-300 animate-pulse">
                  <Search size={24} />
                </div>
                <h3 className="text-xs font-black tracking-[0.3em] text-neutral-950 uppercase mb-2">No Search Conducted</h3>
                <p className="text-[11px] text-neutral-400 max-w-xs font-medium uppercase tracking-wider leading-relaxed">
                  Use the inputs on the left to find your shipment status or directly query tracking codes.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Help Banner */}
        <div className="mt-24 border-t border-neutral-100 pt-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h4 className="text-xs font-black tracking-[0.2em] text-black uppercase mb-2">Need assistance with your delivery?</h4>
            <p className="text-neutral-500 text-[11px] font-medium tracking-wider">Our premium client relations team is standing by to assist you.</p>
          </div>
          <div className="flex gap-6">
            <Link href="/contact-us" className="text-[10px] font-black text-black border-b-2 border-black tracking-[0.25em] uppercase pb-1 hover:text-neutral-600 hover:border-neutral-300 transition-all">
              CONTACT ASSISTANCE
            </Link>
            <Link href="/faq" className="text-[10px] font-black text-black border-b-2 border-black tracking-[0.25em] uppercase pb-1 hover:text-neutral-600 hover:border-neutral-300 transition-all">
              LOGISTICS FAQS
            </Link>
          </div>
        </div>

      </div>

      {/* ==================== SIMULATED GOOGLE OAUTH OVERLAY ==================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 transform scale-100 transition-transform">
            
            {/* Google Chrome Top Bar Decoration */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span className="text-xs font-medium text-gray-600 tracking-tight select-none">accounts.google.com</span>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Main Google Identity Body */}
            <div className="p-8 md:p-10 text-center">
              {/* Google Logo Container */}
              <div className="flex justify-center mb-6">
                <svg className="w-16" viewBox="0 0 74 24">
                  <g fill="none" fillRule="evenodd">
                    <path fill="#EA4335" d="M64.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0m-2.4 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#FBBC05" d="M52.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0m-2.4 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#4285F4" d="M40.5 12a5.5 5.5 0 01-8.9 4.3l-.1.1v.8c0 2.1-1.1 3.2-3 3.2-1.8 0-2.8-1.3-3.2-2.4l-2 1c.6 1.5 2.1 3.2 5.2 3.2 3.7 0 5.6-2.2 5.6-5.8V6.7h-2.3v.9a5.5 5.5 0 01-1.3-1.6m-2.5 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#34A853" d="M27.7 1.1H23V17h4.7z"/>
                    <path fill="#EA4335" d="M20.7 13.9c-.5-1.1-1.8-2-3.3-2a3 3 0 00-2.9 2.1l6.2-2.6zm-8.2-1.9a5.5 5.5 0 0110.2-2.9L22.4 10a3 3 0 00-5.2-.8l-.2.4 5.7 2.4-.7 1.6a5.4 5.4 0 01-9.7-1.7"/>
                    <path fill="#4285F4" d="M8.5 10v2.4H14c-.2 1.3-1.5 3.7-5.5 3.7a5.9 5.9 0 110-11.8c2.3 0 3.8 1 4.7 1.8l1.9-1.8C13.9 3.1 11.5 2 8.5 2A9.9 9.9 0 000 12a9.9 9.9 0 0010 10c5.4 0 9-3.8 9-9a9 9 0 00-.1-1.8z"/>
                  </g>
                </svg>
              </div>

              <h3 className="text-xl text-gray-900 font-normal tracking-tight mb-2">Sign in</h3>
              <p className="text-[13px] text-gray-600 font-normal mb-8">to continue to <strong className="text-black">Kozmocart</strong></p>

              <form onSubmit={handleGoogleAuth} className="text-left space-y-6">
                <div className="relative group border border-gray-300 rounded p-1 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                  <label className="block text-[10px] px-1 font-medium text-gray-500 absolute -top-2 left-3 bg-white select-none group-focus-within:text-blue-600 transition-colors">
                    Email or phone
                  </label>
                  <input 
                    type="email" 
                    required
                    autoFocus
                    placeholder="e.g., you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-transparent border-0 py-2.5 px-3 text-[15px] text-gray-900 outline-none focus:ring-0 placeholder-gray-300 tracking-wide"
                  />
                </div>

                <div className="relative group border border-gray-300 rounded p-1 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                  <label className="block text-[10px] px-1 font-medium text-gray-500 absolute -top-2 left-3 bg-white select-none group-focus-within:text-blue-600 transition-colors">
                    Full Name (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Alex V."
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full bg-transparent border-0 py-2.5 px-3 text-[15px] text-gray-900 outline-none focus:ring-0 placeholder-gray-300 tracking-wide"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button 
                    type="button"
                    className="text-[13px] text-blue-600 font-medium hover:bg-blue-50 py-2 px-3 rounded select-none"
                  >
                    Create account
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded text-[13px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[80px] shadow-sm hover:shadow"
                  >
                    {googleLoading ? 'Processing...' : 'Next'}
                  </button>
                </div>
              </form>

            </div>

            {/* Google Consent Footer */}
            <div className="bg-gray-50 px-8 py-4 text-[11px] text-gray-500 font-normal leading-relaxed select-none border-t border-gray-100 flex flex-wrap justify-between gap-4">
              <p>English (United States)</p>
              <div className="flex space-x-3">
                <span className="cursor-pointer hover:text-gray-700">Help</span>
                <span className="cursor-pointer hover:text-gray-700">Privacy</span>
                <span className="cursor-pointer hover:text-gray-700">Terms</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrder() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
