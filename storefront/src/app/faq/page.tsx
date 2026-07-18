'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

type FAQItemProps = {
  question: string;
  answer: string;
  category: string;
};

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  const faqs: FAQItemProps[] = [
    {
      category: 'AUTHENTICITY',
      question: "Are your fragrances 100% original?",
      answer: "Absolutely. Pommastore holds a zero-tolerance policy towards counterfeits or grey-market adulterated products. Every single bottle is sourced directly from certified distributors, retains its original batch codes, and matches global brand inventory logs. You can verify the batch code upon arrival."
    },
    {
      category: 'AUTHENTICITY',
      question: "Why does my perfume look or smell slightly different from an older bottle?",
      answer: "Fragrance formulations can slightly vary over different production years due to international regulations (like IFRA banning specific raw elements) or natural harvesting variations in crops (e.g., Bergamot or Jasmine). Additionally, new bottles require maceration (resting) after transit to reveal their full, mature projection profile."
    },
    {
      category: 'SHIPPING',
      question: "Which carrier do you use and how long is the transit?",
      answer: "We predominantly use trusted express couriers such as Delhivery for pan-India safe transit. Standard shipping typically spans 3-5 business days for metropolitan cities and 5-8 business days for other regions after fulfillment from our secure climate-controlled vault."
    },
    {
      category: 'SHIPPING',
      question: "How do I track my order with Delhivery?",
      answer: "As soon as your consignment leaves our hub, a unique AWB code is sent via SMS and Email. You can input this AWB directly on our 'Track Order' page or via Delhivery's secure public tracking portal to view real-time transit updates."
    },
    {
      category: 'ORDERS',
      question: "Can I modify or cancel my order after placing it?",
      answer: "Orders enter our automated picking and secure wrapping system within 2 hours. If you need changes, please reach out to our Whatsapp Concierge immediately. Once the order status moves to 'Packed' or 'Shipped', modifications are legally and logistically restricted."
    },
    {
      category: 'RETURNS',
      question: "What is your return policy?",
      answer: "Due to hygiene and security controls regarding luxury liquids, products cannot be returned or exchanged once the primary seal/wrap is broken. If your item suffers transit damage, we offer immediate replacements provided you present a continuous, unedited HD video of unboxing the package."
    },
    {
      category: 'PAYMENTS',
      question: "Do you support Cash on Delivery (COD)?",
      answer: "Yes, we provide COD options up to limits of AED 15,000 across select pin codes serviced securely by Delhivery. For amounts exceeding this threshold, pre-payment via UPI or Cards is mandated to secure high-value consignments."
    }
  ];

  const categories = ['ALL', 'AUTHENTICITY', 'SHIPPING', 'RETURNS', 'ORDERS'];

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || f.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-white min-h-screen py-24 md:py-36 selection:bg-black selection:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-black tracking-[0.4em] text-neutral-400 uppercase mb-4 block">KNOWLEDGE HUB</span>
          <h1 className="text-4xl md:text-5xl font-serif text-neutral-950 mb-6 font-light italic tracking-tight">
            Frequently Asked <br/>Concierge Queries
          </h1>
          <div className="w-12 h-[1px] bg-neutral-300 mx-auto mb-8" />
        </div>

        {/* Search & Filter Controls */}
        <div className="mb-12 space-y-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="SEARCH YOUR TOPIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-neutral-200 bg-neutral-50 p-5 pl-12 text-xs tracking-widest font-bold text-black focus:border-black focus:bg-white transition-all outline-none rounded-none uppercase"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          <div className="flex flex-wrap gap-3 justify-center border-b border-neutral-100 pb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[9px] font-black tracking-[0.25em] border transition-all uppercase ${
                  activeCategory === cat ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200 hover:border-black hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion Grid */}
        <div className="space-y-4 animate-fadeIn">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => (
              <FAQAccordionItem key={idx} item={faq} />
            ))
          ) : (
            <div className="text-center py-16 border border-dashed border-neutral-200 text-neutral-400 text-xs uppercase font-bold tracking-widest">
              No corresponding records found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function FAQAccordionItem({ item }: { item: FAQItemProps }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-neutral-100 hover:border-neutral-200 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left transition-colors select-none bg-neutral-50/50 hover:bg-neutral-50"
      >
        <div className="pr-4">
          <span className="text-[8px] font-black text-neutral-400 tracking-widest block mb-2 uppercase">{item.category}</span>
          <h3 className="text-[12px] font-black uppercase text-neutral-900 tracking-[0.15em] leading-snug">{item.question}</h3>
        </div>
        <div className="shrink-0 ml-4">
          {isOpen ? <ChevronUp size={16} className="text-black" /> : <ChevronDown size={16} className="text-neutral-400" />}
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 border-t border-neutral-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 text-[12px] text-neutral-600 font-medium leading-relaxed tracking-wide">
          {item.answer}
        </div>
      </div>
    </div>
  );
}
