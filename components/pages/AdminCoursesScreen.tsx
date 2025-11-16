'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { adminService, AdminCourseBundle } from '@/lib/services/adminService';
import { Scorecard } from '@/lib/models/scorecard';

export default function AdminCoursesScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const [bundles, setBundles] = useState<AdminCourseBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getCoursesWithScorecards();
      setBundles(data);
    } catch (e) {
      setError((e as Error).toString());
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
          <h1 className="text-xl font-semibold">Admin • Courses</h1>
        </div>
        <div className="p-4 text-error">
          <p className="font-medium">Failed to load admin data.</p>
          <p className="text-sm text-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold">Admin • Courses</h1>
      </div>

      <div className="p-4 space-y-6">
        {bundles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No courses available.</p>
        ) : (
          bundles.map((bundle) => (
            <div key={bundle.course.id} className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-bold mb-2">{bundle.course.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">Course ID: {bundle.course.id}</p>
              {bundle.scorecards.length === 0 ? (
                <p className="text-muted-foreground">No scorecards found.</p>
              ) : (
                <div className="space-y-2">
                  {bundle.scorecards.map((scorecard) => {
                    const allTeeboxes = [
                      ...(scorecard.backTeeboxes?.teeboxes || []),
                      ...(scorecard.forwardTeeboxes?.teeboxes || []),
                    ];
                    return (
                      <div key={scorecard.id} className="border-t border-border pt-2">
                        <p className="font-medium">{scorecard.name || 'Scorecard'}</p>
                        <p className="text-sm text-muted-foreground">
                          {allTeeboxes.length} teeboxes
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

