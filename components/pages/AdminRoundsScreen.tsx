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
      const data = await adminService.getRecentRounds({ limit: 20 });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-xl font-semibold">Admin • Recent Rounds</h1>
        </div>
        <div className="p-4 text-red-600">
          <p>Failed to load rounds.</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadRounds}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatter = new DateFormatter(AppDateFormatStyle.medium);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-semibold flex-1">Admin • Recent Rounds</h1>
      </div>

      <div className="p-4 space-y-3">
        {rounds.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No recent rounds found.</p>
        ) : (
          rounds.map((round) => {
            const courseName = round.course.name;
            const courseInitial = courseName.length > 0 ? courseName[0].toUpperCase() : '?';
            const memberCount = round.memberIds.length;

            return (
              <div
                key={round.id}
                onClick={() => router.push(`/${locale}/rounds/${round.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    {courseInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {courseName || 'Unknown course'}
                    </h3>
                    <p className="text-sm text-gray-600">{memberCount} players</p>
                    <p className="text-sm text-gray-600">
                      {formatter.format(round.createdAt)}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">Round ID: {round.id}</p>
                      <p className="text-xs text-gray-500">Admin ID: {round.adminId}</p>
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

