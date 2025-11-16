'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { useLocale } from 'next-intl';
import TabNavigation from '@/components/TabNavigation';

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/auth`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <TabNavigation />;
}

