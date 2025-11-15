'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { friendService } from '@/lib/services/friendService';
import { getInitials, colorFromName } from '@/lib/utils/validator';

interface AddPlayersDialogProps {
  round: Round;
  currentUserId: string;
  onClose: () => void;
  onShare: () => Promise<void>;
  onAddGuest: () => void;
  onInvite: (userIds: string[]) => Promise<void>;
}

export default function AddPlayersDialog({
  round,
  currentUserId,
  onClose,
  onShare,
  onAddGuest,
  onInvite,
}: AddPlayersDialogProps) {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Record<string, AppUser>>({});
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const existingMemberIds = useMemo(() => new Set(round.memberIds), [round.memberIds]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await friendService.searchUsers({
          query: trimmed,
          excludeUserId: currentUserId,
          limitCount: 10,
        });

        const filtered = Object.values(results)
          .filter((user) => !existingMemberIds.has(user.id))
          .sort((a, b) => a.name.localeCompare(b.name));

        setSearchResults(filtered);
      } catch (e) {
        console.error('Search error:', e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, currentUserId, existingMemberIds]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleToggleSelection = (user: AppUser) => {
    setSelectedUsers((prev) => {
      const updated = { ...prev };
      if (updated[user.id]) {
        delete updated[user.id];
      } else {
        updated[user.id] = user;
      }
      return updated;
    });
  };

  const handleRemoveSelected = (userId: string) => {
    setSelectedUsers((prev) => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const handleInvite = async () => {
    const userIds = Object.keys(selectedUsers);
    if (userIds.length === 0) return;
    
    setIsInviting(true);
    try {
      await onInvite(userIds);
      onClose();
    } catch (e) {
      alert(t('failedToInvite') || `Failed to invite: ${e}`);
    } finally {
      setIsInviting(false);
    }
  };

  const canSubmit = Object.keys(selectedUsers).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{t('invite') || 'Invite'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            title={t('cancel') || 'Cancel'}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('friendsSearchPlaceholder') || 'Search users...'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              </div>
            ) : searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Selected Users */}
          {Object.keys(selectedUsers).length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {Object.values(selectedUsers).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    <span className="text-sm">{user.name}</span>
                    <button
                      onClick={() => handleRemoveSelected(user.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-1 max-h-80 overflow-y-auto">
              {searchResults.map((user) => {
                const isSelected = !!selectedUsers[user.id];
                return (
                  <button
                    key={user.id}
                    onClick={() => handleToggleSelection(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left ${
                      isSelected ? 'bg-green-50 border border-green-200' : ''
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: colorFromName(user.name) }}
                    >
                      {user.pictureUrl ? (
                        <img
                          src={user.pictureUrl}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <span className="flex-1 font-medium">{user.name}</span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty States */}
          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="mt-4 text-center text-gray-500">
              {t('noAvailablePlayers') || 'No players found'}
            </div>
          )}

          {!searchQuery && searchResults.length === 0 && (
            <div className="mt-4 text-center text-gray-500">
              {t('friendsSearchPlaceholder') || 'Search users...'}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onShare}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {t('shareUrl') || 'Share URL'}
            </button>
            <button
              onClick={onAddGuest}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {t('addGuest') || 'Add Guest'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleInvite}
            disabled={!canSubmit || isInviting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isInviting ? (t('inviting') || 'Inviting...') : (t('invite') || 'Invite')}
          </button>
        </div>
      </div>
    </div>
  );
}

