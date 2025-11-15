import { Timestamp } from 'firebase/firestore';

export enum FriendshipStatus {
  pending = 'pending',
  accepted = 'accepted',
}

export interface Friendship {
  id: string;
  userIds: string[];
  initiatorId: string;
  status: FriendshipStatus;
  createdAt?: Date;
  updatedAt?: Date;
  acceptedAt?: Date;
  isPending: boolean;
  isIncoming: (userId: string) => boolean;
  isOutgoing: (userId: string) => boolean;
  otherUserId: (userId: string) => string;
}

export function friendshipStatusFromString(value: string): FriendshipStatus {
  switch (value) {
    case 'accepted':
      return FriendshipStatus.accepted;
    case 'pending':
    default:
      return FriendshipStatus.pending;
  }
}

export function friendshipStatusToString(status: FriendshipStatus): string {
  return status;
}

export function friendshipFromFirestore(docSnap: { id: string; data(): any; exists?: () => boolean }): Friendship {
  const data = docSnap.data() || {};
  const rawUserIds = (data.userIds || []).map((e: any) => e.toString());
  const statusString = (data.status ?? 'pending').toString();
  const status = friendshipStatusFromString(statusString);
  
  const friendship: Friendship = {
    id: docSnap.id,
    userIds: rawUserIds,
    initiatorId: (data.initiatorId ?? '').toString(),
    status,
    createdAt: toDate(data.createdAt) || undefined,
    updatedAt: toDate(data.updatedAt) || undefined,
    acceptedAt: toDate(data.acceptedAt) || undefined,
    get isPending() {
      return this.status === FriendshipStatus.pending;
    },
    isIncoming(userId: string) {
      if (!this.isPending) return false;
      return this.initiatorId !== userId;
    },
    isOutgoing(userId: string) {
      if (!this.isPending) return false;
      return this.initiatorId === userId;
    },
    otherUserId(userId: string) {
      if (this.userIds.length !== 2) return userId;
      if (this.userIds[0] === userId) return this.userIds[1];
      return this.userIds[0];
    },
  };
  
  return friendship;
}

function toDate(value: any): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

