'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { friendService } from '@/lib/services/friendService';

interface TabBadgeState {
  friends: boolean;
  more: boolean;
}

interface TabBadgeContextType {
  badges: TabBadgeState;
  setFriendsBadge: (show: boolean) => void;
  setMoreBadge: (show: boolean) => void;
}

const TabBadgeContext = createContext<TabBadgeContextType | undefined>(undefined);

export function TabBadgeProvider({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const [badges, setBadges] = useState<TabBadgeState>({
    friends: false,
    more: false,
  });

  const setFriendsBadge = useCallback((show: boolean) => {
    setBadges((prev) => ({ ...prev, friends: show }));
  }, []);

  const setMoreBadge = useCallback((show: boolean) => {
    setBadges((prev) => ({ ...prev, more: show }));
  }, []);

  // Check badges on app launch
  useEffect(() => {
    if (!user || loading) {
      setBadges({ friends: false, more: false });
      return;
    }

    const checkBadges = async () => {
      try {
        // Check user role for More tab badge
        const userData = await userService.getUserById(user.uid);
        const hasTemporaryRole = userData?.role !== 'member';
        setMoreBadge(hasTemporaryRole);

        // Check friend requests for Friends tab badge
        const friendsOverview = await friendService.loadOverview(user.uid);
        const hasIncomingRequests = friendsOverview.incomingRequests.length > 0;
        setFriendsBadge(hasIncomingRequests);
      } catch (error) {
        console.error('Failed to check badges:', error);
      }
    };

    checkBadges();
  }, [user, loading]);

  return (
    <TabBadgeContext.Provider value={{ badges, setFriendsBadge, setMoreBadge }}>
      {children}
    </TabBadgeContext.Provider>
  );
}

export function useTabBadge() {
  const context = useContext(TabBadgeContext);
  if (!context) {
    throw new Error('useTabBadge must be used within TabBadgeProvider');
  }
  return context;
}
