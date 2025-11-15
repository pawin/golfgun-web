import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Course, courseFromFirestore } from '../models/course';

export class CourseService {
  async getAllCoursesOrderByName(): Promise<Course[]> {
    const q = query(collection(db, 'courses'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => courseFromFirestore(doc.data(), doc.id));
  }

  async getCourse(id: string): Promise<Course | null> {
    const docRef = doc(db, 'courses', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return courseFromFirestore(docSnap.data(), docSnap.id);
  }
}

export const courseService = new CourseService();

