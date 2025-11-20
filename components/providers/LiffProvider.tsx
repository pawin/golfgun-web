'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';

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
    
    if (liff.isInClient()) {
      initializeLiff();
    } else {
      setIsReady(true);
    }
  }, []);

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

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Initializing LIFF...</p>
        </div>
      </div>
    );
  }

  return (
    <LiffContext.Provider value={{ isReady, error }}>
      {children}
    </LiffContext.Provider>
  );
}

