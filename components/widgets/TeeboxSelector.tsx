'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Round } from '@/lib/models/round';
import { Scorecard, TeeboxRow, ScoreCellKind } from '@/lib/models/scorecard';
import { roundService } from '@/lib/services/roundService';

interface TeeboxSelectorProps {
  round: Round;
  currentUserId: string;
  onClose: () => void;
}

// Convert a teebox name (e.g., "white", "Black", "BLUE") into a CSS color.
// Includes a small mapping for common golf tee colors; falls back to CSS color names.
function colorFromTeeboxName(name: string): string {
  const key = name.trim().toLowerCase();
  const map: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    blue: '#1e40af', // tailwind blue-800
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
  return map[key] ?? key; // if not in map, assume it's a valid CSS color name
}

// Helper function to calculate total yards for a teebox
function totalYards(teebox: TeeboxRow): number {
  if (teebox.totalYardsOverride !== undefined) {
    return teebox.totalYardsOverride;
  }
  let sum = 0;
  for (const cell of teebox.cells) {
    if (cell.kind === ScoreCellKind.hole && cell.yards !== undefined) {
      sum += cell.yards;
    }
  }
  if (sum === 0) {
    const sides = teebox.cells
      .filter((c) => c.yards !== undefined)
      .map((c) => c.yards!);
    if (sides.length > 0) {
      sum = Math.max(...sides);
    }
  }
  return sum;
}

export default function TeeboxSelector({
  round,
  currentUserId,
  onClose,
}: TeeboxSelectorProps) {
  const t = useTranslations();
  const [selectedFrontTeeboxId, setSelectedFrontTeeboxId] = useState<string | null>(null);
  const [selectedBackTeeboxId, setSelectedBackTeeboxId] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const selectedIds = Array.isArray(round.userTeeboxes[currentUserId])
      ? (round.userTeeboxes[currentUserId] as string[])
      : [];

    // Initialize selections based on existing user teeboxes
    if (round.selectedScoreCardIds.length >= 2 && selectedIds.length >= 2) {
      setSelectedFrontTeeboxId(selectedIds[0]);
      setSelectedBackTeeboxId(selectedIds[1]);
    } else if (selectedIds.length > 0) {
      setSelectedFrontTeeboxId(selectedIds[0]);
      if (selectedIds.length > 1) {
        setSelectedBackTeeboxId(selectedIds[1]);
      }
    }

    // Set expanded index
    if (round.selectedScoreCardIds.length === 1) {
      setExpandedIndex(0);
    } else if (round.selectedScoreCardIds.length >= 2) {
      setExpandedIndex(0); // Expand front by default
    }
  }, [round, currentUserId]);

  const updateTeeboxSelection = (teeboxId: string, isFrontNine: boolean) => {
    if (isFrontNine) {
      setSelectedFrontTeeboxId(teeboxId);
      // If there are multiple selectedScoreCardIds, collapse first and expand second
      if (round.selectedScoreCardIds.length >= 2) {
        setExpandedIndex(1); // Expand the second card (back)
      }
    } else {
      setSelectedBackTeeboxId(teeboxId);
    }
  };

  const areAllTeeboxesSelected = (): boolean => {
    // If only one scorecard, we only need front teebox selected
    if (round.selectedScoreCardIds.length === 1) {
      return selectedFrontTeeboxId !== null;
    }
    // If multiple scorecards, we need both front and back selected
    if (round.selectedScoreCardIds.length >= 2) {
      return selectedFrontTeeboxId !== null && selectedBackTeeboxId !== null;
    }
    return false;
  };

  const saveTeeboxSelection = async () => {
    if (!areAllTeeboxesSelected()) {
      return;
    }

    const teeboxIds: string[] = [];
    if (selectedFrontTeeboxId) {
      teeboxIds.push(selectedFrontTeeboxId);
    }
    // If we have 2 selected scorecards, save both front and back
    if (selectedBackTeeboxId && round.selectedScoreCardIds.length >= 2) {
      teeboxIds.push(selectedBackTeeboxId);
    }

    try {
      await roundService.updateUserTeebox(round.id, currentUserId, teeboxIds);
      onClose();
    } catch (e) {
      console.error('Failed to save teebox selection:', e);
      alert(t('failedToSaveTeeboxSelection'));
    }
  };

  const teeTile = (sc: Scorecard, teebox: TeeboxRow, isFrontNine: boolean) => {
    const yards = totalYards(teebox);
    const rating = teebox.rating?.toFixed(1) ?? '-';
    const slope = teebox.slope?.toString() ?? '-';
    // Use color derived purely from the teebox name
    const badgeColor = colorFromTeeboxName(teebox.name);
    const isSelected = isFrontNine
      ? selectedFrontTeeboxId === teebox.rowId
      : selectedBackTeeboxId === teebox.rowId;

    return (
      <div
        key={teebox.rowId}
        onClick={() => updateTeeboxSelection(teebox.rowId, isFrontNine)}
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-accent/20 rounded"
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-black"
          style={{ backgroundColor: badgeColor }}
        >
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            {teebox.name} ({teebox.color})
          </div>
          <div className="text-xs text-muted-foreground">
            {t('yards')}: {yards} • {rating} / {slope}
          </div>
        </div>
        {isSelected && (
          <svg
            className="w-5 h-5 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    );
  };

  const buildExpandableScorecardPanel = (
    sc: Scorecard,
    isFrontNine: boolean,
    index: number
  ) => {
    const allTeeboxes = [
      ...sc.backTeeboxes.teeboxes,
      ...sc.forwardTeeboxes.teeboxes,
    ];

    const sideLabel = isFrontNine ? t('front9') : t('back9');
    const displayName = sc.name || round.course.name;
    const isSingleScorecard = round.selectedScoreCardIds.length === 1;
    const shouldBeExpanded = expandedIndex === index || (isSingleScorecard && index === 0);

    const titleText = isSingleScorecard ? displayName : `${displayName} - ${sideLabel}`;

    return (
      <div key={sc.id} className="border border-border rounded-lg overflow-hidden mb-2 bg-card">
        <button
          onClick={() => {
            if (expandedIndex === index) {
              if (!isSingleScorecard) {
                setExpandedIndex(null);
              }
            } else {
              setExpandedIndex(index);
            }
          }}
          className="w-full px-4 py-3 text-left font-semibold text-sm flex items-center justify-between bg-muted hover:bg-accent/20"
        >
          <span>{titleText}</span>
          <svg
            className={`w-5 h-5 transition-transform ${shouldBeExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {shouldBeExpanded && (
          <div className="p-2">
            {allTeeboxes.map((teebox, idx) => (
              <div key={teebox.rowId}>
                {teeTile(sc, teebox, isFrontNine)}
                {idx < allTeeboxes.length - 1 && (
                  <div className="h-px bg-border my-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get front and back scorecards based on selectedScoreCardIds
  const frontScorecard = round.selectedScoreCardIds.length > 0
    ? round.scorecards.find((sc) => sc.id === round.selectedScoreCardIds[0]) || round.scorecards[0]
    : null;

  const backScorecard = round.selectedScoreCardIds.length >= 2
    ? round.scorecards.find((sc) => sc.id === round.selectedScoreCardIds[1]) || round.scorecards[round.scorecards.length - 1]
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{t('selectTeebox')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {frontScorecard && buildExpandableScorecardPanel(frontScorecard, true, 0)}
          {backScorecard && (
            <>
              <div className="h-2" />
              {buildExpandableScorecardPanel(backScorecard, false, 1)}
            </>
          )}
          <div className="mt-4">
            <button
              onClick={saveTeeboxSelection}
              disabled={!areAllTeeboxesSelected()}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                areAllTeeboxesSelected()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

