'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getMediaUrl } from '@/services/media';
import { Mail, Lock, ArrowRight, Smartphone, ShieldCheck, X } from 'lucide-react';
import { useTranslation } from '@/locales/i18nContext';

function LoginContent() {
  const { t, locale } = useTranslation();
  const continueRef = React.useRef<HTMLDivElement>(null);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cmsLayout, setCmsLayout] = useState<any>(null);

  // Simulated Google SSO states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.includes('@')) return;
    
    setGoogleLoading(true);
    try {
      const res = await api.post('/auth/google', {
        email: googleEmail.trim(),
        name: googleName.trim() || googleEmail.split('@')[0],
        token: "simulated-google-sso-login-token"
      });
      setAuth(res.data.customer, res.data.access_token);
      
      // Sync local cart with backend
      const { syncCartWithServer, useCartStore } = await import('@/store/cartStore');
      await syncCartWithServer();

      setShowGoogleModal(false);
      const cartItems = useCartStore.getState().items;
      if (cartItems && cartItems.length > 0) {
        router.push('/checkout?section=continue');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google sign-in simulation failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const section = searchParams?.get('section');
    if (section === 'continue' && continueRef?.current) {
      continueRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Fetch storefront layout settings
    api.get('/settings/storefront_layout')
      .then((res) => {
        setCmsLayout(res.data);
      })
      .catch((err) => {
        console.warn('Failed to fetch storefront layout for login background', err);
      });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (step === 'verify' && otpRef.current) {
      otpRef.current.focus();
    }
  }, [step]);

  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (timer > 0) return;

    setLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      const payload = loginMethod === 'email' ? { email: identifier } : { phone: identifier };
      await api.post('/auth/otp/send', payload);
      setStep('verify');
      setOtp(''); // Clear previous OTP on resend
      setTimer(60); // 60 seconds resend timer
      if (step === 'verify') {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        [loginMethod]: identifier,
        otp
      };
      const res = await api.post('/auth/otp/verify', payload);
      setAuth(res.data.customer, res.data.access_token);
      
      // Sync local cart with backend
      const { syncCartWithServer, useCartStore } = await import('@/store/cartStore');
      await syncCartWithServer();

      const cartItems = useCartStore.getState().items;
      if (cartItems && cartItems.length > 0) {
        router.push('/checkout?section=continue');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const bgImage = cmsLayout?.login_bg_image 
    ? getMediaUrl(cmsLayout.login_bg_image) 
    : "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="min-h-screen flex flex-col md:flex-row mt-20 md:mt-0">
      {/* Left Side - Luxury Branding */}
      <div className="hidden md:flex md:w-1/2 bg-black relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0">
           <img 
             src={bgImage} 
             alt="Luxury Perfumery Background" 
             className="w-full h-full object-cover opacity-60" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/85" />
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-white text-4xl md:text-5xl font-serif tracking-[0.2em] uppercase mb-8 leading-tight font-normal">
            The Art of <br/> <span className="text-[#d4af37]">Fragrance</span>
          </h2>
          <div className="w-16 h-[1px] bg-[#d4af37]/80 mx-auto mb-8" />
          <p className="text-neutral-400 font-light font-montserrat text-[10px] md:text-xs tracking-[0.3em] uppercase leading-relaxed max-w-md mx-auto">
            Exclusive access to the world's most <br/> prestigious perfume houses.
          </p>
          <div className="mt-16 flex items-center justify-center space-x-8 text-neutral-400 font-montserrat">
            <div className="flex flex-col items-center">
               <ShieldCheck size={20} className="text-[#d4af37]" />
               <span className="text-[9px] mt-2 tracking-[0.25em] font-semibold uppercase">AUTHENTIC</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
               <Smartphone size={20} className="text-[#d4af37]" />
               <span className="text-[9px] mt-2 tracking-[0.25em] font-semibold uppercase">SECURE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 md:p-20">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="mb-12">
            <Link href="/" className="md:hidden inline-block mb-8">
              <img src="/logo.png" alt="Pommastore Logo" className="h-8 object-contain" />
            </Link>
            <h1 className="text-3xl font-serif text-neutral-950 mb-3 tracking-[0.15em] uppercase font-normal">
              {step === 'send' ? t('login_title') : t('login_access_code')}
            </h1>
            <p className="text-neutral-500 font-montserrat text-[10px] tracking-[0.25em] uppercase font-semibold">
              {step === 'send' 
                ? t('login_subtitle_send') 
                : t('login_subtitle_verify').replace('{identifier}', identifier)}
            </p>
          </div>

          {error && (
            <div className="bg-black text-white p-4 text-[10px] font-black mb-8 tracking-[0.2em] uppercase border-l-4 border-gray-600">
              {error}
            </div>
          )}

          {step === 'send' ? (
            <div className="space-y-8">
              <form onSubmit={handleSendOTP} className="space-y-8">
                <div>
                  <label className="block text-[9px] font-bold font-montserrat text-neutral-700 uppercase tracking-[0.25em] mb-3">
                    {t('login_email_id')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-800 transition-transform group-focus-within:scale-110 duration-300">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full border-b border-neutral-200 bg-transparent py-4 pl-8 pr-4 text-sm focus:border-neutral-950 transition-all outline-none font-sans placeholder:text-neutral-300 tracking-wider"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-950 text-white py-4 rounded-full text-[11px] font-bold font-montserrat tracking-[0.3em] hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center space-x-2.5 disabled:bg-neutral-200 group"
                >
                  {loading ? t('login_processing') : (
                    <>
                      <span>{t('login_continue')}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Placeholders */}
              <div className="pt-8">
                <div className="relative mb-8 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-100"></div></div>
                  <span className="relative bg-white px-6 text-[9px] font-bold font-montserrat tracking-[0.25em] text-neutral-400 uppercase">{t('login_or_connect')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowGoogleModal(true)}
                    className="flex items-center justify-center space-x-3 border border-neutral-200 rounded-full py-3.5 hover:border-neutral-950 transition-all duration-300 group"
                  >
                    <span className="text-[10px] font-bold font-montserrat tracking-[0.2em] uppercase text-neutral-800">{t('login_google')}</span>
                  </button>
                  <button 
                    type="button" 
                    className="flex items-center justify-center space-x-3 border border-neutral-200 rounded-full py-3.5 hover:border-neutral-950 transition-all duration-300 group"
                  >
                    <span className="text-[10px] font-bold font-montserrat tracking-[0.2em] uppercase text-neutral-800">{t('login_apple')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <form onSubmit={handleVerifyOTP} className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <label className="text-[9px] font-bold font-montserrat text-neutral-700 uppercase tracking-[0.25em]">{t('login_access_code')}</label>
                    <button 
                      type="button"
                      onClick={() => setStep('send')}
                      className="text-[9px] font-bold font-montserrat text-neutral-400 uppercase tracking-widest hover:text-neutral-950 transition-colors"
                    >
                      {t('login_change_details')}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-800 transition-transform group-focus-within:scale-110 duration-300">
                      <Lock size={16} />
                    </div>
                    <input
                      ref={otpRef}
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full border-b border-neutral-200 bg-transparent py-4 pl-8 pr-4 text-2xl tracking-[0.5em] font-medium focus:border-neutral-950 transition-all outline-none placeholder:text-neutral-200 font-serif"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-950 text-white py-4 rounded-full text-[11px] font-bold font-montserrat tracking-[0.3em] hover:bg-neutral-900 transition-all duration-300 flex items-center justify-center space-x-2.5 disabled:bg-neutral-200 group"
                >
                  {loading ? t('login_verifying') : (
                    <>
                      <span>{t('login_secure')}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                {resendSuccess && (
                  <div className="mb-4 py-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded text-[10px] font-bold font-montserrat text-emerald-700 tracking-[0.2em] uppercase animate-fadeIn">
                    {t('login_resend_success').replace('{identifier}', identifier)}
                  </div>
                )}
                {timer > 0 ? (
                  <p className="text-[10px] font-bold font-montserrat text-neutral-400 tracking-[0.2em] uppercase">
                    {t('login_resend_timer').replace('{timer}', String(timer))}
                  </p>
                ) : (
                  <button
                    onClick={() => handleSendOTP()}
                    className="text-[10px] font-bold font-montserrat text-neutral-950 tracking-[0.2em] uppercase border-b border-neutral-950 pb-0.5 hover:text-neutral-600 hover:border-neutral-600 transition-all"
                  >
                    {t('login_resend_btn')}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-neutral-100 flex items-center justify-center">
             <ShieldCheck size={14} className="text-neutral-300 mr-2" />
             <p className="text-[9px] text-neutral-400 font-semibold font-montserrat uppercase tracking-[0.2em]">{t('login_encrypted')}</p>
          </div>
        </div>
      </div>

      {showGoogleModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 transform scale-100 transition-transform text-black">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span className="text-xs font-medium text-gray-600 tracking-tight select-none">accounts.google.com</span>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-8 md:p-10 text-center">
              <div className="flex justify-center mb-6">
                <svg className="w-16" viewBox="0 0 74 24">
                  <g fill="none" fillRule="evenodd">
                    <path fill="#EA4335" d="M64.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0m-2.4 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#FBBC05" d="M52.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0m-2.4 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#4285F4" d="M40.5 12a5.5 5.5 0 01-8.9 4.3l-.1.1v.8c0 2.1-1.1 3.2-3 3.2-1.8 0-2.8-1.3-3.2-2.4l-2 1c.6 1.5 2.1 3.2 5.2 3.2 3.7 0 5.6-2.2 5.6-5.8V6.7h-2.3v.9a5.5 5.5 0 01-1.3-1.6m-2.5 0a3.1 3.1 0 10-6.2 0 3.1 3.1 0 006.2 0"/>
                    <path fill="#34A853" d="M27.7 1.1H23V17h4.7z"/>
                    <path fill="#EA4335" d="M20.7 13.9c-.5-1.1-1.8-2-3.3-2a3 3 0 00-2.9 2.1l6.2-2.6zm-8.2-1.9a5.5 5.5 0 0110.2-2.9L22.4 10a3 3 0 00-5.2-.8l-.2.4 5.7 2.4-.7 1.6a5.4 5.4 0 01-9.7-1.7"/>
                    <path fill="#4285F4" d="M8.5 10v2.4H14c-.2 1.3-1.5 3.7-5.5 3.7a5.9 5.9 0 110-11.8c2.3 0 3.8 1 4.7 1.8l1.9-1.8C13.9 3.1 11.5 2 8.5 2A9.9 9.9 0 000 12a9.9 9.9 0 0010 10c5.4 0 9-3.8 9-9a9 9 0 00-.1-1.8z"/>
                  </g>
                </svg>
              </div>
              <h3 className="text-xl text-gray-900 font-normal tracking-tight mb-2">Sign in</h3>
              <p className="text-[13px] text-gray-600 font-normal mb-8">to continue to <strong className="text-black">Pommastore</strong></p>
              <form onSubmit={handleGoogleAuth} className="flex flex-col gap-6 text-left">
                <div className="relative group border border-gray-300 rounded p-1 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                  <label className="block text-[10px] px-1 font-medium text-gray-500 absolute -top-2 left-3 bg-white select-none group-focus-within:text-blue-600 transition-colors">
                    Email
                  </label>
                  <input 
                    type="email" 
                    required
                    autoFocus
                    placeholder="e.g., you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-transparent border-0 py-2.5 px-3 text-[15px] text-gray-900 outline-none focus:ring-0 placeholder-gray-300 tracking-wide"
                  />
                </div>

                <div className="relative group border border-gray-300 rounded p-1 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                  <label className="block text-[10px] px-1 font-medium text-gray-500 absolute -top-2 left-3 bg-white select-none group-focus-within:text-blue-600 transition-colors">
                    Full Name (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g., Alex V."
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full bg-transparent border-0 py-2.5 px-3 text-[15px] text-gray-900 outline-none focus:ring-0 placeholder-gray-300 tracking-wide"
                  />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button 
                    type="button"
                    className="text-[13px] text-blue-600 font-medium hover:bg-blue-50 py-2 px-3 rounded select-none"
                  >
                    Create account
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded text-[13px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[80px] shadow-sm hover:shadow"
                  >
                    {googleLoading ? 'Processing...' : 'Next'}
                  </button>
                </div>
              </form>

            </div>

            {/* Google Consent Footer */}
            <div className="bg-gray-50 px-8 py-4 text-[11px] text-gray-500 font-normal leading-relaxed select-none border-t border-gray-100 flex flex-wrap justify-between gap-4">
              <p>English (United States)</p>
              <div className="flex space-x-3">
                <span className="cursor-pointer hover:text-gray-700">Help</span>
                <span className="cursor-pointer hover:text-gray-700">Privacy</span>
                <span className="cursor-pointer hover:text-gray-700">Terms</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
