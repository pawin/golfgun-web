import { Timestamp } from 'firebase/firestore';

export interface SpinnerEntry {
  id: string;
  userId: string;
  userName: string;
  option: string;
  createdAt?: Date;
}

export function spinnerEntryFromFirestore(data: any, id: string): SpinnerEntry {
  return {
    id,
    userId: (data.userId ?? '').toString(),
    userName: (data.userName ?? '').toString(),
    option: (data.option ?? '').toString(),
    createdAt: toTimestamp(data.createdAt),
  };
}

export function spinnerEntryToMap(entry: SpinnerEntry): any {
  return {
    userId: entry.userId,
    userName: entry.userName,
    option: entry.option,
    ...(entry.createdAt && { createdAt: entry.createdAt }),
  };
}

function toTimestamp(value: any): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

