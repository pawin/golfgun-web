import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Scorecard, scorecardFromFirestore } from '../models/scorecard';

export interface TeeboxUpdatePayload {
  groupKey: string;
  index: number;
  rating?: number;
  slope?: number;
}

export class ScorecardService {
  private collection = collection(db, 'scorecards');

  async getByCourseId(courseId: string): Promise<Scorecard[]> {
    const q = query(this.collection, where('courseId', '==', courseId));
    const querySnapshot = await getDocs(q);

    const list = querySnapshot.docs.map((docSnap) =>
      scorecardFromFirestore(docSnap.data(), docSnap.id)
    );

    // Sort client-side by name (case-insensitive)
    list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return list;
  }

  watchByCourseId(courseId: string, callback: (scorecards: Scorecard[]) => void): () => void {
    const q = query(this.collection, where('courseId', '==', courseId));

    return onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map((docSnap) =>
        scorecardFromFirestore(docSnap.data(), docSnap.id)
      );
      list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      callback(list);
    });
  }

  async getById(id: string): Promise<Scorecard | null> {
    const docRef = doc(db, 'scorecards', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return scorecardFromFirestore(docSnap.data(), docSnap.id);
  }

  async getFirstByCourseId(courseId: string): Promise<Scorecard | null> {
    const list = await this.getByCourseId(courseId);
    return list.length > 0 ? list[0] : null;
  }

  async updateTeeboxValues(
    scorecardId: string,
    updates: TeeboxUpdatePayload[]
  ): Promise<void> {
    if (updates.length === 0) return;

    const docRef = doc(db, 'scorecards', scorecardId);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      if (!snap.exists()) {
        throw new Error(`Scorecard ${scorecardId} not found`);
      }

      const rootData = snap.data() || {};
      const scorecardMap = { ...(rootData.scorecard || {}) };
      const sectionCache: Record<string, any> = {};

      const cloneSection = (key: string): any => {
        if (sectionCache[key]) {
          return sectionCache[key];
        }

        const existing = scorecardMap[key];
        if (!existing || typeof existing !== 'object') return null;

        const clone = { ...existing };
        const rawTeeboxes = clone.teeboxes || [];
        const clonedTeeboxes = Array.isArray(rawTeeboxes)
          ? rawTeeboxes.map((tee: any) => (typeof tee === 'object' ? { ...tee } : tee))
          : [];

        clone.teeboxes = clonedTeeboxes;
        sectionCache[key] = clone;
        return clone;
      };

      for (const update of updates) {
        const section = cloneSection(update.groupKey);
        if (!section || !Array.isArray(section.teeboxes)) continue;

        const teebox = section.teeboxes[update.index];
        if (!teebox || typeof teebox !== 'object') continue;

        const updatedTee = { ...teebox };
        if (update.rating !== undefined) {
          updatedTee.rating = update.rating;
        }
        if (update.slope !== undefined) {
          updatedTee.slope = update.slope;
        }
        section.teeboxes[update.index] = updatedTee;
      }

      for (const key of Object.keys(sectionCache)) {
        scorecardMap[key] = sectionCache[key];
      }

      tx.update(docRef, {
        scorecard: scorecardMap,
        updatedAt: serverTimestamp(),
      });
    });
  }
}

export const scorecardService = new ScorecardService();

