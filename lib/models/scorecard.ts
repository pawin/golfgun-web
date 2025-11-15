import { Timestamp } from 'firebase/firestore';

export enum ScoreCellKind {
  hole = 'hole',
  side = 'side',
  unknown = 'unknown',
}

export interface ScoreCell {
  kind: ScoreCellKind;
  value?: string;
  yards?: number;
}

export interface ScoreRow {
  kind: string;
  rowId: string;
  title: string;
  cellCount: number;
  isEmpty: boolean;
  cells: ScoreCell[];
}

export interface TeeboxRow {
  kind: string;
  rowId: string;
  name: string;
  color: string;
  rating?: number;
  slope?: number;
  totalYardsOverride?: number;
  cellCount: number;
  isEmpty: boolean;
  cells: ScoreCell[];
}

export interface ScoreGroup {
  par?: ScoreRow;
  handicaps?: ScoreRow;
  teeboxes: TeeboxRow[];
}

export interface Scorecard {
  id: string;
  name: string;
  courseId: string;
  modified?: Date;
  averageScores?: ScoreRow;
  golfshotHandicaps?: ScoreRow;
  holes?: ScoreRow;
  backTeeboxes: ScoreGroup;
  forwardTeeboxes: ScoreGroup;
}

// Helper functions
function numOrNull(v: any): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const parsed = parseFloat(v);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function asMap(v: any): any {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function asListOfMap(v: any): any[] {
  if (!Array.isArray(v)) return [];
  return v.filter((e) => e && typeof e === 'object');
}

function cellKindOf(k: string): ScoreCellKind {
  switch ((k ?? '').toLowerCase()) {
    case 'hole':
      return ScoreCellKind.hole;
    case 'side':
      return ScoreCellKind.side;
    default:
      return ScoreCellKind.unknown;
  }
}

export function scoreCellFromMap(m: any): ScoreCell {
  return {
    kind: cellKindOf(m?.kind),
    value: m?.value != null ? m.value.toString() : undefined,
    yards: numOrNull(m?.yards) ?? undefined,
  };
}

export function scoreRowFromMap(m: any): ScoreRow {
  const cells = asListOfMap(m?.cells).map(scoreCellFromMap);
  return {
    kind: (m?.kind ?? '').toString(),
    rowId: (m?.rowId ?? '').toString(),
    title: (m?.title ?? '').toString(),
    cellCount: numOrNull(m?.cellCount) ?? cells.length,
    isEmpty: typeof m?.isEmpty === 'boolean' ? m.isEmpty : false,
    cells,
  };
}

export function teeboxRowFromMap(m: any): TeeboxRow {
  const cells = asListOfMap(m?.cells).map(scoreCellFromMap);
  return {
    kind: (m?.kind ?? '').toString(),
    rowId: (m?.rowId ?? '').toString(),
    name: (m?.name ?? '').toString(),
    color: (m?.color ?? '').toString(),
    rating: numOrNull(m?.rating) ?? undefined,
    slope: numOrNull(m?.slope) ?? undefined,
    totalYardsOverride: numOrNull(m?.totalYards) ?? undefined,
    cellCount: numOrNull(m?.cellCount) ?? cells.length,
    isEmpty: typeof m?.isEmpty === 'boolean' ? m.isEmpty : false,
    cells,
  };
}

export function scoreGroupFromMap(m: any): ScoreGroup {
  if (!m) return { teeboxes: [] };
  return {
    par: asMap(m.par) ? scoreRowFromMap(asMap(m.par)) : undefined,
    handicaps: asMap(m.handicaps) ? scoreRowFromMap(asMap(m.handicaps)) : undefined,
    teeboxes: asListOfMap(m.teeboxes).map(teeboxRowFromMap),
  };
}

export function scorecardFromFirestore(m: any, id: string): Scorecard {
  return {
    id,
    name: (m?.name ?? '').toString(),
    courseId: (m?.courseId ?? '').toString(),
    modified: toDate(m?.modified),
    averageScores: asMap(m?.scorecard?.averageScores)
      ? scoreRowFromMap(asMap(m.scorecard.averageScores))
      : undefined,
    golfshotHandicaps: asMap(m?.scorecard?.golfshotHandicaps)
      ? scoreRowFromMap(asMap(m.scorecard.golfshotHandicaps))
      : undefined,
    holes: asMap(m?.scorecard?.holes) ? scoreRowFromMap(asMap(m.scorecard.holes)) : undefined,
    backTeeboxes: scoreGroupFromMap(asMap(m?.scorecard?.backTeeboxes)),
    forwardTeeboxes: scoreGroupFromMap(asMap(m?.scorecard?.forwardTeeboxes)),
  };
}

export function scorecardFromMap(m: any): Scorecard {
  return {
    id: (m?.id ?? '').toString(),
    name: (m?.name ?? '').toString(),
    courseId: (m?.courseId ?? '').toString(),
    modified: toDate(m?.modified),
    averageScores: asMap(m?.averageScores) ? scoreRowFromMap(asMap(m.averageScores)) : undefined,
    golfshotHandicaps: asMap(m?.golfshotHandicaps)
      ? scoreRowFromMap(asMap(m.golfshotHandicaps))
      : undefined,
    holes: asMap(m?.holes) ? scoreRowFromMap(asMap(m.holes)) : undefined,
    backTeeboxes: scoreGroupFromMap(asMap(m?.backTeeboxes)),
    forwardTeeboxes: scoreGroupFromMap(asMap(m?.forwardTeeboxes)),
  };
}

export function scorecardToMap(scorecard: Scorecard): any {
  return {
    id: scorecard.id,
    name: scorecard.name,
    courseId: scorecard.courseId,
    ...(scorecard.modified && { modified: scorecard.modified.toISOString() }),
    ...(scorecard.averageScores && { averageScores: scoreRowToMap(scorecard.averageScores) }),
    ...(scorecard.golfshotHandicaps && {
      golfshotHandicaps: scoreRowToMap(scorecard.golfshotHandicaps),
    }),
    ...(scorecard.holes && { holes: scoreRowToMap(scorecard.holes) }),
    ...(hasScoreGroupData(scorecard.backTeeboxes) && {
      backTeeboxes: scoreGroupToMap(scorecard.backTeeboxes),
    }),
    ...(hasScoreGroupData(scorecard.forwardTeeboxes) && {
      forwardTeeboxes: scoreGroupToMap(scorecard.forwardTeeboxes),
    }),
  };
}

function scoreCellToMap(cell: ScoreCell): any {
  return {
    kind: cell.kind,
    value: cell.value ?? '', // Always include value, default to empty string if null/undefined
    ...(cell.yards !== undefined && { yards: cell.yards }),
  };
}

function scoreRowToMap(row: ScoreRow): any {
  return {
    kind: row.kind,
    rowId: row.rowId,
    title: row.title,
    cellCount: row.cellCount,
    isEmpty: row.isEmpty,
    cells: row.cells.map(scoreCellToMap),
  };
}

function teeboxRowToMap(teebox: TeeboxRow): any {
  return {
    kind: teebox.kind,
    rowId: teebox.rowId,
    name: teebox.name,
    color: teebox.color,
    ...(teebox.rating !== undefined && { rating: teebox.rating }),
    ...(teebox.slope !== undefined && { slope: teebox.slope }),
    ...(teebox.totalYardsOverride !== undefined && { totalYards: teebox.totalYardsOverride }),
    cellCount: teebox.cellCount,
    isEmpty: teebox.isEmpty,
    cells: teebox.cells.map(scoreCellToMap),
  };
}

function scoreGroupToMap(group: ScoreGroup): any {
  return {
    ...(group.par && { par: scoreRowToMap(group.par) }),
    ...(group.handicaps && { handicaps: scoreRowToMap(group.handicaps) }),
    ...(group.teeboxes.length > 0 && {
      teeboxes: group.teeboxes.map(teeboxRowToMap),
    }),
  };
}

function hasScoreGroupData(group: ScoreGroup): boolean {
  return !!(group.par || group.handicaps || group.teeboxes.length > 0);
}
