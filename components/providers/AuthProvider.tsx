'use client';

import { createContext, useContext, ReactNode, useEffect, useState, useMemo, useRef } from 'react';

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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const useCurrentUserId = (): string | null => {
    const { userId } = useAuth();
    return userId;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Inner component that uses useAuthState - only rendered when Firebase is ready
function AuthProviderInner({ children }: AuthProviderProps) {
    const [user, loading, error] = useAuthState(auth);
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();
    const userService = useMemo(() => new UserService(), []);

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
                    // Save redirect URL if not already on auth pages
                    if (pathname && !pathname.includes('/username') && !pathname.includes('/auth')) {
                        sessionStorage.setItem('redirect_after_login', pathname);
                    }
                    router.replace(`/${locale}/username`);
                } else {
                    debugLogger.success('AuthProvider', 'User authenticated with name');
                }
            });
        } else {
            debugLogger.warn('AuthProvider', 'No user ID, redirecting to username screen');
            // Save redirect URL if not already on auth pages
            if (pathname && !pathname.includes('/username') && !pathname.includes('/auth')) {
                sessionStorage.setItem('redirect_after_login', pathname);
            }
            router.replace(`/${locale}/username`);
        }

    }, [user, loading, error]);

    return (
        <AuthContext.Provider value={{ user, loading, error, userId }}>
            {children}
        </AuthContext.Provider>
    );
}

// Wrapper component that ensures Firebase is initialized before rendering AuthProviderInner
export default function AuthProvider({ children }: AuthProviderProps) {
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        // Check if Firebase is initialized, with a small delay to ensure client-side hydration is complete
        const checkFirebase = () => {
            if (isFirebaseInitialized()) {
                debugLogger.success('AuthProvider', 'Firebase initialized successfully');
                setFirebaseReady(true);
            } else {
                debugLogger.warn('AuthProvider', 'Firebase not ready, retrying...');
                // Retry after a short delay - Firebase might still be initializing
                setTimeout(checkFirebase, 50);
            }
        };

        checkFirebase();
    }, []);

    if (!firebaseReady) {
        debugLogger.info('AuthProvider', 'Waiting for Firebase to initialize...');
        return (
            <AuthContext.Provider value={{ user: undefined, loading: true, error: undefined, userId: null }}>
                {children}
            </AuthContext.Provider>
        );
    }

    return <AuthProviderInner>{children}</AuthProviderInner>;
}

