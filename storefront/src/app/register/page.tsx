'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/locales/i18nContext';

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-64 mt-20 text-center">
      <div className="animate-pulse font-serif italic text-2xl">
        {t('login_redirecting')}
      </div>
    </div>
  );
}
