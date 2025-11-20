'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import UsernameScreen from '@/components/pages/UsernameScreen';

// Re-export liff for convenience
export { liff };

interface LiffContextType {
  isReady: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  isReady: false,
  error: null,
});

/**
 * Hook to check if LIFF is ready
 * @returns {LiffContextType} Object containing isReady and error
 * 
 * @example
 * ```tsx
 * import { useLiff, liff } from '@/components/providers/LiffProvider';
 * 
 * function MyComponent() {
 *   const { isReady } = useLiff();
 *   
 *   if (!isReady) return <div>Loading...</div>;
 *   
 *   // Now you can safely use liff
 *   const profile = await liff.getProfile();
 *   // ...
 * }
 * ```
 */
export const useLiff = () => useContext(LiffContext);

interface LiffProviderProps {
  children: ReactNode;
}

export default function LiffProvider({ children }: LiffProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, loading] = useAuthState(auth);
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || 'YOUR_LIFF_ID';
        
        // Check if LIFF is already initialized (prevents re-initialization errors)
        // @ts-ignore - isInitialized() exists but may not be in type definitions
        if (typeof liff.isInitialized === 'function' && liff.isInitialized()) {
          console.log('LIFF already initialized');
          if (!liff.isLoggedIn()) {
            console.log('Not logged in, redirecting to login...');
            liff.login();
            return;
          }
          setIsReady(true);
          return;
        }
        
        // Initialize LIFF
        await liff.init({ liffId });
        
        console.log('LIFF initialized successfully');
        console.log('Is logged in:', liff.isLoggedIn());
        console.log('Is in client:', liff.isInClient());
        
        // If user is not logged in, redirect them to login
        if (!liff.isLoggedIn()) {
          console.log('Not logged in, redirecting to login...');
          liff.login();
          return;
        }
        
        setIsReady(true);
      } catch (error) {
        console.error('LIFF initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeLiff();
  }, []);

  // Check for Firebase session and username after LIFF is ready
  useEffect(() => {
    const checkFirebaseSession = async () => {
      if (!isReady || loading) return;

      if (!user) {
        // No Firebase session exists
        setHasUsername(false);
        return;
      }

      try {
        // Check if user has a username in Firebase
        userService.invalidateUserCache(user.uid);
        const appUser = await userService.getUserById(user.uid);
        const hasName = !!appUser && !!String(appUser.name ?? '').trim();
        setHasUsername(hasName);
      } catch (error) {
        console.error('Error checking user profile:', error);
        setHasUsername(false);
      }
    };

    checkFirebaseSession();
  }, [isReady, user, loading]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">LIFF Error</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady || loading || hasUsername === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Initializing LIFF...</p>
        </div>
      </div>
    );
  }

  // If no Firebase session or no username, show UsernameScreen
  if (!hasUsername) {
    return (
      <LiffContext.Provider value={{ isReady, error }}>
        <UsernameScreen />
      </LiffContext.Provider>
    );
  }

  // User has Firebase session and username, show children
  return (
    <LiffContext.Provider value={{ isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

