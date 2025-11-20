'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth } from '@/lib/firebase/config';
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
  const userService = new UserService();

  // Derive userId from user object
  const userId = user?.uid ?? null;

  // Navigate to username screen if Firebase user doesn't exist
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Check if we're not already on the username or auth screen to avoid infinite loops
      const authScreen = pathname?.includes('/username') || pathname?.includes('/auth');
      if (!authScreen) {
        return;
      }

      const firebaseUserId = firebaseUser?.uid ?? '';
      if (!!firebaseUserId) {
        userService.getUserById(firebaseUser?.uid ?? '').then((appUser) => {
          const hasName = !!String(appUser?.name ?? '').trim();
          if (!hasName) {
            router.replace(`/${locale}/username`);
          }
        });
      } else {
        router.replace(`/${locale}/username`);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [router, pathname, locale]);

  return (
    <AuthContext.Provider value={{ user, loading, error, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

