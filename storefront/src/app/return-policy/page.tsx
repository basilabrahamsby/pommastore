'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

export default function ReturnPolicy() {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/storefront_layout')
      .then(res => {
        if (res.data && res.data.return_policy) {
          setPolicy(res.data.return_policy);
        }
      })
      .catch(err => {
        console.warn('Failed to load dynamic return policy settings', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Static fallback values if database hasn't been initialized with legal copy yet
  const defaultPolicy = {
    title: "Returns & Exchange Policy",
    lastUpdated: "Last updated June 2026",
    authenticityTitle: "100% Authenticity",
    authenticityDesc: "Every fragrance dispatched from Pommastore is completely sealed and sourced directly. We guarantee absolute authenticity.",
    windowTitle: "7-Day Window",
    windowDesc: "Requests for returns or replacements due to transit damage or shipping errors are accepted within 7 days of delivery.",
    contentHtml: `
      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">1. General Overview</h2>
        <p>
          At Pommastore, we specialize in premium, personal-care items namely liquid luxury perfumes and colognes. 
          Due to hygiene protocols, the strict personal nature of fragrances, and safety mandates surrounding flammable liquids, 
          <strong> products cannot be returned once the primary seal or outer cellophane wrap has been broken or altered</strong>.
        </p>
        <p>
          We highly recommend our clients to be thoroughly satisfied and verified with their olfactory selection before breaking the security seals.
        </p>
      </section>

      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black flex items-center">
          2. Valid Grounds for Return or Exchange
        </h2>
        <p>
          Pommastore handles exceptions under very strict quality controls. We will issue replacements, exchanges, or full refunds if:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-neutral-500">
          <li>The received product suffered severe physical breakage/leakage during transit.</li>
          <li>The physical item, volume (ml), or fragrance differs completely from your ordered invoice.</li>
          <li>The atomiser mechanism is proven defective upon the very first attempted use.</li>
        </ul>
        <div class="bg-amber-50/50 border border-amber-100 p-5 text-[12px] text-neutral-700 mt-4 font-bold">
          <strong>Crucial Mandate:</strong> To claim transit damage, clients MUST record an uninterrupted, high-definition video of unboxing the outer courier packaging till the extraction of the actual perfume bottle.
        </div>
      </section>

      <section class="space-y-4 border-b border-neutral-100 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">3. Process to Initiate</h2>
        <p>
          Should your package meet the valid criteria outlined above, please proceed as follows:
        </p>
        <ol class="list-decimal pl-5 space-y-4 text-neutral-500 font-medium">
          <li>
            <span class="text-black font-black tracking-wide">Contact Concierge:</span> Email us at <span class="text-black font-black">concierge@pommastore.com</span> within 48 hours of delivery. Include your <strong>Order Number</strong> and the <strong>Unboxing Video</strong>.
          </li>
          <li>
            <span class="text-black font-black tracking-wide">Internal Review:</span> Our warehouse auditing team will analyze the metadata and footage within 48 business hours.
          </li>
          <li>
            <span class="text-black font-black tracking-wide">Reverse Logistics:</span> If approved, we will schedule our partners (such as Delhivery) to safely secure the return consignment from your address free of cost.
          </li>
          <li>
            <span class="text-black font-black tracking-wide">Resolution:</span> Once our inspectors verify the physical return matches the video, we will dispatch the pristine replacement immediately.
          </li>
        </ol>
      </section>

      <section class="space-y-4 pb-10">
        <h2 class="text-sm font-black uppercase tracking-[0.2em] text-black">4. Non-Returnable Scenarios</h2>
        <p>
          We absolutely cannot accept returns based on olfactory preferences, reformulation issues, lack of projection on skin, or open sprayed bottles.
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
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">CLIENT PROMISE</span>
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
            <RefreshCw className="w-6 h-6 text-black mt-1 shrink-0" />
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
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2">Still have questions?</h3>
            <p className="text-[11px] text-neutral-400 tracking-widest font-medium">Connect with our client relations for tailored assistance.</p>
          </div>
          <Link href="/contact-us" className="px-6 py-4 bg-white text-black text-[9px] font-black tracking-[0.25em] uppercase hover:bg-neutral-200 transition-all flex items-center shrink-0">
            CONTACT ASSISTANCE <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
