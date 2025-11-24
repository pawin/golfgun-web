'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Round, RoundGame, roundScorecardBridge, roundGetPlayableHoles, roundColorForPlayer, roundColorForTeam } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { getInitials } from '@/lib/utils/validator';

interface GameHoleHandicapProps {
  round: Round;
  game: RoundGame;
  users: Record<string, AppUser>;
  holePoints: Record<string, Record<string, any>>;
  handicapStrokes: Record<string, any>;
  onPointsChanged: (points: Record<string, Record<string, any>>) => void;
  onHandicapStrokesChanged: (strokes: Record<string, any>) => void;
  redTeamIds?: string[];
  blueTeamIds?: string[];
  playerIds?: string[];
}

interface PlayableHole {
  index: number;
  number: string;
  hole: any;
}

export default function GameHoleHandicap({
  round,
  game,
  users,
  holePoints: initialHolePoints,
  handicapStrokes: initialHandicapStrokes,
  onPointsChanged,
  onHandicapStrokesChanged,
  redTeamIds,
  blueTeamIds,
  playerIds,
}: GameHoleHandicapProps) {
  const t = useTranslations();
  const [points, setPoints] = useState<Record<string, Record<string, any>>>({});
  const [handicapStrokes, setHandicapStrokes] = useState<Record<string, any>>({});
  const [showPointDialog, setShowPointDialog] = useState<{
    holeNumber: string;
    par: number;
    currentPoint: number;
  } | null>(null);
  const [showHandicapDialog, setShowHandicapDialog] = useState<{
    holeNumber: string;
    par: number;
  } | null>(null);

  useEffect(() => {
    setPoints({ ...initialHolePoints });
    setHandicapStrokes({ ...initialHandicapStrokes });
  }, [initialHolePoints, initialHandicapStrokes]);

  const getPlayableHoles = (): PlayableHole[] => {
    const scorecard = roundScorecardBridge(round);
    return scorecard.holes
      .map((hole, index) => ({ index, hole, value: hole.value }))
      .filter((item) => item.hole?.kind === 'hole')
      .map((item) => ({
        index: item.index,
        number: item.value?.toString() ?? '',
        hole: item.hole,
      }));
  };

  const getHandicapForHole = (index: number): number => {
    const scorecard = roundScorecardBridge(round);
    if (index < 0 || index >= scorecard.handicaps.length) return 0;
    const hdcpValue = scorecard.handicaps[index]?.value;
    return typeof hdcpValue === 'number' ? hdcpValue : parseInt(String(hdcpValue ?? '')) || 0;
  };

  const getParForHole = (index: number): number => {
    const scorecard = roundScorecardBridge(round);
    if (index < 0 || index >= scorecard.par.length) return 0;
    const parValue = scorecard.par[index]?.value;
    return typeof parValue === 'number' ? parValue : parseInt(String(parValue ?? '')) || 0;
  };

  const getPointForHole = (holeNumber: string): number => {
    const holeData = points[holeNumber];
    if (holeData?.point !== undefined) {
      return typeof holeData.point === 'number' ? holeData.point : parseInt(String(holeData.point ?? '')) || 1;
    }
    return 1;
  };

  const getHandicapStrokeCountForHole = (holeNumber: string): number => {
    const holeData = handicapStrokes[holeNumber];
    if (holeData && typeof holeData === 'object' && Object.keys(holeData).length > 0) {
      return Object.keys(holeData).length;
    }
    return 0;
  };

  const getHandicapStrokesForHole = (holeNumber: string): Record<string, number> => {
    const holeData = handicapStrokes[holeNumber];
    if (holeData && typeof holeData === 'object') {
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(holeData)) {
        result[key] = typeof value === 'number' ? value : parseFloat(String(value ?? '')) || 0;
      }
      return result;
    }
    return {};
  };

  const formatHandicapStrokesDisplay = (holeNumber: string): React.ReactNode => {
    const strokes = getHandicapStrokesForHole(holeNumber);
    if (Object.keys(strokes).length === 0) return '-';

    // Filter to only show players who are in the current game
    const gameType = game.type.toLowerCase();
    let gamePlayerIds: string[] = [];
    if (gameType === 'skins') {
      gamePlayerIds = currentPlayerIds;
    } else {
      gamePlayerIds = [...currentRedTeamIds, ...currentBlueTeamIds];
    }

    // Filter strokes to only include players in the game
    const filteredStrokes = Object.entries(strokes).filter(([playerId]) =>
      gamePlayerIds.includes(playerId)
    );

    if (filteredStrokes.length === 0) return '-';

    // Sort by memberIds index
    const sortedEntries = filteredStrokes.sort(([playerIdA], [playerIdB]) => {
      const indexA = round.memberIds.indexOf(playerIdA);
      const indexB = round.memberIds.indexOf(playerIdB);
      // If not found in memberIds, put at the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return (
      <div className="flex flex-col gap-0.5 items-center">
        {sortedEntries.map(([playerId, value]) => {
          const player = users[playerId];
          const playerName = player?.name || playerId;
          const strokeValue = value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
          const playerColor = roundColorForPlayer(round, playerId);

          return (
            <div key={playerId} className="text-xs leading-tight text-center">
              <span style={{ color: playerColor }} className="font-semibold">{playerName}</span>
              <span className="text-black"> {strokeValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handlePointChange = (holeNumber: string, par: number, newPoint: number) => {
    const newPoints = { ...points };
    newPoints[holeNumber] = { par: par.toString(), point: newPoint };
    setPoints(newPoints);
    onPointsChanged(newPoints);
  };

  const handleHandicapStrokesChange = (
    holeNumber: string,
    par: number,
    strokes: Record<string, number>,
    applyToAll: boolean,
    applyToSamePar: boolean
  ) => {
    const newStrokes = { ...handicapStrokes };
    const holes = getPlayableHoles();

    if (applyToAll) {
      for (const hole of holes) {
        const hNum = hole.number;
        if (Object.keys(strokes).length === 0) {
          delete newStrokes[hNum];
        } else {
          newStrokes[hNum] = { ...strokes };
        }
      }
    } else if (applyToSamePar) {
      for (const hole of holes) {
        const hNum = hole.number;
        const holePar = getParForHole(hole.index);
        if (holePar === par) {
          if (Object.keys(strokes).length === 0) {
            delete newStrokes[hNum];
          } else {
            newStrokes[hNum] = { ...strokes };
          }
        }
      }
    } else {
      if (Object.keys(strokes).length === 0) {
        delete newStrokes[holeNumber];
      } else {
        newStrokes[holeNumber] = strokes;
      }
    }

    setHandicapStrokes(newStrokes);
    onHandicapStrokesChanged(newStrokes);
  };

  const holes = getPlayableHoles();
  const currentRedTeamIds = redTeamIds ?? game.redTeamIds;
  const currentBlueTeamIds = blueTeamIds ?? game.blueTeamIds;
  const currentPlayerIds = playerIds ?? game.playerIds;

  // Get players based on game type
  const getPlayersForHole = (): AppUser[] => {
    const gameType = game.type.toLowerCase();
    if (gameType === 'skins') {
      return round.memberIds
        .filter((id) => currentPlayerIds.includes(id))
        .map((id) => users[id])
        .filter((u): u is AppUser => u !== undefined);
    } else {
      return round.memberIds
        .filter((id) => currentRedTeamIds.includes(id) || currentBlueTeamIds.includes(id))
        .map((id) => users[id])
        .filter((u): u is AppUser => u !== undefined);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-green-50 border-b border-gray-200 grid grid-cols-[10%_10%_10%_10%_60%] gap-2 text-sm font-bold py-3 px-2">
        <div className="text-center">{t('hole')}</div>
        <div className="text-center">{t('par')}</div>
        <div className="text-center">{t('hcp')}</div>
        <div className="text-center">{t('point')}</div>
        <div className="text-center">{t('stroke')}</div>
      </div>

      {/* Holes */}
      {holes.map((hole) => {
        const holeNumber = hole.number;
        const index = hole.index;
        const par = getParForHole(index);
        const handicap = getHandicapForHole(index);
        const point = getPointForHole(holeNumber);
        const strokeCount = getHandicapStrokeCountForHole(holeNumber);

        return (
          <div key={holeNumber} className="border-b border-gray-100 grid grid-cols-[10%_10%_10%_10%_60%] gap-2 py-4 px-2 items-center">
            <div className="text-center text-sm flex items-center justify-center">{holeNumber}</div>
            <div className="text-center text-sm flex items-center justify-center">{par}</div>
            <div className="text-center text-sm flex items-center justify-center">{handicap}</div>
            <button
              onClick={() => setShowPointDialog({ holeNumber, par, currentPoint: point })}
              className={`text-center text-sm font-semibold flex items-center justify-center gap-1 ${point === 1
                  ? 'text-green-600 hover:text-green-700'
                  : 'text-red-600 hover:text-red-700'
                }`}
            >
              {point}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setShowHandicapDialog({ holeNumber, par })}
              className="text-center text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-2 px-2 w-full min-w-0"
            >
              <div className="flex-1 flex justify-center items-center min-w-0 overflow-hidden">
                {formatHandicapStrokesDisplay(holeNumber)}
                <div className="pl-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {/* Point Selector Dialog */}
      {showPointDialog && (
        <PointSelectorDialog
          holeNumber={showPointDialog.holeNumber}
          par={showPointDialog.par}
          currentPoint={showPointDialog.currentPoint}
          onSave={(point) => {
            handlePointChange(showPointDialog.holeNumber, showPointDialog.par, point);
            setShowPointDialog(null);
          }}
          onCancel={() => setShowPointDialog(null)}
        />
      )}

      {/* Handicap Stroke Dialog */}
      {showHandicapDialog && (
        <HandicapStrokeDialog
          holeNumber={showHandicapDialog.holeNumber}
          par={showHandicapDialog.par}
          round={round}
          game={game}
          users={users}
          redTeamIds={currentRedTeamIds}
          blueTeamIds={currentBlueTeamIds}
          playerIds={currentPlayerIds}
          currentHandicapStrokes={getHandicapStrokesForHole(showHandicapDialog.holeNumber)}
          onSave={(strokes, applyToAll, applyToSamePar) => {
            handleHandicapStrokesChange(
              showHandicapDialog.holeNumber,
              showHandicapDialog.par,
              strokes,
              applyToAll,
              applyToSamePar
            );
            setShowHandicapDialog(null);
          }}
          onCancel={() => setShowHandicapDialog(null)}
        />
      )}
    </div>
  );
}

// Point Selector Dialog Component
function PointSelectorDialog({
  holeNumber,
  par,
  currentPoint,
  onSave,
  onCancel,
}: {
  holeNumber: string;
  par: number;
  currentPoint: number;
  onSave: (point: number) => void;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [selectedPoint, setSelectedPoint] = useState(currentPoint);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{t('editPoint', { hole: holeNumber })}</h2>
        </div>
        <div className="p-6">
          <p className="text-xs text-gray-600 mb-6">
            {t('parHoleHandicapPoint', { par: String(par) })}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setSelectedPoint(Math.max(0, selectedPoint - 1))}
              disabled={selectedPoint === 0}
              className="disabled:opacity-50"
            >
              <svg className="w-9 h-9 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="w-20 h-20 flex items-center justify-center">
              <span className="text-5xl font-bold">{selectedPoint}</span>
            </div>
            <button
              onClick={() => setSelectedPoint(Math.min(30, selectedPoint + 1))}
              disabled={selectedPoint === 30}
              className="disabled:opacity-50"
            >
              <svg className="w-9 h-9 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center">{t('range')}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            {t('cancel')}
          </button>
          <button
            onClick={() => onSave(selectedPoint)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Handicap Stroke Dialog Component
function HandicapStrokeDialog({
  holeNumber,
  par,
  round,
  game,
  users,
  redTeamIds,
  blueTeamIds,
  playerIds,
  currentHandicapStrokes,
  onSave,
  onCancel,
}: {
  holeNumber: string;
  par: number;
  round: Round;
  game: RoundGame;
  users: Record<string, AppUser>;
  redTeamIds: string[];
  blueTeamIds: string[];
  playerIds?: string[];
  currentHandicapStrokes: Record<string, number>;
  onSave: (strokes: Record<string, number>, applyToAll: boolean, applyToSamePar: boolean) => void;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const [handicapStrokes, setHandicapStrokes] = useState<Record<string, number>>({ ...currentHandicapStrokes });
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToSamePar, setApplyToSamePar] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState<{ playerId: string; playerName: string } | null>(null);

  const strokeOptions = [-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0];

  const getStrokeForPlayer = (playerId: string): number => {
    return handicapStrokes[playerId] ?? 0.0;
  };

  const updateStroke = (playerId: string, newStroke: number) => {
    const newStrokes = { ...handicapStrokes };
    if (newStroke === 0.0) {
      delete newStrokes[playerId];
    } else {
      newStrokes[playerId] = newStroke;
    }
    setHandicapStrokes(newStrokes);
  };

  const buildPlayerStrokeControl = (playerId: string, playerName: string, color: string) => {
    const currentStroke = getStrokeForPlayer(playerId);

    return (
      <div
        key={playerId}
        onClick={() => setShowStrokePicker({ playerId, playerName })}
        className="flex items-center justify-between p-3 mb-2 border rounded-lg cursor-pointer hover:bg-gray-50"
        style={{ borderColor: `${color}4d` }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {getInitials(playerName)}
          </div>
          <span className="text-sm font-semibold" style={{ color }}>
            {playerName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${currentStroke === 0.0 ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'
              }`}
          >
            {currentStroke >= 0 ? `+${currentStroke.toFixed(1)}` : currentStroke.toFixed(1)}
          </div>
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </div>
    );
  };

  // Get players based on game type
  const getPlayers = (): AppUser[] => {
    const gameType = game.type.toLowerCase();
    if (gameType === 'skins') {
      const currentPlayerIds = playerIds ?? game.playerIds;
      return round.memberIds
        .filter((id) => currentPlayerIds.includes(id))
        .map((id) => users[id])
        .filter((u): u is AppUser => u !== undefined);
    } else {
      const red = round.memberIds
        .filter((id) => redTeamIds.includes(id))
        .map((id) => users[id])
        .filter((u): u is AppUser => u !== undefined);
      const blue = round.memberIds
        .filter((id) => blueTeamIds.includes(id))
        .map((id) => users[id])
        .filter((u): u is AppUser => u !== undefined);
      return [...red, ...blue];
    }
  };

  const players = getPlayers();

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{t('handicapStrokes', { hole: holeNumber })}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-gray-600 mb-4">{t('parTapPlayer', { par: String(par) })}</p>

          {/* Apply options */}
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => {
                  setApplyToAll(e.target.checked);
                  if (e.target.checked) setApplyToSamePar(false);
                }}
                className="rounded"
              />
              <span>{t('applyToAllHoles')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={applyToSamePar}
                onChange={(e) => {
                  setApplyToSamePar(e.target.checked);
                  if (e.target.checked) setApplyToAll(false);
                }}
                className="rounded"
              />
              <span>{t('applyToAllParHoles', { par: String(par) })}</span>
            </label>
          </div>

          {/* Player stroke controls */}
          <div className="space-y-2">
            {players.map((player) => {
              const gameType = game.type.toLowerCase();
              const color =
                gameType === '1v1' || gameType === 'skins'
                  ? roundColorForPlayer(round, player.id)
                  : redTeamIds.includes(player.id)
                    ? roundColorForTeam(0)
                    : roundColorForTeam(1);
              return buildPlayerStrokeControl(player.id, player.name, color);
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            {t('cancel')}
          </button>
          <button
            onClick={() => onSave(handicapStrokes, applyToAll, applyToSamePar)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {t('save')}
          </button>
        </div>
      </div>

      {/* Stroke Picker Dialog */}
      {showStrokePicker && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowStrokePicker(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{showStrokePicker.playerName}</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {strokeOptions.map((stroke) => {
                  const isSelected = stroke === getStrokeForPlayer(showStrokePicker.playerId);
                  return (
                    <button
                      key={stroke}
                      onClick={() => {
                        updateStroke(showStrokePicker.playerId, stroke);
                        setShowStrokePicker(null);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 ${isSelected
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {isSelected ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={`text-base font-medium ${isSelected ? 'text-green-600 font-bold' : ''}`}>
                        {stroke >= 0 ? `+${stroke.toFixed(1)}` : stroke.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowStrokePicker(null)}
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

