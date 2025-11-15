'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Round, roundScorecardBridge, roundColorForPlayer, HoleStats } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { roundService } from '@/lib/services/roundService';
import ScoreEditDialog from './ScoreEditDialog';

interface ScorecardTableProps {
  round: Round;
  users: Record<string, AppUser>;
  currentUserId: string;
  isAdmin: boolean;
  isMember: boolean;
}

export default function ScorecardTable({
  round,
  users,
  currentUserId,
  isAdmin,
  isMember,
}: ScorecardTableProps) {
  const t = useTranslations();
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

  const getCellStyle = (score: number, parValue: number): { shape: 'circle' | 'square'; bgColor: string; textColor: string } => {
    if (score <= 0) {
      return { shape: 'circle', bgColor: 'transparent', textColor: '#000000' };
    }

    const diff = score - parValue;

    if (score === 1) {
      return { shape: 'circle', bgColor: '#9932CC', textColor: '#FFFFFF' }; // Purple (Hole in One)
    }
    if (diff === -3) {
      return { shape: 'circle', bgColor: '#FF69B4', textColor: '#FFFFFF' }; // Pink (Albatross)
    }
    if (diff === -2) {
      return { shape: 'circle', bgColor: '#FF8C00', textColor: '#FFFFFF' }; // Orange (Eagle)
    }
    if (diff === -1) {
      return { shape: 'circle', bgColor: '#DC143C', textColor: '#FFFFFF' }; // Red (Birdie)
    }
    if (diff === 0) {
      return { shape: 'circle', bgColor: '#1E90FF', textColor: '#FFFFFF' }; // Blue (Par)
    }
    if (diff === 1) {
      return { shape: 'circle', bgColor: '#32CD32', textColor: '#FFFFFF' }; // Green (Bogey)
    }
    if (diff === 2) {
      return { shape: 'square', bgColor: '#808080', textColor: '#FFFFFF' }; // Grey (Double Bogey)
    }
    if (diff >= 3) {
      return { shape: 'square', bgColor: '#000000', textColor: '#FFFFFF' }; // Black (Triple or worse)
    }

    return { shape: 'circle', bgColor: 'transparent', textColor: '#000000' };
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
        result.score === -1 ? null : result.score === 0 ? null : result.score,
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="relative overflow-x-auto">
        {/* Scrollable table */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {/* Header row (Holes) */}
            <tr className="bg-green-600 text-white">
              <th className="w-20 h-10 px-2 py-2 text-xs font-bold sticky left-0 bg-green-600 z-20">
                {t('hole')}
              </th>
              {holes.map((hole, idx) => {
                const kind = hole.kind?.toString().toLowerCase();
                const isSummary = kind === 'side';
                return (
                  <th
                    key={idx}
                    className={`h-10 px-2 py-2 text-xs font-bold text-center ${
                      isSummary ? 'w-16 bg-green-500' : 'w-10'
                    }`}
                  >
                    {hole.value?.toString() || ''}
                  </th>
                );
              })}
            </tr>
            {/* HDCP row */}
            <tr className="bg-green-50">
              <th className="w-20 h-10 px-2 py-2 text-xs font-bold sticky left-0 bg-green-50 z-20 border-r border-gray-200">
                {t('handicapShort') || 'HDCP'}
              </th>
              {handicaps.map((hdcp, idx) => {
                const kind = hdcp.kind?.toString().toLowerCase();
                const isSummary = kind === 'side';
                return (
                  <td
                    key={idx}
                    className={`h-10 px-2 py-2 text-xs font-bold text-center ${
                      isSummary ? 'w-16' : 'w-10'
                    }`}
                  >
                    {hdcp.value?.toString() || ''}
                  </td>
                );
              })}
            </tr>
            {/* Par row */}
            <tr className="bg-green-600 text-white">
              <th className="w-20 h-10 px-2 py-2 text-xs font-bold sticky left-0 bg-green-600 z-20 border-r border-green-500">
                {t('par')}
              </th>
              {holes.map((hole, idx) => {
                const kind = hole.kind?.toString().toLowerCase();
                const isSummary = kind === 'side';
                const parValue = idx < par.length ? par[idx]?.value : null;
                return (
                  <td
                    key={idx}
                    className={`h-10 px-2 py-2 text-xs font-bold text-center ${
                      isSummary ? 'w-16 bg-green-500' : 'w-10'
                    }`}
                  >
                    {parValue?.toString() || ''}
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {round.memberIds.map((memberId) => {
              const member = users[memberId];
              if (!member) return null;

              let outSum = 0;
              let inSum = 0;
              let inPhase = startsWithIn;

              return (
                <tr key={memberId} className="hover:bg-gray-50">
                  {/* Sticky player name cell */}
                  <td
                    className="w-20 h-10 px-2 py-2 text-xs font-semibold sticky left-0 bg-white z-20 border-r border-gray-200 text-center"
                    style={{
                      color: roundColorForPlayer(round, memberId),
                    }}
                  >
                    {member.name}
                  </td>

                  {/* Score cells */}
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
                          className="w-16 h-10 px-2 py-2 text-sm font-bold text-center bg-gray-50"
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
                        className={`w-10 h-10 px-2 py-2 text-sm font-bold text-center relative ${
                          canEditThis
                            ? 'cursor-pointer hover:opacity-80'
                            : 'cursor-default'
                        }`}
                      >
                        {holeScore > 0 && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center ${
                              style.shape === 'circle' ? 'rounded-full' : 'rounded'
                            }`}
                            style={{
                              backgroundColor: style.bgColor,
                              color: style.textColor,
                            }}
                          >
                            {holeScoreText}
                          </div>
                        )}
                        {holeScore === 0 && holeScoreText && (
                          <span className="text-gray-500">{holeScoreText}</span>
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
    </div>
  );
}

