'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { Scale, ArrowRight, ShieldAlert } from 'lucide-react';

export default function TermsConditions() {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/storefront_layout')
      .then(res => {
        if (res.data && res.data.terms_conditions) {
          setPolicy(res.data.terms_conditions);
        }
      })
      .catch(err => {
        console.warn('Failed to load dynamic terms conditions settings', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Static fallback values if database hasn't been initialized with legal copy yet
  const defaultPolicy = {
    title: "Terms & Conditions",
    lastUpdated: "Last updated June 2026",
    authenticityTitle: "Age Mandate",
    authenticityDesc: "By utilizing Pommastore storefront, you affirm you are at least 18 years of age or accessing under familial supervision.",
    windowTitle: "Commercial Fair Use",
    windowDesc: "We prohibit automated bot crawlers or resellers from executing speculative bulk orders. We reserve cancellation rights.",
    contentHtml: `
      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">1. Terms of Use</h2>
        <p>
          Welcome to Pommastore. By using this storefront or subscribing to our concierge, you agree to comply with our commercial terms and local statutory mandates.
        </p>
        <p>
          We provide high-end, premium personal fragrances directly to luxury consumers. All contents of this storefront are protected under national copyright regulations.
        </p>
      </section>

      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">2. Purchase Agreements & Cancellations</h2>
        <p>
          Due to the exclusive, imported nature of limited luxury fragrances, catalog prices are subject to dynamic correction without prior notice. 
          We reserve full rights to restrict order quantities or cancel suspicious bulk transactions.
        </p>
      </section>

      <section class="space-y-4 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">3. Intellectual Assets</h2>
        <p>
          All brand titles, custom product photography, liquid obsidian illustrations, and Nelphim type styles are protected under intellectual property regulations and belong solely to Pommastore.
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
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">LEGAL FRAMEWORK</span>
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
            <Scale className="w-6 h-6 text-black mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-2">{activePolicy.authenticityTitle}</h3>
              <p className="text-[11px] text-neutral-500 font-medium leading-relaxed tracking-wide">
                {activePolicy.authenticityDesc}
              </p>
            </div>
          </div>
          <div className="bg-neutral-50 p-8 border border-neutral-100 flex items-start space-x-4">
            <ShieldAlert className="w-6 h-6 text-black mt-1 shrink-0" />
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
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2">Questions about our terms?</h3>
            <p className="text-[11px] text-neutral-400 tracking-widest font-medium">Connect with our corporate legal counsel desk.</p>
          </div>
          <Link href="/contact-us" className="px-6 py-4 bg-white text-black text-[9px] font-black tracking-[0.25em] uppercase hover:bg-neutral-200 transition-all flex items-center shrink-0">
            CONTACT COUNSEL <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
