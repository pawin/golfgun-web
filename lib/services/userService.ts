import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, query, where, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/config';
import { AppUser, appUserFromFirestore, appUserToFirestore, appUserToMap } from '../models/appUser';

export class UserService {
  // In-memory cache for fetched users during the session
  private userCache: Record<string, AppUser> = {};

  invalidateUserCache(userId: string): void {
    if (!userId) return;
    delete this.userCache[userId];
  }

  async signOut(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    // Clear user cache on sign out
    this.userCache = {};
    await firebaseSignOut(auth);
  }

  async signInOrSignUp({
    email,
    password,
    isLogin,
    language = 'th',
  }: {
    email: string;
    password: string;
    isLogin: boolean;
    language?: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    let userCredential;
    if (isLogin) {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await this.updateLastLogin(userCredential.user.uid);
      }
    } else {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        const aUser: AppUser = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: this.generateFallbackName(userCredential.user.email || ''),
          language,
          registered: false,
        };
        await this.createIfMissing(aUser);
      }
    }
  }

  private async createIfMissing(user: AppUser): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    const ref = doc(db, 'users', user.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const unameRef = doc(db, 'usernames', user.name.toLowerCase());
      await runTransaction(db, async (tx) => {
        const existing = await tx.get(unameRef);
        if (existing.exists()) {
          throw new Error('Username already taken');
        }
        tx.set(unameRef, {
          uid: user.id,
          createdAt: serverTimestamp(),
        });
      });
      await setDoc(ref, {
        id: user.id,
        email: user.email,
        name: user.name.toLowerCase(),
        role: 'member',
        language: user.language,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        registered: true,
      });
    } else {
      await this.updateLastLogin(user.id);
    }
  }

  async createGuest(name: string): Promise<string | null> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    const id = `guest_${doc(collection(db, 'users')).id}`;
    const ref = doc(db, 'users', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id,
        email: '',
        name: `${name} (Guest)`.toLowerCase(),
        role: 'guest',
        language: 'th',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        registered: false,
      });
      return id;
    }
    return null;
  }

  private async updateLastLogin(userId: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    await setDoc(doc(db, 'users', userId), { lastLoginAt: serverTimestamp() }, { merge: true });
  }

  private generateFallbackName(email: string): string {
    // Extract the local part of the email (before @)
    const localPart = email.split('@')[0].toLowerCase();
    // Generate a random 2-digit number from 00 to 99
    const random = Math.floor(Math.random() * 100);
    const suffix = random.toString().padStart(2, '0');
    return `${localPart}_${suffix}`;
  }

  async updateProfile({
    username,
    imageBytes,
    language,
  }: {
    username: string;
    imageBytes?: Uint8Array;
    language?: string;
  }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    try {
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      const currentUser = currentUserDoc.exists() ? currentUserDoc.data() : null;
      const currentUsername = currentUser?.name ?? '';

      if (username !== currentUsername) {
        const unameRef = doc(db, 'usernames', username.toLowerCase());
        await runTransaction(db, async (tx) => {
          const existing = await tx.get(unameRef);
          if (existing.exists()) {
            throw new Error('Username already taken');
          }
          tx.set(unameRef, {
            uid: user.uid,
            createdAt: serverTimestamp(),
          });
          if (currentUsername) {
            const oldRef = doc(db, 'usernames', currentUsername);
            tx.delete(oldRef);
          }
        });
      }

      let imageUrl: string | undefined;
      if (imageBytes && imageBytes.length > 0) {
        // In browser, resize and crop would be handled client-side
        const storageRef = ref(storage, `profile_pictures/${user.uid}.jpg`);
        await uploadBytes(storageRef, imageBytes, { contentType: 'image/jpeg' });
        imageUrl = await getDownloadURL(storageRef);
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: username.toLowerCase(),
          ...(imageUrl && { pictureUrl: imageUrl }),
          ...(language && { language }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Invalidate and refresh the user cache to reflect the updated username
      this.invalidateUserCache(user.uid);
      await this.getUserById(user.uid);
    } catch (e) {
      throw e;
    }
  }

  async getUserById(userId: string): Promise<AppUser | null> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    if (!userId) return null;
    
    // Check cache first
    if (this.userCache[userId]) {
      return this.userCache[userId];
    }
    
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const user = appUserFromFirestore(snap.data(), snap.id);
    // Update cache
    this.userCache[userId] = user;
    return user;
  }

  async getUsersByIds(userIds: string[]): Promise<Record<string, AppUser>> {
    if (typeof window === 'undefined') {
      throw new Error('UserService can only be used on the client side');
    }
    if (userIds.length === 0) return {};
    
    const uniqueIds = Array.from(new Set(userIds));
    const result: Record<string, AppUser> = {};
    const missingIds: string[] = [];

    // Check cache first
    for (const id of uniqueIds) {
      if (this.userCache[id]) {
        result[id] = this.userCache[id];
      } else {
        missingIds.push(id);
      }
    }

    // Fetch missing users
    if (missingIds.length > 0) {
      const chunkSize = 10;
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        const chunk = missingIds.slice(i, i + chunkSize);
        const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const user = appUserFromFirestore(doc.data(), doc.id);
          result[doc.id] = user;
          // Update cache
          this.userCache[doc.id] = user;
        });
      }
    }

    return result;
  }
}

export const userService = new UserService();

