'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCurrentUserId } from '@/components/providers/AuthProvider';
import { useLiff, liff } from '@/components/providers/LiffProvider';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { userMigrationService } from '@/lib/services/userMigrationService';
import { Round, roundIsFinished } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import RoundCardView from '@/components/widgets/RoundCardView';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

export default function MyRoundsScreen() {
  const t = useTranslations();
  const userId = useCurrentUserId();
  const { isReady: isLiffReady } = useLiff();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const migrationAttempted = useRef(false);

  // Lightweight migration effect - runs once when both LIFF and Firebase user are available
  useEffect(() => {
    const attemptMigration = async () => {
      // Only attempt once
      if (migrationAttempted.current) return;
      
      // Need both LIFF ready and Firebase user ID
      if (!isLiffReady || !userId) return;
      
      // Only run in LINE client
      if (!liff.isInClient()) return;
      
      // Check if logged in to LIFF
      if (!liff.isLoggedIn()) return;

      migrationAttempted.current = true;

      try {
        // Get LINE user ID
        const profile = await liff.getProfile();
        const lineUserId = profile.userId;

        if (lineUserId && userId) {
          // Attempt migration (returns null if old user doesn't exist, which is fine)
          await userMigrationService.migrateIfOldUserExistsAndLink(lineUserId, userId);
        }
      } catch (error) {
        // Silently handle errors - migration is non-blocking
        console.debug('User migration attempt failed:', error);
      }
    };

    attemptMigration();
  }, [isLiffReady, userId]);

  useEffect(() => {
    if (userId) {
      loadRounds();
    }
  }, [userId]);

  const loadRounds = async () => {
    if (!userId) return;

    setLoadingRounds(true);
    setError(null);

    try {
      const allRounds = await roundService.getAllRounds(userId);
      
      // Filter finished rounds and sort by date
      const finishedRounds = allRounds
        .filter((r) => !r.deletedAt && roundIsFinished(r))
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

  if (loadingRounds) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('notSignedIn')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <AppIconHomeLink />
          <h1 className="text-xl font-semibold">{t('rounds')}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-error mb-4">
              {t('failedToLoadRounds', { error: error.message })}
            </p>
            <button
              onClick={loadRounds}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3 z-20">
        <AppIconHomeLink />
        <h1 className="text-xl font-semibold">{t('rounds')}</h1>
      </div>

      {rounds.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('noRoundsFound')}</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {rounds.map((round) => (
            <RoundCardView
              key={round.id}
              round={round}
              currentUserId={userId}
              users={users}
            />
          ))}
        </div>
      )}
    </div>
  );
}
