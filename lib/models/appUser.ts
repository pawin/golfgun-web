import { Timestamp } from 'firebase/firestore';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
  updatedAt?: Date;
  registered: boolean;
  role?: string;
  language: string;
}

export function appUserFromFirestore(data: any, id: string): AppUser {
  return {
    id,
    email: (data.email ?? '').toString(),
    name: (data.name ?? '').toString(),
    pictureUrl: data.pictureUrl?.toString(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    lastLoginAt: data.lastLoginAt instanceof Timestamp ? data.lastLoginAt.toDate() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    registered: data.registered ?? false,
    role: data.role?.toString(),
    language: (data.language ?? 'th').toString(),
  };
}

export function appUserFromMap(m: any): AppUser {
  return {
    id: (m.id ?? '').toString(),
    email: (m.email ?? '').toString(),
    name: (m.name ?? '').toString(),
    pictureUrl: m.pictureUrl?.toString(),
    createdAt: toDate(m.createdAt),
    lastLoginAt: toDate(m.lastLoginAt),
    updatedAt: toDate(m.updatedAt),
    registered: m.registered ?? false,
    role: m.role?.toString(),
    language: (m.language ?? 'th').toString(),
  };
}

export function appUserToMap(user: AppUser): any {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    ...(user.pictureUrl && { pictureUrl: user.pictureUrl }),
    ...(user.createdAt && { createdAt: user.createdAt.toISOString() }),
    ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt.toISOString() }),
    ...(user.updatedAt && { updatedAt: user.updatedAt.toISOString() }),
    registered: user.registered,
    ...(user.role && { role: user.role }),
    language: user.language,
  };
}

export function appUserToFirestore(user: AppUser): any {
  const { Timestamp: FirestoreTimestamp } = require('firebase/firestore');
  return {
    id: user.id,
    name: user.name,
    ...(user.pictureUrl && { pictureUrl: user.pictureUrl }),
    ...(user.createdAt && { createdAt: FirestoreTimestamp.fromDate(user.createdAt) }),
    ...(user.lastLoginAt && { lastLoginAt: FirestoreTimestamp.fromDate(user.lastLoginAt) }),
    ...(user.updatedAt && { updatedAt: FirestoreTimestamp.fromDate(user.updatedAt) }),
    registered: user.registered,
    ...(user.role && { role: user.role }),
    language: user.language,
  };
}

function toDate(v: any): Date | undefined {
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === 'string') {
    const parsed = new Date(v);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

export function emptyAppUser(): AppUser {
  return { id: '', name: '', email: '', registered: false, language: 'th' };
}

