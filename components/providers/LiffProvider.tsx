'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';
import { debugLogger } from '@/lib/utils/debugLogger';

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

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || 'YOUR_LIFF_ID';
        debugLogger.info('LiffProvider', `Starting LIFF initialization with ID: ${liffId}`);

        // Check if LIFF is already initialized (prevents re-initialization errors)
        // @ts-ignore - isInitialized() exists but may not be in type definitions
        if (typeof liff.isInitialized === 'function' && liff.isInitialized()) {
          debugLogger.info('LiffProvider', 'LIFF already initialized');
          if (!liff.isLoggedIn()) {
            debugLogger.warn('LiffProvider', 'Not logged in, redirecting to login...');
            liff.login();
            return;
          }
          debugLogger.success('LiffProvider', 'LIFF ready (already initialized)');
          setIsReady(true);
          return;
        }

        // Initialize LIFF
        debugLogger.info('LiffProvider', 'Calling liff.init()...');
        await liff.init({ liffId });

        const isLoggedIn = liff.isLoggedIn();
        const isInClient = liff.isInClient();
        
        debugLogger.info('LiffProvider', 'LIFF initialized', {
          isLoggedIn,
          isInClient,
        });

        // If user is not logged in, redirect them to login
        if (!isLoggedIn) {
          debugLogger.warn('LiffProvider', 'Not logged in, redirecting to login...');
          liff.login();
          return;
        }

        debugLogger.success('LiffProvider', 'LIFF initialization complete');
        setIsReady(true);
      } catch (error) {
        debugLogger.error('LiffProvider', 'LIFF initialization failed', error);
        setError(error instanceof Error ? error.message : 'Unknown error');

        // If liff error it should not affect the app
        setIsReady(true);
      }
    };

    const isInClient = liff.isInClient();
    debugLogger.info('LiffProvider', `useEffect triggered, isInClient: ${isInClient}`);

    if (isInClient) {
      initializeLiff();
    } else {
      debugLogger.info('LiffProvider', 'Not in LINE client, skipping LIFF initialization');
      setIsReady(true);
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <LiffContext.Provider value={{ isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

