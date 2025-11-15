import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Friendship, FriendshipStatus, friendshipStatusFromString, friendshipFromFirestore } from '../models/friendship';
import { AppUser } from '../models/appUser';
import { userService } from './userService';
import { orderBy, limit, startAt, endAt } from 'firebase/firestore';

export class FriendService {
  private get collection() {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    return collection(db, 'friendships');
  }

  private docId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  async getFriendship(userId: string, otherUserId: string): Promise<Friendship | null> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    if (!userId || !otherUserId || userId === otherUserId) return null;
    const docId = this.docId(userId, otherUserId);
    const docRef = doc(db, 'friendships', docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return friendshipFromFirestore(docSnap as DocumentSnapshot);
  }

  async sendFriendRequest({
    fromUserId,
    toUserId,
  }: {
    fromUserId: string;
    toUserId: string;
  }): Promise<Friendship> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    if (!fromUserId || !toUserId) {
      throw new Error('Invalid user ids');
    }
    if (fromUserId === toUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const docId = this.docId(fromUserId, toUserId);
    const docRef = doc(db, 'friendships', docId);

    await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(docRef);
      const now = serverTimestamp();

      if (!docSnap.exists()) {
        tx.set(docRef, {
          userIds: [fromUserId, toUserId].sort(),
          initiatorId: fromUserId,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });
        return;
      }

      const data = docSnap.data();
      const status = data?.status?.toString() ?? 'pending';
      const initiatorId = data?.initiatorId?.toString() ?? '';

      if (status === 'accepted') {
        return;
      }

      if (status === 'pending' && initiatorId === fromUserId) {
        return;
      }

      if (status === 'pending' && initiatorId !== fromUserId) {
        tx.update(docRef, {
          status: 'accepted',
          acceptedAt: now,
          updatedAt: now,
        });
        return;
      }

      tx.set(docRef, {
        userIds: [fromUserId, toUserId].sort(),
        initiatorId: fromUserId,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    });

    const friendship = await this.getFriendship(fromUserId, toUserId);
    if (!friendship) {
      throw new Error('Failed to create friend request');
    }
    return friendship;
  }

  async cancelFriendRequest({
    fromUserId,
    toUserId,
  }: {
    fromUserId: string;
    toUserId: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const friendship = await this.getFriendship(fromUserId, toUserId);
    if (!friendship) return;
    if (!friendship.isOutgoing(fromUserId)) {
      throw new Error('Cannot cancel this request');
    }
    const docRef = doc(db, 'friendships', friendship.id);
    await deleteDoc(docRef);
  }

  async acceptFriendRequest({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const docId = this.docId(currentUserId, otherUserId);
    const docRef = doc(db, 'friendships', docId);

    await runTransaction(db, async (tx) => {
      const docSnap = await tx.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Friend request not found');
      }

      const data = docSnap.data();
      const initiatorId = (data?.initiatorId ?? '').toString();
      const status = (data?.status ?? 'pending').toString();

      if (status === 'accepted') {
        return;
      }

      if (status !== 'pending' || initiatorId === currentUserId) {
        throw new Error('Invalid request state');
      }

      tx.update(docRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async declineFriendRequest({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const friendship = await this.getFriendship(currentUserId, otherUserId);
    if (!friendship) return;
    if (!friendship.isIncoming(currentUserId)) {
      throw new Error('Cannot decline this request');
    }
    const docRef = doc(db, 'friendships', friendship.id);
    await deleteDoc(docRef);
  }

  async removeFriend({
    userId1,
    userId2,
  }: {
    userId1: string;
    userId2: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const docId = this.docId(userId1, userId2);
    const docRef = doc(db, 'friendships', docId);
    await deleteDoc(docRef);
  }

  async getFriendshipsForUser(userId: string): Promise<Friendship[]> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const q = query(this.collection, where('userIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => friendshipFromFirestore(docSnap as DocumentSnapshot));
  }

  async loadOverview(userId: string): Promise<FriendOverview> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    if (!userId) {
      return {
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
      };
    }

    const q = query(
      this.collection,
      where('userIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const friendships = querySnapshot.docs.map((docSnap) => 
      friendshipFromFirestore(docSnap as DocumentSnapshot)
    );

    const otherIds = friendships
      .map((friendship) => friendship.otherUserId(userId))
      .filter((id) => id !== userId);
    
    const uniqueOtherIds = Array.from(new Set(otherIds));
    const users = await userService.getUsersByIds(uniqueOtherIds);

    const entries: FriendshipWithUser[] = [];
    for (const friendship of friendships) {
      const otherUserId = friendship.otherUserId(userId);
      const otherUser = users[otherUserId];
      if (!otherUser) continue;
      entries.push({
        friendship,
        otherUser,
      });
    }

    const friends: FriendshipWithUser[] = [];
    const incoming: FriendshipWithUser[] = [];
    const outgoing: FriendshipWithUser[] = [];

    for (const entry of entries) {
      if (entry.friendship.status === FriendshipStatus.accepted) {
        friends.push(entry);
      } else if (entry.friendship.isIncoming(userId)) {
        incoming.push(entry);
      } else if (entry.friendship.isOutgoing(userId)) {
        outgoing.push(entry);
      }
    }

    return {
      friends,
      incomingRequests: incoming,
      outgoingRequests: outgoing,
    };
  }

  async searchUsers({
    query: searchQuery,
    excludeUserId,
    limitCount = 20,
  }: {
    query: string;
    excludeUserId: string;
    limitCount?: number;
  }): Promise<Record<string, AppUser>> {
    if (typeof window === 'undefined') {
      throw new Error('FriendService can only be used on the client side');
    }
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return {};

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', 'in', ['member', 'temporary']),
      orderBy('name'),
      startAt(trimmed),
      endAt(`${trimmed}\uf8ff`),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const users: Record<string, AppUser> = {};

    for (const docSnap of querySnapshot.docs) {
      if (excludeUserId && docSnap.id === excludeUserId) continue;
      const data = docSnap.data();
      users[docSnap.id] = {
        id: docSnap.id,
        name: (data?.name ?? '').toString(),
        email: (data?.email ?? '').toString(),
        pictureUrl: data?.pictureUrl?.toString(),
        registered: data?.registered === true,
        createdAt: data?.createdAt?.toDate?.() || new Date(),
        language: (data?.language ?? 'th').toString(),
      };
    }

    return users;
  }
}

export interface FriendshipWithUser {
  friendship: Friendship;
  otherUser: AppUser;
}

export interface FriendOverview {
  friends: FriendshipWithUser[];
  incomingRequests: FriendshipWithUser[];
  outgoingRequests: FriendshipWithUser[];
}

export const friendService = new FriendService();

