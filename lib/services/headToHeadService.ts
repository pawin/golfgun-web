import { Round, RoundGame } from '../models/round';
import { AppUser } from '../models/appUser';
import {
  GameStatsService,
  classifyGame,
  RoundGameType,
  GameTeamSide,
  HorseOutcome,
} from './gameStatsService';

export interface HeadToHeadStats {
  oneVOne: HeadToHeadRecord;
  sameTeam: HeadToHeadRecord;
  oppositeTeam: HeadToHeadRecord;
  skins: HeadToHeadScoreRecord;
  olympic: HeadToHeadScoreRecord;
  horse: HeadToHeadScoreRecord;
}

export function hasHeadToHeadData(stats: HeadToHeadStats): boolean {
  return (
    stats.oneVOne.games > 0 ||
    stats.sameTeam.games > 0 ||
    stats.oppositeTeam.games > 0 ||
    stats.skins.games > 0 ||
    stats.olympic.games > 0 ||
    stats.horse.games > 0
  );
}

export interface HeadToHeadRecord {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  netPoints: number;
}

export interface HeadToHeadScoreRecord {
  games: number;
  wins: number;
  losses: number;
  ties: number;
  netScore: number;
}

export class HeadToHeadService {
  static calculate({
    rounds,
    currentUserId,
    otherUserId,
    users,
  }: {
    rounds: Round[];
    currentUserId: string;
    otherUserId: string;
    users: Map<string, AppUser>;
  }): HeadToHeadStats {
    const oneVOne = new HeadToHeadAccumulator();
    const sameTeam = new HeadToHeadAccumulator();
    const oppositeTeam = new HeadToHeadAccumulator();
    const skins = new HeadToHeadScoreAccumulator();
    const olympic = new HeadToHeadScoreAccumulator();
    const horse = new HeadToHeadScoreAccumulator();

    for (const round of rounds) {
      if (round.deletedAt) continue;
      if (!round.isFinished) continue;
      if (!round.memberIds.includes(currentUserId)) continue;
      if (!round.memberIds.includes(otherUserId)) continue;

      for (const game of round.games) {
        const type = classifyGame(game);
        switch (type) {
          case RoundGameType.oneVOne:
          case RoundGameType.teamVs: {
            const mySide = GameStatsService.sideForPlayer(
              round,
              game,
              currentUserId,
              users
            );
            const otherSide = GameStatsService.sideForPlayer(
              round,
              game,
              otherUserId,
              users
            );

            if (mySide === null || otherSide === null) {
              continue;
            }

            const diff = GameStatsService.resultOfGame(round, game, users);
            const diffForMe = mySide === GameTeamSide.red ? diff : -diff;

            if (type === RoundGameType.oneVOne) {
              oneVOne.add(diffForMe);
            }

            if (mySide === otherSide) {
              sameTeam.add(diffForMe);
            } else if (type === RoundGameType.teamVs) {
              oppositeTeam.add(diffForMe);
            }
            break;
          }
          case RoundGameType.skins: {
            const stats = GameStatsService.calculateSkinsStats(round, game, users);
            let myStats: typeof stats.players[0] | null = null;
            let otherStats: typeof stats.players[0] | null = null;
            for (const player of stats.players) {
              if (player.player.id === currentUserId) {
                myStats = player;
              } else if (player.player.id === otherUserId) {
                otherStats = player;
              }
              if (myStats && otherStats) break;
            }
            if (!myStats || !otherStats) {
              continue;
            }
            const diffSkins = myStats.total - otherStats.total;
            skins.add(diffSkins);
            break;
          }
          case RoundGameType.olympic: {
            const stats = GameStatsService.calculateOlympicStats(round, game, users);
            let myStats: typeof stats.players[0] | null = null;
            let otherStats: typeof stats.players[0] | null = null;
            for (const player of stats.players) {
              if (player.player.id === currentUserId) {
                myStats = player;
              } else if (player.player.id === otherUserId) {
                otherStats = player;
              }
              if (myStats && otherStats) break;
            }
            if (!myStats || !otherStats) {
              continue;
            }
            const diffOlympic = myStats.total - otherStats.total;
            olympic.add(diffOlympic);
            break;
          }
          case RoundGameType.horse: {
            const stats = GameStatsService.calculateHorseStats(round, game, users);
            let myStats: typeof stats.players[0] | null = null;
            let otherStats: typeof stats.players[0] | null = null;
            for (const player of stats.players) {
              if (player.player.id === currentUserId) {
                myStats = player;
              } else if (player.player.id === otherUserId) {
                otherStats = player;
              }
              if (myStats && otherStats) break;
            }
            if (!myStats || !otherStats) {
              continue;
            }

            function segmentCounts(segment: { outcome: HorseOutcome; target: number; hasStroke: boolean } | undefined): boolean {
              if (!segment) return false;
              if (segment.target < 1) return false;
              if (!segment.hasStroke) return false;
              if (segment.outcome === HorseOutcome.pending) return false;
              return true;
            }

            let myWins = 0;
            let otherWins = 0;
            function evaluateSegment(
              mySegment: typeof myStats.front | undefined,
              otherSegment: typeof otherStats.front | undefined
            ) {
              const bothEligible = segmentCounts(mySegment) && segmentCounts(otherSegment);
              if (!bothEligible) return;
              if (mySegment!.outcome === HorseOutcome.win) {
                myWins++;
              }
              if (otherSegment!.outcome === HorseOutcome.win) {
                otherWins++;
              }
            }

            evaluateSegment(myStats.front, otherStats.front);
            evaluateSegment(myStats.back, otherStats.back);
            evaluateSegment(myStats.total, otherStats.total);

            horse.add(myWins - otherWins);
            break;
          }
          case RoundGameType.other:
            break;
        }
      }
    }

    return {
      oneVOne: oneVOne.toRecord(),
      sameTeam: sameTeam.toRecord(),
      oppositeTeam: oppositeTeam.toRecord(),
      skins: skins.toRecord(),
      olympic: olympic.toRecord(),
      horse: horse.toRecord(),
    };
  }
}

class HeadToHeadAccumulator {
  games = 0;
  wins = 0;
  losses = 0;
  ties = 0;
  netPoints = 0;

  add(diffForMe: number) {
    this.games++;
    this.netPoints += diffForMe;
    if (diffForMe > 0) {
      this.wins++;
    } else if (diffForMe < 0) {
      this.losses++;
    } else {
      this.ties++;
    }
  }

  toRecord(): HeadToHeadRecord {
    return {
      games: this.games,
      wins: this.wins,
      losses: this.losses,
      ties: this.ties,
      netPoints: this.netPoints,
    };
  }
}

class HeadToHeadScoreAccumulator {
  games = 0;
  wins = 0;
  losses = 0;
  ties = 0;
  netScore = 0;

  add(diff: number) {
    if (diff === 0) {
      this.games++;
      this.ties++;
      return;
    }

    this.games++;
    this.netScore += diff;
    if (diff > 0) {
      this.wins++;
    } else {
      this.losses++;
    }
  }

  toRecord(): HeadToHeadScoreRecord {
    return {
      games: this.games,
      wins: this.wins,
      losses: this.losses,
      ties: this.ties,
      netScore: this.netScore,
    };
  }
}

export const headToHeadService = new HeadToHeadService();
