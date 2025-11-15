import { Round, RoundGame, roundScorecardBridge } from '../models/round';
import { AppUser } from '../models/appUser';

export enum RoundGameType {
  oneVOne = '1v1',
  teamVs = 'teamvs',
  skins = 'skins',
  olympic = 'olympic',
  horse = 'horse',
  other = 'other',
}

export function classifyGame(game: RoundGame): RoundGameType {
  switch (game.type.toLowerCase()) {
    case '1v1':
      return RoundGameType.oneVOne;
    case 'teamvs':
      return RoundGameType.teamVs;
    case 'skins':
      return RoundGameType.skins;
    case 'olympic':
      return RoundGameType.olympic;
    case 'horse':
      return RoundGameType.horse;
    default:
      return RoundGameType.other;
  }
}

export enum GameTeamSide {
  red = 'red',
  blue = 'blue',
}

// Helper functions to work with Round model
function getScorecardBridge(round: Round): Round['scorecard'] {
  return roundScorecardBridge(round);
}

function getGameRedTeam(round: Round, game: RoundGame, users: Map<string, AppUser>): AppUser[] {
  return game.redTeamIds
    .map((id) => users.get(id))
    .filter((u): u is AppUser => u !== undefined);
}

function getGameBlueTeam(round: Round, game: RoundGame, users: Map<string, AppUser>): AppUser[] {
  return game.blueTeamIds
    .map((id) => users.get(id))
    .filter((u): u is AppUser => u !== undefined);
}

function getGamePlayers(round: Round, game: RoundGame, users: Map<string, AppUser>): AppUser[] {
  const playerIds = game.playerIds.length > 0 ? game.playerIds : round.memberIds;
  return playerIds
    .map((id) => users.get(id))
    .filter((u): u is AppUser => u !== undefined);
}

function getUser(round: Round, userId: string, users: Map<string, AppUser>): AppUser | null {
  return users.get(userId) || null;
}

export class GameStatsService {
  static resultOfGame(round: Round, game: RoundGame, users: Map<string, AppUser>): number {
    let totalPoints = 0;
    const scorecardBridge = getScorecardBridge(round);

    for (const [holeKey, playersMap] of Object.entries(round.score)) {
      const holePoint = (game.holePoints[holeKey] as any)?.point ?? 1;

      const idx = scorecardBridge.holes.findIndex(
        (h: any) => h.value === holeKey
      );
      if (idx < 0 || idx >= scorecardBridge.par.length) continue;

      const parCell = scorecardBridge.par[idx]?.value;
      const par = typeof parCell === 'number' ? parCell : parseInt(parCell?.toString() ?? '4') || 4;
      if (!par) continue;

      const reds = createScoreObjectForGame(
        round,
        getGameRedTeam(round, game, users),
        game.handicapStrokes,
        holeKey
      );
      const blues = createScoreObjectForGame(
        round,
        getGameBlueTeam(round, game, users),
        game.handicapStrokes,
        holeKey
      );

      const count = game.scoreCountMode ?? 1;
      for (let i = 0; i < count; i++) {
        const redRaw = i < reds.length ? reds[i].raw : -1;
        const redAdjusted = i < reds.length ? reds[i].adjusted : -1;
        const blueRaw = i < blues.length ? blues[i].raw : -1;
        const blueAdjusted = i < blues.length ? blues[i].adjusted : -1;

        if (redRaw > 0 && blueRaw > 0) {
          if (redAdjusted < blueAdjusted) {
            const m = gameMultiplierForScore(game, redRaw, par);
            totalPoints += holePoint * m;
          } else if (redAdjusted > blueAdjusted) {
            const m = gameMultiplierForScore(game, blueRaw, par);
            totalPoints -= holePoint * m;
          }
        }
      }
    }

    return totalPoints;
  }

  static sideForPlayer(
    round: Round,
    game: RoundGame,
    userId: string,
    users: Map<string, AppUser>
  ): GameTeamSide | null {
    const redTeam = getGameRedTeam(round, game, users);
    if (redTeam.some((p) => p.id === userId)) {
      return GameTeamSide.red;
    }
    const blueTeam = getGameBlueTeam(round, game, users);
    if (blueTeam.some((p) => p.id === userId)) {
      return GameTeamSide.blue;
    }
    return null;
  }

  static winningSide(diff: number): GameTeamSide | null {
    if (diff > 0) return GameTeamSide.red;
    if (diff < 0) return GameTeamSide.blue;
    return null;
  }

  static calculateOneVOneStats(
    round: Round,
    game: RoundGame,
    users: Map<string, AppUser>
  ): OneVOneGameStats {
    const redTeam = getGameRedTeam(round, game, users);
    const blueTeam = getGameBlueTeam(round, game, users);
    const red = redTeam[0] || createEmptyUser();
    const blue = blueTeam[0] || createEmptyUser();
    const diff = this.resultOfGame(round, game, users);
    return { redPlayer: red, bluePlayer: blue, diff };
  }

  static calculateTeamVsStats(
    round: Round,
    game: RoundGame,
    users: Map<string, AppUser>
  ): TeamVsGameStats {
    const diff = this.resultOfGame(round, game, users);
    return {
      redPlayers: getGameRedTeam(round, game, users),
      bluePlayers: getGameBlueTeam(round, game, users),
      diff,
      scoreCountMode: game.scoreCountMode ?? 1,
    };
  }

  static calculateSkinsStats(
    round: Round,
    game: RoundGame,
    users: Map<string, AppUser>
  ): SkinsGameStats {
    const skinsStartingHole = game.skinsStartingHole;
    const scorecardBridge = getScorecardBridge(round);
    const playableHoles = scorecardBridge.holes
      .filter((h: any) => h.kind?.toString().toLowerCase() === 'hole')
      .map((h: any) => parseInt(h.value?.toString() ?? '') || 0)
      .filter((n: number) => n > 0);

    const orderedPlayableHoles = (() => {
      if (playableHoles.length === 0) return [];
      const startIndex = playableHoles.indexOf(skinsStartingHole);
      if (startIndex <= 0) {
        return playableHoles;
      }
      return [
        ...playableHoles.slice(startIndex),
        ...playableHoles.slice(0, startIndex),
      ];
    })();

    const players = round.memberIds
      .filter((mid) => game.playerIds.includes(mid))
      .map((mid) => getUser(round, mid, users))
      .filter((u): u is AppUser => u !== null);

    const playerScores: Map<string, SkinsPlayerStats> = new Map();
    for (const player of players) {
      playerScores.set(player.id, {
        player,
        total: 0,
        net: 0,
      });
    }

    const skinsMode = game.skinsMode ?? 0;
    const maxSkins = game.maxSkins ?? 18;
    let carryOver = 1;
    for (const hole of orderedPlayableHoles) {
      const holeGrossScores: Map<string, number> = new Map();
      const holeNetScores: Map<string, number> = new Map();
      for (const player of players) {
        const grossScore = round.score[String(hole)]?.[player.id] ?? 0;
        if (grossScore > 0) {
          holeGrossScores.set(player.id, grossScore);
          const handicapStrokes = (game.handicapStrokes[String(hole)] as any)?.[player.id] ?? 0;
          const handicap = typeof handicapStrokes === 'number' ? handicapStrokes : parseFloat(String(handicapStrokes)) || 0;
          holeNetScores.set(player.id, grossScore - handicap);
        }
      }

      if (holeGrossScores.size !== players.length) {
        continue;
      }

      const par = parForHole(round, hole);
      const threshold = skinsMode === 100 ? null : par + skinsMode;

      const eligiblePlayers: string[] = [];
      if (threshold === null) {
        eligiblePlayers.push(...holeNetScores.keys());
      } else {
        for (const [playerId, netScore] of holeNetScores.entries()) {
          if (netScore <= threshold) {
            eligiblePlayers.push(playerId);
          }
        }
      }

      if (eligiblePlayers.length === 0) {
        carryOver = Math.min(carryOver + 1, maxSkins);
        continue;
      }

      let bestNetScore: number | null = null;
      for (const playerId of eligiblePlayers) {
        const netScore = holeNetScores.get(playerId)!;
        if (bestNetScore === null || netScore < bestNetScore) {
          bestNetScore = netScore;
        }
      }

      const winners = eligiblePlayers.filter(
        (playerId) => holeNetScores.get(playerId) === bestNetScore
      );

      if (winners.length === 1) {
        const winnerId = winners[0];
        const existing = playerScores.get(winnerId)!;
        playerScores.set(winnerId, {
          ...existing,
          total: existing.total + carryOver,
        });
        carryOver = 1;
      } else {
        carryOver = Math.min(carryOver + 1, maxSkins);
      }
    }

    for (const player of players) {
      let netScore = 0;
      const playerTotal = playerScores.get(player.id)?.total ?? 0;
      for (const other of players) {
        if (other.id === player.id) continue;
        const otherTotal = playerScores.get(other.id)?.total ?? 0;
        netScore += playerTotal - otherTotal;
      }
      const existing = playerScores.get(player.id)!;
      playerScores.set(player.id, { ...existing, net: netScore });
    }

    const sorted = Array.from(playerScores.values()).sort((a, b) => b.net - a.net);

    return { players: sorted, orderedHoles: orderedPlayableHoles };
  }

  static calculateOlympicStats(
    round: Round,
    game: RoundGame,
    users: Map<string, AppUser>
  ): OlympicGameStats {
    const skinsStartingHole = game.skinsStartingHole;
    const scorecardBridge = getScorecardBridge(round);
    const playableHoles = scorecardBridge.holes
      .filter((h: any) => h.kind?.toString().toLowerCase() === 'hole')
      .map((h: any) => parseInt(h.value?.toString() ?? '') || 0)
      .filter((n: number) => n > 0);

    const orderedPlayableHoles = (() => {
      if (playableHoles.length === 0) return [];
      const startIndex = playableHoles.indexOf(skinsStartingHole);
      if (startIndex <= 0) {
        return playableHoles;
      }
      return [
        ...playableHoles.slice(startIndex),
        ...playableHoles.slice(0, startIndex),
      ];
    })();

    const players = round.memberIds
      .filter((mid) => game.playerIds.includes(mid))
      .map((mid) => getUser(round, mid, users))
      .filter((u): u is AppUser => u !== null);

    const playerScores: Map<string, OlympicPlayerStats> = new Map();
    for (const player of players) {
      let total = 0;
      for (const hole of orderedPlayableHoles) {
        const rawPoint = (round.olympic as any)?.[String(hole)]?.[player.id];
        const point =
          typeof rawPoint === 'number'
            ? rawPoint
            : parseInt(String(rawPoint ?? '')) || 0;
        total += point;
      }
      playerScores.set(player.id, {
        player,
        total,
        net: 0,
      });
    }

    for (const player of players) {
      let netScore = 0;
      const playerTotal = playerScores.get(player.id)?.total ?? 0;
      for (const other of players) {
        if (other.id === player.id) continue;
        const otherTotal = playerScores.get(other.id)?.total ?? 0;
        netScore += playerTotal - otherTotal;
      }
      const existing = playerScores.get(player.id)!;
      playerScores.set(player.id, { ...existing, net: netScore });
    }

    const sorted = Array.from(playerScores.values()).sort((a, b) => b.net - a.net);

    return { players: sorted, orderedHoles: orderedPlayableHoles };
  }

  static calculateHorseStats(
    round: Round,
    game: RoundGame,
    users: Map<string, AppUser>
  ): HorseGameStats {
    const idOrder =
      game.playerIds.length > 0
        ? [...game.playerIds]
        : getGamePlayers(round, game, users).map((p) => p.id);

    const playerEntries = idOrder.map((playerId) => {
      const member = getUser(round, playerId, users);
      const source = member || createEmptyUser();
      const displayName = source.name || playerId;
      const player: AppUser = {
        id: playerId,
        name: displayName,
        email: source.email || '',
        pictureUrl: source.pictureUrl,
        role: source.role,
        language: source.language,
        registered: source.registered,
      };
      return { player };
    });

    const defaults = this.horseDefaultValuesForRound(round);
    const holeKeys = this.horseHoleKeys(round);
    const frontHoleKeys = holeKeys.slice(0, 9);
    const backHoleKeys = holeKeys.slice(9, 18);

    const entries = playerEntries.map((entry) => {
      const playerId = entry.player.id;
      const frontTarget = horseValueForPlayer(game, 'front', playerId, defaults);
      const backTarget = horseValueForPlayer(game, 'back', playerId, defaults);
      const totalTarget = horseValueForPlayer(game, 'total', playerId, defaults);

      return {
        ...entry,
        front: this.computeHorseSegmentScore(round, frontHoleKeys, playerId, frontTarget),
        back: this.computeHorseSegmentScore(round, backHoleKeys, playerId, backTarget),
        total: this.computeHorseSegmentScore(round, holeKeys, playerId, totalTarget),
      };
    });

    return { players: entries };
  }

  static horseDefaultValuesForRound(round: Round): Record<string, number> {
    const scorecardBridge = getScorecardBridge(round);
    const holes = scorecardBridge.holes;
    const par = scorecardBridge.par;
    let front = 0;
    let back = 0;
    let unnamed = 0;
    const length = Math.min(holes.length, par.length);

    for (let i = 0; i < length; i++) {
      const kind = (holes[i] as any)?.kind?.toString().toLowerCase();
      if (kind !== 'hole') continue;

      const parValue = parseInt((par[i] as any)?.value?.toString() ?? '') || 0;
      if (!parValue) continue;

      const holeNumber = parseInt((holes[i] as any)?.value?.toString() ?? '') || 0;

      if (holeNumber > 0) {
        if (holeNumber <= 9) {
          front += parValue;
        } else {
          back += parValue;
        }
      } else {
        unnamed++;
        if (unnamed <= 9) {
          front += parValue;
        } else {
          back += parValue;
        }
      }
    }

    const total = front + back;
    return { front, back, total };
  }

  static horseHoleKeys(round: Round): string[] {
    const scorecardBridge = getScorecardBridge(round);
    const keys: string[] = [];
    for (const hole of scorecardBridge.holes) {
      const kind = (hole as any)?.kind?.toString().toLowerCase();
      if (kind !== 'hole') continue;
      const rawValue = (hole as any)?.value?.toString().trim();
      if (rawValue && rawValue.length > 0) {
        keys.push(rawValue);
      } else {
        keys.push(String(keys.length + 1));
      }
    }
    return keys;
  }

  static computeHorseSegmentScore(
    round: Round,
    holeKeys: string[],
    playerId: string,
    target: number
  ): HorseSegmentScore {
    let total = 0;
    let allHolesFilled = holeKeys.length > 0;

    for (const holeKey of holeKeys) {
      const strokeValue = round.score[holeKey]?.[playerId] ?? 0;
      if (strokeValue > 0) {
        total += strokeValue;
      } else {
        allHolesFilled = false;
      }
    }

    if (!allHolesFilled) {
      return {
        stroke: total,
        target,
        hasStroke: true,
        outcome: HorseOutcome.pending,
        diff: 0,
      };
    }

    const didMeetTarget = target > 0 && total <= target;
    const outcome = didMeetTarget ? HorseOutcome.win : HorseOutcome.lose;

    return {
      stroke: total,
      target,
      hasStroke: true,
      outcome,
      diff: didMeetTarget ? target - total : 0,
    };
  }
}

// Helper functions
function createScoreObjectForGame(
  round: Round,
  team: AppUser[],
  handicapStrokes: Record<string, any>,
  hole: string
): Array<{ id: string; name: string; raw: number; adjusted: number }> {
  return team
    .map((m) => {
      const rawScore = round.score[hole]?.[m.id] ?? -1;
      const hdcpRaw = handicapStrokes[hole]?.[m.id];
      const hdcp =
        typeof hdcpRaw === 'number'
          ? hdcpRaw
          : parseFloat(String(hdcpRaw ?? '')) || 0;
      return {
        id: m.id,
        name: m.name,
        raw: rawScore,
        adjusted: rawScore + hdcp,
      };
    })
    .filter((x) => x.raw > 0)
    .sort((a, b) => a.raw - b.raw);
}

function gameMultiplierForScore(game: RoundGame, stroke: number, par: number): number {
  const label = calculateScoreLabelForGame(stroke, par);
  switch (label) {
    case 'Birdie':
      return parseInt(game.birdieMultiplier ?? '2') || 2;
    case 'Eagle':
      return parseInt(game.eagleMultiplier ?? '5') || 5;
    case 'Albatross':
      return parseInt(game.albatrossMultiplier ?? '10') || 10;
    case 'Hole in One':
      return parseInt(game.holeInOneMultiplier ?? '20') || 20;
    default:
      return 1;
  }
}

function calculateScoreLabelForGame(score: number, par: number): string {
  const diff = score - par;
  if (score === 1) return 'Hole in One';
  if (diff === -3) return 'Albatross';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff === 3) return 'Triple Bogey';
  return diff > 3 ? `+${diff}` : `${diff}`;
}

function parForHole(round: Round, holeNumber: number): number {
  const scorecardBridge = getScorecardBridge(round);
  const idx = scorecardBridge.holes.findIndex((h: any) => {
    const kind = h.kind?.toString().toLowerCase();
    const val = h.value?.toString();
    return kind === 'hole' && val === String(holeNumber);
  });
  if (idx < 0 || idx >= scorecardBridge.par.length) return 4;
  const parValue = scorecardBridge.par[idx]?.value;
  if (typeof parValue === 'number') return parValue;
  return parseInt(parValue?.toString() ?? '4') || 4;
}

function horseValueForPlayer(
  game: RoundGame,
  segment: string,
  playerId: string,
  defaults: Record<string, number>
): number {
  const segmentValues = game.horseSettings[segment];
  if (segmentValues && segmentValues[playerId] !== undefined) {
    return segmentValues[playerId];
  }
  return defaults[segment] ?? 0;
}

function createEmptyUser(): AppUser {
  return {
    id: '',
    name: '',
    email: '',
    registered: false,
    language: 'th',
  };
}

// Type definitions
export interface OneVOneGameStats {
  redPlayer: AppUser;
  bluePlayer: AppUser;
  diff: number;
}

export interface TeamVsGameStats {
  redPlayers: AppUser[];
  bluePlayers: AppUser[];
  diff: number;
  scoreCountMode: number;
}

export interface SkinsPlayerStats {
  player: AppUser;
  total: number;
  net: number;
}

export interface SkinsGameStats {
  players: SkinsPlayerStats[];
  orderedHoles: number[];
}

export interface OlympicPlayerStats {
  player: AppUser;
  total: number;
  net: number;
}

export interface OlympicGameStats {
  players: OlympicPlayerStats[];
  orderedHoles: number[];
}

export interface HorsePlayerStats {
  player: AppUser;
  front?: HorseSegmentScore;
  back?: HorseSegmentScore;
  total?: HorseSegmentScore;
}

export interface HorseGameStats {
  players: HorsePlayerStats[];
}

export enum HorseOutcome {
  win = 'win',
  lose = 'lose',
  pending = 'pending',
}

export interface HorseSegmentScore {
  stroke: number;
  target: number;
  hasStroke: boolean;
  outcome: HorseOutcome;
  diff: number;
}

export const gameStatsService = new GameStatsService();
