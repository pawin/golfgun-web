'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { useLocale } from 'next-intl';
import TabNavigation from '@/components/TabNavigation';
import { userService } from '@/lib/services/userService';

export default function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (loading) return;
      if (!user) {
        router.push(`/${locale}/username`);
        return;
      }
      try {
        const appUser = await userService.getUserById(user.uid);
        const missingName =
          !appUser || appUser.name === null || appUser.name === undefined || String(appUser.name).trim() === '';
        if (missingName) {
          router.push(`/${locale}/username`);
          return;
        }
      } finally {
        if (isMounted) setCheckingProfile(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [user, loading, router, locale]);

  if (loading || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <TabNavigation />;
}

