'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User as FirebaseUser } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth, isFirebaseInitialized } from '@/lib/firebase/config';
import { UserService } from '@/lib/services/userService';

interface AuthContextType {
  user: FirebaseUser | null | undefined;
  loading: boolean;
  error: Error | undefined;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  error: undefined,
  userId: null,
});

/**
 * Hook to access Firebase authentication state
 * @returns Object containing user, loading, error, and userId
 * 
 * @example
 * ```tsx
 * import { useAuth } from '@/components/providers/AuthProvider';
 * 
 * function MyComponent() {
 *   const { user, loading, userId } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not authenticated</div>;
 *   
 *   // Use userId directly
 *   const rounds = await roundService.getAllRounds(userId!);
 *   // ...
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to get the current user ID (convenience hook)
 * @returns The current user's ID, or null if not authenticated
 * 
 * @example
 * ```tsx
 * import { useCurrentUserId } from '@/components/providers/AuthProvider';
 * 
 * function MyComponent() {
 *   const userId = useCurrentUserId();
 *   
 *   if (!userId) return <div>Please sign in</div>;
 *   
 *   // Use userId directly
 *   const rounds = await roundService.getAllRounds(userId);
 * }
 * ```
 */
export const useCurrentUserId = (): string | null => {
  const { userId } = useAuth();
  return userId;
};

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const userService = useMemo(() => new UserService(), []);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Derive userId from user object
  const userId = user?.uid ?? null;

  // Combined loading state: Firebase auth loading OR Firebase not ready
  const isLoading = user?.uid != null && !loading;

  // Poll for Firebase initialization until it's ready
  useEffect(() => {
    // Check immediately
    if (isFirebaseInitialized()) {
      setFirebaseReady(true);
      return;
    }

    // If not ready, poll every 100ms until it's ready (max 10 seconds)
    const maxAttempts = 100; // 50 * 100ms = 5 seconds
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (isFirebaseInitialized()) {
        setFirebaseReady(true);
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        // Stop polling after max attempts to avoid infinite loops
        console.warn('Firebase initialization check timed out after 5 seconds');
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, []); // Only run once on mount

  // Navigate to username screen if Firebase user doesn't exist or doesn't have a name
  useEffect(() => {
    // Wait until Firebase is ready and auth state is loaded
    if (!firebaseReady || !isFirebaseInitialized() || !auth || loading) {
      return;
    }

    if (isAuthenticating) {
      return;
    }
    
    setIsAuthenticating(true);
    // Check if we're not already on the username or auth screen to avoid infinite loops
    const authScreen = pathname?.includes('/username') || pathname?.includes('/auth');
    if (authScreen) {
      return;
    }

    // Use userId (string) instead of user (object) to avoid unnecessary re-runs
    const firebaseUserId = userId ?? '';
    if (!!firebaseUserId) {
      userService.getUserById(firebaseUserId).then((appUser) => {
        const hasName = !!String(appUser?.name ?? '').trim();
        if (!hasName) {
          router.replace(`/${locale}/username`);
        }
      });
    } else {
      router.replace(`/${locale}/username`);
    }
  }, [firebaseReady, loading, userId, router, pathname, locale, userService]);

  // Show loading state while Firebase is initializing or auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

