'use client';

import React from 'react';
import { Shield, Award, Truck, Sparkles } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="bg-white min-h-screen py-24 md:py-36 selection:bg-black selection:text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-6 block">OUR STORY</span>
            <h1 className="text-5xl md:text-7xl font-serif text-neutral-950 mb-8 font-light italic tracking-tight leading-[1.1]">
              The Art of <br/> Fine Perfumery.
            </h1>
            <div className="w-16 h-[2px] bg-black mb-8" />
            <p className="text-neutral-600 font-medium leading-relaxed tracking-wide text-[14px] mb-6">
              Pommastore was founded on a singular, uncompromising premise: that access to genuine, globally revered liquid art should be seamless and trustworthy. 
            </p>
            <p className="text-neutral-500 font-medium leading-relaxed tracking-wide text-[13px]">
              In an ecosystem frequently clouded by uncertainty, we envisioned a secure conduit between prestigious fragrance houses in Europe and Middle East, and the discerning, olfactory connoisseurs of the Indian subcontinent. We curate only original masterpieces.
            </p>
          </div>
          <div className="relative h-[400px] lg:h-[600px] w-full overflow-hidden bg-neutral-100 border border-neutral-200">
            <div 
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615655404700-397a557ca7bc?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center contrast-110 saturate-0"
              aria-label="Luxury perfume bottles curated elegantly"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <span className="text-[9px] font-black tracking-[0.3em] uppercase block mb-1 opacity-75">SINCE 2024</span>
              <p className="font-serif italic text-xl">Curating Authentic Masterpieces.</p>
            </div>
          </div>
        </div>
      </div>

      {/* The Core Pillars Banner */}
      <div className="bg-neutral-950 py-20 md:py-32 text-white mb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase mb-4 block">OUR MANIFESTO</span>
            <h2 className="text-3xl font-serif italic">Pillars of Excellence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] mb-4">Absolute Veracity</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed tracking-wider font-medium max-w-xs">
                Every unit disembarks directly from audited international distributors. Multiple checks guarantee 100% batch-traceable original liquid.
              </p>
            </div>
            
            <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-neutral-800">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800">
                <Award className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] mb-4">Exquisite Curation</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed tracking-wider font-medium max-w-xs">
                We do not stock arbitrary scents. We select the finest Extraits, Parfums, and exclusive editions from niche and designer lineages.
              </p>
            </div>

            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800">
                <Sparkles className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.25em] mb-4">Sensory Logistics</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed tracking-wider font-medium max-w-xs">
                Fragrances are temperature-sensitive. We keep inventory housed in climate-controlled luxury vaults until dispatched via specialized transit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative / Journey */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-24">
        <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-6 block">BEYOND LUXURY</span>
        <h2 className="text-3xl font-serif text-neutral-950 mb-8 font-light italic tracking-tight leading-tight">
          Our Uncompromising Promise
        </h2>
        <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-8" />
        <p className="text-[13px] text-neutral-600 leading-relaxed tracking-widest font-medium uppercase max-w-2xl mx-auto mb-12">
          "Fragrance is a profound language, a silent poem etched in space. It defines memories before a single word escapes the lips."
        </p>
        <div className="prose prose-neutral max-w-none text-[13px] tracking-wide text-neutral-500 font-medium leading-relaxed space-y-6 text-justify md:text-center">
          <p>
            Our operations operate at a global scale but serve you individually. From the moment you click purchase, the bottle travels in climate regulated zones, passes multiple authenticity inspections at our primary Indian hub, is secured inside multi-layered bespoke packaging, and travels to your doorstep via express freight networks like Delhivery.
          </p>
          <p>
            Welcome to the Inner Sanctum. Welcome to Pommastore.
          </p>
        </div>
      </div>

    </div>
  );
}
