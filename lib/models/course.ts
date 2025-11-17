import { Timestamp } from 'firebase/firestore';

export interface Course {
  id: string;
  name: string;
  lat: number;
  lng: number;
  createdAt?: Date;
}

export function courseFromFirestore(data: any, id: string): Course {
  return {
    id,
    name: (data.name ?? '').toString(),
    lat: typeof data.lat === 'number' ? data.lat : 0.0,
    lng: typeof data.lng === 'number' ? data.lng : 0.0,
    createdAt: parseDate(data.createdAt),
  };
}

export function courseFromMap(m: any): Course {
  return {
    id: (m.id ?? '').toString(),
    name: (m.name ?? '').toString(),
    lat: typeof m.lat === 'number' ? m.lat : 0.0,
    lng: typeof m.lng === 'number' ? m.lng : 0.0,
    createdAt: parseDate(m.createdAt),
  };
}

export function courseToFirestore(course: Course): any {
  const { Timestamp: FirestoreTimestamp, serverTimestamp } = require('firebase/firestore');
  return {
    name: course.name,
    lat: course.lat,
    lng: course.lng,
    createdAt: course.createdAt
      ? FirestoreTimestamp.fromDate(course.createdAt)
      : serverTimestamp(),
  };
}

export function courseToMap(course: Course): any {
  return {
    id: course.id,
    name: course.name,
    lat: course.lat,
    lng: course.lng,
    ...(course.createdAt && { createdAt: course.createdAt.toISOString() }),
  };
}

function parseDate(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

