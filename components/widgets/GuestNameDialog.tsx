'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { sanitizeUsername } from '@/lib/utils/validator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GuestNameDialogProps {
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}

export default function GuestNameDialog({
  onClose,
  onConfirm,
}: GuestNameDialogProps) {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = name.trim();
    const validationError = sanitizeUsername(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(trimmed);
    } catch (e) {
      setError((e as Error).toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent overlayClassName="bg-black/80" className="top-4 sm:top-6 left-1/2 -translate-x-1/2 translate-y-0 max-w-md w-[calc(100%-2rem)] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>{t('addGuest') || 'Add Guest'}</DialogTitle>
          <DialogDescription>
            {t('enterGuestName') || 'Enter a name for the guest player'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4">
          <div>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t('username') || 'Name'}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (t('adding') || 'Adding...') : (t('addGuest') || 'Add Guest')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

