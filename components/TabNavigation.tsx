'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faClipboardList, faChartBar, faUsers, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import HomeTab from './tabs/HomeTab';
import RoundsTab from './tabs/RoundsTab';
import StatsTab from './tabs/StatsTab';
import FriendsTab from './tabs/FriendsTab';
import MoreTab from './tabs/MoreTab';

// Map hash values to tab indices
const hashToIndex: Record<string, number> = {
  'home': 0,
  'rounds': 1,
  'stats': 2,
  'friends': 3,
  'more': 4,
};

// Map tab indices to hash values
const indexToHash: Record<number, string> = {
  0: 'home',
  1: 'rounds',
  2: 'stats',
  3: 'friends',
  4: 'more',
};

export default function TabNavigation() {
  const t = useTranslations();
  
  // Initialize state from hash or default to 0
  const getInitialIndex = () => {
    if (typeof window === 'undefined') return 0;
    const hash = window.location.hash.slice(1); // Remove the '#'
    return hashToIndex[hash] ?? 0;
  };

  const [currentIndex, setCurrentIndex] = useState(getInitialIndex);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Sync hash with current tab index (only on initial mount to set default hash)
  useEffect(() => {
    if (isInitialMount && typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      // Only set default hash if no hash is present
      if (!hash || !hashToIndex[hash]) {
        window.history.replaceState(null, '', '#home');
      }
      setIsInitialMount(false);
    }
  }, [isInitialMount]);

  // Listen for hash changes (browser back/forward, direct navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const index = hashToIndex[hash] ?? 0;
      setCurrentIndex(index);
    };

    // Handle hash changes (direct URL changes, link clicks)
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle browser back/forward navigation
    window.addEventListener('popstate', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Handle tab click - update hash with pushState for browser history
  const handleTabClick = (index: number) => {
    const hash = indexToHash[index] || 'home';
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${hash}`);
      setCurrentIndex(index);
    }
  };

  // Memoize tab components with key to force remount when tab changes
  // This ensures useEffect hooks run when switching tabs
  const tabs = useMemo(() => [
    { component: <HomeTab key="home" />, icon: faHome, label: t('home') },
    { component: <RoundsTab key="rounds" />, icon: faClipboardList, label: t('rounds') },
    { component: <StatsTab key="stats" />, icon: faChartBar, label: t('stats') },
    { component: <FriendsTab key="friends" />, icon: faUsers, label: t('friends') },
    { component: <MoreTab key="more" />, icon: faEllipsisVertical, label: t('more') },
  ], [t]);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto" key={currentIndex}>
        {tabs[currentIndex].component}
      </main>
      <nav className="border-t border-border bg-background relative z-50">
        <div className="flex justify-around">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabClick(index)}
              className={`flex flex-col items-center justify-center px-4 py-2 flex-1 ${
                currentIndex === index
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} className="text-xl" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

