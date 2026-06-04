import React from 'react';
import { ShieldCheck, Truck, RotateCcw, CreditCard } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} />,
      title: "100% ORIGINAL",
      desc: "Authenticity Guaranteed"
    },
    {
      icon: <Truck size={32} strokeWidth={1.5} />,
      title: "FREE SHIPPING",
      desc: "On orders over ₹1,000"
    },
    {
      icon: <RotateCcw size={32} strokeWidth={1.5} />,
      title: "7 DAY RETURNS",
      desc: "Easy & Hassle Free"
    },
    {
      icon: <CreditCard size={32} strokeWidth={1.5} />,
      title: "SECURE PAYMENT",
      desc: "100% Safe Checkout"
    }
  ];

  return (
    <section className="bg-gray-50 py-12 border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left space-y-3 md:space-y-0 md:space-x-4">
              <div className="text-black">{badge.icon}</div>
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-black uppercase">{badge.title}</h4>
                <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase mt-1">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
