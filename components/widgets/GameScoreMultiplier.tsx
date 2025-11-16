'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RoundGame } from '@/lib/models/round';

interface GameScoreMultiplierProps {
  game: RoundGame;
  onMultipliersChanged: (multipliers: {
    birdie?: string;
    eagle?: string;
    albatross?: string;
    holeInOne?: string;
  }) => void;
}

export default function GameScoreMultiplier({
  game,
  onMultipliersChanged,
}: GameScoreMultiplierProps) {
  const t = useTranslations();
  const [birdieMultiplier, setBirdieMultiplier] = useState(2);
  const [eagleMultiplier, setEagleMultiplier] = useState(5);
  const [albatrossMultiplier, setAlbatrossMultiplier] = useState(10);
  const [holeInOneMultiplier, setHoleInOneMultiplier] = useState(20);
  const [showPicker, setShowPicker] = useState<{
    title: string;
    currentValue: number;
    onChange: (value: number) => void;
  } | null>(null);

  useEffect(() => {
    setBirdieMultiplier(parseInt(game.birdieMultiplier ?? '2') || 2);
    setEagleMultiplier(parseInt(game.eagleMultiplier ?? '5') || 5);
    setAlbatrossMultiplier(parseInt(game.albatrossMultiplier ?? '10') || 10);
    setHoleInOneMultiplier(parseInt(game.holeInOneMultiplier ?? '20') || 20);
  }, [game]);

  const showMultiplierPicker = (
    title: string,
    currentValue: number,
    onChange: (value: number) => void
  ) => {
    setShowPicker({ title, currentValue, onChange });
  };

  const buildMultiplierRow = ({
    label,
    description,
    value,
    color,
    onTap,
  }: {
    label: string;
    description: string;
    value: number;
    color: string; // expects CSS variable e.g., 'var(--score-birdie)'
    onTap: () => void;
  }) => (
    <div
      onClick={onTap}
      className="mb-2 p-4 rounded-lg border-2 cursor-pointer hover:bg-gray-50"
      style={{
        borderColor: color,
        // Subtle tinted background from the score color
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center border-2"
          style={{ borderColor: color }}
        >
          <span style={{ color, fontSize: 14, fontWeight: 'bold' }}>×{value}</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-gray-600 mt-1">{description}</div>
        </div>
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-base font-bold mb-2">{t('scoreMultipliers')}</h3>
      <p className="text-xs text-gray-600 mb-4">{t('setPointMultipliersForSpecialScores')}</p>

      {buildMultiplierRow({
        label: t('birdie'),
        description: t('birdieDescription'),
        value: birdieMultiplier,
        color: 'var(--score-birdie)',
        onTap: () => {
          showMultiplierPicker(t('selectBirdieMultiplier'), birdieMultiplier, (value) => {
            setBirdieMultiplier(value);
            onMultipliersChanged({ birdie: value.toString() });
          });
        },
      })}

      {buildMultiplierRow({
        label: t('eagle'),
        description: t('eagleDescription'),
        value: eagleMultiplier,
        color: 'var(--score-eagle)',
        onTap: () => {
          showMultiplierPicker(t('selectEagleMultiplier'), eagleMultiplier, (value) => {
            setEagleMultiplier(value);
            onMultipliersChanged({ eagle: value.toString() });
          });
        },
      })}

      {buildMultiplierRow({
        label: t('albatross'),
        description: t('albatrossDescription'),
        value: albatrossMultiplier,
        color: 'var(--score-albatross)',
        onTap: () => {
          showMultiplierPicker(t('selectAlbatrossMultiplier'), albatrossMultiplier, (value) => {
            setAlbatrossMultiplier(value);
            onMultipliersChanged({ albatross: value.toString() });
          });
        },
      })}

      {buildMultiplierRow({
        label: t('holeInOne'),
        description: t('holeInOneDescription'),
        value: holeInOneMultiplier,
        color: 'var(--score-hole-in-one)',
        onTap: () => {
          showMultiplierPicker(t('selectHoleInOneMultiplier'), holeInOneMultiplier, (value) => {
            setHoleInOneMultiplier(value);
            onMultipliersChanged({ holeInOne: value.toString() });
          });
        },
      })}

      {showPicker && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPicker(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{showPicker.title}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((value) => {
                  const isSelected = value === showPicker.currentValue;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        showPicker.onChange(value);
                        setShowPicker(null);
                      }}
                      className={`p-4 rounded-lg border-2 text-center font-semibold ${
                        isSelected
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPicker(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

