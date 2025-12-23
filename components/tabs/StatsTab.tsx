'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGolfBall, faChartLine, faTrophy, faCalendar, faMapMarkerAlt, faBullseye, faWater, faChartBar, faFlag, faHeart } from '@fortawesome/free-solid-svg-icons';
import { useCurrentUserId } from '@/components/providers/AuthProvider';
import { roundService } from '@/lib/services/roundService';
import { Round, calculateGir, roundScorecardBridge, roundIsFinished } from '@/lib/models/round';
import { HoleStats } from '@/lib/models/round';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

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

interface PerformanceStats {
  totalHolesWithStats: number;
  fairwayHitPercent?: number;
  girPercent?: number;
  averagePutts?: number;
  totalBunkers: number;
  totalHazards: number;
}

interface ScoringBreakdownStats {
  eagleOrBetterPercent?: number;
  birdiePercent?: number;
  parPercent?: number;
  bogeyPercent?: number;
  doubleOrWorsePercent?: number;
  averagePar3?: number;
  averagePar4?: number;
  averagePar5?: number;
  totalHoles: number;
}

export default function StatsTab() {
  const t = useTranslations();
  const userId = useCurrentUserId();
  const [basicStats, setBasicStats] = useState<RoundStatistics | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [scoringBreakdown, setScoringBreakdown] = useState<ScoringBreakdownStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      const rounds = await roundService.getAllRounds(userId);
      const finishedRounds = rounds.filter((r) => !r.deletedAt && roundIsFinished(r));

      // Filter to only include rounds where every hole has a score > 0
      const validRounds = finishedRounds.filter((r) => isRoundCompleteWithAllScores(r, userId));

      setBasicStats(calculateBasicStatistics(validRounds, userId));
      setPerformanceStats(calculatePerformanceStats(validRounds, userId));
      setScoringBreakdown(calculateScoringBreakdown(validRounds, userId));
    } catch (e) {
      console.error('Failed to load statistics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{t('notSignedIn')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <AppIconHomeLink />
        <h1 className="text-xl font-semibold">{t('statisticsTitle')}</h1>
      </div>

      <div className="p-4 space-y-1">
        {/* Summary Section */}
        {basicStats && (
          <>
            <SummarySection stats={basicStats} />
            <div className="h-6"></div>
          </>
        )}

        {/* Performance Stats */}
        {performanceStats && (
          <>
            <PerformanceStatsSection stats={performanceStats} />
            <div className="h-6"></div>
          </>
        )}

        {/* Scoring Breakdown */}
        {scoringBreakdown && <ScoringBreakdownSection stats={scoringBreakdown} />}
      </div>
    </div>
  );
}

function SummarySection({ stats }: { stats: RoundStatistics }) {
  const t = useTranslations();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">{t('summary')}</h2>
      <div className="space-y-3">
        <StatRow icon={faGolfBall} label={t('totalRounds')} value={stats.totalRounds.toString()} iconColorClass="text-[color:var(--rough)]" />
        {stats.totalRounds > 0 && (
          <>
            <StatRow
              icon={faChartLine}
              label={t('averageScore')}
              value={stats.averageScore > 0 ? stats.averageScore.toFixed(1) : t('dash')}
              iconColorClass="text-[color:var(--rough)]"
            />
            {stats.bestScore !== 0 && (
              <StatRow
                icon={faTrophy}
                label={t('bestScore')}
                value={formatBestScore(stats.bestTotalScore, stats.bestScore)}
                iconColorClass="text-[color:var(--rough)]"
              />
            )}
            <StatRow icon={faCalendar} label={t('thisMonth')} value={stats.roundsThisMonth.toString()} iconColorClass="text-[color:var(--rough)]" />
            {stats.mostPlayedCourse && (
              <StatRow icon={faHeart} label={t('courses')} value={stats.mostPlayedCourse} iconColorClass="text-[color:var(--rough)]" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  iconColorClass,
}: {
  icon: any;
  label: string;
  value: string;
  iconColorClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <FontAwesomeIcon icon={icon} className={`text-xl ${iconColorClass ?? ''}`} />
      <span className="flex-1 text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function PerformanceStatsSection({ stats }: { stats: PerformanceStats }) {
  const t = useTranslations();

  if (stats.totalHolesWithStats === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <FontAwesomeIcon icon={faChartBar} className="text-5xl text-gray-400" />
          <h3 className="text-lg font-bold mt-4 mb-2">{t('noPerformanceData')}</h3>
          <p className="text-gray-600">{t('startTrackingStats')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('performanceStatistics')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <PerformanceCard
          icon={faBullseye}
          label={t('fairwayHitPercentLabel')}
          value={stats.fairwayHitPercent != null ? `${stats.fairwayHitPercent.toFixed(1)}%` : t('dash')}
          iconColorClass="text-red-600"
        />
        <PerformanceCard
          icon={faFlag}
          label={t('girPercentLabel')}
          value={stats.girPercent != null ? `${stats.girPercent.toFixed(1)}%` : t('dash')}
          iconColorClass="text-emerald-600"
        />
        <PerformanceCard
          icon={faGolfBall}
          label={t('avgPuttsPerHoleLabel')}
          value={stats.averagePutts != null ? stats.averagePutts.toFixed(1) : t('dash')}
          iconColorClass="text-sky-600"
        />
        <PerformanceCard
          icon={faWater}
          label={t('bunkersHazardsLabel')}
          value={`${stats.totalBunkers}/${stats.totalHazards}`}
          iconColorClass="text-amber-600"
        />
      </div>
    </div>
  );
}

function PerformanceCard({
  icon,
  label,
  value,
  iconColorClass,
}: {
  icon: any;
  label: string;
  value: string;
  iconColorClass?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
      <FontAwesomeIcon icon={icon} className={`text-3xl mb-2 ${iconColorClass ?? ''}`} />
      <span className="text-xl font-bold mb-1">{value}</span>
      <span className="text-xs text-gray-600 text-center">{label}</span>
    </div>
  );
}

function ScoringBreakdownSection({ stats }: { stats: ScoringBreakdownStats }) {
  const t = useTranslations();

  if (stats.totalHoles === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <FontAwesomeIcon icon={faChartBar} className="text-5xl text-gray-400" />
          <h3 className="text-lg font-bold mt-4 mb-2">{t('noScoringData')}</h3>
          <p className="text-gray-600">{t('playRoundsForScoringBreakdown')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('scoringBreakdown')}</h2>

      {/* Score Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-bold mb-4">{t('scoreDistribution')}</h3>
        <div className="space-y-3">
          <BreakdownRow
            label={t('eagleOrBetter')}
            percent={stats.eagleOrBetterPercent}
            color="eagle"
          />
          <BreakdownRow label={t('birdie')} percent={stats.birdiePercent} color="birdie" />
          <BreakdownRow label={t('par')} percent={stats.parPercent} color="par" />
          <BreakdownRow label={t('bogey')} percent={stats.bogeyPercent} color="bogey" />
          <BreakdownRow
            label={t('doubleOrWorse')}
            percent={stats.doubleOrWorsePercent}
            color="double-bogey"
          />
        </div>
      </div>

      {/* Average Scores by Par */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-bold mb-4">{t('averageScoreByPar')}</h3>
        <div className="space-y-3">
          <StatRow
            icon={faFlag}
            label={t('par3s')}
            value={stats.averagePar3 != null ? stats.averagePar3.toFixed(2) : t('dash')}
            iconColorClass="text-emerald-600"
          />
          <StatRow
            icon={faFlag}
            label={t('par4s')}
            value={stats.averagePar4 != null ? stats.averagePar4.toFixed(2) : t('dash')}
            iconColorClass="text-sky-600"
          />
          <StatRow
            icon={faFlag}
            label={t('par5s')}
            value={stats.averagePar5 != null ? stats.averagePar5.toFixed(2) : t('dash')}
            iconColorClass="text-amber-600"
          />
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  percent,
  color,
}: {
  label: string;
  percent?: number;
  color: string;
}) {
  const t = useTranslations();
  const colorStyle: React.CSSProperties =
    color === 'eagle'
      ? { backgroundColor: 'var(--score-eagle)' }
      : color === 'birdie'
      ? { backgroundColor: 'var(--score-birdie)' }
      : color === 'par'
      ? { backgroundColor: 'var(--score-par)' }
      : color === 'bogey'
      ? { backgroundColor: 'var(--score-bogey)' }
      : color === 'double-bogey'
      ? { backgroundColor: 'var(--score-double-bogey)' }
      : { backgroundColor: 'var(--muted)' };

  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 rounded" style={colorStyle}></div>
      <span className="flex-1 text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">
        {percent != null ? `${percent.toFixed(1)}%` : t('dash')}
      </span>
    </div>
  );
}

// Helper functions - reuse from HomeTab
function calculateBasicStatistics(rounds: Round[], userId: string): RoundStatistics {
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

    if (round.createdAt && round.createdAt > thisMonthStart) {
      thisMonth++;
    }

    courseCounts[round.course.name] = (courseCounts[round.course.name] || 0) + 1;

    if (round.createdAt) {
      if (!lastDate || round.createdAt > lastDate) {
        lastDate = round.createdAt;
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

function calculatePerformanceStats(rounds: Round[], userId: string): PerformanceStats {
  let holesWithFairway = 0;
  let fairwayHits = 0;
  let holesWithPutts = 0;
  let girHits = 0;
  let totalPutts = 0;
  let totalBunkers = 0;
  let totalHazards = 0;

  for (const round of rounds) {
    const playableHoles = getPlayableHoles(round);

    for (const hole of playableHoles) {
      const holeKey = String(hole);
      const stats = round.stats[holeKey]?.[userId];
      if (!stats) continue;

      // Fairway stats
      if (stats.fairway) {
        holesWithFairway++;
        if (stats.fairway === 'hit') {
          fairwayHits++;
        }
      }

      // Putts and GIR stats
      if (stats.putts && stats.putts > 0) {
        holesWithPutts++;
        totalPutts += stats.putts;

        // Calculate GIR
        const score = round.score[holeKey]?.[userId] ?? 0;
        if (score > 0) {
          const par = getParForHole(round, hole);
          const gir = calculateGir(stats, score, par);
          if (gir === true) {
            girHits++;
          }
        }
      }

      // Bunker and hazard counts
      if (stats.bunker) {
        totalBunkers += stats.bunker;
      }
      if (stats.hazard) {
        totalHazards += stats.hazard;
      }
    }
  }

  return {
    totalHolesWithStats: holesWithFairway + holesWithPutts,
    fairwayHitPercent: holesWithFairway > 0 ? (fairwayHits / holesWithFairway) * 100 : undefined,
    girPercent: holesWithPutts > 0 ? (girHits / holesWithPutts) * 100 : undefined,
    averagePutts: holesWithPutts > 0 ? totalPutts / holesWithPutts : undefined,
    totalBunkers,
    totalHazards,
  };
}

function calculateScoringBreakdown(rounds: Round[], userId: string): ScoringBreakdownStats {
  let totalHoles = 0;
  let eagleOrBetter = 0;
  let birdie = 0;
  let par = 0;
  let bogey = 0;
  let doubleOrWorse = 0;

  let par3Holes = 0;
  let par3Total = 0;
  let par4Holes = 0;
  let par4Total = 0;
  let par5Holes = 0;
  let par5Total = 0;

  for (const round of rounds) {
    const playableHoles = getPlayableHoles(round);

    for (const hole of playableHoles) {
      const holeKey = String(hole);
      const score = round.score[holeKey]?.[userId];
      if (!score || score <= 0) continue;

      const parValue = getParForHole(round, hole);
      const diff = score - parValue;

      totalHoles++;

      // Categorize score
      if (score === 1) {
        eagleOrBetter++;
      } else if (diff <= -2) {
        eagleOrBetter++;
      } else if (diff === -1) {
        birdie++;
      } else if (diff === 0) {
        par++;
      } else if (diff === 1) {
        bogey++;
      } else {
        doubleOrWorse++;
      }

      // Track averages by par
      if (parValue === 3) {
        par3Holes++;
        par3Total += score;
      } else if (parValue === 4) {
        par4Holes++;
        par4Total += score;
      } else if (parValue === 5) {
        par5Holes++;
        par5Total += score;
      }
    }
  }

  return {
    totalHoles,
    eagleOrBetterPercent: totalHoles > 0 ? (eagleOrBetter / totalHoles) * 100 : undefined,
    birdiePercent: totalHoles > 0 ? (birdie / totalHoles) * 100 : undefined,
    parPercent: totalHoles > 0 ? (par / totalHoles) * 100 : undefined,
    bogeyPercent: totalHoles > 0 ? (bogey / totalHoles) * 100 : undefined,
    doubleOrWorsePercent: totalHoles > 0 ? (doubleOrWorse / totalHoles) * 100 : undefined,
    averagePar3: par3Holes > 0 ? par3Total / par3Holes : undefined,
    averagePar4: par4Holes > 0 ? par4Total / par4Holes : undefined,
    averagePar5: par5Holes > 0 ? par5Total / par5Holes : undefined,
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
  const scorecard = roundScorecardBridge(round);
  const idx = scorecard.holes.findIndex((h: any) => {
    const kind = h.kind?.toString().toLowerCase();
    const val = h.value?.toString();
    return kind === 'hole' && val === String(holeNumber);
  });
  if (idx < 0 || idx >= scorecard.par.length) return 4;
  const parValue = scorecard.par[idx]?.value;
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
