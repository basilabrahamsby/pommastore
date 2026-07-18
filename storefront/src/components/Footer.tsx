'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import api from '@/services/api';

import { useTranslation } from '@/locales/i18nContext';

/* ──────────────────── Social Icon SVGs ──────────────────── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20.07 12 20.07 12 20.07s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

/* ──────────────────── Payment SVG Icons ──────────────────── */
const VisaIcon = () => (
  <svg viewBox="0 0 48 30" className="h-6 w-auto">
    <rect width="48" height="30" rx="4" fill="#1A1F71"/>
    <text x="8" y="21" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="white" letterSpacing="0">VISA</text>
  </svg>
);
const MastercardIcon = () => (
  <svg viewBox="0 0 48 30" className="h-6 w-auto">
    <rect width="48" height="30" rx="4" fill="#252525"/>
    <circle cx="18" cy="15" r="10" fill="#EB001B"/>
    <circle cx="30" cy="15" r="10" fill="#F79E1B"/>
    <path d="M24 7.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z" fill="#FF5F00"/>
  </svg>
);
const StripeIcon = () => (
  <svg viewBox="0 0 48 30" className="h-6 w-auto">
    <rect width="48" height="30" rx="4" fill="#635BFF"/>
    <text x="50%" y="19" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white">Stripe</text>
  </svg>
);

const Footer = () => {
  const { t, locale } = useTranslation();
  const [layout, setLayout] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/settings/storefront_layout'),
      api.get('/brands'),
      api.get('/categories')
    ]).then(([resLayout, resBrands, resCats]) => {
      setLayout(resLayout.data);
      setBrands(resBrands.data);
      setCategories(resCats.data);
    }).catch(err => console.warn('Footer failed to fetch data', err));
  }, [locale]);

  const footer = layout?.footer_settings || {};
  const defaultAbout = locale === 'ar'
    ? (footer.aboutText_ar || footer.aboutText || t('footer_about_desc'))
    : (footer.aboutText || t('footer_about_desc'));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-neutral-950 text-white selection:bg-white selection:text-black">

      {/* Newsletter Banner Strip */}
      <div className="border-b border-neutral-800 bg-neutral-900">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase mb-1">{t('footer_stay_in_know')}</p>
            <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">{t('footer_subscribe_desc')}</h3>
          </div>
          {subscribed ? (
            <div className="text-sm font-bold text-green-400 tracking-widest uppercase font-sans">{t('footer_subscribed')}</div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto md:min-w-[380px] rounded overflow-hidden border border-neutral-700 focus-within:border-accent/60 transition-colors">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('footer_email_placeholder')}
                required
                className="bg-neutral-800/80 text-sm text-white px-4 py-3 w-full outline-none placeholder-neutral-500 font-sans"
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-white px-6 text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-colors font-sans"
              >
                {t('footer_subscribe_btn')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer Body */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-10">

        {/* Top 4-Col Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14 border-b border-neutral-800 pb-14">

          {/* About Column */}
          <div>
            <div className="mb-6">
              <img src="/logo.png" alt="Pommastore Logo" className="h-9 object-contain" />
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 font-medium">
              {defaultAbout}
            </p>
            {/* Social Icons */}
            <div className="flex items-center space-x-3">
              <a href={footer.facebook || "#"} target="_blank" rel="noreferrer" aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-accent flex items-center justify-center text-neutral-300 hover:text-white transition-all duration-300">
                <FacebookIcon />
              </a>
              <a href={footer.instagram || "#"} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-accent flex items-center justify-center text-neutral-300 hover:text-white transition-all duration-300">
                <InstagramIcon />
              </a>
              <a href={footer.twitter || "#"} target="_blank" rel="noreferrer" aria-label="X (Twitter)"
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-accent flex items-center justify-center text-neutral-300 hover:text-white transition-all duration-300">
                <TwitterXIcon />
              </a>
              <a href={footer.youtube || "#"} target="_blank" rel="noreferrer" aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-accent flex items-center justify-center text-neutral-300 hover:text-white transition-all duration-300">
                <YoutubeIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[11px] font-sans font-semibold tracking-[0.25em] uppercase mb-6 text-neutral-400 border-b border-neutral-800 pb-4">{t('footer_customer_service')}</h3>
            <ul className="space-y-3.5">
              {[
                { label: t('nav_track_order'), href: '/track-order' },
                { label: t('nav_return_policy'), href: '/return-policy' },
                { label: t('nav_about_us'), href: '/about-us' },
                { label: t('nav_faq'), href: '/faq' },
                { label: t('nav_contact_us'), href: '/contact-us' },
                { label: t('nav_rewards'), href: '/rewards' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="flex items-center gap-2 text-neutral-400 text-[12px] font-medium font-sans tracking-wide hover:text-white transition-colors group">
                    <ChevronRight size={10} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-[11px] font-sans font-semibold tracking-[0.25em] uppercase mb-6 text-neutral-400 border-b border-neutral-800 pb-4">{t('footer_shop')}</h3>
            <ul className="space-y-3.5">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?category=${cat.slug || cat.id}`} className="flex items-center gap-2 text-neutral-400 text-[12px] font-medium font-sans tracking-wide hover:text-white transition-colors group">
                    <ChevronRight size={10} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" />
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length === 0 && (
                <>
                  {[t('nav_men'), t('nav_women'), t('nav_unisex'), t('new_arrivals'), t('popular_picks'), t('nav_offers')].map(item => (
                    <li key={item}>
                      <Link href="/shop" className="flex items-center gap-2 text-neutral-400 text-[12px] font-medium tracking-wide hover:text-white transition-colors group">
                        <ChevronRight size={10} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5 flex-shrink-0" />
                        {item}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-[11px] font-sans font-semibold tracking-[0.25em] uppercase mb-6 text-neutral-400 border-b border-neutral-800 pb-4">{t('footer_contact_title')}</h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mb-0.5">{locale === 'ar' ? 'الهاتف' : 'Phone'}</p>
                  <a href={`tel:${footer.phone || '+919999999999'}`} className="text-neutral-300 text-sm font-medium hover:text-white transition-colors">
                    {footer.phone || "+91 99999 99999"}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mb-0.5">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <a href={`mailto:${footer.email || 'support@pommastore.com'}`} className="text-neutral-300 text-sm font-medium hover:text-white transition-colors">
                    {footer.email || "support@pommastore.com"}
                  </a>
                </div>
              </li>
              {layout?.company?.gst_number && (
                <li className="flex items-start gap-3">
                  <MapPin size={15} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mb-0.5">GST</p>
                    <span className="text-neutral-300 text-sm font-medium">{layout.company.gst_number}</span>
                  </div>
                </li>
              )}
              <li className="pt-2">
                <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase mb-1">{t('footer_authenticity')}</p>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">{t('footer_authenticity_desc')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Olfactory Sitemap Directory - All Brands & Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 border-b border-neutral-800 pb-12">
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase mb-4">{t('footer_all_houses')}</h4>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {brands.map((brand) => (
                <Link key={brand.id} href={`/shop?brand=${brand.id}`} className="text-neutral-500 hover:text-neutral-200 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200">
                  {locale === 'ar' ? (brand.name_ar || brand.name) : brand.name}
                </Link>
              ))}
              {brands.length === 0 && <span className="text-neutral-700 text-[11px] font-bold uppercase tracking-widest">{t('footer_no_brands')}</span>}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase mb-4">{t('footer_all_categories')}</h4>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/shop?category=${cat.slug || cat.id}`} className="text-neutral-500 hover:text-neutral-200 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200">
                  {cat.name}
                </Link>
              ))}
              {categories.length === 0 && <span className="text-neutral-700 text-[11px] font-bold uppercase tracking-widest">{t('footer_no_categories')}</span>}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-neutral-700 uppercase text-center md:text-left">
              Powered by{' '}
              <a 
                href="https://teqmates.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-neutral-500 hover:text-white transition-colors"
              >
                Teqmates
              </a>
            </p>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold tracking-widest text-neutral-700 uppercase mr-1">{t('footer_we_accept')}</span>
            <VisaIcon />
            <MastercardIcon />
            <StripeIcon />
          </div>

          <div className="flex items-center gap-5 text-[10px] text-neutral-600 font-bold uppercase tracking-wider">
            <Link href="/privacy-policy" className="hover:text-neutral-300 transition-colors">{locale === 'ar' ? 'الخصوصية' : 'Privacy'}</Link>
            <Link href="/terms-conditions" className="hover:text-neutral-300 transition-colors">{locale === 'ar' ? 'الشروط' : 'Terms'}</Link>
            <Link href="/return-policy" className="hover:text-neutral-300 transition-colors">{locale === 'ar' ? 'الإرجاع' : 'Returns'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
