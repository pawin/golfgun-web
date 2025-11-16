'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Round, roundIsFinished, roundColorForPlayer } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { DateFormatter, AppDateFormatStyle } from '@/lib/utils/dateFormatter';
import { getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface RoundCardViewProps {
  round: Round;
  currentUserId: string;
  users: Record<string, AppUser>;
}

export default function RoundCardView({
  round,
  currentUserId,
  users,
}: RoundCardViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const total = computeUserTotal(round, currentUserId);
  const thru = computeThruHole(round);

  const handleClick = () => {
    router.push(`/${locale}/rounds/${round.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{round.course.name}</h3>
          <SubtitleLine round={round} thru={thru} />
        </div>
        {total > 0 && (
          <div className="ml-2 px-2 py-1 bg-[color:var(--green)] text-[color:var(--fairway-foreground)] rounded-lg font-bold text-lg">
            {total}
          </div>
        )}
      </div>
      <MembersGrid
        round={round}
        users={users}
      />
    </div>
  );
}

function SubtitleLine({ round, thru }: { round: Round; thru: number }) {
  const t = useTranslations();
  const locale = useLocale();
  // Map app locale to Intl locale format (e.g., 'en' -> 'en-US', 'th' -> 'th-TH')
  const intlLocale = locale === 'th' ? 'th-TH' : locale === 'en' ? 'en-US' : undefined;

  if (roundIsFinished(round)) {
    return (
      <p className="text-sm text-muted-foreground">
        {DateFormatter.format(round.createdAt, AppDateFormatStyle.medium, intlLocale)}
      </p>
    );
  }

  return (
    <p className="text-sm text-primary font-semibold">
      {thru > 0 ? `${t('thru')} ${thru}` : `${t('thru')} ${t('dash')}`}
    </p>
  );
}

function MembersGrid({
  round,
  users,
}: {
  round: Round;
  users: Record<string, AppUser>;
}) {
  const members = round.memberIds;
  if (members.length === 0) return null;

  const maxColumns = Math.min(5, members.length);
  const gridColsClass = maxColumns === 1 ? 'grid-cols-1' :
                        maxColumns === 2 ? 'grid-cols-2' :
                        maxColumns === 3 ? 'grid-cols-3' :
                        maxColumns === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className={`grid ${gridColsClass} gap-2 justify-items-stretch w-full`}>
      {members.map((memberId) => {
        const member = users[memberId];
        if (!member) {
          return (
            <div key={memberId} className="flex flex-col items-center w-full">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xs">?</span>
              </div>
              <p className="text-xs mt-1 text-center truncate w-full">...</p>
            </div>
          );
        }

        const bgColor = roundColorForPlayer(round, memberId);
        const initials = getInitials(member.name);

        return (
          <div
            key={memberId}
            className="flex flex-col items-center w-full"
          >
            <Avatar className="w-12 h-12">
              {member.pictureUrl ? (
                <AvatarImage src={member.pictureUrl} alt={member.name} />
              ) : null}
              <AvatarFallback
                style={{ backgroundColor: bgColor }}
                className="text-white font-bold text-sm"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
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
  // Cycle through chart tokens to avoid hard-coded hex colors
  const chartVars = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
    'var(--color-chart-6)',
    'var(--color-chart-7)',
    'var(--color-chart-8)',
  ];
  return chartVars[index % chartVars.length] || 'var(--color-foreground)';
}

