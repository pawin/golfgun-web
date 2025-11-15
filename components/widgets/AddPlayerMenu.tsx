'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Round, roundIsMember } from '@/lib/models/round';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import AddPlayersDialog from './AddPlayersDialog';
import GuestNameDialog from './GuestNameDialog';

interface AddPlayerMenuProps {
  roundId: string;
  round: Round;
  currentUserId: string;
  onUpdate?: () => void;
}

export default function AddPlayerMenu({
  roundId,
  round,
  currentUserId,
  onUpdate,
}: AddPlayerMenuProps) {
  const t = useTranslations();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const locale = useLocale();

  const isMember = roundIsMember(round, currentUserId);

  const handleJoinRound = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      await roundService.joinRound(roundId, currentUserId);
      alert(t('joinedRound') || 'Joined round');
      onUpdate?.();
    } catch (e) {
      alert(t('failedToJoinRound', { error: (e as Error).toString() }) || `Failed to join round: ${e}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleShareUrl = async () => {
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/${locale}/rounds/${roundId}`
      : `https://golfgun.co/${locale}/rounds/${roundId}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('invite') || 'Invite',
          text: t('roundInvite') || 'Join my round',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert(t('urlCopied') || 'URL copied to clipboard');
      }
    } catch (e) {
      // User cancelled or error
      if ((e as Error).name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          alert(t('urlCopied') || 'URL copied to clipboard');
        } catch (clipboardError) {
          alert(t('failedToShare') || 'Failed to share');
        }
      }
    }
  };

  const handleAddGuest = async (name: string) => {
    if (!name || isAddingGuest) return;
    setIsAddingGuest(true);
    try {
      const guestId = await userService.createGuest(name);
      if (!guestId) {
        alert(t('failedToCreateGuest') || 'Failed to create guest');
        return;
      }
      await roundService.joinRound(roundId, guestId);
      alert(t('guestAdded', { name }) || `Guest ${name} added`);
      onUpdate?.();
    } catch (e) {
      alert(t('error') + ': ' + (e as Error).toString());
    } finally {
      setIsAddingGuest(false);
      setShowGuestDialog(false);
    }
  };

  const handleAddUsers = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    for (const userId of userIds) {
      try {
        await roundService.joinRound(roundId, userId);
      } catch (e) {
        console.error(`Failed to add user ${userId}:`, e);
      }
    }
    onUpdate?.();
  };

  // If user is not a member, show Join button
  if (!isMember) {
    return (
      <button
        onClick={handleJoinRound}
        disabled={isJoining}
        className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        title={t('joinRound') || 'Join Round'}
      >
        {isJoining ? (
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )}
      </button>
    );
  }

  // If user is a member, show add players button
  return (
    <>
      <button
        onClick={() => setShowAddDialog(true)}
        className="p-2 text-gray-600 hover:text-gray-900"
        title={t('invite') || 'Invite'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      </button>

      {showAddDialog && (
        <AddPlayersDialog
          round={round}
          currentUserId={currentUserId}
          onClose={() => setShowAddDialog(false)}
          onShare={handleShareUrl}
          onAddGuest={() => {
            setShowAddDialog(false);
            setShowGuestDialog(true);
          }}
          onInvite={handleAddUsers}
        />
      )}

      {showGuestDialog && (
        <GuestNameDialog
          onClose={() => setShowGuestDialog(false)}
          onConfirm={handleAddGuest}
        />
      )}
    </>
  );
}

