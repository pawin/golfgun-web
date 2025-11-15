'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { sanitizeUsername } from '@/lib/utils/validator';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{t('addGuest') || 'Add Guest'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('username') || 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t('username') || 'Name'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (t('adding') || 'Adding...') : (t('addGuest') || 'Add Guest')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

