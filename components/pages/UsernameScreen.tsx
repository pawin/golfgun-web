'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signInAnonymously } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { sanitizeUsername } from '@/lib/utils/validator';
import { useLocale } from 'next-intl';
import { userService } from '@/lib/services/userService';
import Image from 'next/image';

export default function UsernameScreen() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Sync selectedLanguage with current locale
  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // Navigate to the same page with the new locale
    const currentPath = pathname || '/username';
    const pathWithoutLocale = currentPath.replace(/^\/(en|th)/, '');
    router.push(`/${newLanguage}${pathWithoutLocale}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = sanitizeUsername(username);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSaving(true);

    try {
      // Sign in anonymously if not already signed in
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;
      }

      const usernameLower = username.trim().toLowerCase();
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

      // Invalidate cached user so subsequent reads fetch the fresh profile
      userService.invalidateUserCache(currentUser.uid);

      router.push(`/${locale}`);
    } catch (error: any) {
      alert(error.message || t('errorWithMessage', { error: String(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/golfgun.png"
              alt="Golfgun"
              width={160}
              height={160}
              priority
              style={{ width: '160px', height: '160px' }}
              className="rounded-full"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">{t('welcomeTitle')}</h1>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {t('chooseUsernameToGetStarted')}
          </p>

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
              onChange={(e) => handleLanguageChange(e.target.value)}
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
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              </div>
            ) : (
              t('continueButton')
            )}
          </button>

          {/* Sign In Link */}
          <div className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/auth`)}
              disabled={saving}
              className="text-primary font-semibold hover:underline"
            >
              {t('alreadyHaveAccountSignIn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

