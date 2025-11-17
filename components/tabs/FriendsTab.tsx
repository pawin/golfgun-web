'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { auth } from '@/lib/firebase/config';
import { friendService, FriendOverview, FriendshipWithUser } from '@/lib/services/friendService';
import { AppUser } from '@/lib/models/appUser';
import { colorFromName, getInitials } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useLocale } from 'next-intl';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

type FriendRelationship = 'self' | 'friend' | 'incoming' | 'outgoing' | 'none';

interface SearchResultEntry {
  user: AppUser;
  relationship: FriendRelationship;
}

export default function FriendsTab() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [overview, setOverview] = useState<FriendOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && !loading) {
      loadOverview();
    }
  }, [user, loading]);

  const loadOverview = async () => {
    if (!user) {
      setOverview({
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
      });
      setIsLoading(false);
      refreshSearchRelationships();
      return;
    }

    setIsLoading(true);

    try {
      const data = await friendService.loadOverview(user.uid);
      setOverview(data);
      setErrorMessage(null);
      refreshSearchRelationships();
    } catch (e) {
      setErrorMessage((e as Error).toString());
      refreshSearchRelationships();
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPendingSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    cancelPendingSearch();

    const normalized = value.trim().toLowerCase();

    if (normalized.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(normalized);
    }, 400);
  };

  const performSearch = async (query: string) => {
    if (!user) return;

    const trimmed = query.trim().toLowerCase();

    if (trimmed.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const results = await friendService.searchUsers({
        query: trimmed,
        excludeUserId: user.uid,
      });

      const entries: SearchResultEntry[] = Object.values(results).map((user) => ({
        user,
        relationship: relationshipForUser(user),
      }));

      setSearchResults(entries);
    } catch (e) {
      showError((e as Error).toString());
    } finally {
      setIsSearching(false);
    }
  };

  const relationshipForUser = (targetUser: AppUser): FriendRelationship => {
    if (!user || targetUser.id === user.uid) return 'self';
    if (!overview) return 'none';

    if (overview.friends.some((entry) => entry.otherUser.id === targetUser.id)) {
      return 'friend';
    }
    if (overview.outgoingRequests.some((entry) => entry.otherUser.id === targetUser.id)) {
      return 'outgoing';
    }
    if (overview.incomingRequests.some((entry) => entry.otherUser.id === targetUser.id)) {
      return 'incoming';
    }
    return 'none';
  };

  const refreshSearchRelationships = () => {
    if (searchResults.length === 0) return;
    const updated = searchResults.map((entry) => ({
      ...entry,
      relationship: relationshipForUser(entry.user),
    }));
    setSearchResults(updated);
  };

  const sendRequest = async (target: AppUser) => {
    if (!user) {
      showError(t('notSignedIn'));
      return;
    }

    try {
      await friendService.sendFriendRequest({
        fromUserId: user.uid,
        toUserId: target.id,
      });
      await loadOverview();
      showMessage(t('friendsRequestSent'));
    } catch (e) {
      showError((e as Error).toString());
    }
  };

  const acceptRequest = async (entry: FriendshipWithUser) => {
    if (!user) return;

    try {
      await friendService.acceptFriendRequest({
        currentUserId: user.uid,
        otherUserId: entry.otherUser.id,
      });
      await loadOverview();
      showMessage(t('friendsRequestAccepted'));
    } catch (e) {
      showError((e as Error).toString());
    }
  };

  const declineRequest = async (entry: FriendshipWithUser) => {
    if (!user) return;

    try {
      await friendService.declineFriendRequest({
        currentUserId: user.uid,
        otherUserId: entry.otherUser.id,
      });
      await loadOverview();
      showMessage(t('friendsRequestDeclined'));
    } catch (e) {
      showError((e as Error).toString());
    }
  };

  const cancelRequest = async (entry: FriendshipWithUser) => {
    if (!user) return;

    try {
      await friendService.cancelFriendRequest({
        fromUserId: user.uid,
        toUserId: entry.otherUser.id,
      });
      await loadOverview();
      showMessage(t('friendsRequestCancelled'));
    } catch (e) {
      showError((e as Error).toString());
    }
  };

  const openProfile = (targetUser: AppUser) => {
    router.push(`/${locale}/profile/${targetUser.id}`);
  };

  const showMessage = (message: string) => {
    // Could use a toast library here
    alert(message);
  };

  const showError = (error: string) => {
    setErrorMessage(error);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <AppIconHomeLink />
          <h1 className="text-xl font-semibold">{t('friendsTitle')}</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('friendsSignInRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3 z-100">
        <AppIconHomeLink />
        <h1 className="text-xl font-semibold">{t('friendsTitle')}</h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Search Section */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-md font-semibold mb-2">{t('friendsSearchLabel')}</h2>
          <div className="relative">
            <input
              type="text"
              onChange={(e) => {
                handleSearchChange(e.target.value);
              }}
              value={searchQuery}
              placeholder={t('friendsSearchPlaceholder')}
              className="w-full px-4 py-2 h-9 border border-input rounded-md pr-10 bg-input-background transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] placeholder:text-muted-foreground"
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : searchQuery ? (
              <button
                onClick={() => {
                  cancelPendingSearch();
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <FontAwesomeIcon icon={faSearch} />
              </span>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 bg-card border border-border rounded-lg divide-y">
              {searchResults.map((entry) => (
                <SearchResultTile
                  key={entry.user.id}
                  entry={entry}
                  onAction={(action) => {
                    if (action === 'accept') {
                      // Find entry in incoming requests
                      const incomingEntry = overview?.incomingRequests.find(
                        (e) => e.otherUser.id === entry.user.id
                      );
                      if (incomingEntry) acceptRequest(incomingEntry);
                    } else if (action === 'decline') {
                      const incomingEntry = overview?.incomingRequests.find(
                        (e) => e.otherUser.id === entry.user.id
                      );
                      if (incomingEntry) declineRequest(incomingEntry);
                    } else if (action === 'cancel') {
                      const outgoingEntry = overview?.outgoingRequests.find(
                        (e) => e.otherUser.id === entry.user.id
                      );
                      if (outgoingEntry) cancelRequest(outgoingEntry);
                    } else if (action === 'add') {
                      sendRequest(entry.user);
                    } else if (action === 'view') {
                      openProfile(entry.user);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-3">
            <p className="text-sm text-error">{errorMessage}</p>
          </div>
        )}

        {overview && (
          <>
            {/* Incoming Requests */}
            {overview.incomingRequests.length > 0 && (
              <FriendsSection
                title={t('friendsSectionIncoming')}
                emptyLabel={t('friendsNoIncoming')}
                entries={overview.incomingRequests}
                onAccept={acceptRequest}
                onDecline={declineRequest}
                onCancel={undefined}
                onTap={openProfile}
              />
            )}

            {/* Outgoing Requests */}
            {overview.outgoingRequests.length > 0 && (
              <FriendsSection
                title={t('friendsSectionOutgoing')}
                emptyLabel={t('friendsNoOutgoing')}
                entries={overview.outgoingRequests}
                onAccept={undefined}
                onDecline={undefined}
                onCancel={cancelRequest}
                onTap={openProfile}
              />
            )}

            {/* Friends List */}
            <FriendsSection
              title={t('friendsSectionFriends')}
              emptyLabel={t('friendsNoFriends')}
              entries={overview.friends}
              onAccept={undefined}
              onDecline={undefined}
              onCancel={undefined}
              onTap={openProfile}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SearchResultTile({
  entry,
  onAction,
}: {
  entry: SearchResultEntry;
  onAction: (action: string) => void;
}) {
  const t = useTranslations();
  const bgColor = colorFromName(entry.user.name);
  const initials = getInitials(entry.user.name);

  const renderAction = () => {
    switch (entry.relationship) {
      case 'self':
        return null;
      case 'friend':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('view');
            }}
            className="px-3 py-1 bg-info/10 text-info rounded text-sm font-medium"
          >
            {t('friendsActionViewProfile')}
          </button>
        );
      case 'outgoing':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('cancel');
            }}
            className="px-3 py-1 bg-error/10 text-error rounded text-sm font-medium"
          >
            {t('friendsActionCancel')}
          </button>
        );
      case 'incoming':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('decline');
              }}
              className="px-3 py-1 bg-muted text-foreground rounded text-sm font-medium"
            >
              {t('friendsActionDecline')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('accept');
              }}
              className="px-3 py-1 bg-success text-success-foreground rounded text-sm font-medium"
            >
              {t('friendsActionAccept')}
            </button>
          </div>
        );
      case 'none':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('add');
            }}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-medium"
          >
            {t('friendsActionAdd')}
          </button>
        );
    }
  };

  return (
    <div
      onClick={() => onAction('view')}
      className="p-3 flex items-center gap-3 hover:bg-muted cursor-pointer"
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        {entry.user.pictureUrl ? <AvatarImage src={entry.user.pictureUrl} alt={entry.user.name} /> : null}
        <AvatarFallback className="text-white font-bold text-sm" style={{ backgroundColor: bgColor }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.user.name}</p>
      </div>
      {renderAction()}
    </div>
  );
}

function FriendsSection({
  title,
  emptyLabel,
  entries,
  onAccept,
  onDecline,
  onCancel,
  onTap,
}: {
  title: string;
  emptyLabel: string;
  entries: FriendshipWithUser[];
  onAccept?: (entry: FriendshipWithUser) => void;
  onDecline?: (entry: FriendshipWithUser) => void;
  onCancel?: (entry: FriendshipWithUser) => void;
  onTap: (user: AppUser) => void;
}) {
  const t = useTranslations();

  if (entries.length === 0) {
    return (
      <div>
        <h2 className="text-md font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-md font-semibold mb-2">{title}</h2>
      <div className="bg-card border border-border rounded-lg divide-y">
        {entries.map((entry) => (
          <FriendListTile
            key={entry.otherUser.id}
            user={entry.otherUser}
            onAccept={onAccept ? () => onAccept(entry) : undefined}
            onDecline={onDecline ? () => onDecline(entry) : undefined}
            onCancel={onCancel ? () => onCancel(entry) : undefined}
            onTap={() => onTap(entry.otherUser)}
          />
        ))}
      </div>
    </div>
  );
}

function FriendListTile({
  user,
  onAccept,
  onDecline,
  onCancel,
  onTap,
}: {
  user: AppUser;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onTap: () => void;
}) {
  const t = useTranslations();
  const bgColor = colorFromName(user.name);
  const initials = getInitials(user.name);

  const renderActions = () => {
    if (onAccept && onDecline) {
      return (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecline();
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium"
          >
            {t('friendsActionDecline')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium"
          >
            {t('friendsActionAccept')}
          </button>
        </div>
      );
    }
    if (onCancel) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium"
        >
          {t('friendsActionCancel')}
        </button>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onTap}
      className="p-3 flex items-center gap-3 hover:bg-muted cursor-pointer"
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        {user.pictureUrl ? <AvatarImage src={user.pictureUrl} alt={user.name} /> : null}
        <AvatarFallback className="text-white font-bold text-sm" style={{ backgroundColor: bgColor }}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.name}</p>
      </div>
      {renderActions()}
    </div>
  );
}