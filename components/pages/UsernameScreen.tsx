'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInAnonymously } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { sanitizeUsername } from '@/lib/utils/validator';
import { useLocale } from 'next-intl';

export default function UsernameScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingIn, setSigningIn] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('th');

  useEffect(() => {
    if (user && !loading) {
      // Check if user already has a username
      // For now, just proceed - we'll check in the save function
      setSigningIn(false);
    } else if (!loading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Anonymous sign in error:', error);
        setSigningIn(false);
      });
    }
  }, [user, loading]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = sanitizeUsername(username);
    if (validationError) {
      alert(validationError);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert(t('notSignedIn'));
      return;
    }

    const usernameLower = username.trim().toLowerCase();
    setSaving(true);

    try {
      const unameRef = doc(db, 'usernames', usernameLower);
      const userRef = doc(db, 'users', currentUser.uid);

      await runTransaction(db, async (tx) => {
        const existing = await tx.get(unameRef);
        if (existing.exists()) {
          throw new Error(t('usernameAlreadyTaken'));
        }
        tx.set(unameRef, {
          uid: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        tx.set(userRef, {
          id: currentUser.uid,
          name: usernameLower,
          language: selectedLanguage,
          role: 'temporary',
          registered: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      router.push(`/${locale}`);
    } catch (error: any) {
      alert(error.message || t('errorWithMessage', { error: String(error) }));
    } finally {
      setSaving(false);
    }
  };

  if (signingIn || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-4xl font-bold">GG</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">{t('welcomeTitle')}</h1>
          <p className="text-muted-foreground">{t('chooseUsernameToGetStarted')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('username')}
              className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={saving}
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('settingsLanguage')}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={saving}
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="th">{t('languageThai')}</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving || !username.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              </div>
            ) : (
              t('continueButton')
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/${locale}/auth`)}
            className="text-sm text-primary hover:underline"
          >
            {t('alreadyHaveAccountSignIn')}
          </button>
        </div>
      </div>
    </div>
  );
}

