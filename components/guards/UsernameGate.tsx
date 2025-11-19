'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';

interface UsernameGateProps {
  children: ReactNode;
}

export default function UsernameGate({ children }: UsernameGateProps) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  const normalizedPath = useMemo(
    () => normalizePath(pathname, locale),
    [pathname, locale]
  );

  const shouldGuard =
    normalizedPath !== '/username' && !normalizedPath.startsWith('/auth');

  useEffect(() => {
    let active = true;

    if (!shouldGuard) {
      setChecking(false);
      return;
    }

    // Whenever we enter a guarded route, start in checking mode
    setChecking(true);

    const ensureUsername = async () => {
      if (loading) return;

      if (!user) {
        if (active) {
          setChecking(false);
        }
        router.replace(`/${locale}/username`);
        return;
      }

      try {
        userService.invalidateUserCache(user.uid);
        const appUser = await userService.getUserById(user.uid);
        const name = (appUser?.name ?? '').trim();

        if (name.length == 0) {
          if (active) {
            setChecking(false);
          }
          router.replace(`/${locale}/username`);
          return;
        }

        // Only set checking to false if username is valid
        if (active) {
          setChecking(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        // On error, redirect to username screen to be safe
        if (active) {
          setChecking(false);
        }
        router.replace(`/${locale}/username`);
      }
    };

    ensureUsername();

    return () => {
      active = false;
    };
  }, [shouldGuard, user, loading, router, locale]);

  if (!shouldGuard) {
    return <>{children}</>;
  }

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

function normalizePath(pathname: string | null, locale: string): string {
  if (!pathname) return '/';
  const localePrefix = `/${locale}`;

  if (pathname === localePrefix) {
    return '/';
  }

  if (pathname.startsWith(`${localePrefix}/`)) {
    const remainder = pathname.slice(localePrefix.length);
    return remainder.startsWith('/') ? remainder : `/${remainder}`;
  }

  return pathname;
}

