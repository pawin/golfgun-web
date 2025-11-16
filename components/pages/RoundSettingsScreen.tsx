'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { spinnerService } from '@/lib/services/spinnerService';
import { Round, RoundGame } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { userService } from '@/lib/services/userService';
import { getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { defaultWheelOptionsTh } from '@/lib/utils/party_game_defaults';
import GameSettingsScreen from './GameSettingsScreen';
import GamesView from '@/components/widgets/GamesView';

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
      router.push(`/${locale}/rounds`);
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
        <div className="min-h-screen bg-subtle">
          <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
            <h1 className="text-xl font-semibold">{t('gameSettings') || 'Game Settings'}</h1>
          </div>
          <GameSettingsScreen
            round={round}
            game={game}
            users={users}
            currentUserId={user.uid}
            onClose={() => router.back()}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold">{t('roundSettings')}</h1>
      </div>

      <div className="p-4 space-y-4">
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

        {/* Games Section */}
        <div>
          <GamesView
            round={round}
            users={users}
            currentUserId={user?.uid || ''}
            /* GamesView now owns the Add Game dialog */
            onGameTap={(game) => {
              router.push(`/${locale}/rounds/${roundId}/settings?gameId=${game.id}`);
            }}
          />
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
                      <AvatarFallback className="text-white font-bold" style={{ backgroundColor: 'var(--color-chart-1)' }}>
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

      {/* Game Type Selection Dialog is handled inside GamesView */}
    </div>
  );
}

