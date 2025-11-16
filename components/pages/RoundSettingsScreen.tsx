'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faXmark } from '@fortawesome/free-solid-svg-icons';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { spinnerService } from '@/lib/services/spinnerService';
import { Round, RoundGame } from '@/lib/models/round';
import { roundColorForPlayer } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { userService } from '@/lib/services/userService';
import { getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { defaultWheelOptionsTh } from '@/lib/utils/party_game_defaults';
import GameSettingsScreen from './GameSettingsScreen';
import TeeboxSelector from '@/components/widgets/TeeboxSelector';

export default function RoundSettingsScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const [user, loading] = useAuthState(auth);
  const [round, setRound] = useState<Round | null>(null);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [roundId, setRoundId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingPartyGame, setUpdatingPartyGame] = useState(false);
  const [showTeeboxSelector, setShowTeeboxSelector] = useState(false);
  
  const gameId = searchParams?.get('gameId');

  useEffect(() => {
    (async () => {
      const resolvedParams = await params;
      const id = resolvedParams?.id as string;
      setRoundId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (!roundId || !user) return;

    const unsubscribe = roundService.watchRound(roundId, async (updatedRound) => {
      setRound(updatedRound);

      // Fetch users
      const allUserIds = new Set<string>();
      allUserIds.add(updatedRound.adminId);
      updatedRound.memberIds.forEach((id) => allUserIds.add(id));

      if (allUserIds.size > 0) {
        const fetchedUsers = await userService.getUsersByIds(Array.from(allUserIds));
        setUsers(fetchedUsers);
      }
    });

    return () => unsubscribe();
  }, [roundId, user]);

  const handleRemoveMember = async (memberId: string) => {
    if (!roundId || !round) return;
    if (!confirm(t('confirmRemoveMember', { name: users[memberId]?.name || memberId }))) return;

    try {
      await roundService.leaveRound(roundId, memberId);
      alert(t('memberRemoved'));
    } catch (e) {
      alert(t('failedToRemoveMember', { error: (e as Error).toString() }));
    }
  };

  const handleLeaveRound = async () => {
    if (!roundId || !user) return;
    if (!confirm(t('leaveRoundConfirm'))) return;

    try {
      await roundService.leaveRound(roundId, user.uid);
      alert(t('leftRound'));
      router.back();
    } catch (e) {
      alert(t('failedToLeaveRound', { error: (e as Error).toString() }));
    }
  };

  const handleDeleteRound = async () => {
    if (!roundId || !user || !round) return;
    if (!confirm(t('deleteRoundWarning'))) return;

    setIsDeleting(true);
    try {
      await roundService.deleteRound(roundId, user.uid);
      alert(t('roundDeleted'));
      router.push(`/${locale}`);
    } catch (e) {
      alert(t('failedToDeleteRound', { error: (e as Error).toString() }));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePartyGame = async (enabled: boolean) => {
    if (!roundId || !round || updatingPartyGame) return;
    setUpdatingPartyGame(true);

    try {
      await roundService.setPartyGameEnabled(roundId, enabled);
      if (enabled) {
        const existing = await spinnerService.fetchOptions(roundId);
        if (existing.length === 0) {
          const seedOptions = round.spinnerOptions.length > 0 ? round.spinnerOptions : defaultWheelOptionsTh;
          await spinnerService.setOptions(roundId, seedOptions);
        }
      }
      alert(enabled ? t('partyGameEnableSuccess') : t('partyGameDisableSuccess'));
    } catch (e) {
      alert((e as Error).toString());
    } finally {
      setUpdatingPartyGame(false);
    }
  };

  // Helpers to present selected teebox info similar to Dart implementation
  function colorFromTeeboxName(name: string): string {
    const key = (name || '').trim().toLowerCase();
    const map: Record<string, string> = {
      white: '#ffffff',
      black: '#000000',
      blue: '#1e40af',
      navy: '#1e3a8a',
      royal: '#4169e1',
      sky: '#38bdf8',
      red: '#dc2626',
      maroon: '#7f1d1d',
      green: '#16a34a',
      emerald: '#059669',
      teal: '#0d9488',
      yellow: '#eab308',
      gold: '#d4af37',
      orange: '#f97316',
      purple: '#7e22ce',
      violet: '#8b5cf6',
      pink: '#ec4899',
      brown: '#92400e',
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gray: '#9ca3af',
      grey: '#9ca3af',
    };
    return map[key] ?? key;
  }

  function totalYardsFromTeebox(teebox: any): number {
    if (!teebox) return 0;
    if (typeof teebox.totalYardsOverride === 'number') return teebox.totalYardsOverride;
    let sum = 0;
    const cells: any[] = Array.isArray(teebox.cells) ? teebox.cells : [];
    for (const cell of cells) {
      if (cell?.kind === 'hole' && typeof cell?.yards === 'number') {
        sum += cell.yards;
      }
    }
    // Fallback: if side cells contain yards, take max
    if (sum === 0) {
      const sides = cells.filter((c) => typeof c?.yards === 'number').map((c) => c.yards as number);
      if (sides.length > 0) sum = Math.max(...sides);
    }
    return sum;
  }

  function allTeeboxesOfScorecard(sc: any): any[] {
    const back = sc?.backTeeboxes?.teeboxes ?? [];
    const forward = sc?.forwardTeeboxes?.teeboxes ?? [];
    return [...back, ...forward];
  }

  function renderTeeboxInfo() {
    if (!round || !user) return null;
    const selectedIds: string[] = Array.isArray(round.userTeeboxes[user.uid]) ? (round.userTeeboxes[user.uid] as string[]) : [];
    if (selectedIds.length === 0 || !Array.isArray(round.scorecards) || round.scorecards.length === 0) return null;

    // Multiple scorecards (front/back)
    if (round.scorecards.length > 1 && round.selectedScoreCardIds.length >= 2) {
      const frontSc = round.scorecards.find((sc) => sc.id === round.selectedScoreCardIds[0]) || round.scorecards[0];
      const backSc = round.scorecards.find((sc) => sc.id === round.selectedScoreCardIds[1]) || round.scorecards[round.scorecards.length - 1];
      const frontSelectedId = selectedIds[0] ?? null;
      const backSelectedId = selectedIds[1] ?? null;
      const frontTee = allTeeboxesOfScorecard(frontSc).find((t) => t.rowId === frontSelectedId) ||
        allTeeboxesOfScorecard(frontSc).find((t) => selectedIds.includes(t.rowId));
      const backTee = allTeeboxesOfScorecard(backSc).find((t) => t.rowId === backSelectedId) ||
        allTeeboxesOfScorecard(backSc).find((t) => selectedIds.includes(t.rowId));

      const rows: any[] = [];
      if (frontTee) {
        const color = colorFromTeeboxName(frontTee.name || frontTee.color || '');
        const frontName = frontSc?.name?.length ? frontSc.name : round.course.name;
        const rating = typeof frontTee.rating === 'number' ? frontTee.rating.toFixed(1) : '-';
        const slope = typeof frontTee.slope === 'number' ? String(frontTee.slope) : '-';
        rows.push(
          <div key="front" className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-full border-2 border-black" style={{ backgroundColor: color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{`${frontName} — ${t('front9')}`}</div>
              <div className="text-xs text-muted-foreground">
                {frontTee.name} {t('yards')}: {totalYardsFromTeebox(frontTee)} • {rating} / {slope}
              </div>
            </div>
          </div>
        );
      }
      if (backTee) {
        if (rows.length > 0) {
          rows.push(<div key="divider" className="h-px bg-border my-3" />);
        }
        const color = colorFromTeeboxName(backTee.name || backTee.color || '');
        const backName = backSc?.name?.length ? backSc.name : round.course.name;
        const rating = typeof backTee.rating === 'number' ? backTee.rating.toFixed(1) : '-';
        const slope = typeof backTee.slope === 'number' ? String(backTee.slope) : '-';
        rows.push(
          <div key="back" className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-full border-2 border-black" style={{ backgroundColor: color }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{`${backName} — ${t('back9')}`}</div>
              <div className="text-xs text-muted-foreground">
                {backTee.name} {t('yards')}: {totalYardsFromTeebox(backTee)} • {rating} / {slope}
              </div>
            </div>
          </div>
        );
      }
      if (rows.length === 0) return null;
      return <div className="space-y-0">{rows}</div>;
    }

    // Single scorecard: combine
    const sc = round.scorecards[0];
    const tees = allTeeboxesOfScorecard(sc).filter((tbox) => selectedIds.includes(tbox.rowId));
    if (tees.length === 0) return null;
    const badgeColor = colorFromTeeboxName(tees[0].name || tees[0].color || '');
    const names = Array.from(new Set(tees.map((tbox) => tbox.name))).join('/');
    let details: string;
    if (tees.length === 1) {
      const tt = tees[0];
      const rating = typeof tt.rating === 'number' ? tt.rating.toFixed(1) : '-';
      const slope = typeof tt.slope === 'number' ? String(tt.slope) : '-';
      details = `${t('yards')}: ${totalYardsFromTeebox(tt)} • ${rating} / ${slope}`;
    } else {
      const ratings = tees.map((tbox) => (typeof tbox.rating === 'number' ? tbox.rating : null)).filter((v) => v !== null) as number[];
      const slopes = tees.map((tbox) => (typeof tbox.slope === 'number' ? tbox.slope : null)).filter((v) => v !== null) as number[];
      const sumRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) : null;
      const avgSlope = slopes.length ? Math.round(slopes.reduce((a, b) => a + b, 0) / slopes.length) : null;
      const r = sumRating !== null ? sumRating.toFixed(1) : '-';
      const s = avgSlope !== null ? String(avgSlope) : '-';
      details = `${r} / ${s}`;
    }
    const title = sc?.name?.length ? sc.name : round.course.name;
    return (
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-full border-2 border-black" style={{ backgroundColor: badgeColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{names} • {details}</div>
        </div>
      </div>
    );
  }

  if (loading || !round) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = round.adminId === user?.uid;
  const isMember = round.memberIds.includes(user?.uid || '');

  // If gameId is provided, show GameSettingsScreen
  if (gameId && user) {
    const game = round.games.find((g) => g.id === gameId);
    if (game) {
      return (
        <GameSettingsScreen
          round={round}
          game={game}
          users={users}
          currentUserId={user.uid}
          onClose={() => {
            if (roundId) {
              router.push(`/${locale}/rounds/${roundId}`);
            } else {
              router.back();
            }
          }}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('roundSettings')}</h1>
          <button
            aria-label="Close"
            onClick={() => {
              if (roundId) {
                router.push(`/${locale}/rounds/${roundId}`);
              } else {
                router.back();
              }
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent/20"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Teebox Section (V2 only) */}
        {round.version === '2' && user && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t('myTeebox')}</p>
              <button
                onClick={() => setShowTeeboxSelector(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-accent/20 text-sm"
              >
                <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                {t('edit')}
              </button>
            </div>
            <div className="h-3" />
            <div className="border border-border rounded-lg p-4">
              {renderTeeboxInfo() ?? <div className="text-sm text-muted-foreground">{t('noSelection') || ''}</div>}
            </div>
          </div>
        )}

        {/* Party Game Toggle */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('partyGameToggleTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('partyGameToggleSubtitle')}</p>
            </div>
            {updatingPartyGame ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            ) : (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={round.partyGameEnabled || false}
                  onChange={(e) => handleTogglePartyGame(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('members')}</h2>
          <div className="bg-card border border-border rounded-lg divide-y">
            {round.memberIds.map((memberId, index) => {
              const member = users[memberId];
              const isRoundAdmin = memberId === round.adminId;
              const canRemove = isAdmin && !isRoundAdmin;

              return (
                <div key={memberId} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {member?.pictureUrl ? <AvatarImage src={member.pictureUrl} alt={member?.name} /> : null}
                      <AvatarFallback className="text-white font-bold" style={{ backgroundColor: roundColorForPlayer(round, memberId) }}>
                        {getInitials(member?.name || memberId)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member?.name || memberId}</p>
                      {isRoundAdmin && <p className="text-xs text-muted-foreground">Admin</p>}
                    </div>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(memberId)}
                      className="text-error hover:opacity-80"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Round (Members Only) */}
        {!isAdmin && isMember && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-error mb-2">{t('dangerZone')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('leaveRoundConfirm')}</p>
            <button
              onClick={handleLeaveRound}
              className="w-full px-4 py-2 bg-error text-error-foreground rounded-lg font-medium"
            >
              {t('leaveRound')}
            </button>
          </div>
        )}

        {/* Delete Round (Admin Only) */}
        {isAdmin && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-error mb-2">{t('dangerZone')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('deleteRoundWarning')}</p>
            <button
              onClick={handleDeleteRound}
              disabled={isDeleting}
              className="w-full px-4 py-2 bg-error text-error-foreground rounded-lg font-medium disabled:bg-muted"
            >
              {isDeleting ? t('deleting') : t('deleteThisRound')}
            </button>
          </div>
        )}
      </div>

      {/* Teebox selector overlay */}
      {showTeeboxSelector && user && round && (
        <TeeboxSelector
          round={round}
          currentUserId={user.uid}
          onClose={() => setShowTeeboxSelector(false)}
        />
      )}

      {/* Game Type Selection Dialog is handled inside GamesView */}
    </div>
  );
}

