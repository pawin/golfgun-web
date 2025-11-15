'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import RoundCardView from '@/components/widgets/RoundCardView';

interface RoundStatistics {
  totalRounds: number;
  averageScore: number;
  bestScore: number;
  bestTotalScore?: number;
  roundsThisMonth: number;
  mostPlayedCourse?: string;
  lastPlayedDate?: Date;
  lastPlayedCourse?: string;
}

export default function HomeTab() {
  const t = useTranslations();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [stats, setStats] = useState<RoundStatistics | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      loadRounds();
      loadStatistics();
    }
  }, [user, loading]);

  const loadRounds = async () => {
    if (!user) return;

    setLoadingRounds(true);
    setError(null);

    try {
      const allRounds = await roundService.getAllRounds(user.uid);
      
      // Filter active rounds (not finished, not deleted)
      const active = allRounds
        .filter((r) => !r.deletedAt && !r.isFinished)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setActiveRounds(active);

      // Fetch users
      const allUserIds = new Set<string>();
      active.forEach((r) => {
        allUserIds.add(r.adminId);
        r.memberIds.forEach((id) => allUserIds.add(id));
      });

      if (allUserIds.size > 0) {
        const fetchedUsers = await userService.getUsersByIds(Array.from(allUserIds));
        setUsers(fetchedUsers);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingRounds(false);
    }
  };

  const loadStatistics = async () => {
    if (!user) return;

    setLoadingStats(true);

    try {
      const allRounds = await roundService.getAllRounds(user.uid);
      const finishedRounds = allRounds.filter((r) => !r.deletedAt && r.isFinished);

      // Filter to only include rounds where every hole has a score > 0
      const validRounds = finishedRounds.filter((r) => isRoundCompleteWithAllScores(r, user.uid));

      setStats(calculateStatistics(validRounds, user.uid));
    } catch (e) {
      console.error('Failed to load statistics:', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleStartRound = () => {
    router.push('/courses');
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

  const appUser = users[user.uid];
  const userName = appUser?.name || t('player');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('welcomeUser', { name: userName })}
          </h1>
        </div>

        {/* Active Rounds Section */}
        {activeRounds.length > 0 && (
          <ActiveRoundsSection rounds={activeRounds} users={users} currentUserId={user.uid} />
        )}

        {/* Start New Round Button */}
        <button
          onClick={handleStartRound}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span>
          {t('startNewRound')}
        </button>

        {/* Quick Stats Summary */}
        {stats && <QuickStatsSummary stats={stats} />}

        {/* Statistics Dashboard */}
        {loadingStats ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : stats ? (
          <StatisticsSection stats={stats} />
        ) : null}
      </div>
    </div>
  );
}

function ActiveRoundsSection({
  rounds,
  users,
  currentUserId,
}: {
  rounds: Round[];
  users: Record<string, AppUser>;
  currentUserId: string;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">▶</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-green-700">{t('activeRounds')}</h2>
            <p className="text-sm text-green-600">{t('roundsInProgress', { count: rounds.length })}</p>
          </div>
        </div>
      </div>
      {rounds.map((round) => (
        <RoundCardView
          key={round.id}
          round={round}
          currentUserId={currentUserId}
          users={users}
        />
      ))}
    </div>
  );
}

function QuickStatsSummary({ stats }: { stats: RoundStatistics }) {
  const t = useTranslations();

  if (stats.totalRounds === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-2">{t('welcomeTitle')}</h3>
        <p className="text-gray-600">{t('welcomeSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">{t('summary')}</h3>
      <div className="space-y-3">
        <StatRow icon="⛳" label={t('totalRounds')} value={stats.totalRounds.toString()} />
        {stats.totalRounds > 0 && (
          <>
            <StatRow
              icon="📈"
              label={t('averageScore')}
              value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : t('dash')}
            />
            {stats.bestScore !== 0 && (
              <StatRow
                icon="🏆"
                label={t('bestScore')}
                value={formatBestScore(stats.bestTotalScore, stats.bestScore)}
              />
            )}
            <StatRow icon="📅" label={t('thisMonth')} value={stats.roundsThisMonth.toString()} />
            {stats.mostPlayedCourse && (
              <StatRow icon="📍" label={t('courses')} value={stats.mostPlayedCourse} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function StatisticsSection({ stats }: { stats: RoundStatistics }) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">{t('statistics')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon="⛳"
          label={t('totalRounds')}
          value={stats.totalRounds.toString()}
          color="blue"
        />
        <StatCard
          icon="📈"
          label={t('averageScore')}
          value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : t('dash')}
          color="green"
        />
        <StatCard
          icon="🏆"
          label={t('bestScore')}
          value={stats.bestScore !== 0 ? formatBestScore(stats.bestTotalScore, stats.bestScore) : t('dash')}
          color="amber"
        />
        <StatCard
          icon="📅"
          label={t('thisMonth')}
          value={stats.roundsThisMonth.toString()}
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-2xl font-bold mb-1">{value}</span>
      <span className="text-xs text-gray-600 text-center">{label}</span>
    </div>
  );
}

// Helper functions
function calculateStatistics(rounds: Round[], userId: string): RoundStatistics {
  if (rounds.length === 0) {
    return {
      totalRounds: 0,
      averageScore: 0,
      bestScore: 0,
      roundsThisMonth: 0,
    };
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let total = 0;
  let sum = 0;
  let bestRelativeToPar: number | null = null;
  let bestTotalScore: number | undefined = undefined;
  let thisMonth = 0;
  const courseCounts: Record<string, number> = {};
  let lastRound: Round | null = null;
  let lastDate: Date | undefined = undefined;

  for (const round of rounds) {
    const userScore = calculateUserScore(round, userId);
    if (userScore > 0) {
      total++;
      sum += userScore;

      const scoreRelativeToPar = calculateScoreRelativeToPar(round, userId);
      if (scoreRelativeToPar !== null) {
        if (bestRelativeToPar === null || scoreRelativeToPar < bestRelativeToPar) {
          bestRelativeToPar = scoreRelativeToPar;
          bestTotalScore = userScore;
        }
      }
    }

    // Count rounds this month
    if (round.endedAt && round.endedAt > thisMonthStart) {
      thisMonth++;
    }

    // Track most played course
    courseCounts[round.course.name] = (courseCounts[round.course.name] || 0) + 1;

    // Track last played
    if (round.endedAt) {
      if (!lastDate || round.endedAt > lastDate) {
        lastDate = round.endedAt;
        lastRound = round;
      }
    }
  }

  const mostPlayed = Object.entries(courseCounts).reduce((a, b) => (a[1] > b[1] ? a : b), ['', 0])[0] || undefined;

  return {
    totalRounds: total,
    averageScore: total > 0 ? sum / total : 0,
    bestScore: bestRelativeToPar ?? 0,
    bestTotalScore,
    roundsThisMonth: thisMonth,
    mostPlayedCourse: mostPlayed || undefined,
    lastPlayedDate: lastDate,
    lastPlayedCourse: lastRound?.course.name,
  };
}

function calculateUserScore(round: Round, userId: string): number {
  const playableHoles = getPlayableHoles(round);
  let total = 0;
  for (const hole of playableHoles) {
    const score = round.score[String(hole)]?.[userId] ?? 0;
    if (score > 0) {
      total += score;
    }
  }
  return total;
}

function calculateScoreRelativeToPar(round: Round, userId: string): number | null {
  const playableHoles = getPlayableHoles(round);
  let totalScore = 0;
  let totalPar = 0;

  for (const hole of playableHoles) {
    const holeKey = String(hole);
    const score = round.score[holeKey]?.[userId] ?? 0;
    if (score <= 0) return null;

    totalScore += score;
    totalPar += getParForHole(round, hole);
  }

  return totalScore - totalPar;
}

function getParForHole(round: Round, holeNumber: number): number {
  const idx = round.scorecard.holes.findIndex((h: any) => {
    const kind = h.kind?.toString().toLowerCase();
    const val = h.value?.toString();
    return kind === 'hole' && val === String(holeNumber);
  });
  if (idx < 0 || idx >= round.scorecard.par.length) return 4;
  const parValue = round.scorecard.par[idx]?.value;
  if (typeof parValue === 'number') return parValue;
  return parseInt(parValue?.toString() ?? '4') || 4;
}

function getPlayableHoles(round: Round): number[] {
  const holes: number[] = [];
  for (const entry of Object.keys(round.score)) {
    const holeNum = parseInt(entry);
    if (!isNaN(holeNum) && holeNum > 0) {
      holes.push(holeNum);
    }
  }
  return holes.sort((a, b) => a - b);
}

function isRoundCompleteWithAllScores(round: Round, userId: string): boolean {
  const playableHoles = getPlayableHoles(round);
  for (const hole of playableHoles) {
    const score = round.score[String(hole)]?.[userId] ?? 0;
    if (score <= 0) return false;
  }
  return true;
}

function formatScoreRelativeToPar(scoreRelativeToPar: number): string {
  if (scoreRelativeToPar === 0) {
    return 'E';
  } else if (scoreRelativeToPar < 0) {
    return String(scoreRelativeToPar);
  } else {
    return `+${scoreRelativeToPar}`;
  }
}

function formatBestScore(totalScore: number | undefined, scoreRelativeToPar: number): string {
  if (totalScore === undefined) {
    return formatScoreRelativeToPar(scoreRelativeToPar);
  }
  const relativeStr = formatScoreRelativeToPar(scoreRelativeToPar);
  return `${totalScore} (${relativeStr})`;
}
