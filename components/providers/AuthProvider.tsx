'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { User as FirebaseUser } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { auth, isFirebaseInitialized } from '@/lib/firebase/config';
import { UserService } from '@/lib/services/userService';
import { debugLogger } from '@/lib/utils/debugLogger';

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

    //const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Derive userId from user object
    const userId = user?.uid ?? null;

    // Log auth state changes (user, loading, error)
    useEffect(() => {
        // Check if we're not already on the username or auth screen to avoid infinite loops
        const authScreen = pathname?.includes('/username') || pathname?.includes('/auth');
        if (authScreen) {
            debugLogger.info('AuthProvider', 'Already on auth screen, skipping redirect');
            return;
        }

        debugLogger.info('AuthProvider', 'Auth state changed', {
            hasUser: !!user,
            userId: user?.uid ?? 'null',
            userEmail: user?.email ?? 'null',
            loading,
            hasError: !!error,
            errorMessage: error?.message ?? 'null',
        });

        if (error) {
            debugLogger.error('AuthProvider', 'Auth state error detected', {
                error: error.message,
                code: (error as any).code ?? 'unknown',
                fullError: error,
            });
        }

        if (user && !loading) {
            debugLogger.success('AuthProvider', 'User authenticated', {
                userId: user.uid,
                email: user.email,
            });
        }

        if (loading) {
            debugLogger.info('AuthProvider', 'Still loading, skipping auth check');
            return;
        }

        // Use userId (string) instead of user (object) to avoid unnecessary re-runs
        const firebaseUserId = userId ?? '';
        debugLogger.info('AuthProvider', 'Checking user authentication', {
            hasUserId: !!firebaseUserId,
            pathname,
        });

        if (!!firebaseUserId) {
            debugLogger.info('AuthProvider', `Fetching user profile for: ${firebaseUserId}`);
            userService.getUserById(firebaseUserId).then((appUser) => {
                const hasName = !!String(appUser?.name ?? '').trim();
                debugLogger.info('AuthProvider', 'User profile check', {
                    hasName,
                    userName: appUser?.name,
                });
                if (!hasName) {
                    debugLogger.warn('AuthProvider', 'User has no name, redirecting to username screen');
                    router.replace(`/${locale}/username`);
                } else {
                    debugLogger.success('AuthProvider', 'User authenticated with name');
                }
            });
        } else {
            debugLogger.warn('AuthProvider', 'No user ID, redirecting to username screen');
            router.replace(`/${locale}/username`);
        }

    }, [user, loading, error]);

    return (
        <AuthContext.Provider value={{ user, loading, error, userId }}>
            {children}
        </AuthContext.Provider>
    );
}

