'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Round, roundIsMember } from '@/lib/models/round';
import { roundService } from '@/lib/services/roundService';
import { userService } from '@/lib/services/userService';
import AddPlayersDialog from './AddPlayersDialog';
import GuestNameDialog from './GuestNameDialog';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserCheck } from '@fortawesome/free-solid-svg-icons';

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
  const isEnded = !!round.endedAt;

  // If round is ended, hide join/invite actions
  if (isEnded) {
    return null;
  }

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
    const url = `https://liff.line.me/2001440168-5GozgrPQ/rounds/${roundId}`
    
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleJoinRound}
        disabled={isJoining}
        title={t('joinRound') || 'Join Round'}
        aria-label={t('joinRound') || 'Join Round'}
      >
        {isJoining ? (
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faUserPlus} />
        )}
      </Button>
    );
  }

  // If user is a member, show add players button
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowAddDialog(true)}
        title={t('invite') || 'Invite'}
        aria-label={t('invite') || 'Invite'}
      >
        <FontAwesomeIcon icon={faUserPlus} />
      </Button>

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

