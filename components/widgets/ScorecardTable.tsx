'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Round, roundScorecardBridge, roundColorForPlayer, HoleStats } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { roundService } from '@/lib/services/roundService';
import ScoreEditDialog from './ScoreEditDialog';

interface ScorecardTableProps {
  round: Round;
  users: Record<string, AppUser>;
  currentUserId: string;
  currentUser?: AppUser;
  isAdmin: boolean;
  isMember: boolean;
}

export default function ScorecardTable({
  round,
  users,
  currentUserId,
  currentUser,
  isAdmin,
  isMember,
}: ScorecardTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const scorecard = roundScorecardBridge(round);
  const holes = scorecard.holes;
  const par = scorecard.par;
  const handicaps = scorecard.handicaps;

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    player: string;
    holeKey: string;
    parValue: number;
    currentScore: number | null;
    showStats: boolean;
    currentStats?: HoleStats;
    hasOlympicGame: boolean;
    currentOlympicPoint?: number;
    memberId: string;
  } | null>(null);

  // Find side labels (Out/In/Total)
  const sideEntries = holes
    .map((h, i) => ({ hole: h, index: i }))
    .filter((e) => e.hole.kind?.toString().toLowerCase() === 'side');

  const sideLabels = sideEntries.map((e) =>
    (e.hole.value?.toString() ?? '').toLowerCase()
  );

  const hasOut = sideLabels.includes('out');
  const hasIn = sideLabels.includes('in');
  const startsWithIn =
    sideEntries.length > 0 &&
    (sideEntries[0].hole.value?.toString().toLowerCase() === 'in');

  const canEdit = isAdmin || (isMember && !round.disableMemberEdit);

  const parForHole = (holeNumber: number): number => {
    const idx = holes.findIndex((h) => {
      const kind = h.kind?.toString().toLowerCase();
      const val = h.value?.toString();
      return kind === 'hole' && val === holeNumber.toString();
    });
    if (idx < 0 || idx >= par.length) return 4;
    const parValue = par[idx]?.value;
    if (typeof parValue === 'number') return parValue;
    return parseInt(parValue?.toString() ?? '4') || 4;
  };

  const getCellStyle = (score: number, parValue: number): { shape: 'circle' | 'square'; className: string } => {
    if (score <= 0) {
      return { shape: 'circle', className: '' };
    }

    const diff = score - parValue;

    if (score === 1) {
      // Hole in One
      return { shape: 'circle', className: 'bg-[var(--score-hole-in-one)] text-white' };
    }
    if (diff === -3) {
      // Albatross
      return { shape: 'circle', className: 'bg-[var(--score-albatross)] text-white' };
    }
    if (diff === -2) {
      // Eagle
      return { shape: 'circle', className: 'bg-[var(--score-eagle)] text-white' };
    }
    if (diff === -1) {
      // Birdie
      return { shape: 'circle', className: 'bg-[var(--score-birdie)] text-white' };
    }
    if (diff === 0) {
      // Par
      return { shape: 'circle', className: 'bg-[var(--score-par)] text-white' };
    }
    if (diff === 1) {
      // Bogey
      return { shape: 'square', className: 'bg-[var(--score-bogey)] text-white' };
    }
    if (diff === 2) {
      // Double Bogey
      return { shape: 'square', className: 'bg-[var(--score-double-bogey)] text-white' };
    }
    if (diff >= 3) {
      // Triple or worse
      return { shape: 'square', className: 'bg-[var(--score-triple-plus)] text-white' };
    }

    return { shape: 'circle', className: '' };
  };

  const getStrokeLabel = (score: number, parValue: number): string => {
    if (score <= 0) return '';
    const diff = score - parValue;
    if (score === 1) return t('strokeLabelHoleInOne') || 'Hole in One';
    if (diff === -3) return t('strokeLabelAlbatross') || 'Albatross';
    if (diff === -2) return t('strokeLabelEagle') || 'Eagle';
    if (diff === -1) return t('strokeLabelBirdie') || 'Birdie';
    if (diff === 0) return t('strokeLabelPar') || 'Par';
    if (diff === 1) return t('strokeLabelBogey') || 'Bogey';
    if (diff === 2) return t('strokeLabelDoubleBogey') || 'Double Bogey';
    if (diff === 3) return t('strokeLabelTripleBogey') || 'Triple Bogey';
    if (diff > 3) return `+${diff}`;
    return String(diff);
  };

  const handleScoreClick = (
    memberId: string,
    holeKey: string,
    currentScore: number | null
  ) => {
    if (!canEdit) return;

    const parValue = parForHole(parseInt(holeKey) || 0);
    const member = users[memberId];
    const isOwnScore = memberId === currentUserId;
    const currentStats = round.stats[holeKey]?.[memberId];
    const hasOlympicGame = round.games.some(
      (g) => g.type.toLowerCase() === 'olympic' && g.playerIds.includes(memberId)
    );
    const currentOlympicPoint = round.olympic?.[holeKey]?.[memberId] as number | undefined;

    setDialogState({
      isOpen: true,
      player: member?.name || '',
      holeKey,
      parValue,
      currentScore,
      showStats: isOwnScore,
      currentStats,
      hasOlympicGame,
      currentOlympicPoint,
      memberId,
    });
  };

  const handleDialogSave = async (result: {
    score: number;
    stats?: HoleStats;
    olympicPoint?: number;
  }) => {
    if (!dialogState) return;

    try {
      await roundService.updateScore(
        round.id,
        dialogState.holeKey,
        dialogState.memberId,
        result.score === -1 ? -1 : result.score === 0 ? null : result.score,
        result.stats,
        result.olympicPoint
      );
      setDialogState(null);
    } catch (error) {
      alert(t('saveFailed').replace('{error}', String(error)));
    }
  };

  const handleDialogClose = () => {
    setDialogState(null);
  };

  const handleNameClick = async (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const member = users[memberId];
    if (!member) return;

    // Check if clicked user is a guest
    const isGuest = member.role === 'guest';
    
    // Check if current user can replace the guest
    const currentUserNotInRound = !round.memberIds.includes(currentUserId);
    const currentUserRoleValid = currentUser && (currentUser.role === 'member' || currentUser.role === 'temporary');

    if (isGuest && currentUserNotInRound && currentUserRoleValid && currentUserId) {
      // Show confirmation dialog
      const guestName = member.name.replace(/\s*\(Guest\)$/i, '') || member.name;
      const confirmMessage = t('replaceGuestConfirm', { name: guestName });
      
      if (confirm(confirmMessage)) {
        try {
          await roundService.replaceGuest(round.id, memberId, currentUserId);
          alert(t('guestReplaced', { name: guestName }));
        } catch (error) {
          alert(t('failedToReplaceGuest', { error: String(error) }));
        }
      }
      return;
    }

    // Default behavior: navigate to profile
    router.push(`/${locale}/profile/${memberId}`);
  };

  return (
    <>
      <div className="relative px-[6px]">
        {/* Shared vertical scroll container to keep left and right tables aligned */}
        <div className="flex overflow-y-auto overscroll-none" style={{ WebkitOverflowScrolling: 'auto' }}>
          {/* Left table: labels + player names */}
          <div className="shrink-0">
            <table className="table-fixed divide-y divide-border">
              <thead>
                <tr className="bg-accent text-accent-foreground">
                  <th className="w-[80px] min-w-[80px] max-w-[80px] h-[40px] px-2 py-2 text-base font-bold bg-accent border border-border text-center">
                    Hole
                  </th>
                </tr>
                <tr className="bg-muted">
                  <th className="w-[80px] min-w-[80px] max-w-[80px] h-[40px] px-2 py-2 text-base font-bold bg-muted border border-border text-center">
                    HDCP
                  </th>
                </tr>
                <tr className="bg-accent text-accent-foreground">
                  <th className="w-[80px] min-w-[80px] max-w-[80px] h-[40px] px-2 py-2 text-base font-bold bg-accent border border-border text-center">
                    Par
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {round.memberIds.map((memberId) => {
                  const member = users[memberId];
                  if (!member) return null;
                  return (
                    <tr key={memberId} className="hover:bg-accent/20">
                      <td
                        onClick={(e) => handleNameClick(memberId, e)}
                        className="w-[80px] min-w-[80px] max-w-[80px] h-[40px] px-2 py-2 text-sm font-bold bg-card border border-border text-center cursor-pointer hover:underline"
                        style={{ color: roundColorForPlayer(round, memberId) }}
                      >
                        <span className="block truncate whitespace-nowrap overflow-hidden" title={member.name}>
                          {member.name}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right table: scrollable horizontally */}
          <div className="overflow-x-auto overscroll-none border-r border-border" style={{ WebkitOverflowScrolling: 'auto' }}>
            <table className="table-fixed divide-y divide-border">
              <thead>
                {/* Header row (Holes) */}
                <tr className="bg-accent text-accent-foreground">
                  {holes.map((hole, idx) => {
                    const kind = hole.kind?.toString().toLowerCase();
                    const isSummary = kind === 'side';
                    return (
                      <th
                        key={idx}
                        className={`h-[40px] px-2 py-2 text-base font-bold text-center border border-border ${idx === 0 ? 'border-l-0' : ''} ${idx === holes.length - 1 ? 'border-r-0' : ''} ${
                          isSummary ? 'w-[50px] min-w-[60px] max-w-[60px] bg-accent/80' : 'w-[40px] min-w-[40px] max-w-[40px]'
                        }`}
                      >
                        {hole.value?.toString() || ''}
                      </th>
                    );
                  })}
                </tr>
                {/* HDCP row */}
                <tr className="bg-muted">
                  {handicaps.map((hdcp, idx) => {
                    const kind = hdcp.kind?.toString().toLowerCase();
                    const isSummary = kind === 'side';
                    return (
                      <td
                        key={idx}
                        className={`h-[40px] px-2 py-2 text-base font-bold text-center border border-border ${idx === 0 ? 'border-l-0' : ''} ${idx === handicaps.length - 1 ? 'border-r-0' : ''} ${
                          isSummary ? 'w-[60px] min-w-[60px] max-w-[60px]' : 'w-[40px] min-w-[40px] max-w-[40px]'
                        }`}
                      >
                        {hdcp.value?.toString() || ''}
                      </td>
                    );
                  })}
                </tr>
                {/* Par row */}
                <tr className="bg-accent text-accent-foreground">
                  {holes.map((hole, idx) => {
                    const kind = hole.kind?.toString().toLowerCase();
                    const isSummary = kind === 'side';
                    const parValue = idx < par.length ? par[idx]?.value : null;
                    return (
                      <td
                        key={idx}
                        className={`h-[40px] px-2 py-2 text-base font-bold text-center border border-border ${idx === 0 ? 'border-l-0' : ''} ${idx === holes.length - 1 ? 'border-r-0' : ''} ${
                          isSummary ? 'w-[60px] min-w-[60px] max-w-[60px] bg-accent/80' : 'w-[40px] min-w-[40px] max-w-[40px]'
                        }`}
                      >
                        {parValue?.toString() || ''}
                      </td>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {round.memberIds.map((memberId) => {
                  const member = users[memberId];
                  if (!member) return null;

                  let outSum = 0;
                  let inSum = 0;
                  let inPhase = startsWithIn;

                  return (
                    <tr key={memberId} className="hover:bg-accent/20">
                      {holes.map((hole, idx) => {
                        const kind = hole.kind?.toString().toLowerCase();
                        const label = hole.value?.toString() ?? '';

                        if (kind === 'side') {
                          const low = label.toLowerCase();
                          let displayValue = '';
                          if (low === 'out') {
                            displayValue = outSum > 0 ? outSum.toString() : '';
                            inPhase = true;
                          } else if (low === 'in') {
                            displayValue = inSum > 0 ? inSum.toString() : '';
                            inPhase = false;
                          } else if (low === 'total') {
                            const total = outSum + inSum;
                            displayValue = total > 0 ? total.toString() : '';
                          }

                          return (
                            <td
                              key={idx}
                              className={`w-[60px] min-w-[60px] max-w-[60px] h-[40px] px-2 py-2 text-sm font-bold text-center bg-muted border border-border ${idx === 0 ? 'border-l-0' : ''} ${idx === holes.length - 1 ? 'border-r-0' : ''}`}
                            >
                              {displayValue}
                            </td>
                          );
                        }

                        if (kind !== 'hole') return null;

                        const holeKey = label;
                        const rawScore = round.score[holeKey]?.[memberId] ?? null;
                        const holeScore = rawScore && rawScore > 0 ? rawScore : 0;
                        const parValue = idx < par.length ? parForHole(parseInt(holeKey) || 0) : 4;
                        const style = getCellStyle(holeScore, parValue);

                        // Track sums
                        if (hasOut && hasIn) {
                          if (inPhase) {
                            inSum += holeScore;
                          } else {
                            outSum += holeScore;
                          }
                        } else {
                          outSum += holeScore;
                        }

                        let holeScoreText = '';
                        if (rawScore === -1) {
                          holeScoreText = 'X';
                        } else if (rawScore && rawScore > 0) {
                          holeScoreText = rawScore.toString();
                        }

                        const canEditThis =
                          isAdmin || (round.memberIds.includes(currentUserId) && !round.disableMemberEdit);

                        return (
                          <td
                            key={idx}
                            onClick={() =>
                              canEditThis && handleScoreClick(memberId, holeKey, rawScore)
                            }
                                className={`w-[40px] min-w-[40px] max-w-[40px] h-[40px] px-2 py-2 text-base font-bold text-center relative border border-border ${idx === 0 ? 'border-l-0' : ''} ${idx === holes.length - 1 ? 'border-r-0' : ''} ${
                              canEditThis
                                ? 'cursor-pointer hover:opacity-80'
                                : 'cursor-default'
                            }`}
                          >
                            {holeScore > 0 && (
                              <div
                                className={`absolute inset-0 m-[5px] flex items-center justify-center ${
                                  style.shape === 'circle' ? 'rounded-full' : 'rounded'
                                } ${style.className}`}
                              >
                                {holeScoreText}
                              </div>
                            )}
                            {holeScore === 0 && holeScoreText && (
                              <span className="text-muted-foreground">{holeScoreText}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Score Edit Dialog */}
      {dialogState && (
        <ScoreEditDialog
          isOpen={dialogState.isOpen}
          player={dialogState.player}
          holeKey={dialogState.holeKey}
          parValue={dialogState.parValue}
          currentScore={dialogState.currentScore}
          showStats={dialogState.showStats}
          currentStats={dialogState.currentStats}
          hasOlympicGame={dialogState.hasOlympicGame}
          currentOlympicPoint={dialogState.currentOlympicPoint}
          onClose={handleDialogClose}
          onSave={handleDialogSave}
        />
      )}
    </>
  );
}

