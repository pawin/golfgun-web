'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import TabNavigation from '@/components/TabNavigation';
import UsernameGate from '../guards/UsernameGate';

export default function HomePage() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
      
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || 'YOUR_LIFF_ID';
        
        await liff.init({ liffId });
        
        console.log('LIFF initialized successfully');
        console.log('Is logged in:', liff.isLoggedIn());
        
        // If user is not logged in, you can redirect them to login
        if (!liff.isLoggedIn()) {
          liff.login();
        }
        
        setIsLiffReady(true);
      } catch (error) {
        console.error('LIFF initialization failed:', error);
        setLiffError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeLiff();
  }, []);

  if (liffError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">LIFF Error</h2>
          <p className="text-red-500">{liffError}</p>
        </div>
      </div>
    );
  }

  if (!isLiffReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Initializing LIFF...</p>
        </div>
      </div>
    );
  }

  return <UsernameGate>{<TabNavigation />}</UsernameGate>;
}
