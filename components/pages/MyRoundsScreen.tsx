'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import RoundCardView from '@/components/widgets/RoundCardView';

export default function MyRoundsScreen() {
  const t = useTranslations();
  const [user, loading] = useAuthState(auth);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user && !loading) {
      loadRounds();
    }
  }, [user, loading]);

  const loadRounds = async () => {
    if (!user) return;

    setLoadingRounds(true);
    setError(null);

    try {
      const allRounds = await roundService.getAllRounds(user.uid);
      
      // Filter finished rounds and sort by date
      const finishedRounds = allRounds
        .filter((r) => !r.deletedAt && r.isFinished)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setRounds(finishedRounds);

      // Fetch all users
      const allUserIds = new Set<string>();
      finishedRounds.forEach((r) => {
        allUserIds.add(r.adminId);
        r.memberIds.forEach((id) => allUserIds.add(id));
      });

      if (allUserIds.size > 0) {
        const fetchedUsers = await userService.getUsersByIds(Array.from(allUserIds));
        setUsers(fetchedUsers);
      }
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoadingRounds(false);
    }
  };

  if (loading || loadingRounds) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('notSignedIn')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-xl font-semibold">{t('rounds')}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {t('failedToLoadRounds', { error: error.message })}
            </p>
            <button
              onClick={loadRounds}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold">{t('rounds')}</h1>
      </div>

      {rounds.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">{t('noRoundsFound')}</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {rounds.map((round) => (
            <RoundCardView
              key={round.id}
              round={round}
              currentUserId={user.uid}
              users={users}
            />
          ))}
        </div>
      )}
    </div>
  );
}

