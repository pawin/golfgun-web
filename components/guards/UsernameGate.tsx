'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';

interface UsernameGateProps {
  children: ReactNode;
}

export default function UsernameGate({ children }: UsernameGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (loading) return;

      // Allow access to username and auth pages without checks
      if (pathname.endsWith('/username') || pathname.endsWith('/auth')) {
        setChecking(false);
        return;
      }

      if (!user) {
        // If no Firebase user is logged in, redirect to username screen
        router.replace(`/${locale}/username`);
        return;
      }

      // If we have a Firebase user, fetch the app user
      try {
        userService.invalidateUserCache(user.uid);
        const appUser = await userService.getUserById(user.uid);
        
        // Check if appUser.name is empty
        const hasName = !!appUser && !!String(appUser.name ?? '').trim();
        
        if (!hasName) {
          // If name is empty, redirect to username screen
          router.replace(`/${locale}/username`);
        } else {
          // User has a name, allow access
          setChecking(false);
        }
      } catch (error) {
        // On error, redirect to username screen
        console.error('Error checking user:', error);
        router.replace(`/${locale}/username`);
      }
    };

    checkUser();
  }, [user, loading, pathname, router, locale]);

  // Show loading spinner while checking auth state
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render children once checks are complete
  return <>{children}</>;
}
