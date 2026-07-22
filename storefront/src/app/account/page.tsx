'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ShoppingBag, MapPin, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Account() {
  const { customer, token, logout, setAuth } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'settings'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    phone: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    country: 'India',
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push('/login');
      return;
    }
    
    if (customer) {
      setSettingsForm({
        full_name: customer.full_name || '',
        phone: customer.phone || '',
      });
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, addressesRes] = await Promise.allSettled([
          api.get('/account/orders'),
          api.get('/account/addresses')
        ]);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data);
        if (addressesRes.status === 'fulfilled') setAddresses(addressesRes.value.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, customer, router, isHydrated]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg({ type: '', text: '' });
    try {
      const res = await api.patch('/account/me', settingsForm);
      setAuth(res.data, token || ''); // Update auth store with new customer data
      setSettingsMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await api.post('/account/addresses', addressForm);
      setAddresses([...addresses, res.data]);
      setShowAddressForm(false);
      setAddressForm({
        label: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', phone: '', country: 'India', is_default: false
      });
    } catch (err) {
      console.error('Failed to save address', err);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.delete(`/account/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  if (!isHydrated || !customer) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-4xl font-serif text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-500 text-sm">Welcome back, {customer.full_name || customer.email}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 text-xs font-bold tracking-widest text-gray-400 hover:text-black transition-colors uppercase mt-4 md:mt-0"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Left: Sidebar */}
        <div className="w-full lg:w-1/4">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between p-4 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center space-x-4">
                <ShoppingBag size={18} />
                <span>Orders</span>
              </div>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between p-4 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'addresses' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center space-x-4">
                <MapPin size={18} />
                <span>Addresses</span>
              </div>
              <ChevronRight size={14} />
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between p-4 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === 'settings' ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center space-x-4">
                <Settings size={18} />
                <span>Settings</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </nav>

          <div className="mt-12 bg-gray-50 p-6">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">Loyalty Status</h3>
            <p className="text-xl font-serif text-gray-900 mb-1">{customer.loyalty_tier}</p>
            <p className="text-xs text-gray-500">{customer.loyalty_points} Points available</p>
            <div className="mt-4 h-1 bg-gray-200 w-full">
              <div className="h-full bg-black w-1/3" />
            </div>
            <Link 
              href="/rewards" 
              className="mt-6 flex items-center justify-between text-[10px] font-black tracking-widest text-black uppercase group"
            >
              <span>Redeem Rewards</span>
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right: Content */}
        <div className="w-full lg:w-3/4">
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-serif text-gray-900 mb-8">Recent Orders</h2>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-gray-50 animate-pulse w-full" />
                  ))}
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order: any) => (
                    <div key={order.id} className="border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-xs font-bold tracking-widest text-gray-900 uppercase">Order #{order.order_number}</span>
                          <span className="px-2 py-1 bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-tighter rounded">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 mb-1">AED {order.total_amount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.items.length} Items</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-6 py-3 border border-gray-200 text-[10px] font-bold tracking-widest hover:border-black transition-colors uppercase"
                      >
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 bg-gray-50 text-center rounded">
                  <p className="text-gray-400 italic text-sm mb-6">You haven't placed any orders yet.</p>
                  <Link href="/shop" className="text-xs font-bold tracking-widest text-black border-b-2 border-black pb-1 hover:text-gray-600 transition-all uppercase">
                    Explore Fragrances
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-serif text-gray-900">My Addresses</h2>
                <button 
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="px-6 py-3 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors"
                >
                  {showAddressForm ? 'Cancel' : 'Add New'}
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleSaveAddress} className="bg-gray-50 p-6 mb-8 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest">New Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Label (e.g. Home, Work)</label>
                      <input type="text" required value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Address Line 1</label>
                      <input type="text" required value={addressForm.address_line1} onChange={e => setAddressForm({...addressForm, address_line1: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Address Line 2 (Optional)</label>
                      <input type="text" value={addressForm.address_line2} onChange={e => setAddressForm({...addressForm, address_line2: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">City</label>
                      <input type="text" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">State</label>
                      <input type="text" required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pincode</label>
                      <input type="text" required value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number for this Address</label>
                      <input type="tel" required value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                    </div>
                  </div>
                  <button type="submit" disabled={savingAddress} className="w-full py-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </form>
              )}

              {loading ? (
                <div className="h-24 bg-gray-50 animate-pulse w-full" />
              ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-gray-100 p-6 relative">
                      {address.is_default && <span className="absolute top-4 right-4 text-[9px] font-bold tracking-widest text-white bg-black px-2 py-1 uppercase">Default</span>}
                      <p className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-widest">{address.label}</p>
                      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                        {address.address_line1}<br />
                        {address.address_line2 && <>{address.address_line2}<br /></>}
                        {[address.city, address.state && address.state !== address.city ? address.state : ''].filter(Boolean).join(', ')}{address.pincode && address.pincode !== '00000' && address.pincode !== '0' ? ` - ${address.pincode}` : ''}<br />
                        {address.phone && <span className="block mt-1 text-black font-bold">📞 {address.phone}</span>}
                        {address.country}
                      </p>
                      <button onClick={() => handleDeleteAddress(address.id)} className="text-[10px] font-bold tracking-widest text-red-500 uppercase hover:text-red-700 transition-colors border-b border-red-500 pb-0.5">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 bg-gray-50 text-center rounded">
                  <p className="text-gray-400 italic text-sm mb-6">You don't have any saved addresses.</p>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-serif text-gray-900 mb-8">Account Settings</h2>
              <div className="max-w-xl">
                {settingsMsg.text && (
                  <div className={`p-4 mb-6 text-xs font-bold tracking-widest text-center border ${settingsMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {settingsMsg.text}
                  </div>
                )}
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" disabled value={customer.email} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 cursor-not-allowed" />
                    <p className="text-[10px] text-gray-400 mt-2">Email address cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input type="text" value={settingsForm.full_name} onChange={e => setSettingsForm({...settingsForm, full_name: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="text" value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full bg-white border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={savingSettings} className="px-8 py-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
                      {savingSettings ? 'Updating...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Order Details Modal (Moved to root level for z-index safety) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-serif text-2xl">Order #{selectedOrder.order_number}</h3>
              <div className="flex items-center space-x-4">
                <a 
                  href={`${api.defaults.baseURL || '/api/v1'}/orders/${selectedOrder.id}/invoice`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-bold tracking-widest text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-all uppercase inline-block"
                >
                  📄 View Invoice
                </a>
                <button type="button" onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-black">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-b border-gray-50 pb-8">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="uppercase font-bold text-black">{selectedOrder.status.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                  <p className="uppercase font-medium">{selectedOrder.payment_method || '—'}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tracking</p>
                  {selectedOrder.tracking_number ? (
                    <>
                      <p className="font-medium">{selectedOrder.tracking_number}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{selectedOrder.carrier}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">Not available</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Shipping Address</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="font-bold text-black">
                        {(selectedOrder.shipping_address.name && selectedOrder.shipping_address.name !== 'New Customer') 
                          ? selectedOrder.shipping_address.name 
                          : (selectedOrder.customer_name && selectedOrder.customer_name !== 'New Customer' 
                            ? selectedOrder.customer_name 
                            : customer.full_name)}
                      </p>
                      <p>{selectedOrder.shipping_address.address_line1}</p>
                      {selectedOrder.shipping_address.address_line2 && <p>{selectedOrder.shipping_address.address_line2}</p>}
                      <p>{[selectedOrder.shipping_address.city, selectedOrder.shipping_address.state && selectedOrder.shipping_address.state !== selectedOrder.shipping_address.city ? selectedOrder.shipping_address.state : ''].filter(Boolean).join(', ')}{selectedOrder.shipping_address.pincode && selectedOrder.shipping_address.pincode !== '00000' && selectedOrder.shipping_address.pincode !== '0' ? ` - ${selectedOrder.shipping_address.pincode}` : ''}</p>
                      <p>Phone: {selectedOrder.shipping_address.phone || selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                )}

                {/* Notes / Gift Message */}
                {(selectedOrder.notes || selectedOrder.gift_message) && (
                  <div>
                    {selectedOrder.gift_message && (
                      <div className="mb-4">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Gift Message</h4>
                        <div className="bg-gray-50 p-4 rounded italic text-sm text-gray-700">
                          "{selectedOrder.gift_message}"
                        </div>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Notes</h4>
                        <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TIMELINE SECTION */}
              <div className="border-y border-gray-50 py-8">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Order Timeline</h4>
                <div className="relative pl-8 space-y-8">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
                  
                  {[
                    { key: 'pending', label: 'Ordered', desc: 'We have received your order.' },
                    { key: 'confirmed', label: 'Confirmed', desc: 'Your order has been confirmed.' },
                    { key: 'processing', label: 'Processing', desc: 'Your order is being processed.' },
                    { key: 'packed', label: 'Packed', desc: 'Items have been packed and are ready for shipment.' },
                    { key: 'shipped', label: 'Shipped', desc: 'Your order has been handed over to the courier.' },
                    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'The package is out for delivery.' },
                    { key: 'delivered', label: 'Delivered', desc: 'Package delivered successfully.' }
                  ].map((step, idx) => {
                    const historyItem = selectedOrder.status_history?.find((h: any) => h.status === step.key);
                    const isCompleted = !!historyItem;
                    
                    // Simple logic to find the "current" status for highlighting
                    const statusOrder = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
                    const currentIdx = statusOrder.indexOf(selectedOrder.status);
                    const stepIdx = statusOrder.indexOf(step.key);
                    const isPastOrCurrent = stepIdx <= currentIdx;

                    return (
                      <div key={step.key} className={`relative ${isPastOrCurrent ? 'opacity-100' : 'opacity-30'}`}>
                        {/* Dot */}
                        <div className={`absolute -left-[27px] mt-1 w-4 h-4 rounded-full border-2 bg-white z-10 ${isPastOrCurrent ? 'border-black' : 'border-gray-200'}`}>
                          {isPastOrCurrent && <div className="absolute inset-1 bg-black rounded-full" />}
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest">{step.label}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
                          </div>
                          {historyItem && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                              {new Date(historyItem.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Items</h4>
                <div className="space-y-6">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-center py-2">
                      <div className="w-16 h-16 bg-gray-50 flex-shrink-0 border border-gray-100">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-tighter text-center px-1">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-black uppercase tracking-tight">{item.product_name || 'Product'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                              {item.size_ml ? `${item.size_ml}ml` : ''} {item.sku ? `• SKU: ${item.sku}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-bold">AED {item.total_price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity} × AED {item.unit_price.toLocaleString('en-IN')}</p>
                          {item.discount_amount > 0 && (
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Saved AED {item.discount_amount.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Subtotal</span>
                  <span className="font-medium text-gray-900">AED {Number(selectedOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500 uppercase tracking-widest text-[10px] font-bold">Discount</span>
                    <span className="font-medium text-red-500">-AED {Number(selectedOrder.discount_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedOrder.shipping_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Shipping</span>
                    <span className="font-medium text-gray-900">AED {Number(selectedOrder.shipping_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                  <span className="font-serif">Total</span>
                  <span className="font-bold">AED {Number(selectedOrder.total_amount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Link 
                  href="/contact-us" 
                  className="text-[10px] font-bold tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase border-b border-transparent hover:border-black pb-1"
                >
                  Need help with this order?
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
