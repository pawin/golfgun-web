'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye, faArrowUp, faArrowDown, faArrowLeft, faArrowRight, faMinus, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { HoleStats, holeStatsCopyWith } from '@/lib/models/round';

interface ScoreEditDialogProps {
  isOpen: boolean;
  player: string;
  holeKey: string;
  parValue: number;
  currentScore: number | null;
  showStats: boolean;
  currentStats?: HoleStats;
  hasOlympicGame: boolean;
  currentOlympicPoint?: number;
  onClose: () => void;
  onSave: (result: {
    score: number;
    stats?: HoleStats;
    olympicPoint?: number;
  }) => void;
}

export default function ScoreEditDialog({
  isOpen,
  player,
  holeKey,
  parValue,
  currentScore,
  showStats,
  currentStats,
  hasOlympicGame,
  currentOlympicPoint,
  onClose,
  onSave,
}: ScoreEditDialogProps) {
  const t = useTranslations();
  const [score, setScore] = useState(currentScore && currentScore > 0 ? currentScore : parValue);
  const [stats, setStats] = useState<HoleStats>(
    currentStats || { fairway: 'hit', putts: 2, bunker: 0, hazard: 0 }
  );
  const [olympicPoint, setOlympicPoint] = useState(currentOlympicPoint ?? 0);

  useEffect(() => {
    if (isOpen) {
      setScore(currentScore && currentScore > 0 ? currentScore : parValue);
      setStats(currentStats || { fairway: 'hit', putts: 2, bunker: 0, hazard: 0 });
      setOlympicPoint(currentOlympicPoint ?? 0);
    }
  }, [isOpen, currentScore, parValue, currentStats, currentOlympicPoint]);

  if (!isOpen) return null;

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

  const handleSave = () => {
    onSave({
      score: score || 0,
      stats: showStats && !isEmptyStats(stats) ? stats : undefined,
      olympicPoint: hasOlympicGame ? olympicPoint : undefined,
    });
  };

  const handleRemove = () => {
    onSave({ score: 0, stats: undefined, olympicPoint: undefined });
  };

  const handleSkip = () => {
    onSave({ score: -1, stats: undefined, olympicPoint: undefined });
  };

  const isEmptyStats = (s: HoleStats): boolean => {
    return !s.fairway && !s.putts && !s.bunker && !s.hazard;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{player}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('hole')} {holeKey} · {t('par')} {parValue}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Score Input */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setScore(Math.max(1, (score || parValue) - 1))}
              className="text-blue-600 hover:text-blue-700 text-3xl"
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
            <div className="text-6xl font-bold w-32 text-center">{score || parValue}</div>
            <button
              onClick={() => setScore((score || parValue) + 1)}
              className="text-blue-600 hover:text-blue-700 text-3xl"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {/* Stroke Label */}
          <div className="text-center text-lg font-medium">
            {getStrokeLabel(score || parValue, parValue)}
          </div>

          {/* Olympic Points */}
          {hasOlympicGame && (
            <div className="flex items-center justify-between py-2 border-t border-gray-200">
              <span className="font-medium">{t('gameTypeOlympic') || 'Olympic'}</span>
              <select
                value={olympicPoint}
                onChange={(e) => setOlympicPoint(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded"
              >
                {Array.from({ length: 21 }, (_, i) => i).map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            {t('save')}
          </button>

          {/* Remove/Skip Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleRemove}
              className="flex-1 py-2 text-red-600 border border-red-600 rounded-lg font-medium hover:bg-red-50"
            >
              {t('removeScore') || 'Remove Score'}
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 py-2 text-gray-600 border border-gray-600 rounded-lg font-medium hover:bg-gray-50"
            >
              {t('skipHole') || 'Skip Hole'}
            </button>
          </div>

          {/* Stats Section (only for own score) */}
          {showStats && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4">
                {/* Fairway (hidden on Par 3) */}
                {parValue !== 3 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      {t('fairway') || 'Fairway'}
                    </label>
                    <div className="flex justify-center space-x-2">
                      <FairwayButton
                        icon={faBullseye}
                        tooltip={t('hit') || 'Hit'}
                        value="hit"
                        selected={stats.fairway === 'hit'}
                        onClick={() => setStats(holeStatsCopyWith(stats, { fairway: 'hit' }))}
                      />
                      <FairwayButton
                        icon={faArrowUp}
                        tooltip={t('missShort') || 'Miss Short'}
                        value="miss_short"
                        selected={stats.fairway === 'miss_short'}
                        onClick={() =>
                          setStats(holeStatsCopyWith(stats, { fairway: 'miss_short' }))
                        }
                      />
                      <FairwayButton
                        icon={faArrowDown}
                        tooltip={t('missLong') || 'Miss Long'}
                        value="miss_long"
                        selected={stats.fairway === 'miss_long'}
                        onClick={() =>
                          setStats(holeStatsCopyWith(stats, { fairway: 'miss_long' }))
                        }
                      />
                      <FairwayButton
                        icon={faArrowLeft}
                        tooltip={t('missLeft') || 'Miss Left'}
                        value="miss_left"
                        selected={stats.fairway === 'miss_left'}
                        onClick={() =>
                          setStats(holeStatsCopyWith(stats, { fairway: 'miss_left' }))
                        }
                      />
                      <FairwayButton
                        icon={faArrowRight}
                        tooltip={t('missRight') || 'Miss Right'}
                        value="miss_right"
                        selected={stats.fairway === 'miss_right'}
                        onClick={() =>
                          setStats(holeStatsCopyWith(stats, { fairway: 'miss_right' }))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Putts */}
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">{t('putts') || 'Putts'}</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            putts: stats.putts && stats.putts > 0 ? stats.putts - 1 : undefined,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">
                      {stats.putts?.toString() || '-'}
                    </span>
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            putts: (stats.putts || 0) + 1,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>

                {/* Bunker */}
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">{t('bunker') || 'Bunker'}</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            bunker: stats.bunker && stats.bunker > 0 ? stats.bunker - 1 : undefined,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">
                      {stats.bunker?.toString() || '-'}
                    </span>
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            bunker: (stats.bunker || 0) + 1,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>

                {/* Hazard */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t('hazard') || 'Hazard'}</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            hazard:
                              stats.hazard && stats.hazard > 0 ? stats.hazard - 1 : undefined,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="text-xl font-bold w-12 text-center">
                      {stats.hazard?.toString() || '-'}
                    </span>
                    <button
                      onClick={() =>
                        setStats(
                          holeStatsCopyWith(stats, {
                            hazard: (stats.hazard || 0) + 1,
                          })
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-2xl"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FairwayButton({
  icon,
  tooltip,
  value,
  selected,
  onClick,
}: {
  icon: any;
  tooltip: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-300 bg-white hover:bg-gray-50'
      }`}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

