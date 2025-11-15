'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';
import { getInitials, colorFromName } from '@/lib/utils/validator';

interface RoundCardViewProps {
  round: Round;
  currentUserId: string;
  users: Record<string, AppUser>;
  onMemberTap?: (member: AppUser) => void;
}

export default function RoundCardView({
  round,
  currentUserId,
  users,
  onMemberTap,
}: RoundCardViewProps) {
  const t = useTranslations();
  const router = useRouter();

  const total = computeUserTotal(round, currentUserId);
  const thru = computeThruHole(round);

  const handleClick = () => {
    router.push(`/rounds/${round.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{round.course.name}</h3>
          <SubtitleLine round={round} thru={thru} />
        </div>
        {total > 0 && (
          <div className="ml-2 px-2 py-1 bg-green-600 text-white rounded-lg font-bold text-lg">
            {total}
          </div>
        )}
      </div>
      <MembersGrid
        round={round}
        users={users}
        onMemberTap={onMemberTap}
      />
    </div>
  );
}

function SubtitleLine({ round, thru }: { round: Round; thru: number }) {
  const t = useTranslations();
  const locale = useLocale();
  // Map app locale to Intl locale format (e.g., 'en' -> 'en-US', 'th' -> 'th-TH')
  const intlLocale = locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined;

  if (round.isFinished) {
    return (
      <p className="text-sm text-gray-600">
        {DateFormatter.format(round.createdAt, AppDateFormatStyle.medium, intlLocale)}
      </p>
    );
  }

  return (
    <p className="text-sm text-green-600 font-semibold">
      {thru > 0 ? `${t('thru')} ${thru}` : `${t('thru')} ${t('dash')}`}
    </p>
  );
}

function MembersGrid({
  round,
  users,
  onMemberTap,
}: {
  round: Round;
  users: Record<string, AppUser>;
  onMemberTap?: (member: AppUser) => void;
}) {
  const members = round.memberIds;
  if (members.length === 0) return null;

  const maxColumns = Math.min(5, members.length);
  const gridColsClass = maxColumns === 1 ? 'grid-cols-1' :
                        maxColumns === 2 ? 'grid-cols-2' :
                        maxColumns === 3 ? 'grid-cols-3' :
                        maxColumns === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className={`grid ${gridColsClass} gap-2`}>
      {members.map((memberId) => {
        const member = users[memberId];
        if (!member) {
          return (
            <div key={memberId} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 text-xs">?</span>
              </div>
              <p className="text-xs mt-1 text-center truncate w-full">...</p>
            </div>
          );
        }

        const bgColor = colorForPlayer(memberId, round.memberIds);
        const initials = getInitials(member.name);

        return (
          <div
            key={memberId}
            onClick={(e) => {
              e.stopPropagation();
              onMemberTap?.(member);
            }}
            className="flex flex-col items-center"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: bgColor }}
            >
              {member.pictureUrl ? (
                <img
                  src={member.pictureUrl}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <p className="text-xs mt-1 text-center truncate w-full">{member.name}</p>
          </div>
        );
      })}
    </div>
  );
}

function computeUserTotal(round: Round, userId: string): number {
  if (!userId) return 0;
  let total = 0;
  for (const entry of Object.entries(round.score)) {
    const v = entry[1][userId];
    if (v != null && v > 0) {
      total += v;
    }
  }
  return total;
}

function computeThruHole(round: Round): number {
  let thru = 0;
  for (const [holeKey, playerScores] of Object.entries(round.score)) {
    const holeNum = parseInt(holeKey) || 0;
    if (holeNum === 0) continue;
    const anyScored = Object.values(playerScores).some((v) => (v ?? 0) > 0);
    if (anyScored && holeNum > thru) thru = holeNum;
  }
  return thru;
}

function colorForPlayer(userId: string, memberIds: string[]): string {
  const index = memberIds.indexOf(userId);
  const colors = [
    '#DC143C', // Crimson Red
    '#1E90FF', // Dodger Blue
    '#32CD32', // Lime Green
    '#FF8C00', // Dark Orange
    '#9932CC', // Dark Orchid Purple
    '#FF1493', // Deep Pink
    '#20B2AA', // Light Sea Green
    '#8B4513', // Saddle Brown
    '#4169E1', // Royal Blue
    '#FFD700', // Gold
  ];
  return colors[index % colors.length] || '#000000';
}

