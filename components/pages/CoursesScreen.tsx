'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { courseService } from '@/lib/services/courseService';
import { Course } from '@/lib/models/course';

export default function CoursesScreen() {
  const t = useTranslations();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userPosition, setUserPosition] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    loadCourses();
    initLocation();
  }, []);

  const initLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition(position);
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await courseService.getAllCoursesOrderByName();
      setCourses(items);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery) return true;
    return course.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedCourses = [...filteredCourses];
  if (userPosition) {
    sortedCourses.sort((a, b) => {
      const distA = distanceKm(
        userPosition.coords.latitude,
        userPosition.coords.longitude,
        a.lat,
        a.lng
      );
      const distB = distanceKm(
        userPosition.coords.latitude,
        userPosition.coords.longitude,
        b.lat,
        b.lng
      );
      return distA - distB;
    });
  }

  const handleCourseClick = (course: Course) => {
    router.push(`/start-round?courseId=${course.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">{t('courses')}</h1>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchCourseByName')}
          className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-error">
            {t('failedToLoadCourses')}
            <br />
            {error.message}
          </div>
        ) : sortedCourses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t('noCoursesFound')}</div>
        ) : (
          <div className="space-y-1">
            {sortedCourses.map((course) => {
              let subtitle = '';
              if (userPosition) {
                const km = distanceKm(
                  userPosition.coords.latitude,
                  userPosition.coords.longitude,
                  course.lat,
                  course.lng
                );
                subtitle = ` • ${km.toFixed(1)} ${t('kilometers')}`;
              }

              return (
                <button
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-muted flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{course.name}</div>
                    {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

