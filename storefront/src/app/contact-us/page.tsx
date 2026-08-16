'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import api from '@/services/api';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    api.get('/settings/storefront_layout')
      .then(res => setCompanyInfo(res.data))
      .catch(err => console.warn('Failed to fetch layout on contact page', err));
  }, []);

  const phone = companyInfo?.footer_settings?.phone || companyInfo?.company?.phone || '+971 4 453 9119';
  const email = companyInfo?.footer_settings?.email || companyInfo?.company?.email || 'sales@poshgallery.ae';
  const companyName = companyInfo?.company?.companyName || 'POSH NICHE PERFUMES & COSMETICS TRADING LLC';
  const registeredAddress = companyInfo?.company?.registeredAddress || 'Office No. C-81, Al Muteena, Dubai, United Arab Emirates';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate client relations API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <div className="bg-white min-h-screen py-24 md:py-36 selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-20 animate-fadeIn">
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">CLIENT RELATIONS</span>
          <h1 className="text-5xl md:text-6xl font-serif text-neutral-950 mb-6 font-light italic tracking-tight leading-[1.1]">
            Establish <br/>Connection.
          </h1>
          <div className="w-16 h-[1px] bg-neutral-300 mb-6" />
          <p className="text-neutral-500 text-xs md:text-sm font-medium uppercase tracking-[0.2em] max-w-md leading-relaxed">
            Connect with our dedicated fragrance concierge for premium assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          
          {/* Left Side: Information Blocks */}
          <div className="lg:col-span-5 space-y-12">
            
            <div className="space-y-10 pb-10 border-b border-neutral-100">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-black">Channels</h3>
              
              <div className="flex items-start space-x-5">
                <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
                  <Phone size={16} className="text-black" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Telephone Concierge</span>
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-sm font-bold text-black hover:opacity-70 transition-opacity font-mono">{phone}</a>
                </div>
              </div>

              <div className="flex items-start space-x-5">
                <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
                  <Mail size={16} className="text-black" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Digital Correspondence</span>
                  <a href={`mailto:${email}`} className="text-sm font-bold text-black hover:opacity-70 transition-opacity font-medium">{email}</a>
                </div>
              </div>
            </div>

            <div className="space-y-8 pb-10 border-b border-neutral-100">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-black">Temporal Availability</h3>
              
              <div className="flex items-start space-x-5">
                <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
                  <Clock size={16} className="text-black" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Operational Hours</span>
                  <p className="text-[12px] text-neutral-600 font-medium leading-relaxed">
                    Monday – Saturday <br/>
                    <span className="text-black font-bold font-mono">09:00 AM – 06:00 PM GST (Dubai Time)</span>
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-2 font-medium italic">Closed on national holidays.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-black">Hub Location</h3>
              <div className="flex items-start space-x-5">
                <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 shrink-0">
                  <MapPin size={16} className="text-black" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-neutral-400 tracking-widest uppercase block mb-1">Corporate Offices</span>
                  <p className="text-[12px] text-neutral-600 font-medium leading-relaxed">
                    <span className="font-bold text-black">{companyName}</span> <br/>
                    {registeredAddress}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side: Interactive Premium Form */}
          <div className="lg:col-span-7">
            <div className="bg-neutral-50 border border-neutral-100 p-8 md:p-16 relative overflow-hidden">
              
              {sent ? (
                <div className="text-center py-16 animate-fadeIn">
                  <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={20} />
                  </div>
                  <h3 className="text-lg font-serif italic text-black mb-4">Message Transmitted</h3>
                  <p className="text-[12px] text-neutral-500 max-w-sm mx-auto leading-relaxed font-medium">
                    Thank you. Your transmission was logged into our system. A client relations executive will initiate contact within 12 business hours.
                  </p>
                  <button 
                    onClick={() => setSent(false)}
                    className="mt-8 text-[10px] font-black tracking-[0.2em] uppercase text-black border-b-2 border-black pb-1 hover:text-neutral-500"
                  >
                    SEND ANOTHER ENQUIRY
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-black mb-2">Secure Transmission</h3>
                    <p className="text-[11px] text-neutral-400 tracking-wide font-medium">Fill out the fields below to directly signal our HQ.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Signature Name</label>
                        <input 
                          type="text" 
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-transparent border-b border-neutral-300 py-3 px-0 text-sm focus:border-black outline-none transition-all font-medium placeholder:text-neutral-200 rounded-none" 
                          placeholder="e.g., Alex V."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Digital Address</label>
                        <input 
                          type="email" 
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-transparent border-b border-neutral-300 py-3 px-0 text-sm focus:border-black outline-none transition-all font-medium placeholder:text-neutral-200 rounded-none" 
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Subject of Inquiry</label>
                      <input 
                        type="text" 
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full bg-transparent border-b border-neutral-300 py-3 px-0 text-sm focus:border-black outline-none transition-all font-medium placeholder:text-neutral-200 rounded-none" 
                        placeholder="e.g., Order Logistics, Product Veracity"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-black uppercase tracking-[0.3em] mb-3">Message Transcript</label>
                      <textarea 
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-transparent border border-neutral-200 p-4 text-sm focus:border-black outline-none transition-all font-medium placeholder:text-neutral-200 resize-none rounded-none" 
                        placeholder="State your requirements here in detail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black text-white py-5 text-[10px] font-black tracking-[0.35em] hover:bg-neutral-800 transition-all flex items-center justify-center space-x-3 disabled:bg-neutral-200"
                    >
                      {loading ? 'TRANSMITTING...' : (
                        <>
                          <span>DISPATCH MESSAGE</span>
                          <Send size={12} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
