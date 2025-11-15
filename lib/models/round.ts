import { Timestamp } from 'firebase/firestore';
import { Course, courseFromMap } from './course';
import { AppUser, appUserFromMap } from './appUser';
import { Scorecard, scorecardFromMap, scorecardToMap, ScoreCell, ScoreCellKind } from './scorecard';

export interface HoleStats {
  fairway?: string;
  putts?: number;
  bunker?: number;
  hazard?: number;
}

export function holeStatsFromMap(m: any): HoleStats {
  if (!m) return {};
  return {
    fairway: m.fairway?.toString(),
    putts: typeof m.putts === 'number' ? m.putts : undefined,
    bunker: typeof m.bunker === 'number' ? m.bunker : undefined,
    hazard: typeof m.hazard === 'number' ? m.hazard : undefined,
  };
}

export function holeStatsToMap(stats: HoleStats): any {
  const result: any = {};
  if (stats.fairway !== undefined) result.fairway = stats.fairway;
  if (stats.putts !== undefined) result.putts = stats.putts;
  if (stats.bunker !== undefined) result.bunker = stats.bunker;
  if (stats.hazard !== undefined) result.hazard = stats.hazard;
  return result;
}

export function calculateGir(stats: HoleStats, score: number, par: number): boolean | null {
  if (stats.putts === undefined || stats.putts === 0) return null;
  const shotsToGreen = score - stats.putts;
  const requiredShots = par - 2;
  return shotsToGreen <= requiredShots;
}

export function isEmptyHoleStats(stats: HoleStats): boolean {
  return stats.fairway === undefined && stats.putts === undefined && stats.bunker === undefined && stats.hazard === undefined;
}

export function holeStatsCopyWith(stats: HoleStats, updates: Partial<HoleStats>): HoleStats {
  return {
    fairway: updates.fairway ?? stats.fairway,
    putts: updates.putts ?? stats.putts,
    bunker: updates.bunker ?? stats.bunker,
    hazard: updates.hazard ?? stats.hazard,
  };
}

export interface RoundGame {
  id: string;
  type: string;
  playerIds: string[];
  blueTeamIds: string[];
  redTeamIds: string[];
  handicapStrokes: Record<string, any>;
  holePoints: Record<string, any>;
  horseSettings: Record<string, Record<string, number>>;
  birdieMultiplier?: string;
  eagleMultiplier?: string;
  albatrossMultiplier?: string;
  holeInOneMultiplier?: string;
  scoreCountMode?: number;
  skinsMode?: number;
  maxSkins?: number;
  skinsStartingHole: number;
}

export interface RoundScorecard {
  holes: any[];
  par: any[];
  handicaps: any[];
  name: string;
}

export interface Round {
  id: string;
  course: Course;
  adminId: string;
  createdAt: Date;
  endedAt?: Date;
  deletedAt?: Date;
  memberIds: string[];
  games: RoundGame[];
  score: Record<string, Record<string, number | null>>;
  olympic?: Record<string, any>;
  scorecard: RoundScorecard;
  disableMemberEdit: boolean;
  version: string;
  scorecards: Scorecard[];
  userTeeboxes: Record<string, any>;
  stats: Record<string, Record<string, HoleStats>>;
  selectedScoreCardIds: string[];
  partyGameEnabled?: boolean;
  spinnerOptions: string[];
  isFinished: boolean;
}

// Helper functions
function toTimestamp(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function asMap(v: any): any {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function asListOfMap(v: any): any[] {
  if (!Array.isArray(v)) return [];
  return v.filter((e) => e && typeof e === 'object');
}

function parseStatsMap(v: any): Record<string, Record<string, HoleStats>> {
  if (!v || typeof v !== 'object') return {};
  const result: Record<string, Record<string, HoleStats>> = {};
  for (const [holeKey, userStatsMap] of Object.entries(v)) {
    if (typeof userStatsMap === 'object' && userStatsMap) {
      const parsedUserStats: Record<string, HoleStats> = {};
      for (const [userId, statsData] of Object.entries(userStatsMap)) {
        if (typeof statsData === 'object' && statsData) {
          parsedUserStats[userId] = holeStatsFromMap(statsData);
        }
      }
      result[holeKey] = parsedUserStats;
    }
  }
  return result;
}

function parseHorseSettings(v: any): Record<string, Record<string, number>> {
  if (!v || typeof v !== 'object') return {};
  const result: Record<string, Record<string, number>> = {};
  for (const [segmentKey, segmentValue] of Object.entries(v)) {
    if (typeof segmentValue === 'object' && segmentValue) {
      const parsedSegment: Record<string, number> = {};
      for (const [playerId, strokes] of Object.entries(segmentValue)) {
        if (typeof strokes === 'number') {
          parsedSegment[playerId] = strokes;
        } else if (typeof strokes === 'string') {
          const parsed = parseInt(strokes);
          if (!isNaN(parsed)) {
            parsedSegment[playerId] = parsed;
          }
        }
      }
      result[segmentKey] = parsedSegment;
    }
  }
  return result;
}

export function roundGameFromMap(m: any): RoundGame {
  return {
    id: (m?.id ?? '').toString(),
    type: (m?.type ?? '').toString(),
    playerIds: Array.isArray(m?.playerIds) ? m.playerIds.map((e: any) => e.toString()) : [],
    blueTeamIds: Array.isArray(m?.blueTeamIds) ? m.blueTeamIds.map((e: any) => e.toString()) : [],
    redTeamIds: Array.isArray(m?.redTeamIds) ? m.redTeamIds.map((e: any) => e.toString()) : [],
    handicapStrokes: asMap(m?.handicapStrokes),
    holePoints: asMap(m?.holePoints),
    horseSettings: parseHorseSettings(m?.horseSettings),
    birdieMultiplier: m?.birdieMultiplier?.toString(),
    eagleMultiplier: m?.eagleMultiplier?.toString(),
    albatrossMultiplier: m?.albatrossMultiplier?.toString(),
    holeInOneMultiplier: m?.holeInOneMultiplier?.toString(),
    scoreCountMode: typeof m?.scoreCountMode === 'number' ? m.scoreCountMode : (typeof m?.scoreCountMode === 'string' ? parseInt(m.scoreCountMode) : undefined),
    skinsMode: typeof m?.skinsMode === 'number' ? m.skinsMode : (typeof m?.skinsMode === 'string' ? parseInt(m.skinsMode) : undefined),
    maxSkins: typeof m?.maxSkins === 'number' ? m.maxSkins : (typeof m?.maxSkins === 'string' ? parseInt(m.maxSkins) : undefined),
    skinsStartingHole: typeof m?.skinsStartingHole === 'number' ? m.skinsStartingHole : (typeof m?.skinsStartingHole === 'string' ? parseInt(m.skinsStartingHole) || 1 : 1),
  };
}

export function roundGameToMap(game: RoundGame): any {
  const result: any = {
    id: game.id,
    type: game.type,
    playerIds: game.playerIds,
    blueTeamIds: game.blueTeamIds,
    redTeamIds: game.redTeamIds,
    handicapStrokes: game.handicapStrokes,
    holePoints: game.holePoints,
    skinsStartingHole: game.skinsStartingHole,
  };

  if (Object.keys(game.horseSettings).length > 0) {
    result.horseSettings = game.horseSettings;
  }
  if (game.birdieMultiplier) result.birdieMultiplier = game.birdieMultiplier;
  if (game.eagleMultiplier) result.eagleMultiplier = game.eagleMultiplier;
  if (game.albatrossMultiplier) result.albatrossMultiplier = game.albatrossMultiplier;
  if (game.holeInOneMultiplier) result.holeInOneMultiplier = game.holeInOneMultiplier;
  if (game.scoreCountMode !== undefined) result.scoreCountMode = game.scoreCountMode;
  if (game.skinsMode !== undefined) result.skinsMode = game.skinsMode;
  if (game.maxSkins !== undefined) result.maxSkins = game.maxSkins;

  return result;
}

export function roundGameCopyWith(game: RoundGame, updates: Partial<RoundGame>): RoundGame {
  return {
    id: updates.id ?? game.id,
    type: updates.type ?? game.type,
    playerIds: updates.playerIds ?? game.playerIds,
    blueTeamIds: updates.blueTeamIds ?? game.blueTeamIds,
    redTeamIds: updates.redTeamIds ?? game.redTeamIds,
    handicapStrokes: updates.handicapStrokes ?? game.handicapStrokes,
    holePoints: updates.holePoints ?? game.holePoints,
    horseSettings: updates.horseSettings ?? game.horseSettings,
    birdieMultiplier: updates.birdieMultiplier ?? game.birdieMultiplier,
    eagleMultiplier: updates.eagleMultiplier ?? game.eagleMultiplier,
    albatrossMultiplier: updates.albatrossMultiplier ?? game.albatrossMultiplier,
    holeInOneMultiplier: updates.holeInOneMultiplier ?? game.holeInOneMultiplier,
    scoreCountMode: updates.scoreCountMode ?? game.scoreCountMode,
    skinsMode: updates.skinsMode ?? game.skinsMode,
    maxSkins: updates.maxSkins ?? game.maxSkins,
    skinsStartingHole: updates.skinsStartingHole ?? game.skinsStartingHole,
  };
}

export function roundScorecardFromMap(m: any): RoundScorecard {
  return {
    holes: asListOfMap(m?.holes),
    par: asListOfMap(m?.par),
    handicaps: asListOfMap(m?.handicaps),
    name: (m?.name ?? '').toString(),
  };
}

export function roundScorecardToMap(scorecard: RoundScorecard): any {
  return {
    holes: scorecard.holes,
    par: scorecard.par,
    handicaps: scorecard.handicaps,
    name: scorecard.name,
  };
}

export function roundFromFirestore(m: any, id: string): Round {
  const rawScore = asMap(m?.score);
  const parsedScore: Record<string, Record<string, number | null>> = {};
  for (const [hole, playersMap] of Object.entries(rawScore)) {
    if (typeof playersMap === 'object' && playersMap) {
      parsedScore[hole] = {};
      for (const [k, v] of Object.entries(playersMap)) {
        parsedScore[hole][k] = typeof v === 'number' ? v : null;
      }
    }
  }

  const createdAt = toTimestamp(m?.createdAt) ?? new Date();
  const endedAt = toTimestamp(m?.endedAt);
  const scorecard = roundScorecardFromMap(asMap(m?.scorecard));
  const memberIds = Array.isArray(m?.memberIds) ? m.memberIds.map((e: any) => e.toString()) : [];
  
  // Calculate isFinished
  let isFinished = false;
  if (endedAt) {
    isFinished = true;
  } else {
    const now = new Date();
    if (now.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000) {
      isFinished = true;
    } else {
      // Check if all holes are scored by all members
      const totalHoles = scorecard.par.filter((p: any) => p.kind === 'hole').length;
      let allScored = true;
      for (const memberId of memberIds) {
        for (let i = 1; i <= totalHoles; i++) {
          const holeKey = String(i);
          const holeScores = parsedScore[holeKey];
          const value = holeScores?.[memberId] ?? 0;
          if (value === 0) {
            allScored = false;
            break;
          }
        }
        if (!allScored) break;
      }
      isFinished = allScored;
    }
  }

  const round: Round = {
    id,
    course: courseFromMap(asMap(m?.course)),
    adminId: (m?.adminId ?? '').toString(),
    createdAt,
    endedAt: endedAt || undefined,
    deletedAt: toTimestamp(m?.deletedAt) || undefined,
    memberIds,
    games: asListOfMap(m?.games).map(roundGameFromMap),
    score: parsedScore,
    olympic: asMap(m?.olympic),
    scorecard,
    disableMemberEdit: m?.disableMemberEdit ?? false,
    version: (m?.version ?? '').toString(),
    scorecards: asListOfMap(m?.scorecards).map(scorecardFromMap),
    userTeeboxes: asMap(m?.userTeeboxes),
    stats: parseStatsMap(m?.stats),
    selectedScoreCardIds: Array.isArray(m?.selectedScoreCardIds)
      ? m.selectedScoreCardIds.map((e: any) => e.toString())
      : [],
    partyGameEnabled: m?.partyGameEnabled !== undefined ? (typeof m.partyGameEnabled === 'boolean' ? m.partyGameEnabled : undefined) : undefined,
    spinnerOptions: Array.isArray(m?.spinnerOptions) ? m.spinnerOptions.map((e: any) => e.toString()) : [],
    isFinished,
  };

  return round;
}

// Helper function to convert ScoreCell to map
function scoreCellToMap(cell: ScoreCell): any {
  const result: any = { kind: cell.kind };
  if (cell.value) result.value = cell.value;
  if (cell.yards !== undefined) result.yards = cell.yards;
  return result;
}

// Round helper functions
export function roundGamePlayers(round: Round, gameId: string, users: AppUser[]): AppUser[] {
  const game = round.games.find((g) => g.id === gameId);
  if (!game) return [];
  return users.filter((u) => game.playerIds.includes(u.id));
}

export function roundGameRedTeam(round: Round, gameId: string, users: AppUser[]): AppUser[] {
  const game = round.games.find((g) => g.id === gameId);
  if (!game) return [];
  return users.filter((u) => game.redTeamIds.includes(u.id));
}

export function roundGameBlueTeam(round: Round, gameId: string, users: AppUser[]): AppUser[] {
  const game = round.games.find((g) => g.id === gameId);
  if (!game) return [];
  return users.filter((u) => game.blueTeamIds.includes(u.id));
}

// Helper function to parse string to int with fallback
function asInt(v: string | null | undefined, fallback: number = 9): number {
  if (!v) return fallback;
  const parsed = parseInt(v.trim());
  return isNaN(parsed) ? fallback : parsed;
}

// Return the positions of HOLE cells in a row (skip side cells)
function holePositions(row: ScoreCell[]): number[] {
  const pos: number[] = [];
  for (let i = 0; i < row.length; i++) {
    if (row[i].kind === ScoreCellKind.hole) pos.push(i);
  }
  return pos;
}

// Helper to filter holes/par/handicaps to only include holes with valid par values
interface FilteredHoles {
  holes: ScoreCell[];
  par: ScoreCell[];
  handicaps: ScoreCell[];
}

function filterHolesWithValidPar(
  holes: ScoreCell[],
  par: ScoreCell[],
  handicaps: ScoreCell[]
): FilteredHoles {
  const filteredHoles: ScoreCell[] = [];
  const filteredPar: ScoreCell[] = [];
  const filteredHandicaps: ScoreCell[] = [];

  for (let i = 0; i < holes.length; i++) {
    const holeCell = holes[i];

    // Keep side cells (Out, In, Total) as-is
    if (holeCell.kind === ScoreCellKind.side) {
      filteredHoles.push(holeCell);
      if (i < par.length) {
        filteredPar.push(par[i]);
      }
      if (i < handicaps.length) {
        filteredHandicaps.push(handicaps[i]);
      }
      continue;
    }

    // For hole cells, only include if par exists and is not null/empty
    if (holeCell.kind === ScoreCellKind.hole) {
      if (i < par.length) {
        const parCell = par[i];
        const parValue = parCell.value;

        if (parValue && parValue.trim().length > 0) {
          filteredHoles.push(holeCell);
          filteredPar.push(parCell);
          if (i < handicaps.length) {
            filteredHandicaps.push(handicaps[i]);
          } else {
            // Add empty handicap cell if missing to maintain alignment
            filteredHandicaps.push({ kind: ScoreCellKind.unknown });
          }
        }
      }
    }
  }

  return { holes: filteredHoles, par: filteredPar, handicaps: filteredHandicaps };
}

// Build handicaps for combined scorecards using USGA standard
function buildUSGAHandicapsForCombinedScorecards(
  firstHandicaps: ScoreCell[],
  secondHandicaps: ScoreCell[]
): ScoreCell[] {
  // Clone to avoid mutating originals
  const first = [...firstHandicaps];
  const second = [...secondHandicaps];

  // Get hole positions (skip side cells)
  const firstPos = holePositions(first);
  const secondPos = holePositions(second);

  // Sort positions by their current handicap (ascending = hardest first)
  firstPos.sort((a, b) => asInt(first[a].value) - asInt(first[b].value));
  secondPos.sort((a, b) => asInt(second[a].value) - asInt(second[b].value));

  // Calculate total number of holes
  const totalHoles = firstPos.length + secondPos.length;

  // Build lists of stroke numbers: odd for first, even for second
  const firstStrokes: number[] = [];
  const secondStrokes: number[] = [];

  // Distribute strokes 1 to (totalHoles * 2)
  for (let i = 1; i <= totalHoles * 2; i++) {
    if (i % 2 === 1 && firstStrokes.length < firstPos.length) {
      firstStrokes.push(i);
    } else if (i % 2 === 0 && secondStrokes.length < secondPos.length) {
      secondStrokes.push(i);
    }

    // Early exit if both are filled
    if (firstStrokes.length >= firstPos.length && secondStrokes.length >= secondPos.length) {
      break;
    }
  }

  // Assign strokes to first scorecard (odd strokes)
  for (let i = 0; i < firstPos.length && i < firstStrokes.length; i++) {
    const idx = firstPos[i];
    first[idx] = {
      kind: first[idx].kind,
      value: firstStrokes[i].toString(),
      yards: first[idx].yards,
    };
  }

  // Assign strokes to second scorecard (even strokes)
  for (let i = 0; i < secondPos.length && i < secondStrokes.length; i++) {
    const idx = secondPos[i];
    second[idx] = {
      kind: second[idx].kind,
      value: secondStrokes[i].toString(),
      yards: second[idx].yards,
    };
  }

  // Return combined (sides preserved as-is)
  return [...first, ...second];
}

// Build a new handicap row for 18 holes using odd/even distribution
export function build18HandicapsDistributed(frontRow: ScoreCell[], backRow: ScoreCell[]): ScoreCell[] {
  const frontOrder = [1, 3, 5, 7, 9, 11, 13, 15, 17];
  const backOrder = [2, 4, 6, 8, 10, 12, 14, 16, 18];

  // Clone so we don't mutate original input
  const f = [...frontRow];
  const b = [...backRow];

  // Get hole positions (skip side cells)
  const fPos = holePositions(f);
  const bPos = holePositions(b);

  // Sort positions by their current per-nine handicap (1..9) ascending (1 = hardest)
  fPos.sort((a, c) => asInt(f[a].value) - asInt(f[c].value));
  bPos.sort((a, c) => asInt(b[a].value) - asInt(b[c].value));

  // Assign odd/even stroke indexes back into the same positions
  for (let i = 0; i < fPos.length && i < 9; i++) {
    const idx = fPos[i];
    f[idx] = {
      kind: f[idx].kind,
      value: frontOrder[i].toString(),
      yards: f[idx].yards,
    };
  }
  for (let i = 0; i < bPos.length && i < 9; i++) {
    const idx = bPos[i];
    b[idx] = {
      kind: b[idx].kind,
      value: backOrder[i].toString(),
      yards: b[idx].yards,
    };
  }

  // Return concatenated rows (sides preserved as-is)
  return [...f, ...b];
}

// Complex scorecard V2 processing
export function roundScorecardV2(round: Round): RoundScorecard {
  const selected = round.selectedScoreCardIds
    .map((id) => round.scorecards.find((sc) => sc.id === id))
    .filter((sc): sc is Scorecard => sc !== undefined);

  // Handle two scorecards: renumber holes and recalculate handicaps
  if (selected.length === 2) {
    const firstSc = selected[0];
    const secondSc = selected[1];

    // Count holes in first scorecard (only holes with valid par values)
    const firstPar = firstSc.backTeeboxes.par ?? firstSc.forwardTeeboxes.par;
    const firstHoles = firstSc.holes?.cells ?? [];
    const firstParCells = firstPar?.cells ?? [];
    let firstHoleCount = 0;
    for (let i = 0; i < firstHoles.length; i++) {
      if (firstHoles[i].kind === ScoreCellKind.hole && i < firstParCells.length) {
        const parValue = firstParCells[i].value;
        if (parValue && parValue.trim().length > 0) {
          firstHoleCount++;
        }
      }
    }
    const lastHoleOfFirst = firstHoleCount;

    // Renumber holes in second scorecard
    const secondHolesCells = secondSc.holes?.cells ?? [];
    const renumberedSecondHoles = secondHolesCells.map((cell) => {
      if (cell.kind === ScoreCellKind.hole) {
        const currentHole = parseInt(cell.value ?? '') || 0;
        const newHole = lastHoleOfFirst + currentHole;
        return {
          kind: cell.kind,
          value: newHole.toString(),
          yards: cell.yards,
        };
      }
      return cell; // Keep side cells as-is
    });

    // Combine holes
    const combinedHoles: ScoreCell[] = [...(firstSc.holes?.cells ?? []), ...renumberedSecondHoles];

    // Combine par (prefer backTeeboxes, fallback to forwardTeeboxes)
    const secondPar = secondSc.backTeeboxes.par ?? secondSc.forwardTeeboxes.par;
    const combinedPar: ScoreCell[] = [
      ...(firstPar?.cells ?? []),
      ...(secondPar?.cells ?? []),
    ];

    // Recalculate handicaps using USGA standard
    const firstHandicaps = firstSc.backTeeboxes.handicaps ?? firstSc.forwardTeeboxes.handicaps;
    const secondHandicaps = secondSc.backTeeboxes.handicaps ?? secondSc.forwardTeeboxes.handicaps;
    const combinedHandicaps = buildUSGAHandicapsForCombinedScorecards(
      firstHandicaps?.cells ?? [],
      secondHandicaps?.cells ?? []
    );

    // If there are two 'total' side cells, remove the first occurrence
    const totalIndexes: number[] = [];
    for (let i = 0; i < combinedHoles.length; i++) {
      const cell = combinedHoles[i];
      if (cell.kind === ScoreCellKind.side && cell.value?.toLowerCase() === 'total') {
        totalIndexes.push(i);
        if (totalIndexes.length >= 2) break;
      }
    }
    if (totalIndexes.length >= 2) {
      // Combine the values of both totals in the PAR row
      const firstTotalIdx = totalIndexes[0];
      const secondTotalIdx = totalIndexes[1];

      if (firstTotalIdx >= 0 && firstTotalIdx < combinedPar.length && secondTotalIdx >= 0 && secondTotalIdx < combinedPar.length) {
        const a = parseInt(combinedPar[firstTotalIdx].value ?? '');
        const b = parseInt(combinedPar[secondTotalIdx].value ?? '');
        if (!isNaN(a) && !isNaN(b)) {
          const sum = a + b;
          const keep = combinedPar[secondTotalIdx];
          combinedPar[secondTotalIdx] = {
            kind: keep.kind,
            value: sum.toString(),
            yards: keep.yards,
          };
        }
      }

      // Remove the first 'total' and align PAR and HANDICAP rows
      const removeAt = totalIndexes[0];
      if (removeAt >= 0 && removeAt < combinedHoles.length) {
        combinedHoles.splice(removeAt, 1);
      }
      if (removeAt >= 0 && removeAt < combinedPar.length) {
        combinedPar.splice(removeAt, 1);
      }
      if (removeAt >= 0 && removeAt < combinedHandicaps.length) {
        combinedHandicaps.splice(removeAt, 1);
      }
    }

    // Normalize duplicate 'Out'/'In' labels
    const sideOIIndexes: number[] = [];
    let countOut = 0;
    let countIn = 0;
    for (let i = 0; i < combinedHoles.length; i++) {
      const c = combinedHoles[i];
      if (c.kind === ScoreCellKind.side) {
        const v = (c.value ?? '').toLowerCase();
        if (v === 'out' || v === 'in') {
          sideOIIndexes.push(i);
          if (v === 'out') countOut++;
          if (v === 'in') countIn++;
        }
      }
    }
    if (sideOIIndexes.length >= 2 && (countOut >= 2 || countIn >= 2)) {
      for (let k = 0; k < sideOIIndexes.length; k++) {
        const idx = sideOIIndexes[k];
        const keep = combinedHoles[idx];
        const normalized = k % 2 === 0 ? 'Out' : 'In';
        combinedHoles[idx] = {
          kind: keep.kind,
          value: normalized,
          yards: keep.yards,
        };
      }
    }

    // Filter to only include holes with valid par values
    const filtered = filterHolesWithValidPar(combinedHoles, combinedPar, combinedHandicaps);

    let name = round.selectedScoreCardIds
      .map((id) => round.scorecards.find((sc) => sc.id === id)?.name)
      .filter((n): n is string => n !== undefined)
      .join(' / ');
    name = name || round.course.name;

    return {
      holes: filtered.holes.map(scoreCellToMap),
      par: filtered.par.map(scoreCellToMap),
      handicaps: filtered.handicaps.map(scoreCellToMap),
      name,
    };
  }

  // Single scorecard or more than 2 - filter each scorecard before expanding
  const filteredHoles: ScoreCell[] = [];
  const filteredPar: ScoreCell[] = [];
  const filteredHandicaps: ScoreCell[] = [];

  for (const scorecard of selected) {
    // Get par row (prefer backTeeboxes, fallback to forwardTeeboxes)
    const parRow = scorecard.backTeeboxes.par ?? scorecard.forwardTeeboxes.par;
    const handicapsRow = scorecard.backTeeboxes.handicaps ?? scorecard.forwardTeeboxes.handicaps;

    const scorecardHoles = scorecard.holes?.cells ?? [];
    const scorecardPar = parRow?.cells ?? [];
    const scorecardHandicaps = handicapsRow?.cells ?? [];

    // Filter this scorecard
    const filtered = filterHolesWithValidPar(scorecardHoles, scorecardPar, scorecardHandicaps);

    filteredHoles.push(...filtered.holes);
    filteredPar.push(...filtered.par);
    filteredHandicaps.push(...filtered.handicaps);
  }

  let name = round.selectedScoreCardIds
    .map((id) => round.scorecards.find((sc) => sc.id === id)?.name)
    .filter((n): n is string => n !== undefined)
    .join(' / ');
  name = name || round.course.name;

  return {
    holes: filteredHoles.map(scoreCellToMap),
    par: filteredPar.map(scoreCellToMap),
    handicaps: filteredHandicaps.map(scoreCellToMap),
    name,
  };
}

export function roundScorecardBridge(round: Round): RoundScorecard {
  if (round.version === '2') {
    return roundScorecardV2(round);
  }
  return round.scorecard;
}

export function roundGetPlayableHoles(round: Round): number[] {
  const holes: number[] = [];
  const scorecard = roundScorecardBridge(round);
  for (const entry of scorecard.holes) {
    const value = entry?.value?.toString();
    if (value) {
      const holeNum = parseInt(value);
      if (!isNaN(holeNum) && holeNum > 0) {
        holes.push(holeNum);
      }
    }
  }
  return holes;
}

export function roundIsRoundCompleteWithAllScores(round: Round, userId: string): boolean {
  const playableHoles = roundGetPlayableHoles(round);
  for (const hole of playableHoles) {
    const holeKey = String(hole);
    const s = round.score[holeKey]?.[userId];
    if (s === undefined || s === null || s <= 0) {
      return false;
    }
  }
  return true;
}

export function roundColorForTeam(index: number): string {
  const colors = [
    '#DC143C', // Crimson Red
    '#1E90FF', // Dodger Blue
    '#32CD32', // Lime Green
    '#FF8C00', // Dark Orange
    '#9932CC', // Dark Orchid Purple
    '#FF1493', // Deep Pink
    '#20B2AA', // Light Sea Green
    '#8B4513', // Saddle Brown
    '#4169E1', // Royal Blue
    '#FFD700', // Gold
  ];
  return colors[index] || '#000000'; // Black default
}

export function roundColorForPlayer(round: Round, id: string): string {
  const index = round.memberIds.indexOf(id);
  return roundColorForTeam(index);
}

export function roundIsMember(round: Round, userId: string): boolean {
  return round.memberIds.includes(userId);
}

export function roundUser(users: AppUser[], id: string): AppUser | undefined {
  return users.find((u) => u.id === id);
}

export function roundToFirestore(round: Round): any {
  const result: any = {
    course: round.course,
    adminId: round.adminId,
    createdAt: round.createdAt.toISOString(),
    memberIds: round.memberIds,
    games: round.games.map(roundGameToMap),
    score: round.score,
    scorecard: roundScorecardToMap(round.scorecard),
    version: round.version,
    scorecards: round.scorecards.map(scorecardToMap),
    userTeeboxes: round.userTeeboxes,
    selectedScoreCardIds: round.selectedScoreCardIds,
    disableMemberEdit: round.disableMemberEdit,
    skinsStartingHole: round.games.length > 0 ? round.games[0].skinsStartingHole : 1,
  };

  if (round.endedAt) result.endedAt = round.endedAt.toISOString();
  if (round.deletedAt) result.deletedAt = round.deletedAt.toISOString();
  if (round.olympic) result.olympic = round.olympic;
  if (Object.keys(round.stats).length > 0) {
    result.stats = Object.entries(round.stats).reduce((acc, [hole, userStatsMap]) => {
      acc[hole] = Object.entries(userStatsMap).reduce((userAcc, [userId, stats]) => {
        userAcc[userId] = holeStatsToMap(stats);
        return userAcc;
      }, {} as Record<string, any>);
      return acc;
    }, {} as Record<string, any>);
  }
  if (round.partyGameEnabled !== undefined) result.partyGameEnabled = round.partyGameEnabled;
  if (round.spinnerOptions.length > 0) result.spinnerOptions = round.spinnerOptions;

  return result;
}

export function roundCopyWith(round: Round, updates: Partial<Round>): Round {
  return {
    id: updates.id ?? round.id,
    course: updates.course ?? round.course,
    adminId: updates.adminId ?? round.adminId,
    createdAt: updates.createdAt ?? round.createdAt,
    endedAt: updates.endedAt ?? round.endedAt,
    deletedAt: updates.deletedAt ?? round.deletedAt,
    memberIds: updates.memberIds ?? round.memberIds,
    games: updates.games ?? round.games,
    score: updates.score ?? round.score,
    olympic: updates.olympic ?? round.olympic,
    scorecard: updates.scorecard ?? round.scorecard,
    disableMemberEdit: updates.disableMemberEdit ?? round.disableMemberEdit,
    version: updates.version ?? round.version,
    scorecards: updates.scorecards ?? round.scorecards,
    userTeeboxes: updates.userTeeboxes ?? round.userTeeboxes,
    stats: updates.stats ?? round.stats,
    selectedScoreCardIds: updates.selectedScoreCardIds ?? round.selectedScoreCardIds,
    partyGameEnabled: updates.partyGameEnabled ?? round.partyGameEnabled,
    spinnerOptions: updates.spinnerOptions ?? round.spinnerOptions,
    isFinished: updates.isFinished ?? round.isFinished,
  };
}

