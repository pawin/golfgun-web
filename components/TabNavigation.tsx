'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import HomeTab from './tabs/HomeTab';
import RoundsTab from './tabs/RoundsTab';
import StatsTab from './tabs/StatsTab';
import FriendsTab from './tabs/FriendsTab';
import MoreTab from './tabs/MoreTab';

export default function TabNavigation() {
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Memoize tab components with key to force remount when tab changes
  // This ensures useEffect hooks run when switching tabs
  const tabs = useMemo(() => [
    { component: <HomeTab key="home" />, icon: '🏠', label: t('home') },
    { component: <RoundsTab key="rounds" />, icon: '📋', label: t('rounds') },
    { component: <StatsTab key="stats" />, icon: '📊', label: t('stats') },
    { component: <FriendsTab key="friends" />, icon: '👥', label: t('friends') },
    { component: <MoreTab key="more" />, icon: '⋮', label: t('more') },
  ], [t]);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto" key={currentIndex}>
        {tabs[currentIndex].component}
      </main>
      <nav className="border-t border-gray-200 bg-white">
        <div className="flex justify-around">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex flex-col items-center justify-center px-4 py-2 flex-1 ${
                currentIndex === index
                  ? 'text-green-600 border-t-2 border-green-600'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

