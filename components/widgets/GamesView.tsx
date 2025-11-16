'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCheck, faTimes, faPlus, faChevronRight, faUser, faUsers, faCoins, faMedal, faHorse } from '@fortawesome/free-solid-svg-icons';
import { Round, RoundGame, roundIsMember, roundColorForPlayer, roundColorForTeam } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { roundService } from '@/lib/services/roundService';
import {
  GameStatsService,
  HorseOutcome,
  HorseSegmentScore,
} from '@/lib/services/gameStatsService';
import { useRouter } from 'next/navigation';

interface GamesViewProps {
  round: Round | null;
  users: Record<string, AppUser>;
  currentUserId: string;
  onGameTap?: (game: RoundGame) => void;
}

export default function GamesView({
  round,
  users,
  currentUserId,
  onGameTap,
}: GamesViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [creatingType, setCreatingType] = React.useState<string | null>(null);

  if (!round) return null;

  const games = round.games;
  const isMember = roundIsMember(round, currentUserId);

  // Group games by type
  const gamesByType: Record<string, RoundGame[]> = {};
  for (const game of games) {
    const type = game.type;
    if (!gamesByType[type]) {
      gamesByType[type] = [];
    }
    gamesByType[type].push(game);
  }

  // Sort by predefined order
  const typeOrder = ['1v1', 'teamvs', 'skins', 'olympic', 'horse'];
  const sortedTypes = Object.entries(gamesByType).sort((a, b) => {
    const indexA = typeOrder.indexOf(a[0].toLowerCase());
    const indexB = typeOrder.indexOf(b[0].toLowerCase());
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  const getGameTypeTitle = (gameType: string): string => {
    switch (gameType.toLowerCase()) {
      case '1v1':
        return t('gameType1v1');
      case 'teamvs':
        return t('gameTypeTeamVs');
      case 'horse':
        return t('gameTypeHorse');
      case 'skins':
        return t('gameTypeSkins');
      case 'olympic':
        return t('gameTypeOlympic');
      default:
        return gameType.toUpperCase();
    }
  };

  const usersMap = new Map(Object.entries(users));

  const createAndOpenGame = async (type: string) => {
    if (!round || !isMember) return;
    try {
      setCreatingType(type);
      const timestamp = Date.now();
      const newGameId = `${type}:${currentUserId}:${timestamp}`;
      const game: RoundGame = {
        id: newGameId,
        type,
        playerIds: [...round.memberIds],
        blueTeamIds: [],
        redTeamIds: [],
        handicapStrokes: {},
        holePoints: {},
        horseSettings: {},
        skinsStartingHole: 1,
      };
      await roundService.saveGame({ roundId: round.id, game });
      setIsAddDialogOpen(false);
      onGameTap?.(game);
    } catch (e) {
      alert(String(e));
    } finally {
      setCreatingType(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">{t('gamesTitle')}</h2>
            {isMember && (
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-11 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center hover:bg-primary-hover"
          >
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          </button>
        )}
      </div>

      {games.length > 0 && (
        <div className="space-y-2">
          {sortedTypes.map(([gameType, gamesOfType]) => (
            <div key={gameType} className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">{getGameTypeTitle(gameType)}</h3>
              <div className="h-px bg-border mb-3" />
              <div className="space-y-0">
                {gamesOfType.map((game, index) => (
                  <div key={game.id}>
                    <div
                      onClick={() => isMember && onGameTap?.(game)}
                      className={`py-3 px-2 ${isMember ? 'cursor-pointer hover:bg-accent rounded' : ''}`}
                    >
                      {gameType.toLowerCase() === '1v1' && (
                        <OneVOneGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                      {gameType.toLowerCase() === 'teamvs' && (
                        <TeamVsGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                      {gameType.toLowerCase() === 'horse' && (
                        <HorseGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                      {gameType.toLowerCase() === 'olympic' && (
                        <OlympicGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                      {gameType.toLowerCase() === 'skins' && (
                        <SkinsGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                      {!['1v1', 'teamvs', 'horse', 'olympic', 'skins'].includes(gameType.toLowerCase()) && (
                        <DefaultGameDisplay round={round} game={game} usersMap={usersMap} />
                      )}
                    </div>
                    {index < gamesOfType.length - 1 && <div className="h-px bg-border" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('startNewGame')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            <button
              className="w-full py-3 px-4 rounded-md border hover:bg-accent text-left font-medium"
              onClick={() => createAndOpenGame('1v1')}
              disabled={creatingType !== null}
            >
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-muted-foreground" />
                {getGameTypeTitle('1v1')}
              </span>
            </button>
            <button
              className="w-full py-3 px-4 rounded-md border hover:bg-accent text-left font-medium"
              onClick={() => createAndOpenGame('teamvs')}
              disabled={creatingType !== null}
            >
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-muted-foreground" />
                {t('matchplay') || getGameTypeTitle('teamvs')}
              </span>
            </button>
            <button
              className="w-full py-3 px-4 rounded-md border hover:bg-accent text-left font-medium"
              onClick={() => createAndOpenGame('skins')}
              disabled={creatingType !== null}
            >
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faCoins} className="w-4 h-4 text-muted-foreground" />
                {getGameTypeTitle('skins')}
              </span>
            </button>
            <button
              className="w-full py-3 px-4 rounded-md border hover:bg-accent text-left font-medium"
              onClick={() => createAndOpenGame('olympic')}
              disabled={creatingType !== null}
            >
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faMedal} className="w-4 h-4 text-muted-foreground" />
                {getGameTypeTitle('olympic')}
              </span>
            </button>
            <button
              className="w-full py-3 px-4 rounded-md border hover:bg-accent text-left font-medium"
              onClick={() => createAndOpenGame('horse')}
              disabled={creatingType !== null}
            >
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faHorse} className="w-4 h-4 text-muted-foreground" />
                {getGameTypeTitle('horse')}
              </span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Game Type Display Components
function OneVOneGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const stats = GameStatsService.calculateOneVOneStats(round, game, usersMap);
  const rawScore = stats.diff;
  let color = '#64748b';
  let leftColor = 'transparent';
  let rightColor = 'transparent';

  const redPlayer = stats.redPlayer;
  const bluePlayer = stats.bluePlayer;

  if (rawScore > 0) {
    color = roundColorForPlayer(round, redPlayer.id);
    leftColor = color;
  } else if (rawScore < 0) {
    color = roundColorForPlayer(round, bluePlayer.id);
    rightColor = color;
  }

  const scoreText = rawScore === 0 ? '-' : Math.abs(rawScore).toString();

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 text-left text-sm font-medium truncate" style={{ color: roundColorForPlayer(round, redPlayer.id) }}>
        {redPlayer.name}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg" style={{ color: leftColor }}>
          +
        </span>
        <div
          className="min-w-[40px] min-h-[40px] px-2 py-2 rounded flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: color }}
        >
          {scoreText}
        </div>
        <span className="text-lg" style={{ color: rightColor }}>
          +
        </span>
      </div>
      <div className="flex-1 text-right text-sm font-medium truncate" style={{ color: roundColorForPlayer(round, bluePlayer.id) }}>
        {bluePlayer.name}
      </div>
    </div>
  );
}

function TeamVsGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const t = useTranslations();
  const stats = GameStatsService.calculateTeamVsStats(round, game, usersMap);
  const rawScore = stats.diff;
  let color = '#64748b';
  let leftColor = 'transparent';
  let rightColor = 'transparent';

  if (rawScore > 0) {
    color = roundColorForTeam(0);
    leftColor = color;
  } else if (rawScore < 0) {
    color = roundColorForTeam(1);
    rightColor = color;
  }

  const scoreText = rawScore === 0 ? '-' : Math.abs(rawScore).toString();

  return (
    <div className="flex items-start gap-1">
      <div className="flex-1">
        {stats.redPlayers.map((player, idx) => (
          <div
            key={player.id}
            className={`text-sm font-medium truncate ${idx < stats.redPlayers.length - 1 ? 'mb-0.5' : ''}`}
            style={{ color: roundColorForTeam(0) }}
          >
            {player.name}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="text-lg" style={{ color: leftColor }}>
            +
          </span>
          <div
            className="min-w-[40px] min-h-[40px] px-2 py-2 rounded flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: color }}
          >
            {scoreText}
          </div>
          <span className="text-lg" style={{ color: rightColor }}>
            +
          </span>
        </div>
        <div className="text-xs text-muted-foreground">{t('bestScoreCount', { count: stats.scoreCountMode?.toString() || '1' })}</div>
      </div>
      <div className="flex-1 text-right">
        {stats.bluePlayers.map((player, idx) => (
          <div
            key={player.id}
            className={`text-sm font-medium truncate ${idx < stats.bluePlayers.length - 1 ? 'mb-0.5' : ''}`}
            style={{ color: roundColorForTeam(1) }}
          >
            {player.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function HorseGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const t = useTranslations();
  const stats = GameStatsService.calculateHorseStats(round, game, usersMap);

  if (stats.players.length === 0) {
    return <div className="text-sm">{t('gameTypeHorse')}</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t grid grid-cols-9 gap-2 text-xs font-bold mb-0">
        <div className="col-span-3">{t('player')}</div>
        <div className="col-span-2 text-center">{t('front9')}</div>
        <div className="col-span-2 text-center">{t('back9')}</div>
        <div className="col-span-2 text-center">{t('total')}</div>
      </div>
      {/* Rows */}
      {stats.players.map((playerStats, index) => {
        const isLast = index === stats.players.length - 1;
        return (
          <div
            key={playerStats.player.id}
            className={`px-3 py-2.5 grid grid-cols-9 gap-2 ${!isLast ? 'border-b border-border' : ''}`}
          >
            <div className="col-span-3 text-sm font-semibold truncate flex items-center" style={{ color: roundColorForPlayer(round, playerStats.player.id) }}>
              {playerStats.player.name}
            </div>
            <div className="col-span-2">
              <HorseSegmentCell segment={playerStats.front} />
            </div>
            <div className="col-span-2">
              <HorseSegmentCell segment={playerStats.back} />
            </div>
            <div className="col-span-2">
              <HorseSegmentCell segment={playerStats.total} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorseSegmentCell({ segment }: { segment?: HorseSegmentScore }) {
  if (!segment || segment.target < 1) {
    return <div className="h-12 flex items-center justify-center text-sm">-</div>;
  }

  let textColorClass = 'text-foreground';
  let iconColorClass = 'text-info';
  let icon = faEllipsis;

  switch (segment.outcome) {
    case HorseOutcome.pending:
      textColorClass = 'text-foreground';
      iconColorClass = 'text-black';
      icon = faEllipsis;
      break;
    case HorseOutcome.win:
      textColorClass = 'text-success';
      iconColorClass = 'text-success';
      icon = faCheck;
      break;
    case HorseOutcome.lose:
      textColorClass = 'text-error';
      iconColorClass = 'text-error';
      icon = faTimes;
      break;
  }

  return (
    <div className="h-12 flex flex-col items-center justify-center">
      <FontAwesomeIcon icon={icon} className={`text-base mb-1 ${iconColorClass}`} />
      <span className={`text-xs font-semibold ${textColorClass}`}>
        {segment.stroke}/{segment.target}
      </span>
    </div>
  );
}

function OlympicGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const t = useTranslations();
  const stats = GameStatsService.calculateOlympicStats(round, game, usersMap);

  return (
    <div>
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t grid grid-cols-5 gap-2 text-xs font-bold mb-0">
        <div className="col-span-3">{t('player')}</div>
        <div className="text-center">{t('total')}</div>
        <div className="text-center">{t('net')}</div>
      </div>
      {stats.players.map((playerStats, index) => {
        const isLast = index === stats.players.length - 1;
        return (
          <div
            key={playerStats.player.id}
            className={`px-3 py-2.5 grid grid-cols-5 gap-2 ${!isLast ? 'border-b border-border' : ''}`}
          >
            <div className="col-span-3 text-sm font-semibold truncate" style={{ color: roundColorForPlayer(round, playerStats.player.id) }}>
              {playerStats.player.name}
            </div>
            <div className="text-center text-sm">{playerStats.total}</div>
            <div className="text-center text-sm font-bold">{playerStats.net}</div>
          </div>
        );
      })}
    </div>
  );
}

function SkinsGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const t = useTranslations();
  const stats = GameStatsService.calculateSkinsStats(round, game, usersMap);

  return (
    <div>
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t grid grid-cols-5 gap-2 text-xs font-bold mb-0">
        <div className="col-span-3">{t('player')}</div>
        <div className="text-center">{t('total')}</div>
        <div className="text-center">{t('net')}</div>
      </div>
      {stats.players.map((playerStats, index) => {
        const isLast = index === stats.players.length - 1;
        return (
          <div
            key={playerStats.player.id}
            className={`px-3 py-2.5 grid grid-cols-5 gap-2 ${!isLast ? 'border-b border-border' : ''}`}
          >
            <div className="col-span-3 text-sm font-semibold truncate" style={{ color: roundColorForPlayer(round, playerStats.player.id) }}>
              {playerStats.player.name}
            </div>
            <div className="text-center text-sm">{playerStats.total}</div>
            <div className="text-center text-sm font-bold">{playerStats.net}</div>
          </div>
        );
      })}
    </div>
  );
}

function DefaultGameDisplay({
  round,
  game,
  usersMap,
}: {
  round: Round;
  game: RoundGame;
  usersMap: Map<string, AppUser>;
}) {
  const t = useTranslations();
  const playerCount = game.playerIds?.length || 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-base font-semibold">
          {t('gamesTitle')} {game.id}
        </div>
        <div className="text-xs text-muted-foreground">
          {playerCount} {t('players').toLowerCase()}
        </div>
      </div>
      <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

