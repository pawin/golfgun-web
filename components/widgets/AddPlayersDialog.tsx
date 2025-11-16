'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Round } from '@/lib/models/round';
import { AppUser } from '@/lib/models/appUser';
import { friendService } from '@/lib/services/friendService';
import { getInitials, colorFromName } from '@/lib/utils/validator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faUserPlus } from '@fortawesome/free-solid-svg-icons';

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        overlayClassName="bg-black/80"
        className="top-4 sm:top-6 left-1/2 -translate-x-1/2 translate-y-0 max-w-md w-[calc(100%-2rem)] p-0"
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{t('invite') || 'Invite'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('friendsSearchPlaceholder') || 'Search users...'}
              className="pr-10"
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin"></div>
              </div>
            ) : searchQuery ? (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={t('clear') || 'Clear'}
                title={t('clear') || 'Clear'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    <span className="text-sm">{user.name}</span>
                    <button
                      onClick={() => handleRemoveSelected(user.id)}
                      className="text-primary hover:opacity-80"
                      aria-label={t('remove') || 'Remove'}
                      title={t('remove') || 'Remove'}
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
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left border transition-colors ${
                      isSelected
                        ? 'bg-primary/5 border-primary/30'
                        : 'hover:bg-accent border-transparent'
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
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="mt-4 text-center text-muted-foreground">
              {t('noAvailablePlayers') || 'No players found'}
            </div>
          )}

          {/* Primary Action (Invite) - above divider */}
          <div className="mt-4">
            <Button
              onClick={handleInvite}
              disabled={!canSubmit || isInviting}
              className="w-full"
            >
              {isInviting ? (t('inviting') || 'Inviting...') : (t('invite') || 'Invite')}
            </Button>
          </div>
        </div>

        {/* Secondary Actions - below divider */}
        <DialogFooter className="p-4 border-t">
          <div className="w-full flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onShare}
            >
              <FontAwesomeIcon icon={faShareNodes} className="w-5 h-5" />
              {t('shareUrl') || 'Share URL'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onAddGuest}
            >
              <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
              {t('addGuest') || 'Add Guest'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

