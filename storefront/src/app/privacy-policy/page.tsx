'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/storefront_layout')
      .then(res => {
        if (res.data && res.data.privacy_policy) {
          setPolicy(res.data.privacy_policy);
        }
      })
      .catch(err => {
        console.warn('Failed to load dynamic privacy policy settings', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Static fallback values if database hasn't been initialized with legal copy yet
  const defaultPolicy = {
    title: "Privacy Policy",
    lastUpdated: "Last updated June 2026",
    authenticityTitle: "100% Secure Data",
    authenticityDesc: "All personal identifiers and transactions are protected via AES-256 standard encryption protocols. Your data is private.",
    windowTitle: "Zero Third-Party Sharing",
    windowDesc: "We do not sell, rent, or lease your private personal information, olfactory profiles, or browsing habits under any conditions.",
    contentHtml: `
      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">1. Collection of Personal Information</h2>
        <p>
          At Pommastore, we collect necessary customer details to fulfill orders and provide tailored luxury fragrances recommendations. 
          This includes identity details (name, email), shipping descriptors, contact numbers, and billing data.
        </p>
        <p>
          We will only store information that is relevant for transaction fulfillment and account security controls.
        </p>
      </section>

      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">2. Protection Protocols</h2>
        <p>
          We implement standard, high-grade security patches, SSL transmission channels, and database isolation frameworks to shield details from unauthorized breaches.
        </p>
        <p>
          Our payment processing is fully outsourced to PCI-DSS certified gateway providers like Stripe; no credit card details are ever retained on Pommastore databases.
        </p>
      </section>

      <section class="space-y-4 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">3. Tracking & Cookies</h2>
        <p>
          We utilize operational cookies to maintain secure persistent shopping baskets, authenticate user sessions, and preserve custom theme choices.
        </p>
      </section>
    `
  };

  const activePolicy = policy || defaultPolicy;

  return (
    <div className="bg-white min-h-screen py-24 md:py-36">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-16 animate-fadeIn">
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">DATA INTEGRITY</span>
          <h1 className="text-4xl md:text-5xl font-serif text-neutral-950 mb-6 font-light italic tracking-tight leading-tight uppercase">
            {activePolicy.title}
          </h1>
          <div className="w-12 h-[1px] bg-neutral-300 mb-6" />
          <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">
            {activePolicy.lastUpdated}
          </p>
        </div>

        {/* Highlights banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-neutral-50 p-8 border border-neutral-100 flex items-start space-x-4">
            <ShieldCheck className="w-6 h-6 text-black mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">{activePolicy.authenticityTitle}</h3>
              <p className="text-[11px] text-neutral-500 font-medium leading-relaxed tracking-wide">
                {activePolicy.authenticityDesc}
              </p>
            </div>
          </div>
          <div className="bg-neutral-50 p-8 border border-neutral-100 flex items-start space-x-4">
            <Lock className="w-6 h-6 text-black mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">{activePolicy.windowTitle}</h3>
              <p className="text-[11px] text-neutral-500 font-medium leading-relaxed tracking-wide">
                {activePolicy.windowDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Body (Rich HTML configured from Admin) */}
        <div 
          className="prose prose-neutral max-w-none font-medium text-[13px] tracking-wide text-neutral-600 leading-relaxed space-y-10"
          dangerouslySetInnerHTML={{ __html: activePolicy.contentHtml }}
        />

        {/* CTA */}
        <div className="mt-16 bg-neutral-950 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2">Have privacy concerns?</h3>
            <p className="text-[11px] text-neutral-400 tracking-widest font-medium">Get in touch with our dedicated Data Compliance officer.</p>
          </div>
          <Link href="/contact-us" className="px-6 py-4 bg-white text-black text-[9px] font-black tracking-[0.25em] uppercase hover:bg-neutral-200 transition-all flex items-center shrink-0">
            CONTACT CONCIERGE <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
