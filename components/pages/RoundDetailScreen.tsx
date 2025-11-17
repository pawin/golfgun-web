'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { Round, roundIsFinished } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';
import ScorecardTable from '@/components/widgets/ScorecardTable';
import PartyGameSection from '@/components/widgets/PartyGameSection';
import GamesView from '@/components/widgets/GamesView';
import AddPlayerMenu from '@/components/widgets/AddPlayerMenu';
import TeeboxSelector from '@/components/widgets/TeeboxSelector';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { TeeboxRow } from '@/lib/models/scorecard';
import { useRouteParams } from '@/lib/contexts/RouteParamsContext';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

export default function RoundDetailScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale(); // Must be called at top level, before any conditional returns
  const routeParams = useRouteParams<{ id?: string }>();
  const [user, loading] = useAuthState(auth);
  const [round, setRound] = useState<Round | null>(null);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  const [loadingRound, setLoadingRound] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeeboxDialog, setShowTeeboxDialog] = useState(false);
  const [teeboxDialogShown, setTeeboxDialogShown] = useState(false);

  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    setRoundId(routeParams.id ?? null);
  }, [routeParams.id]);

  useEffect(() => {
    if (!roundId) return;

    setLoadingRound(true);
    setError(null);

    const unsubscribe = roundService.watchRound(
      roundId,
      (updatedRound) => {
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
      },
      (err) => {
        setRound(null);
        setLoadingRound(false);
        setError(t('roundNotFound'));
      }
    );

    return () => unsubscribe();
  }, [roundId, user?.uid, teeboxDialogShown]);

  // Fetch current user data
  useEffect(() => {
    if (!user?.uid) {
      setCurrentUserData(null);
      return;
    }

    userService.getUsersByIds([user.uid]).then((fetchedUsers) => {
      if (fetchedUsers[user.uid]) {
        setCurrentUserData(fetchedUsers[user.uid]);
      }
    });
  }, [user?.uid]);

  if (loading || loadingRound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <AppIconHomeLink />
          <h1 className="text-xl font-semibold">{t('round')}</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-destructive text-center">{error || t('roundNotFound')}</p>
          <Button onClick={() => router.push(`/${locale}`)}>{t('backToHome')}</Button>
        </div>
      </div>
    );
  }

  const isAdmin = round.adminId === user?.uid;
  const isMember = round.memberIds.includes(user?.uid || '');

  // Calculate teebox info if available
  const getTeeboxInfo = () => {
    if (!user?.uid) return null;
    const selectedIds = (round.userTeeboxes[user.uid] || []) as string[];
    if (selectedIds.length === 0 || round.scorecards.length === 0) return null;

    const allTees: TeeboxRow[] = round.scorecards.flatMap((scorecard) => [
      ...scorecard.backTeeboxes.teeboxes,
      ...scorecard.forwardTeeboxes.teeboxes,
    ]);

    const selectedTees = selectedIds
      .map((selectedId) => allTees.find((tee) => tee.rowId === selectedId))
      .filter((tee): tee is typeof allTees[number] => tee !== undefined);

    if (selectedTees.length === 0) return null;

    const tees = Array.from(new Set(selectedTees.map((tee) => tee.name))).join('/');
    const ratings = selectedTees.map((tee) => tee.rating).filter((rating) => rating != null) as number[];
    const slopes = selectedTees.map((tee) => tee.slope).filter((slope) => slope != null) as number[];

    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : null;
    const avgSlope =
      slopes.length > 0 ? Math.round(slopes.reduce((a, b) => a + b) / slopes.length) : null;

    const r = avgRating ? avgRating.toFixed(1) : '-';
    const s = avgSlope?.toString() || '-';

    return `${tees} - ${r}/${s}`;
  };

  const teeboxInfo = getTeeboxInfo();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <AppIconHomeLink />
          <h1 className="text-lg font-semibold">{t('round')}</h1>
        </div>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/rounds/${round.id}/settings`)}
              title={t('settings') || 'Settings'}
              aria-label={t('settings') || 'Settings'}
            >
              <FontAwesomeIcon icon={faCog} />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Course Info */}
        <div>
          <h2 className="text-xl font-semibold">{round.course.name}</h2>
          {round.scorecard.name !== round.course.name && (
            <p className="text-sm text-muted-foreground mt-1">{round.scorecard.name}</p>
          )}
          {teeboxInfo && (
            <p className="text-sm text-muted-foreground mt-1">{teeboxInfo}</p>
          )}
          {roundIsFinished(round) && (
            <p className="text-sm text-muted-foreground mt-1">
              {DateFormatter.format(round.createdAt, AppDateFormatStyle.medium, locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined)}
            </p>
          )}
        </div>

        {/* Scorecard Table */}
        <ScorecardTable
          round={round}
          users={users}
          currentUserId={user?.uid || ''}
          currentUser={currentUserData || undefined}
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
