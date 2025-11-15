'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Round } from '@/lib/models/round';
import { Scorecard, TeeboxRow, ScoreCellKind } from '@/lib/models/scorecard';
import { roundService } from '@/lib/services/roundService';
import { colorFromName } from '@/lib/utils/validator';

interface TeeboxSelectorProps {
  round: Round;
  currentUserId: string;
  onClose: () => void;
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

// Helper to compute luminance for text color
function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Parse HSL string to hex
function parseColor(colorStr: string): string {
  if (colorStr.startsWith('#')) return colorStr;
  if (colorStr.startsWith('hsl')) {
    const match = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      return hslToHex(h, s, l);
    }
  }
  // Fallback color
  return '#666666';
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

    await roundService.updateUserTeebox(round.id, currentUserId, teeboxIds);
    onClose();
  };

  const teeTile = (sc: Scorecard, t: TeeboxRow, isFrontNine: boolean) => {
    const yards = totalYards(t);
    const rating = t.rating?.toFixed(1) ?? '-';
    const slope = t.slope?.toString() ?? '-';
    const badgeColorStr = colorFromName(t.color);
    const badgeColor = parseColor(badgeColorStr);
    const luminance = getLuminance(badgeColor);
    const fg = luminance < 0.5 ? '#ffffff' : '#000000';
    const isSelected = isFrontNine
      ? selectedFrontTeeboxId === t.rowId
      : selectedBackTeeboxId === t.rowId;

    return (
      <div
        key={t.rowId}
        onClick={() => updateTeeboxSelection(t.rowId, isFrontNine)}
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 rounded"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: badgeColor }}
        >
          <span style={{ color: fg }} className="text-xs">
            🚩
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            {t.name} ({t.color})
          </div>
          <div className="text-xs text-gray-600">
            {t('yards')}: {yards} • {rating} / {slope}
          </div>
        </div>
        {isSelected && (
          <svg
            className="w-5 h-5 text-green-600"
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
      <div key={sc.id} className="border border-gray-200 rounded-lg overflow-hidden mb-2">
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
          className="w-full px-4 py-3 text-left font-semibold text-sm flex items-center justify-between bg-gray-50 hover:bg-gray-100"
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
            {allTeeboxes.map((t, idx) => (
              <div key={t.rowId}>
                {teeTile(sc, t, isFrontNine)}
                {idx < allTeeboxes.length - 1 && (
                  <div className="h-px bg-gray-200 my-1" />
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
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
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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

