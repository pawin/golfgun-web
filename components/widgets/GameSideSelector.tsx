'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Round, RoundGame, roundColorForPlayer, roundColorForTeam } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface GameSideSelectorProps {
  round: Round;
  game: RoundGame;
  users: Record<string, AppUser>;
  onTeamsChanged: (redTeam: string[], blueTeam: string[]) => void;
  onScoreCountModeChanged: (scoreCountMode: number) => void;
}

export default function GameSideSelector({
  round,
  game,
  users,
  onTeamsChanged,
  onScoreCountModeChanged,
}: GameSideSelectorProps) {
  const t = useTranslations();
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [redTeam, setRedTeam] = useState<string[]>([]);
  const [blueTeam, setBlueTeam] = useState<string[]>([]);
  const [scoreCountMode, setScoreCountMode] = useState(1);
  const [showAddDialog, setShowAddDialog] = useState<{ isRedTeam: boolean } | null>(null);
  const [showChangeDialog, setShowChangeDialog] = useState<{
    playerId: string;
    isRedTeam: boolean;
  } | null>(null);

  useEffect(() => {
    const allMemberIds = [...round.memberIds];
    const red = (game.redTeamIds || []).filter((id) => allMemberIds.includes(id));
    const blue = (game.blueTeamIds || []).filter((id) => allMemberIds.includes(id));

    setAllPlayers(allMemberIds);
    setRedTeam(red);
    setBlueTeam(blue);
    setScoreCountMode(game.scoreCountMode ?? 1);
  }, [round, game]);

  const maxPlayersPerTeam = game.type === 'teamvs' ? round.memberIds.length - 1 : 1;

  const isPlayerInTeam = (id: string): boolean => {
    return redTeam.includes(id) || blueTeam.includes(id);
  };

  const getAvailablePlayers = (): string[] => {
    return allPlayers.filter((p) => !isPlayerInTeam(p));
  };

  const maxScoreCountMode = (): number => {
    if (redTeam.length === 0 || blueTeam.length === 0) return 1;
    return Math.min(redTeam.length, blueTeam.length);
  };

  const updateScoreCountMode = () => {
    const maxMode = maxScoreCountMode();
    if (scoreCountMode > maxMode) {
      const newMode = maxMode;
      setScoreCountMode(newMode);
      onScoreCountModeChanged(newMode);
    }
  };

  useEffect(() => {
    updateScoreCountMode();
  }, [redTeam.length, blueTeam.length]);

  const addToRedTeam = (id: string) => {
    if (redTeam.length < maxPlayersPerTeam && !isPlayerInTeam(id)) {
      const newRedTeam = [...redTeam, id];
      setRedTeam(newRedTeam);
      onTeamsChanged(newRedTeam, blueTeam);
    }
  };

  const addToBlueTeam = (id: string) => {
    if (blueTeam.length < maxPlayersPerTeam && !isPlayerInTeam(id)) {
      const newBlueTeam = [...blueTeam, id];
      setBlueTeam(newBlueTeam);
      onTeamsChanged(redTeam, newBlueTeam);
    }
  };

  const removeFromRedTeam = (id: string) => {
    const newRedTeam = redTeam.filter((p) => p !== id);
    setRedTeam(newRedTeam);
    onTeamsChanged(newRedTeam, blueTeam);
  };

  const removeFromBlueTeam = (id: string) => {
    const newBlueTeam = blueTeam.filter((p) => p !== id);
    setBlueTeam(newBlueTeam);
    onTeamsChanged(redTeam, newBlueTeam);
  };

  const replaceInRedTeam = (oldId: string, newId: string) => {
    const index = redTeam.indexOf(oldId);
    if (index !== -1) {
      const newRedTeam = [...redTeam];
      newRedTeam[index] = newId;
      setRedTeam(newRedTeam);
      onTeamsChanged(newRedTeam, blueTeam);
    }
  };

  const replaceInBlueTeam = (oldId: string, newId: string) => {
    const index = blueTeam.indexOf(oldId);
    if (index !== -1) {
      const newBlueTeam = [...blueTeam];
      newBlueTeam[index] = newId;
      setBlueTeam(newBlueTeam);
      onTeamsChanged(redTeam, newBlueTeam);
    }
  };

  const buildPlayerButton = ({
    playerId,
    isRedTeam,
    onAdd,
    onChange,
  }: {
    playerId: string | null;
    isRedTeam: boolean;
    onAdd: () => void;
    onChange: () => void;
  }) => {
    let boxColor = '#4b5563'; // neutralGrayDark
    if (game.type !== '1v1') {
      boxColor = isRedTeam ? roundColorForTeam(0) : roundColorForTeam(1);
    }

    if (playerId === null) {
      return (
        <div className="flex-1">
          <button
            onClick={onAdd}
            className="w-full h-11 px-3 border-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50"
            style={{ borderColor: boxColor, color: boxColor }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">{t('addPlayer')}</span>
          </button>
        </div>
      );
    }

    const player = users[playerId];
    if (!player) return null;

    const bgColor = game.type === '1v1' ? roundColorForPlayer(round, playerId) : boxColor;

    return (
      <div className="flex-1">
        <button
          onClick={onChange}
          className="w-full h-11 px-3 rounded-lg flex items-center justify-between hover:opacity-90"
          style={{ backgroundColor: bgColor, borderColor: bgColor }}
        >
          <span className="text-sm font-semibold text-white truncate flex-1 text-left">
            {player.name}
          </span>
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    );
  };

  const buildScoreCountModeSelector = () => {
    const maxMode = maxScoreCountMode();

    if (redTeam.length === 0 || blueTeam.length === 0) {
      return null;
    }

    if (game.type !== 'teamvs' && maxMode <= 1) {
      return null;
    }

    return (
      <div className="mt-5">
        <h3 className="text-base font-bold mb-3">{t('scoringMode')}</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxMode }, (_, i) => i + 1).map((mode) => {
            const isSelected = scoreCountMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setScoreCountMode(mode);
                  onScoreCountModeChanged(mode);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isSelected
                    ? 'bg-green-600 text-white font-semibold'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('bestScoreCount', { count: mode.toString() })}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Pad teams to max size with nulls for empty slots
  const redTeamPadded = [...redTeam];
  const blueTeamPadded = [...blueTeam];
  while (redTeamPadded.length < maxPlayersPerTeam) {
    redTeamPadded.push(null as any);
  }
  while (blueTeamPadded.length < maxPlayersPerTeam) {
    blueTeamPadded.push(null as any);
  }

  const availablePlayers = getAvailablePlayers();

  return (
    <div>
      <h3 className="text-base font-bold mb-3">{t('selectSide')}</h3>

      {/* Team rows */}
      {Array.from({ length: maxPlayersPerTeam }, (_, index) => (
        <div key={index} className="mb-2 flex items-center gap-3">
          {buildPlayerButton({
            playerId: redTeamPadded[index] || null,
            isRedTeam: true,
            onAdd: () => {
              if (redTeam.length >= maxPlayersPerTeam) {
                alert(t('sideAIsFull').replace('{team}', t('sideA')).replace('{max}', maxPlayersPerTeam.toString()));
                return;
              }
              if (availablePlayers.length === 0) {
                alert(t('noAvailablePlayers'));
                return;
              }
              setShowAddDialog({ isRedTeam: true });
            },
            onChange: () => {
              if (redTeamPadded[index]) {
                setShowChangeDialog({ playerId: redTeamPadded[index]!, isRedTeam: true });
              }
            },
          })}

          <span className="text-base font-medium">{t('vs')}</span>

          {buildPlayerButton({
            playerId: blueTeamPadded[index] || null,
            isRedTeam: false,
            onAdd: () => {
              if (blueTeam.length >= maxPlayersPerTeam) {
                alert(t('sideAIsFull').replace('{team}', t('sideB')).replace('{max}', maxPlayersPerTeam.toString()));
                return;
              }
              if (availablePlayers.length === 0) {
                alert(t('noAvailablePlayers'));
                return;
              }
              setShowAddDialog({ isRedTeam: false });
            },
            onChange: () => {
              if (blueTeamPadded[index]) {
                setShowChangeDialog({ playerId: blueTeamPadded[index]!, isRedTeam: false });
              }
            },
          })}
        </div>
      ))}

      {/* Score Count Mode Selector */}
      {buildScoreCountModeSelector()}

      {/* Add Player Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={() => setShowAddDialog(null)}
        >
          <div
            className="bg-white rounded-t-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {t('addTo')} {showAddDialog.isRedTeam ? t('sideA') : t('sideB')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {availablePlayers.map((playerId) => {
                const player = users[playerId];
                if (!player) return null;
                const bgColor = roundColorForPlayer(round, playerId);

                return (
                  <div
                    key={playerId}
                    onClick={() => {
                      if (showAddDialog.isRedTeam) {
                        addToRedTeam(playerId);
                      } else {
                        addToBlueTeam(playerId);
                      }
                      setShowAddDialog(null);
                    }}
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                  >
                    <Avatar className="w-10 h-10">
                      {player.pictureUrl ? (
                        <AvatarImage src={player.pictureUrl} alt={player.name} />
                      ) : null}
                      <AvatarFallback
                        style={{ backgroundColor: bgColor }}
                        className="text-white font-bold text-sm"
                      >
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{player.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Change Player Dialog */}
      {showChangeDialog && (
        <div
          className="fixed inset-0 bg-black/80 flex items-end justify-center z-50"
          onClick={() => setShowChangeDialog(null)}
        >
          <div
            className="bg-white rounded-t-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{t('editPlayer')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Current player */}
              <div className="bg-gray-100">
                {(() => {
                  const player = users[showChangeDialog.playerId];
                  if (!player) return null;
                  const bgColor = roundColorForPlayer(round, player.id);

                  return (
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          {player.pictureUrl ? (
                            <AvatarImage src={player.pictureUrl} alt={player.name} />
                          ) : null}
                          <AvatarFallback
                            style={{ backgroundColor: bgColor }}
                            className="text-white font-bold text-sm"
                          >
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{player.name}</div>
                          <div className="text-xs text-gray-600">{t('currentPlayer')}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (showChangeDialog.isRedTeam) {
                            removeFromRedTeam(showChangeDialog.playerId);
                          } else {
                            removeFromBlueTeam(showChangeDialog.playerId);
                          }
                          setShowChangeDialog(null);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {availablePlayers.length > 0 && (
                <>
                  <div className="h-px bg-gray-200" />
                  <div className="px-4 py-2 text-xs text-gray-600">{t('orReplaceWith')}</div>
                  {availablePlayers.map((playerId) => {
                    const player = users[playerId];
                    if (!player) return null;
                    const bgColor = roundColorForPlayer(round, playerId);

                    return (
                      <div
                        key={playerId}
                        onClick={() => {
                          if (showChangeDialog.isRedTeam) {
                            replaceInRedTeam(showChangeDialog.playerId, playerId);
                          } else {
                            replaceInBlueTeam(showChangeDialog.playerId, playerId);
                          }
                          setShowChangeDialog(null);
                        }}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                      >
                        <Avatar className="w-10 h-10">
                          {player.pictureUrl ? (
                            <AvatarImage src={player.pictureUrl} alt={player.name} />
                          ) : null}
                          <AvatarFallback
                            style={{ backgroundColor: bgColor }}
                            className="text-white font-bold text-sm"
                          >
                            {getInitials(player.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{player.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

