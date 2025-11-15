'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';
import ScorecardTable from '@/components/widgets/ScorecardTable';
import PartyGameSection from '@/components/widgets/PartyGameSection';
import GamesView from '@/components/widgets/GamesView';
import AddPlayerMenu from '@/components/widgets/AddPlayerMenu';
import TeeboxSelector from '@/components/widgets/TeeboxSelector';
import { useLocale } from 'next-intl';

export default function RoundDetailScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale(); // Must be called at top level, before any conditional returns
  const params = useParams();
  const [user, loading] = useAuthState(auth);
  const [round, setRound] = useState<Round | null>(null);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loadingRound, setLoadingRound] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeeboxDialog, setShowTeeboxDialog] = useState(false);
  const [teeboxDialogShown, setTeeboxDialogShown] = useState(false);

  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof params === 'object' && params !== null && 'id' in params) {
      setRoundId(params.id as string);
    } else {
      // Handle async params
      (async () => {
        const resolvedParams = await params;
        setRoundId(resolvedParams?.id as string);
      })();
    }
  }, [params]);

  useEffect(() => {
    if (!roundId) return;

    const unsubscribe = roundService.watchRound(roundId, (updatedRound) => {
      setRound(updatedRound);
      setLoadingRound(false);
      setError(null);

      // Fetch users
      const allUserIds = new Set<string>();
      allUserIds.add(updatedRound.adminId);
      updatedRound.memberIds.forEach((id) => allUserIds.add(id));

      if (allUserIds.size > 0) {
        userService.getUsersByIds(Array.from(allUserIds)).then((fetchedUsers) => {
          setUsers(fetchedUsers);
        });
      }

      // Check if teebox dialog should be shown
      if (
        updatedRound.version === '2' &&
        !teeboxDialogShown &&
        user?.uid &&
        updatedRound.memberIds.includes(user.uid) &&
        (!updatedRound.userTeeboxes[user.uid] || updatedRound.userTeeboxes[user.uid].length === 0)
      ) {
        setShowTeeboxDialog(true);
        setTeeboxDialogShown(true);
      }
    });

    return () => unsubscribe();
  }, [roundId, user?.uid, teeboxDialogShown]);

  if (loading || loadingRound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-red-600">{error || t('roundNotFound')}</p>
        </div>
      </div>
    );
  }

  const isAdmin = round.adminId === user?.uid;
  const isMember = round.memberIds.includes(user?.uid || '');

  // Calculate teebox info if available
  const getTeeboxInfo = () => {
    if (!user?.uid) return null;
    const selectedIds = round.userTeeboxes[user.uid] || [];
    if (selectedIds.length === 0 || round.scorecards.length === 0) return null;

    const allTees = round.scorecards.flatMap((sc) => [
      ...sc.backTeeboxes.teeboxes,
      ...sc.forwardTeeboxes.teeboxes,
    ]);

    const selectedTees = selectedIds
      .map((id) => allTees.find((t) => t.rowId === id))
      .filter((t) => t !== undefined);

    if (selectedTees.length === 0) return null;

    const tees = Array.from(new Set(selectedTees.map((t) => t.name))).join('/');
    const ratings = selectedTees.map((t) => t.rating).filter((r) => r != null) as number[];
    const slopes = selectedTees.map((t) => t.slope).filter((s) => s != null) as number[];

    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : null;
    const avgSlope =
      slopes.length > 0 ? Math.round(slopes.reduce((a, b) => a + b) / slopes.length) : null;

    const r = avgRating ? avgRating.toFixed(1) : '-';
    const s = avgSlope?.toString() || '-';

    return `${tees} - ${r}/${s}`;
  };

  const teeboxInfo = getTeeboxInfo();

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">{t('round')}</h1>
        <div className="flex items-center gap-2">
          <AddPlayerMenu
            roundId={round.id}
            round={round}
            currentUserId={user?.uid || ''}
            onUpdate={() => {
              // Round will update automatically via watchRound
            }}
          />
          {isMember && (
            <button
              onClick={() => router.push(`/${locale}/rounds/${round.id}/settings`)}
              className="text-gray-600 hover:text-gray-900"
              title={t('settings') || 'Settings'}
            >
              ⚙️
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Course Info */}
        <div>
          <h2 className="text-xl font-semibold">{round.course.name}</h2>
          {round.scorecard.name !== round.course.name && (
            <p className="text-sm text-gray-600 mt-1">{round.scorecard.name}</p>
          )}
          {teeboxInfo && (
            <p className="text-sm text-gray-600 mt-1">{teeboxInfo}</p>
          )}
          {round.isFinished && (
            <p className="text-sm text-gray-600 mt-1">
              {DateFormatter.format(round.createdAt, AppDateFormatStyle.medium, locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined)}
            </p>
          )}
        </div>

        {/* Scorecard Table */}
        <ScorecardTable
          round={round}
          users={users}
          currentUserId={user?.uid || ''}
          isAdmin={isAdmin}
          isMember={isMember}
        />

        {/* Party Game Section */}
        {round.partyGameEnabled && (
          <div className="mt-4">
            <PartyGameSection round={round} currentUserId={user?.uid || ''} />
          </div>
        )}

        {/* Games Section */}
        <div className="mt-4">
          <GamesView
            round={round}
            users={users}
            currentUserId={user?.uid || ''}
            onAddGame={() => {
              router.push(`/${locale}/rounds/${round.id}/settings`);
            }}
            onGameTap={(game) => {
              router.push(`/${locale}/rounds/${round.id}/settings?gameId=${game.id}`);
            }}
          />
        </div>
      </div>

      {/* Teebox Selection Dialog */}
      {showTeeboxDialog && round && user?.uid && (
        <TeeboxSelector
          round={round}
          currentUserId={user.uid}
          onClose={() => setShowTeeboxDialog(false)}
        />
      )}
    </div>
  );
}


