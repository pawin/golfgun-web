'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { roundColorForPlayer } from '@/lib/models/round';

interface GamePlayerSelectorProps {
  round: Round;
  users: Record<string, AppUser>;
  initialPlayerIds: string[];
  onPlayerIdsChanged: (playerIds: string[]) => void;
}

export default function GamePlayerSelector({
  round,
  users,
  initialPlayerIds,
  onPlayerIdsChanged,
}: GamePlayerSelectorProps) {
  const t = useTranslations();
  const [playerIds, setPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    setPlayerIds([...initialPlayerIds]);
  }, [initialPlayerIds]);

  const togglePlayer = (playerId: string) => {
    const newPlayerIds = playerIds.includes(playerId)
      ? playerIds.filter((id) => id !== playerId)
      : [...playerIds, playerId];
    setPlayerIds(newPlayerIds);
    onPlayerIdsChanged(newPlayerIds);
  };

  const members = round.memberIds
    .map((id) => users[id])
    .filter((u): u is AppUser => u !== undefined);

  return (
    <div>
      <h3 className="text-base font-bold mb-3">{t('players')}</h3>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {members.map((member) => {
          const isSelected = playerIds.includes(member.id);
          const bgColor = isSelected
            ? roundColorForPlayer(round, member.id)
            : '#e5e7eb';

          return (
            <div
              key={member.id}
              onClick={() => togglePlayer(member.id)}
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: bgColor }}
              >
                {member.name && member.name.length > 0
                  ? member.name[0].toUpperCase()
                  : '?'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{member.name}</div>
              </div>
              {isSelected ? (
                <svg
                  className="w-6 h-6"
                  style={{ color: roundColorForPlayer(round, member.id) }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

