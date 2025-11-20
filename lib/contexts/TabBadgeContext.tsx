'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useCurrentUserId } from '@/components/providers/AuthProvider';
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
  const userId = useCurrentUserId();
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
    if (!userId) {
      setBadges({ friends: false, more: false });
      return;
    }

    const checkBadges = async () => {
      try {
        // Check user role for More tab badge
        const userData = await userService.getUserById(userId);
        const hasTemporaryRole = userData?.role !== 'member';
        setMoreBadge(hasTemporaryRole);

        // Check friend requests for Friends tab badge
        const friendsOverview = await friendService.loadOverview(userId);
        const hasIncomingRequests = friendsOverview.incomingRequests.length > 0;
        setFriendsBadge(hasIncomingRequests);
      } catch (error) {
        console.error('Failed to check badges:', error);
      }
    };

    checkBadges();
  }, [userId]);

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
