'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Round, RoundGame, roundScorecardBridge, roundColorForPlayer } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { roundService } from '@/lib/services/roundService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import GamePlayerSelector from '@/components/widgets/GamePlayerSelector';
import GameSideSelector from '@/components/widgets/GameSideSelector';
import GameScoreMultiplier from '@/components/widgets/GameScoreMultiplier';
import GameHoleHandicap from '@/components/widgets/GameHoleHandicap';
import { userService } from '@/lib/services/userService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GameSettingsScreenProps {
  round: Round;
  game: RoundGame;
  users: Record<string, AppUser>;
  currentUserId: string;
  onClose?: () => void;
}

export default function GameSettingsScreen({
  round,
  game,
  users,
  currentUserId,
  onClose,
}: GameSettingsScreenProps) {
  const t = useTranslations();
  const router = useRouter();
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [redTeam, setRedTeam] = useState<string[]>([]);
  const [blueTeam, setBlueTeam] = useState<string[]>([]);
  const [scoreCountMode, setScoreCountMode] = useState(1);
  const [birdieMultiplier, setBirdieMultiplier] = useState<string>('2');
  const [eagleMultiplier, setEagleMultiplier] = useState<string>('5');
  const [albatrossMultiplier, setAlbatrossMultiplier] = useState<string>('10');
  const [holeInOneMultiplier, setHoleInOneMultiplier] = useState<string>('20');
  const [skinsMode, setSkinsMode] = useState<number>(0);
  const [maxSkins, setMaxSkins] = useState<number>(18);
  const [skinsStartingHole, setSkinsStartingHole] = useState<number>(1);
  const [holePoints, setHolePoints] = useState<Record<string, Record<string, any>>>({});
  const [handicapStrokes, setHandicapStrokes] = useState<Record<string, any>>({});
  const [horseSettings, setHorseSettings] = useState<Record<string, Record<string, number>>>({
    front: {},
    back: {},
    total: {},
  });
  const [horseDefaultValues, setHorseDefaultValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHorseDialogOpen, setIsHorseDialogOpen] = useState(false);
  const [horseDialogSegment, setHorseDialogSegment] = useState<'front' | 'back' | 'total' | null>(null);
  const [horseDialogPlayerId, setHorseDialogPlayerId] = useState<string | null>(null);
  const [horseDialogValue, setHorseDialogValue] = useState<number>(0);

  useEffect(() => {
    // Initialize state from game
    const gameType = game.type.toLowerCase();
    setPlayerIds(game.playerIds.length > 0 ? [...game.playerIds] : [...round.memberIds]);
    setRedTeam([...game.redTeamIds]);
    setBlueTeam([...game.blueTeamIds]);
    setScoreCountMode(game.scoreCountMode ?? 1);
    setBirdieMultiplier(game.birdieMultiplier ?? '2');
    setEagleMultiplier(game.eagleMultiplier ?? '5');
    setAlbatrossMultiplier(game.albatrossMultiplier ?? '10');
    setHoleInOneMultiplier(game.holeInOneMultiplier ?? '20');
    setSkinsMode(game.skinsMode ?? 0);
    setMaxSkins(game.maxSkins ?? 18);
    setSkinsStartingHole(game.skinsStartingHole ?? 1);

    // Convert hole points
    const convertedHolePoints = convertHolePointsFromGame(game.holePoints);
    setHolePoints(convertedHolePoints);

    // Convert handicap strokes
    const convertedHandicapStrokes = convertHandicapStrokesFromGame(game.handicapStrokes);
    setHandicapStrokes(convertedHandicapStrokes);

    // Calculate horse default values
    const defaults = calculateHorseDefaultValues();
    setHorseDefaultValues(defaults);

    // Build horse settings
    const settings = buildHorseSettings(game.horseSettings, defaults, game.playerIds.length > 0 ? game.playerIds : round.memberIds);
    setHorseSettings(settings);

    // Set available skins holes
    const availableHoles = getAvailableSkinsHoles();
    if (!availableHoles.includes(skinsStartingHole) && availableHoles.length > 0) {
      setSkinsStartingHole(availableHoles[0]);
    }
  }, [game, round]);

  function convertHolePointsFromGame(gameHolePoints: Record<string, any> | null): Record<string, Record<string, any>> {
    if (!gameHolePoints) return {};
    const result: Record<string, Record<string, any>> = {};
    for (const [key, value] of Object.entries(gameHolePoints)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = {
          par: value.par?.toString() ?? '0',
          point: typeof value.point === 'number' ? value.point : parseInt(String(value.point ?? '')) || 1,
        };
      } else {
        result[key] = {
          par: '0',
          point: typeof value === 'number' ? value : parseInt(String(value ?? '')) || 1,
        };
      }
    }
    return result;
  }

  function convertHolePointsToGame(points: Record<string, Record<string, any>>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(points)) {
      result[key] = {
        par: value.par?.toString() ?? '0',
        point: value.point,
      };
    }
    return result;
  }

  function convertHandicapStrokesFromGame(gameHandicapStrokes: Record<string, any> | null): Record<string, any> {
    if (!gameHandicapStrokes) return {};
    const result: Record<string, any> = {};
    for (const [holeKey, value] of Object.entries(gameHandicapStrokes)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const playerStrokes: Record<string, number> = {};
        for (const [playerId, stroke] of Object.entries(value)) {
          playerStrokes[playerId] = typeof stroke === 'number' ? stroke : parseFloat(String(stroke ?? '')) || 0;
        }
        if (Object.keys(playerStrokes).length > 0) {
          result[holeKey] = playerStrokes;
        }
      }
    }
    return result;
  }

  function convertHandicapStrokesToGame(handicapStrokes: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [holeKey, value] of Object.entries(handicapStrokes)) {
      if (value && typeof value === 'object' && Object.keys(value).length > 0) {
        result[holeKey] = { ...value };
      }
    }
    return result;
  }

  function calculateHorseDefaultValues(): Record<string, number> {
    const scorecard = roundScorecardBridge(round);
    const holes = scorecard.holes;
    const par = scorecard.par;
    let front = 0;
    let back = 0;
    let unnamedHoleCount = 0;
    const length = Math.min(holes.length, par.length);

    for (let i = 0; i < length; i++) {
      const hole = holes[i];
      if (hole.kind !== 'hole') continue;

      const parValue = parseInt(String(par[i]?.value ?? '')) || 0;
      if (parValue === 0) continue;

      const holeNumber = parseInt(String(hole.value ?? '')) || 0;

      if (holeNumber > 0) {
        if (holeNumber <= 9) {
          front += parValue;
        } else {
          back += parValue;
        }
      } else {
        unnamedHoleCount++;
        if (unnamedHoleCount <= 9) {
          front += parValue;
        } else {
          back += parValue;
        }
      }
    }

    return { front, back, total: front + back };
  }

  function buildHorseSettings(
    existing: Record<string, Record<string, number>> | null,
    defaults: Record<string, number>,
    playerIds: string[]
  ): Record<string, Record<string, number>> {
    const segments = ['front', 'back', 'total'];
    const result: Record<string, Record<string, number>> = {};

    for (const segment of segments) {
      const segmentValues = existing?.[segment] ? { ...existing[segment] } : {};

      for (const playerId of playerIds) {
        segmentValues[playerId] = segmentValues[playerId] ?? defaults[segment] ?? 0;
      }

      // Remove players not in playerIds
      for (const playerId of Object.keys(segmentValues)) {
        if (!playerIds.includes(playerId)) {
          delete segmentValues[playerId];
        }
      }

      result[segment] = segmentValues;
    }

    return result;
  }

  function getAvailableSkinsHoles(): number[] {
    const scorecard = roundScorecardBridge(round);
    const holes = scorecard.holes
      .filter((hole) => hole.kind === 'hole' && hole.value)
      .map((hole) => parseInt(String(hole.value ?? '')) || 0)
      .filter((value) => value > 0);

    const uniqueHoles = Array.from(new Set(holes)).sort((a, b) => a - b);

    return uniqueHoles.length > 0 ? uniqueHoles : Array.from({ length: 18 }, (_, i) => i + 1);
  }

  function playerName(playerId: string): string {
    const user = users[playerId];
    return user?.name || playerId;
  }

  const handlePlayerIdsChanged = (newPlayerIds: string[]) => {
    setPlayerIds(newPlayerIds);
    const newDefaults = calculateHorseDefaultValues();
    const newSettings = buildHorseSettings(horseSettings, newDefaults, newPlayerIds);
    setHorseSettings(newSettings);
    // Auto-save latest players and horse settings
    saveGameSettings(false, { playerIds: newPlayerIds, horseSettings: newSettings });
  };

  const handleTeamsChanged = (red: string[], blue: string[]) => {
    setRedTeam(red);
    setBlueTeam(blue);
    const combined = [...red, ...blue];
    setPlayerIds(combined);
    const newDefaults = calculateHorseDefaultValues();
    const newSettings = buildHorseSettings(horseSettings, newDefaults, combined);
    setHorseSettings(newSettings);
    // Auto-save latest teams, players, and horse settings
    saveGameSettings(false, {
      redTeamIds: red,
      blueTeamIds: blue,
      playerIds: combined,
      horseSettings: newSettings,
    });
  };

  const handleScoreCountModeChanged = (mode: number) => {
    setScoreCountMode(mode);
    // Auto-save score count mode
    saveGameSettings(false, { scoreCountMode: mode });
  };

  const handleHolePointsChanged = (points: Record<string, Record<string, any>>) => {
    setHolePoints(points);
    // Auto-save hole points
    saveGameSettings(false, { holePoints: points });
  };

  const handleHandicapStrokesChanged = (strokes: Record<string, any>) => {
    setHandicapStrokes(strokes);
    // Auto-save with the freshest strokes value (state set is async)
    saveGameSettings(false, { handicapStrokes: strokes });
  };

  const handleScoreMultipliersChanged = ({
    birdie,
    eagle,
    albatross,
    holeInOne,
  }: {
    birdie?: string;
    eagle?: string;
    albatross?: string;
    holeInOne?: string;
  }) => {
    if (birdie !== undefined) setBirdieMultiplier(birdie);
    if (eagle !== undefined) setEagleMultiplier(eagle);
    if (albatross !== undefined) setAlbatrossMultiplier(albatross);
    if (holeInOne !== undefined) setHoleInOneMultiplier(holeInOne);
    // Auto-save multipliers using latest values
    const nextBirdie = birdie ?? birdieMultiplier;
    const nextEagle = eagle ?? eagleMultiplier;
    const nextAlbatross = albatross ?? albatrossMultiplier;
    const nextHoleInOne = holeInOne ?? holeInOneMultiplier;
    saveGameSettings(false, {
      birdieMultiplier: nextBirdie,
      eagleMultiplier: nextEagle,
      albatrossMultiplier: nextAlbatross,
      holeInOneMultiplier: nextHoleInOne,
    });
  };

  const saveGameSettings = async (
    popAfterSave: boolean = true,
    override?: {
      handicapStrokes?: Record<string, any>;
      holePoints?: Record<string, Record<string, any>>;
      playerIds?: string[];
      redTeamIds?: string[];
      blueTeamIds?: string[];
      horseSettings?: Record<string, Record<string, number>>;
      birdieMultiplier?: string;
      eagleMultiplier?: string;
      albatrossMultiplier?: string;
      holeInOneMultiplier?: string;
      scoreCountMode?: number;
      skinsMode?: number;
      maxSkins?: number;
      skinsStartingHole?: number;
    }
  ) => {
    setIsSaving(true);

    try {
      const updatedGame: RoundGame = {
        ...game,
        playerIds: override?.playerIds ?? playerIds,
        redTeamIds: override?.redTeamIds ?? redTeam,
        blueTeamIds: override?.blueTeamIds ?? blueTeam,
        handicapStrokes: convertHandicapStrokesToGame(
          override?.handicapStrokes ?? handicapStrokes
        ),
        holePoints: convertHolePointsToGame(
          override?.holePoints ?? holePoints
        ),
        horseSettings: game.type.toLowerCase() === 'horse' ? (override?.horseSettings ?? horseSettings) : {},
        birdieMultiplier: override?.birdieMultiplier ?? birdieMultiplier ?? game.birdieMultiplier,
        eagleMultiplier: override?.eagleMultiplier ?? eagleMultiplier ?? game.eagleMultiplier,
        albatrossMultiplier: override?.albatrossMultiplier ?? albatrossMultiplier ?? game.albatrossMultiplier,
        holeInOneMultiplier: override?.holeInOneMultiplier ?? holeInOneMultiplier ?? game.holeInOneMultiplier,
        scoreCountMode: override?.scoreCountMode ?? scoreCountMode,
        skinsMode: override?.skinsMode ?? skinsMode,
        maxSkins: override?.maxSkins ?? maxSkins,
        skinsStartingHole: override?.skinsStartingHole ?? skinsStartingHole,
      };

      await roundService.saveGame({ roundId: round.id, game: updatedGame });

      if (popAfterSave) {
        alert(t('gameSettingsSaved'));
        if (onClose) {
          onClose();
        } else {
          router.back();
        }
      }
    } catch (e) {
      alert(t('failedToSaveGame').replace('{error}', String(e)));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGame = async () => {
    const confirmed = confirm(t('deleteGameConfirm'));
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await roundService.deleteGame({ roundId: round.id, gameId: game.id });
      alert(t('gameDeleted'));
      if (onClose) {
        onClose();
      } else {
        router.back();
      }
    } catch (e) {
      alert(t('failedToDeleteGame').replace('{error}', String(e)));
    } finally {
      setIsDeleting(false);
    }
  };

  const setHorseValue = (segment: string, playerId: string, value: number) => {
    const newSettings = { ...horseSettings };
    const segmentValues = { ...newSettings[segment] };
    segmentValues[playerId] = Math.max(0, value);
    newSettings[segment] = segmentValues;
    setHorseSettings(newSettings);
    // Auto-save horse settings
    saveGameSettings(false, { horseSettings: newSettings });
  };

  const showHorseValueDialog = async (segment: string, playerId: string) => {
    const existingValue = horseSettings[segment]?.[playerId];
    const initialValue = existingValue && existingValue > 0 ? existingValue : horseDefaultValues[segment] ?? 0;
    setHorseDialogSegment(segment as 'front' | 'back' | 'total');
    setHorseDialogPlayerId(playerId);
    setHorseDialogValue(initialValue);
    setIsHorseDialogOpen(true);
  };

  const getSkinsModeText = (mode: number): string => {
    switch (mode) {
      case -1:
        return t('skinsModeBirdieOrBetter');
      case 0:
        return t('skinsModeParOrBetter');
      case 1:
        return t('skinsModeBogeyOrBetter');
      case 100:
        return t('skinsModeLowestStroke');
      default:
        return t('skinsModeParOrBetter');
    }
  };

  const gameType = game.type.toLowerCase();
  const canDelete = game.id.includes(currentUserId);
  const availableSkinsHoles = getAvailableSkinsHoles();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t('gameSettings')}</h1>
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              router.back();
            }
          }}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent/20"
          aria-label="close"
          title={t('close')}
        >
          <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-5">
        {/* Player/Team selection */}
        {(gameType === '1v1' || gameType === 'teamvs') ? (
          <>
            <GameSideSelector
              round={round}
              game={game}
              users={users}
              onTeamsChanged={handleTeamsChanged}
              onScoreCountModeChanged={handleScoreCountModeChanged}
            />
            <div className="h-5" />
          </>
        ) : (
          <>
            <GamePlayerSelector
              round={round}
              users={users}
              initialPlayerIds={playerIds}
              onPlayerIdsChanged={handlePlayerIdsChanged}
            />
            <div className="h-5" />
          </>
        )}

        {/* Horse game settings */}
        {gameType === 'horse' && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('horseSettings')}</h2>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-600 text-white px-4 py-2 grid grid-cols-10 gap-2 text-xs font-bold">
                  <div className="col-span-4">{t('player')}</div>
                  <div className="col-span-2 text-center">{t('front9')}</div>
                  <div className="col-span-2 text-center">{t('back9')}</div>
                  <div className="col-span-2 text-center">{t('total')}</div>
                </div>
                {playerIds.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">{t('players')}</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {playerIds.map((playerId, index) => (
                      <div key={playerId} className="px-4 py-2 grid grid-cols-10 gap-2 items-center">
                        <div className="col-span-4 text-sm font-semibold truncate" style={{ color: roundColorForPlayer(round, playerId) }}>
                          {playerName(playerId)}
                        </div>
                        <div className="col-span-2">
                          <HorseValueCell
                            segment="front"
                            playerId={playerId}
                            value={horseSettings.front?.[playerId] ?? horseDefaultValues.front ?? 0}
                            onClick={() => showHorseValueDialog('front', playerId)}
                          />
                        </div>
                        <div className="col-span-2">
                          <HorseValueCell
                            segment="back"
                            playerId={playerId}
                            value={horseSettings.back?.[playerId] ?? horseDefaultValues.back ?? 0}
                            onClick={() => showHorseValueDialog('back', playerId)}
                          />
                        </div>
                        <div className="col-span-2">
                          <HorseValueCell
                            segment="total"
                            playerId={playerId}
                            value={horseSettings.total?.[playerId] ?? horseDefaultValues.total ?? 0}
                            onClick={() => showHorseValueDialog('total', playerId)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="h-5" />
          </>
        )}

        {/* Skins game settings */}
        {gameType === 'skins' && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-3">{t('skinsSettings')}</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('startingHole')}</span>
                  <select
                    value={skinsStartingHole}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setSkinsStartingHole(v);
                      saveGameSettings(false, { skinsStartingHole: v });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {availableSkinsHoles.map((hole) => (
                      <option key={hole} value={hole}>
                        {t('holeWithNumber', { number: hole })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('skinsMode')}</span>
                  <select
                    value={skinsMode}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setSkinsMode(v);
                      saveGameSettings(false, { skinsMode: v });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={-1}>{t('skinsModeBirdieOrBetter')}</option>
                    <option value={0}>{t('skinsModeParOrBetter')}</option>
                    <option value={1}>{t('skinsModeBogeyOrBetter')}</option>
                    <option value={100}>{t('skinsModeLowestStroke')}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('maxSkins')}</span>
                  <select
                    value={maxSkins}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setMaxSkins(v);
                      saveGameSettings(false, { maxSkins: v });
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="h-5" />
          </>
        )}

        {/* Hole Handicap Section (for non-olympic games, and non-horse if they want it) */}
        {gameType !== 'olympic' && gameType !== 'horse' && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-1">{t('holeSettings')}</h2>
              <p className="text-xs text-gray-600 mb-2">{t('holeSettingsDescription')}</p>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <GameHoleHandicap
                  round={round}
                  game={game}
                  users={users}
                  holePoints={holePoints}
                  handicapStrokes={handicapStrokes}
                  redTeamIds={redTeam}
                  blueTeamIds={blueTeam}
                  playerIds={gameType === 'skins' ? playerIds : undefined}
                  onPointsChanged={handleHolePointsChanged}
                  onHandicapStrokesChanged={handleHandicapStrokesChanged}
                />
              </div>
            </div>
            <div className="h-5" />
          </>
        )}

        {/* Score Multipliers (for 1v1 and teamvs) */}
        {(gameType === '1v1' || gameType === 'teamvs') && (
          <>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <GameScoreMultiplier game={game} onMultipliersChanged={handleScoreMultipliersChanged} />
            </div>
            <div className="h-5" />
          </>
        )}

        {/* Delete Game Button */}
        {canDelete && (
          <div className="pt-4">
            <button
              onClick={deleteGame}
              disabled={isDeleting}
              className="w-full py-4 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('deleteGame')}
                </>
              )}
            </button>
          </div>
        )}

        <div className="h-8" />
      </div>
      <Dialog open={isHorseDialogOpen} onOpenChange={setIsHorseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('setValue')}</DialogTitle>
            <DialogDescription>
              {horseDialogPlayerId
                ? `${playerName(horseDialogPlayerId)} • ${t(horseDialogSegment === 'front' ? 'front9' : horseDialogSegment === 'back' ? 'back9' : 'total')}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setHorseDialogValue((v) => Math.max(0, (Number.isFinite(v) ? v : 0) - 1))}
                className="h-10 w-10 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-xl leading-none"
                aria-label="decrease"
              >
                −
              </button>
              <div className="min-w-16 text-center text-2xl font-semibold">
                {Number.isFinite(horseDialogValue) ? horseDialogValue : 0}
              </div>
              <button
                onClick={() => setHorseDialogValue((v) => (Number.isFinite(v) ? v : 0) + 1)}
                className="h-10 w-10 rounded-md bg-green-600 text-white hover:bg-green-700 text-xl leading-none"
                aria-label="increase"
              >
                +
              </button>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                if (horseDialogSegment && horseDialogPlayerId) {
                  setHorseValue(horseDialogSegment, horseDialogPlayerId, 0);
                }
                setIsHorseDialogOpen(false);
              }}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t('notPlay')}
            </button>
            <button
              onClick={() => {
                if (horseDialogSegment && horseDialogPlayerId) {
                  setHorseValue(horseDialogSegment, horseDialogPlayerId, horseDialogValue || 0);
                }
                setIsHorseDialogOpen(false);
              }}
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
            >
              {t('save')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Horse Value Cell Component
function HorseValueCell({
  segment,
  playerId,
  value,
  onClick,
}: {
  segment: string;
  playerId: string;
  value: number;
  onClick: () => void;
}) {
  const isSet = value > 0;
  const displayValue = isSet ? value.toString() : '-';

  return (
    <button
      onClick={onClick}
      className="w-full py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-1 relative"
    >
      <span className={`text-sm ${isSet ? 'font-semibold' : 'text-gray-400 italic'}`}>
        {displayValue}
      </span>
      <svg className="w-3 h-3 text-gray-500 absolute -right-1 -top-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

