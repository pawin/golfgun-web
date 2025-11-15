import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { SpinnerEntry, spinnerEntryFromFirestore } from '../models/spinnerEntry';

export class SpinnerService {
  private readonly optionsDocId = '_options';

  private collection(roundId: string) {
    return collection(db, 'rounds', roundId, 'spinner');
  }

  private optionsDoc(roundId: string) {
    return doc(this.collection(roundId), this.optionsDocId);
  }

  private legacyOptionsDoc(roundId: string) {
    return doc(collection(db, 'rounds', roundId, 'spinnerConfig'), 'options');
  }

  private sanitizeOptions(raw: any[] | null | undefined): string[] {
    if (!raw || !Array.isArray) return [];
    return raw
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
  }

  watchEntries(roundId: string, callback: (entries: SpinnerEntry[]) => void): () => void {
    const q = query(this.collection(roundId), orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const entries: SpinnerEntry[] = [];
      snapshot.docs.forEach((docSnap) => {
        if (docSnap.id === this.optionsDocId) return;
        const data = docSnap.data();
        if (data.option) {
          entries.push(spinnerEntryFromFirestore(data, docSnap.id));
        }
      });
      callback(entries);
    });
  }

  async logSpin({
    roundId,
    userId,
    userName,
    option,
  }: {
    roundId: string;
    userId: string;
    userName: string;
    option: string;
  }): Promise<void> {
    const payload = {
      userId,
      userName,
      option,
      createdAt: serverTimestamp(),
    };

    await addDoc(this.collection(roundId), payload);
  }

  watchOptions(roundId: string, callback: (options: string[]) => void): () => void {
    const docRef = this.optionsDoc(roundId);

    return onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.data();
      const options = this.sanitizeOptions(data?.options);
      callback(options);
    });
  }

  async fetchOptions(roundId: string): Promise<string[]> {
    const snapshot = await getDoc(this.optionsDoc(roundId));
    let options = this.sanitizeOptions(snapshot.data()?.options);

    if (options.length > 0) {
      return options;
    }

    // Fallback to legacy location and migrate
    const legacy = await getDoc(this.legacyOptionsDoc(roundId));
    options = this.sanitizeOptions(legacy.data()?.options);

    if (options.length > 0) {
      await setDoc(this.optionsDoc(roundId), {
        options,
        kind: 'options',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return options;
  }

  async setOptions(roundId: string, options: string[]): Promise<void> {
    const sanitized = this.sanitizeOptions(options);
    await setDoc(
      this.optionsDoc(roundId),
      {
        options: sanitized,
        kind: 'options',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async ensureOptions(roundId: string, defaults: string[]): Promise<void> {
    const sanitizedDefaults = this.sanitizeOptions(defaults);
    if (sanitizedDefaults.length === 0) return;
    const existing = await this.fetchOptions(roundId);
    if (existing.length > 0) return;
    await setDoc(
      this.optionsDoc(roundId),
      {
        options: sanitizedDefaults,
        kind: 'options',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export const spinnerService = new SpinnerService();

