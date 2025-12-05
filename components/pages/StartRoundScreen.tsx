'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCurrentUserId } from '@/components/providers/AuthProvider';
import { scorecardService } from '@/lib/services/scorecardService';
import { courseService } from '@/lib/services/courseService';
import { roundService } from '@/lib/services/roundService';
import { Scorecard } from '@/lib/models/scorecard';
import { Course } from '@/lib/models/course';
import { ScoreCellKind } from '@/lib/models/scorecard';

export default function StartRoundScreen() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useCurrentUserId();
  const [course, setCourse] = useState<Course | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [loadingScorecards, setLoadingScorecards] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFirst, setSelectedFirst] = useState<string | null>(null);
  const [selectedSecond, setSelectedSecond] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const courseId = searchParams?.get('courseId');
    if (courseId) {
      loadCourseAndScorecards(courseId);
    }
  }, [searchParams]);

  const loadCourseAndScorecards = async (courseId: string) => {
    setLoadingScorecards(true);
    setError(null);

    try {
      const [courseData, scorecardsData] = await Promise.all([
        courseService.getCourse(courseId),
        scorecardService.getByCourseId(courseId),
      ]);

      if (!courseData) {
        setError('Course not found');
        return;
      }

      setCourse(courseData);
      const sorted = scorecardsData.sort((a, b) => a.name.localeCompare(b.name));
      setScorecards(sorted);

      // Auto-select if there's only one scorecard
      if (sorted.length === 1) {
        setSelectedFirst(sorted[0].id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingScorecards(false);
    }
  };

  const holeCount = (sc: Scorecard): number => {
    if (!sc.holes) return 0;

    const parRow = sc.backTeeboxes.par || sc.forwardTeeboxes.par;
    if (!parRow) return 0;

    let count = 0;
    for (let i = 0; i < sc.holes.cells.length; i++) {
      const cell = sc.holes.cells[i];
      if (cell.kind !== ScoreCellKind.hole) continue;

      if (i < parRow.cells.length) {
        const parCell = parRow.cells[i];
        const parValue = parCell.value;
        if (parValue && parValue.trim().length > 0) {
          count++;
        }
      }
    }
    return count;
  };

  const firstScorecard = selectedFirst
    ? scorecards.find((s) => s.id === selectedFirst) || null
    : null;

  const needsSecondSelection = firstScorecard && holeCount(firstScorecard) === 9;
  const canStart = selectedFirst != null;

  const handleStart = async () => {
    if (!userId || !course) return;

    const selectedIds: string[] = [];
    if (selectedFirst) selectedIds.push(selectedFirst);
    if (selectedSecond) selectedIds.push(selectedSecond);

    if (selectedIds.length === 0) return;

    setIsStarting(true);
    try {
      const round = await roundService.startRound(
        userId,
        selectedIds,
        course,
        scorecards
      );

      router.replace(`/rounds/${round.id}`);
    } catch (e) {
      setError((e as Error).message);
      setIsStarting(false);
    }
  };

  if (loadingScorecards) {
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

  if (error && !course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
          <h1 className="text-xl font-semibold">{t('startRound')}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-error text-center px-4">
            {t('failedToLoadScorecards')}
            <br />
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  if (scorecards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
          <h1 className="text-xl font-semibold">{t('startRound')}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('noScorecardsFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isStarting && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-foreground"></div>
        </div>
      )}

      <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold">{t('startRound')}</h1>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">{course.name}</h2>

        {/* Step 1: Select first scorecard */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">{t('startRound')}</h3>
          <div className="space-y-2">
            {scorecards.map((sc) => {
              const isSelected = selectedFirst === sc.id;
              const count = holeCount(sc);

              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    if (selectedFirst === sc.id) {
                      setSelectedFirst(null);
                      setSelectedSecond(null);
                    } else {
                      setSelectedFirst(sc.id);
                      setSelectedSecond(null);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-border-strong'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isSelected ? 'font-semibold' : ''}`}>
                        {sc.name || course.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {count} {t('holes')}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="text-primary text-xl">✓</span>
                    ) : (
                      <span className="text-muted-foreground text-xl">○</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select second scorecard if first is 9 holes */}
        {needsSecondSelection && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">
              {t('selectAnother9HoleScorecard')}
            </h3>
            <div className="space-y-2">
              {scorecards
                .filter((sc) => holeCount(sc) === 9)
                .map((sc) => {
                  const isSelected = selectedSecond === sc.id;
                  const count = holeCount(sc);

                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setSelectedSecond(isSelected ? null : sc.id);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${isSelected
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-border-strong'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${isSelected ? 'font-semibold' : ''}`}>
                            {sc.name || course.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {count} {t('holes')}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="text-primary text-xl">✓</span>
                        ) : (
                          <span className="text-muted-foreground text-xl">○</span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Start Button */}
        {canStart && (
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed"
          >
            {firstScorecard && holeCount(firstScorecard) === 9 && !selectedSecond
              ? t('start9Hole')
              : t('start')}
          </button>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-sm text-error">
              {t('failedToStartRound', { error })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

