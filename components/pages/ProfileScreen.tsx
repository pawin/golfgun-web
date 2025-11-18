'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserXmark, faXmark } from '@fortawesome/free-solid-svg-icons';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { roundService } from '@/lib/services/roundService';
import { friendService, FriendshipWithUser } from '@/lib/services/friendService';
import { HeadToHeadService, HeadToHeadStats, hasHeadToHeadData } from '@/lib/services/headToHeadService';
import { AppUser } from '@/lib/models/appUser';
import { Round, roundIsFinished } from '@/lib/models/round';
import { Friendship, FriendshipStatus } from '@/lib/models/friendship';
import { getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import RoundCardView from '@/components/widgets/RoundCardView';
import { useRouteParams } from '@/lib/contexts/RouteParamsContext';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

export default function ProfileScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const routeParams = useRouteParams<{ userId?: string }>();
  const [user, loading] = useAuthState(auth);
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [headToHead, setHeadToHead] = useState<HeadToHeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriendshipLoading, setIsFriendshipLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(routeParams.userId ?? null);
  }, [routeParams.userId]);

  useEffect(() => {
    if (userId && user && !loading) {
      loadData();
    }
  }, [userId, user, loading]);

  const loadData = async () => {
    if (!userId || !user) return;

    setIsLoading(true);
    setIsFriendshipLoading(true);

    try {
      const targetUser = await userService.getUserById(userId);
      setProfileUser(targetUser);

      if (user.uid) {
        const allRounds = await roundService.getAllRounds(user.uid);
        const userRounds = allRounds
          .filter(
            (r) =>
              !r.deletedAt &&
              roundIsFinished(r) &&
              (r.memberIds.includes(userId) || r.adminId === userId)
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setRounds(userRounds);

        // Fetch all users for rounds display and head-to-head calculation
        const allUserIds = new Set<string>();
        allRounds.forEach((r) => {
          allUserIds.add(r.adminId);
          r.memberIds.forEach((id) => allUserIds.add(id));
        });

        if (allUserIds.size > 0) {
          const usersMap = await userService.getUsersByIds(Array.from(allUserIds));
          setUsers(usersMap);

          if (user.uid !== userId) {
            const usersMapForService = new Map<string, AppUser>();
            Object.entries(usersMap).forEach(([id, user]) => {
              usersMapForService.set(id, user);
            });

            const stats = HeadToHeadService.calculate({
              rounds: allRounds,
              currentUserId: user.uid,
              otherUserId: userId,
              users: usersMapForService,
            });
            setHeadToHead(stats);

            const friendshipData = await friendService.getFriendship(user.uid, userId);
            setFriendship(friendshipData);
          }
        } else if (user.uid !== userId) {
          const friendshipData = await friendService.getFriendship(user.uid, userId);
          setFriendship(friendshipData);
        }
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setIsLoading(false);
      setIsFriendshipLoading(false);
    }
  };

  const refreshFriendship = async () => {
    if (!user || !userId || user.uid === userId) {
      setFriendship(null);
      setIsFriendshipLoading(false);
      return;
    }

    setIsFriendshipLoading(true);

    try {
      const friendshipData = await friendService.getFriendship(user.uid, userId);
      setFriendship(friendshipData);
    } catch (e) {
      console.error('Failed to refresh friendship:', e);
    } finally {
      setIsFriendshipLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !profileUser) return;
    try {
      await friendService.sendFriendRequest({
        fromUserId: user.uid,
        toUserId: profileUser.id,
      });
      await refreshFriendship();
      alert(t('friendsRequestSent'));
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user || !profileUser) return;
    try {
      await friendService.acceptFriendRequest({
        currentUserId: user.uid,
        otherUserId: profileUser.id,
      });
      await refreshFriendship();
      alert(t('friendsRequestAccepted'));
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  const handleDeclineFriendRequest = async () => {
    if (!user || !profileUser) return;
    try {
      await friendService.declineFriendRequest({
        currentUserId: user.uid,
        otherUserId: profileUser.id,
      });
      await refreshFriendship();
      alert(t('friendsRequestDeclined'));
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!user || !profileUser) return;
    try {
      await friendService.cancelFriendRequest({
        fromUserId: user.uid,
        toUserId: profileUser.id,
      });
      await refreshFriendship();
      alert(t('friendsRequestCancelled'));
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !profileUser) return;
    if (!confirm(t('friendsRemoveConfirmMessage', { name: profileUser.name }))) return;

    try {
      await friendService.removeFriend({
        userId1: user.uid,
        userId2: profileUser.id,
      });
      await refreshFriendship();
      alert(t('friendsRemoved'));
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('profileUnknownUser')}</p>
      </div>
    );
  }

  const currentUserId = user?.uid || '';
  const isOwnProfile = currentUserId === userId;
  const canShowFriendActions = !isOwnProfile && currentUserId && ['member', 'temporary'].includes(profileUser.role || '');

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-100">
        <div className="flex items-center gap-3 min-w-0">
          <AppIconHomeLink />
          <h1 className="text-xl font-semibold truncate">{t('profile')}</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent/20"
          aria-label="close"
          title={t('close')}
        >
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
          <Avatar className="w-20 h-20 flex-shrink-0">
            {profileUser.pictureUrl ? <AvatarImage src={profileUser.pictureUrl} alt={profileUser.name} /> : null}
            <AvatarFallback className="text-white font-bold text-2xl" style={{ backgroundColor: 'var(--color-chart-1)' }}>
              {getInitials(profileUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xl truncate">{profileUser.name}</p>
          </div>
          {!isOwnProfile && friendship && friendship.status === FriendshipStatus.accepted && (
            <button
              onClick={handleRemoveFriend}
              className="text-muted-foreground text-sm flex-shrink-0"
              title={t('friendsActionRemove')}
            >
              <FontAwesomeIcon icon={faUserXmark} />
            </button>
          )}
        </div>

        {/* Friend Action Button */}
        {canShowFriendActions && (
          <div>
            {isFriendshipLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : !friendship ? (
              <button
                onClick={handleSendFriendRequest}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                {t('friendsActionAdd')}
              </button>
            ) : friendship.status === FriendshipStatus.pending ? (
              friendship.initiatorId === currentUserId ? (
                <button
                  onClick={handleCancelFriendRequest}
                  className="w-full px-4 py-2 bg-error text-error-foreground rounded-lg font-medium"
                >
                  {t('friendsActionCancel')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeclineFriendRequest}
                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium"
                  >
                    {t('friendsActionDecline')}
                  </button>
                  <button
                    onClick={handleAcceptFriendRequest}
                    className="flex-1 px-4 py-2 bg-success text-success-foreground rounded-lg font-medium"
                  >
                    {t('friendsActionAccept')}
                  </button>
                </div>
              )
            ) : null}
          </div>
        )}

        {/* Head-to-Head Stats */}
        {!isOwnProfile && headToHead && hasHeadToHeadData(headToHead) && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">{t('profileHeadToHeadTitle')}</h2>
            <HeadToHeadSection stats={headToHead} />
          </div>
        )}

        {/* Rounds Section */}
        {!isOwnProfile && (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {t('profileRoundsTogether')} ({rounds.length})
            </h2>
            {rounds.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-4 text-muted-foreground">
                {t('profileNoRounds')}
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map((round) => (
                  <RoundCardView
                    key={round.id}
                    round={round}
                    currentUserId={currentUserId}
                    users={users}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HeadToHeadSection({ stats }: { stats: HeadToHeadStats }) {
  const t = useTranslations();

  const formatSigned = (value: number) => (value > 0 ? `+${value}` : String(value));

  const calculateWinRate = (wins: number, ties: number, games: number) => {
    if (games === 0) return 0;
    return ((wins * 1.0 + ties * 0.5) / games) * 100;
  };

  const formatWinRate = (winRate: number) => {
    const rounded = winRate.toFixed(1);
    if (rounded.endsWith('0')) {
      return winRate.toFixed(0);
    }
    return rounded;
  };

  const colorForWinRate = (winRate: number) => {
    if (winRate > 50) return 'text-success';
    if (winRate < 50) return 'text-error';
    return 'text-muted-foreground';
  };

  const colorForValue = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const buildStatsRow = ({
    label,
    games,
    wins,
    losses,
    ties,
    netValue,
    netLabel,
  }: {
    label: string;
    games: number;
    wins: number;
    losses: number;
    ties: number;
    netValue: number;
    netLabel: string;
  }) => {
    if (games === 0) {
      return (
        <div className="flex justify-between items-start">
          <span className="font-medium">{label}</span>
          <span className="text-gray-600">{t('profileHeadToHeadNoGames')}</span>
        </div>
      );
    }

    const winRate = calculateWinRate(wins, ties, games);
    const winRateText = formatWinRate(winRate);
    const winRateColor = colorForWinRate(winRate);
    const netColor = colorForValue(netValue);

    return (
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium">{label}</div>
          <div className={`text-sm ${netColor}`}>{netLabel}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">
            <span className="text-success">{wins}</span>-<span className="text-error">{losses}</span>-
            <span className="text-muted-foreground">{ties}</span>
          </div>
          <div className={`text-sm ${winRateColor}`}>
            {t('profileHeadToHeadWinRate', { rate: winRateText })}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {buildStatsRow({
        label: t('profileHeadToHead1v1'),
        games: stats.oneVOne.games,
        wins: stats.oneVOne.wins,
        losses: stats.oneVOne.losses,
        ties: stats.oneVOne.ties,
        netValue: stats.oneVOne.netPoints,
        netLabel: t('profileHeadToHeadNetPoints', { points: formatSigned(stats.oneVOne.netPoints) }),
      })}
      <div className="border-t border-gray-200"></div>
      {buildStatsRow({
        label: t('profileHeadToHeadSameTeam'),
        games: stats.sameTeam.games,
        wins: stats.sameTeam.wins,
        losses: stats.sameTeam.losses,
        ties: stats.sameTeam.ties,
        netValue: stats.sameTeam.netPoints,
        netLabel: t('profileHeadToHeadNetPoints', { points: formatSigned(stats.sameTeam.netPoints) }),
      })}
      <div className="border-t border-gray-200"></div>
      {buildStatsRow({
        label: t('profileHeadToHeadOppositeTeam'),
        games: stats.oppositeTeam.games,
        wins: stats.oppositeTeam.wins,
        losses: stats.oppositeTeam.losses,
        ties: stats.oppositeTeam.ties,
        netValue: stats.oppositeTeam.netPoints,
        netLabel: t('profileHeadToHeadNetPoints', { points: formatSigned(stats.oppositeTeam.netPoints) }),
      })}
      <div className="border-t border-gray-200"></div>
      {buildStatsRow({
        label: t('profileHeadToHeadSkins'),
        games: stats.skins.games,
        wins: stats.skins.wins,
        losses: stats.skins.losses,
        ties: stats.skins.ties,
        netValue: stats.skins.netScore,
        netLabel: t('profileHeadToHeadNetScore', { score: formatSigned(stats.skins.netScore) }),
      })}
      <div className="border-t border-gray-200"></div>
      {buildStatsRow({
        label: t('profileHeadToHeadOlympic'),
        games: stats.olympic.games,
        wins: stats.olympic.wins,
        losses: stats.olympic.losses,
        ties: stats.olympic.ties,
        netValue: stats.olympic.netScore,
        netLabel: t('profileHeadToHeadNetScore', { score: formatSigned(stats.olympic.netScore) }),
      })}
      <div className="border-t border-gray-200"></div>
      {buildStatsRow({
        label: t('profileHeadToHeadHorse'),
        games: stats.horse.games,
        wins: stats.horse.wins,
        losses: stats.horse.losses,
        ties: stats.horse.ties,
        netValue: stats.horse.netScore,
        netLabel: t('profileHeadToHeadNetScore', { score: formatSigned(stats.horse.netScore) }),
      })}
    </div>
  );
}

