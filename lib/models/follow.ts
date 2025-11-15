import { Timestamp } from 'firebase/firestore';

export interface Follow {
  userId: string;
  followingId: string;
  createdAt?: Date;
}

export function followFromFirestore(data: any): Follow {
  return {
    userId: (data.userId ?? '').toString(),
    followingId: (data.followingId ?? '').toString(),
    createdAt: parseDate(data.createdAt),
  };
}

export function followToFirestore(follow: Follow): any {
  const { Timestamp: FirestoreTimestamp, serverTimestamp } = require('firebase/firestore');
  return {
    userId: follow.userId,
    followingId: follow.followingId,
    createdAt: follow.createdAt
      ? FirestoreTimestamp.fromDate(follow.createdAt)
      : serverTimestamp(),
  };
}

export function followToJson(follow: Follow): any {
  return {
    userId: follow.userId,
    followingId: follow.followingId,
    createdAt: follow.createdAt?.toISOString(),
  };
}

function parseDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

