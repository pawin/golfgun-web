'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { adminService } from '@/lib/services/adminService';
import { Round } from '@/lib/models/round';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';

export default function AdminRoundsScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getRecentRounds(20);
      setRounds(data);
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
          <h1 className="text-xl font-semibold">{t('adminRecentRounds')}</h1>
        </div>
        <div className="p-4 text-error">
          <p>{t('adminFailedToLoadRounds')}</p>
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={loadRounds}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            {t('adminRetry')}
          </button>
        </div>
      </div>
    );
  }

  // Map app locale to Intl locale format (e.g., 'en' -> 'en-US', 'th' -> 'th-TH')
  const intlLocale = locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined;

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold">{t('adminRecentRounds')}</h1>
      </div>

      <div className="p-4 space-y-3">
        {rounds.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t('adminNoRecentRounds')}</p>
        ) : (
          rounds.map((round) => {
            const courseName = round.course.name;
            const courseInitial = courseName.length > 0 ? courseName[0].toUpperCase() : '?';
            const memberCount = round.memberIds.length;

            return (
              <div
                key={round.id}
                onClick={() => router.push(`/${locale}/rounds/${round.id}`)}
                className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {courseInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {courseName || t('adminUnknownCourse')}
                    </h3>
                    <p className="text-sm text-muted-foreground">{memberCount} {t('adminPlayers')}</p>
                    <p className="text-sm text-muted-foreground">
                      {DateFormatter.format(round.createdAt, AppDateFormatStyle.medium, intlLocale)}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">{t('adminRoundId')}: {round.id}</p>
                      <p className="text-xs text-muted-foreground">{t('adminAdminId')}: {round.adminId}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

