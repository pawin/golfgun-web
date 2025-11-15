import { collection, query, orderBy, limit, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Course } from '../models/course';
import { Round, roundFromFirestore } from '../models/round';
import { Scorecard } from '../models/scorecard';
import { courseService } from './courseService';
import { scorecardService, TeeboxUpdatePayload } from './scorecardService';

export interface AdminCourseBundle {
  course: Course;
  scorecards: Scorecard[];
}

export interface AdminTeeboxUpdate {
  groupKey: string;
  index: number;
  rating?: number;
  slope?: number;
}

export class AdminService {
  async getCoursesWithScorecards(): Promise<AdminCourseBundle[]> {
    const courses = await courseService.getAllCoursesOrderByName();

    const bundles = await Promise.all(
      courses.map(async (course) => {
        const scorecards = await scorecardService.getByCourseId(course.id);
        return { course, scorecards };
      })
    );

    return bundles;
  }

  async updateTeeboxValues({
    scorecardId,
    updates,
  }: {
    scorecardId: string;
    updates: AdminTeeboxUpdate[];
  }): Promise<void> {
    if (updates.length === 0) return;

    const payloads: TeeboxUpdatePayload[] = updates.map((update) => ({
      groupKey: update.groupKey,
      index: update.index,
      rating: update.rating,
      slope: update.slope,
    }));

    await scorecardService.updateTeeboxValues(scorecardId, payloads);
  }

  async updateCourseName({ courseId, name }: { courseId: string; name: string }): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('AdminService can only be used on the client side');
    }
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Course name cannot be empty');
    }

    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, { name: trimmed });
  }

  async getRecentRounds(limitCount: number = 20): Promise<Round[]> {
    if (typeof window === 'undefined') {
      throw new Error('AdminService can only be used on the client side');
    }
    const col = collection(db, 'rounds');
    const q = query(
      col,
      where('version', '==', '2'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    const rounds: Round[] = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const round = roundFromFirestore(data, docSnap.id);
      rounds.push(round);
    }
    return rounds;
  }
}

export const adminService = new AdminService();
