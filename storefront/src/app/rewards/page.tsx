'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { 
  Trophy, 
  Gift, 
  Ticket, 
  Star, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function Rewards() {
  const { customer, token } = useAuthStore();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loyalty/rewards');
      setRewards(res.data);
    } catch (err) {
      console.error('Failed to fetch rewards', err);
      setError('Could not load rewards gallery. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-20 animate-fadeIn">
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">LOYALTY & PRIVILEGES</span>
          <h1 className="text-4xl md:text-6xl font-serif text-neutral-950 mb-6 italic font-light tracking-tight">
            The Rewards Gallery.
          </h1>
          <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-6" />
          <p className="text-neutral-500 text-xs md:text-sm max-w-md mx-auto font-medium uppercase tracking-widest leading-relaxed">
            Exchange your accumulated loyalty points for exclusive signature gifts and privileges.
          </p>
        </div>

        {/* Points Status Card (if logged in) */}
        {customer && (
          <div className="mb-20 bg-neutral-950 text-white p-8 md:p-12 relative overflow-hidden group shadow-2xl">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-900 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
              <div>
                <span className="text-[9px] font-black tracking-[0.3em] text-yellow-500 uppercase mb-4 block">YOUR CURRENT STATUS</span>
                <div className="flex items-baseline space-x-4">
                  <h2 className="text-5xl md:text-7xl font-serif italic text-white">{customer.loyalty_points}</h2>
                  <span className="text-sm font-black tracking-[0.2em] text-neutral-400 uppercase">Available Points</span>
                </div>
                <div className="mt-8 flex items-center space-x-4">
                  <div className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-[10px] font-black tracking-[0.2em] uppercase rounded-full">
                    {customer.loyalty_tier} MEMBER
                  </div>
                  <p className="text-[11px] text-neutral-400 font-medium tracking-wide">
                    Next Tier: <span className="text-white">Silver</span> (Requires {Math.max(0, 5000 - customer.loyalty_points)} more points)
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <Link 
                  href="/shop"
                  className="bg-white text-black px-8 py-4 text-[10px] font-black tracking-[0.2em] uppercase hover:bg-neutral-100 transition-all flex items-center justify-center space-x-3"
                >
                  <ShoppingBag size={14} />
                  <span>Earn More Points</span>
                </Link>
                <Link 
                  href="/account"
                  className="bg-transparent border border-neutral-800 text-neutral-400 px-8 py-4 text-[10px] font-black tracking-[0.2em] uppercase hover:border-neutral-600 hover:text-white transition-all text-center"
                >
                  View Activity History
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-neutral-50 animate-pulse border border-neutral-100"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-neutral-50 p-12 text-center border border-neutral-100">
            <AlertCircle className="mx-auto h-8 w-8 text-neutral-300 mb-4" />
            <p className="text-xs font-black tracking-widest text-neutral-400 uppercase">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {rewards.map((reward) => {
              const canAfford = customer ? customer.loyalty_points >= reward.point_cost : false;
              
              const getRewardIcon = (type: string) => {
                switch(type) {
                  case 'trip': return <ArrowRight size={12} className="rotate-[-45deg] text-neutral-400" />;
                  case 'occasion': return <Star size={12} className="text-neutral-400" />;
                  case 'activity': return <Sparkles size={12} className="text-neutral-400" />;
                  case 'voucher': return <Ticket size={12} className="text-neutral-400" />;
                  default: return <Gift size={12} className="text-neutral-400" />;
                }
              };

              return (
                <div id={reward.id} key={reward.id} className="group relative bg-white overflow-hidden transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-neutral-100 flex flex-col h-full scroll-mt-32">
                  {/* Point Badge - Floating with Glow */}
                  <div className="absolute top-6 right-6 z-20">
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-500 ${
                      canAfford 
                        ? 'bg-neutral-950 text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] group-hover:scale-110' 
                        : 'bg-white/90 backdrop-blur-md border border-neutral-200 text-neutral-400'
                    }`}>
                      {reward.point_cost} PTS
                    </div>
                  </div>

                  {/* Image Container with Parallax Effect */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-neutral-50 flex-shrink-0">
                    <img 
                      src={reward.image_url || '/kozmocart/placeholder-perfume.png'} 
                      alt={reward.name} 
                      className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>

                  {/* Details Section */}
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-4 h-[1px] bg-neutral-300"></div>
                      <span className="text-[9px] font-black tracking-[0.3em] text-neutral-400 uppercase">{reward.reward_type}</span>
                    </div>

                    <h3 className="text-base font-medium text-neutral-900 uppercase tracking-[0.05em] mb-3 group-hover:text-neutral-950 transition-colors">
                      {reward.name}
                    </h3>
                    
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium mb-6 line-clamp-2 italic">
                      {reward.description}
                    </p>

                    {/* Glassmorphism Metadata Card */}
                    {reward.reward_metadata && Object.keys(reward.reward_metadata).length > 0 && (
                      <div className="mt-auto mb-8 p-4 bg-neutral-50/50 backdrop-blur-sm border border-neutral-100 rounded-lg space-y-2 group-hover:bg-neutral-50 transition-colors">
                        {Object.entries(reward.reward_metadata).map(([key, val]: [string, any]) => (
                          <div key={key} className="flex justify-between items-center text-[8px] uppercase tracking-[0.1em]">
                            <span className="text-neutral-400 font-bold">{key}</span>
                            <span className="text-neutral-900 font-black">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button 
                      disabled={!canAfford}
                      className={`w-full py-4 text-[9px] font-black tracking-[0.25em] uppercase border transition-all ${
                        canAfford 
                          ? 'bg-black border-black text-white hover:bg-neutral-800' 
                          : 'bg-transparent border-neutral-200 text-neutral-300 cursor-not-allowed'
                      }`}
                    >
                      {customer ? (canAfford ? 'Redeem Now' : 'Insufficient Points') : 'Login to Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works section */}
        <div className="border-t border-neutral-100 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div>
              <h4 className="text-xs font-black tracking-[0.3em] text-neutral-950 uppercase mb-8">How Redemption Works</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-medium mb-8 uppercase tracking-widest">
                Redeeming your privileges is a seamless experience tailored for our discerning clientele.
              </p>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    <span className="text-[10px] font-black">01</span>
                  </div>
                  <h5 className="text-[10px] font-black tracking-widest uppercase">Select your gift</h5>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-medium pl-11">
                  Choose from our curated collection of signature fragrances, discovery sets, and luxury accessories.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    <span className="text-[10px] font-black">02</span>
                  </div>
                  <h5 className="text-[10px] font-black tracking-widest uppercase">Instant Fulfillment</h5>
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed font-medium pl-11">
                  Vouchers are credited instantly to your vault. Physical gifts are added to your next shipment or dispatched individually.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        {!customer && (
          <div className="mt-20 bg-neutral-50 p-12 text-center border border-neutral-100">
            <h4 className="text-xl font-serif text-neutral-900 mb-4">Join the Kozmocart Inner Circle.</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-8 font-medium uppercase tracking-widest leading-relaxed">
              Sign up today and receive 10 complimentary points instantly to start your journey.
            </p>
            <Link 
              href="/register"
              className="inline-block bg-black text-white px-10 py-5 text-[10px] font-black tracking-[0.25em] uppercase hover:bg-neutral-800 transition-all"
            >
              Initialize Account
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
