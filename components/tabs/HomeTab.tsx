'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faGolfBall, faChartLine, faTrophy, faCalendar, faMapMarkerAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { auth } from '@/lib/firebase/config';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import { Round, roundIsFinished } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import RoundCardView from '@/components/widgets/RoundCardView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      
      console.log('All rounds loaded:', allRounds.length);
      console.log('Rounds data:', allRounds.map(r => ({
        id: r.id,
        deletedAt: r.deletedAt,
        isFinished: roundIsFinished(r),
        memberIds: r.memberIds,
        adminId: r.adminId,
        userId: user.uid,
      })));
      
      // Filter active rounds (not finished, not deleted)
      // Include rounds where the user is a member or the admin
      const active = allRounds
        .filter((r) => {
          const isMember = r.memberIds.includes(user.uid) || r.adminId === user.uid;
          const notDeleted = !r.deletedAt;
          const notFinished = !roundIsFinished(r);
          return isMember && notDeleted && notFinished;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log('Active rounds after filtering:', active.length, active.map(r => r.id));

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
      const finishedRounds = allRounds.filter((r) => !r.deletedAt && roundIsFinished(r));

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('notSignedIn')}</p>
      </div>
    );
  }

  const appUser = users[user.uid];
  const userName = appUser?.name || t('player');

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold">
            {t('welcomeUser', { name: userName })}
          </h1>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="border-destructive/30">
            <AlertDescription>
              <p className="text-sm">{error}</p>
              <Button variant="link" className="mt-2 px-0" onClick={loadRounds}>
                {t('retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Active Rounds Section */}
        {activeRounds.length > 0 ? (
          <ActiveRoundsSection rounds={activeRounds} users={users} currentUserId={user.uid} />
        ) : !loadingRounds && !error ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">{t('noActiveRounds')}</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Start New Round Button */}
        <Button onClick={handleStartRound} className="w-full h-12 text-base">
          <FontAwesomeIcon icon={faPlus} className="text-xl" />
          {t('startNewRound')}
        </Button>

        {/* Quick Stats Summary */}
        {stats && <QuickStatsSummary stats={stats} />}

        {/* Statistics Dashboard */}
        {loadingStats ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faPlay} className="text-2xl text-primary" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-primary">{t('activeRounds')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('roundsInProgress', { count: rounds.length })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
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
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-2">{t('welcomeTitle')}</h3>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-4">{t('summary')}</h3>
        <div className="space-y-3">
          <StatRow icon={faGolfBall} label={t('totalRounds')} value={stats.totalRounds.toString()} />
          {stats.totalRounds > 0 && (
            <>
              <StatRow
                icon={faChartLine}
                label={t('averageScore')}
                value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : t('dash')}
              />
              {stats.bestScore !== 0 && (
                <StatRow
                  icon={faTrophy}
                  label={t('bestScore')}
                  value={formatBestScore(stats.bestTotalScore, stats.bestScore)}
                />
              )}
              <StatRow icon={faCalendar} label={t('thisMonth')} value={stats.roundsThisMonth.toString()} />
              {stats.mostPlayedCourse && (
                <StatRow icon={faMapMarkerAlt} label={t('courses')} value={stats.mostPlayedCourse} />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <FontAwesomeIcon icon={icon} className="text-xl" />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
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
          icon={faGolfBall}
          label={t('totalRounds')}
          value={stats.totalRounds.toString()}
          color="primary"
        />
        <StatCard
          icon={faChartLine}
          label={t('averageScore')}
          value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : t('dash')}
          color="primary"
        />
        <StatCard
          icon={faTrophy}
          label={t('bestScore')}
          value={stats.bestScore !== 0 ? formatBestScore(stats.bestTotalScore, stats.bestScore) : t('dash')}
          color="secondary"
        />
        <StatCard
          icon={faCalendar}
          label={t('thisMonth')}
          value={stats.roundsThisMonth.toString()}
          color="muted"
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
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center">
        <FontAwesomeIcon
          icon={icon}
          className="text-3xl mb-2 text-primary"
        />
        <span className="text-2xl font-bold mb-1">{value}</span>
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      </CardContent>
    </Card>
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
