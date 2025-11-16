'use client';

import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faCheck, faTimes, faPlus, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Round, RoundGame, roundIsMember, roundColorForPlayer, roundColorForTeam } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import {
  GameStatsService,
  OneVOneGameStats,
  TeamVsGameStats,
  SkinsGameStats,
  OlympicGameStats,
  HorseGameStats,
  HorseOutcome,
  HorseSegmentScore,
} from '@/lib/services/gameStatsService';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface GamesViewProps {
  round: Round | null;
  users: Record<string, AppUser>;
  currentUserId: string;
  onAddGame?: () => void;
  onGameTap?: (game: RoundGame) => void;
}

export default function GamesView({
  round,
  users,
  currentUserId,
  onAddGame,
  onGameTap,
}: GamesViewProps) {
  const t = useTranslations();
  const router = useRouter();

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
  const typeOrder = ['1v1', 'teamvs', 'horse', 'olympic', 'skins'];
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">{t('gamesTitle')}</h2>
            {isMember && onAddGame && (
          <Button onClick={onAddGame} size="icon" aria-label={t('add') || 'Add'}>
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
          </Button>
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
                      className={`py-3 px-2 ${isMember ? 'cursor-pointer hover:bg-accent/20 rounded' : ''}`}
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
          className="min-w-[40px] min-h-[40px] px-2 py-2 rounded flex items-center justify-center text-base font-medium text-primary-foreground"
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
            className="min-w-[40px] min-h-[40px] px-2 py-2 rounded flex items-center justify-center text-white text-base font-medium"
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
      <div className="bg-green-600 text-white px-3 py-2 rounded-t grid grid-cols-9 gap-2 text-xs font-bold mb-0">
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
            className={`px-3 py-2.5 grid grid-cols-9 gap-2 ${!isLast ? 'border-b border-gray-200' : ''}`}
          >
            <div className="col-span-3 text-sm font-semibold truncate" style={{ color: roundColorForPlayer(round, playerStats.player.id) }}>
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

  let textColor = '#000000';
  let iconColor = '#3b82f6';
  let icon = faPause;

  switch (segment.outcome) {
    case HorseOutcome.pending:
      textColor = '#000000';
      iconColor = '#3b82f6';
      icon = faPause;
      break;
    case HorseOutcome.win:
      textColor = '#16a34a';
      iconColor = '#16a34a';
      icon = faCheck;
      break;
    case HorseOutcome.lose:
      textColor = '#dc2626';
      iconColor = '#dc2626';
      icon = faTimes;
      break;
  }

  return (
    <div className="h-12 flex flex-col items-center justify-center">
      <FontAwesomeIcon icon={icon} className="text-base mb-1" style={{ color: iconColor }} />
      <span className="text-xs font-semibold" style={{ color: textColor }}>
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
      <div className="bg-green-600 text-white px-3 py-2 rounded-t grid grid-cols-5 gap-2 text-xs font-bold mb-0">
        <div className="col-span-3">{t('player')}</div>
        <div className="text-center">{t('total')}</div>
        <div className="text-center">{t('net')}</div>
      </div>
      {stats.players.map((playerStats, index) => {
        const isLast = index === stats.players.length - 1;
        return (
          <div
            key={playerStats.player.id}
            className={`px-3 py-2.5 grid grid-cols-5 gap-2 ${!isLast ? 'border-b border-gray-200' : ''}`}
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
      <div className="bg-green-600 text-white px-3 py-2 rounded-t grid grid-cols-5 gap-2 text-xs font-bold mb-0">
        <div className="col-span-3">{t('player')}</div>
        <div className="text-center">{t('total')}</div>
        <div className="text-center">{t('net')}</div>
      </div>
      {stats.players.map((playerStats, index) => {
        const isLast = index === stats.players.length - 1;
        return (
          <div
            key={playerStats.player.id}
            className={`px-3 py-2.5 grid grid-cols-5 gap-2 ${!isLast ? 'border-b border-gray-200' : ''}`}
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

