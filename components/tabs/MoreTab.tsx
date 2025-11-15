'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { linkWithCredential, EmailAuthProvider, type User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { AppUser } from '@/lib/models/appUser';
import { getInitials, colorFromName } from '@/lib/utils/validator';

export default function MoreTab() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadUser();
    }
  }, [user]);

  const loadUser = async () => {
    if (!user) return;
    try {
      const userData = await userService.getUserById(user.uid);
      setAppUser(userData);
    } catch (e) {
      console.error('Failed to load user:', e);
    }
  };

  const handleLinkAccount = async () => {
    if (!user) return;

    if (!linkEmail.trim() || !linkPassword) {
      alert(t('enterValidEmail'));
      return;
    }

    setIsLinking(true);

    try {
      const credential = EmailAuthProvider.credential(linkEmail.trim(), linkPassword);
      await linkWithCredential(user as User, credential);

      await updateDoc(doc(db, 'users', user.uid), {
        email: linkEmail.trim(),
        role: 'member',
        registered: true,
        lastLoginAt: serverTimestamp(),
      });

      setShowLinkDialog(false);
      setLinkEmail('');
      setLinkPassword('');
      await loadUser();
      alert(t('linkAccountSuccess'));
    } catch (e: any) {
      let message = t('failedToLinkAccount');
      if (e.code === 'email-already-in-use') {
        message = t('emailAlreadyInUse');
      } else if (e.code === 'invalid-email') {
        message = t('invalidEmail');
      } else if (e.code === 'weak-password') {
        message = t('weakPassword');
      } else if (e.code === 'provider-already-linked') {
        message = t('providerAlreadyLinked');
      } else if (e.code === 'credential-already-in-use') {
        message = t('credentialAlreadyInUse');
      }
      alert(message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await userService.signOut();
      router.push(`/${locale}/auth`);
    } catch (e) {
      alert((e as Error).toString());
    }
  };

  const isRegistered = appUser?.registered ?? false;
  const userEmail = appUser?.email ?? '';
  const isAdmin = userEmail.trim().toLowerCase() === 'pt.pawin@gmail.com';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold">{t('more')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Section */}
        {appUser && (
          <>
            <div
              onClick={() => router.push(`/${locale}/profile/edit`)}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: colorFromName(appUser.name) }}
              >
                {appUser.pictureUrl ? (
                  <img
                    src={appUser.pictureUrl}
                    alt={appUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(appUser.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">{appUser.name}</p>
                <p className="text-sm text-gray-600 truncate">
                  {appUser.email || t('noEmailLinked')}
                </p>
              </div>
              <span className="text-gray-400">›</span>
            </div>

            {/* Link Account Warning */}
            {!isRegistered && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-amber-600 text-xl">⚠️</span>
                  <p className="flex-1 text-amber-900 text-sm">{t('linkAccountWarning')}</p>
                </div>
                <button
                  onClick={() => setShowLinkDialog(true)}
                  className="w-full px-4 py-2 border border-amber-700 text-amber-900 rounded-lg font-medium hover:bg-amber-100"
                >
                  🔗 {t('linkAccount')}
                </button>
              </div>
            )}
          </>
        )}

        {/* Courses */}
        <div
          onClick={() => router.push(`/${locale}/courses`)}
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🗺️</span>
            <span className="font-medium">{t('courses')}</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div
              onClick={() => router.push(`/${locale}/admin/courses`)}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Admin • Courses</span>
              </div>
              <span className="text-gray-400">›</span>
            </div>
            <div
              onClick={() => router.push(`/${locale}/admin/rounds`)}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <span className="font-medium">Admin • Rounds</span>
              </div>
              <span className="text-gray-400">›</span>
            </div>
          </>
        )}

        {/* Language */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌐</span>
              <span className="font-medium">{t('settingsLanguage')}</span>
            </div>
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value;
                const currentPath = window.location.pathname;
                const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, '') || '/';
                router.push(`/${newLocale}${pathWithoutLocale}`);
              }}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="th">{t('languageThai')}</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-medium">{t('about')}</span>
            </div>
            <p className="text-sm text-gray-600 ml-8">{t('aboutSubtitle')}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <span className="font-medium">{t('version')}</span>
                <span className="text-sm text-gray-600 ml-2">1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => setShowSignOutDialog(true)}
          className="w-full bg-white border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-600 font-medium hover:bg-red-50"
        >
          <span className="text-xl">🚪</span>
          {t('signOut')}
        </button>
      </div>

      {/* Link Account Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">{t('linkEmailTitle')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('linkAccountWarningText')}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder={t('yourEmailExample')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('password')}</label>
                <div className="relative">
                  <input
                    type={obscurePassword ? 'password' : 'text'}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder={t('password')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setObscurePassword(!obscurePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {obscurePassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkEmail('');
                  setLinkPassword('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                disabled={isLinking}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLinkAccount}
                disabled={isLinking || !linkEmail.trim() || !linkPassword}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:bg-gray-400"
              >
                {isLinking ? '...' : t('linkAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Dialog */}
      {showSignOutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2
              className={`text-lg font-bold mb-4 ${
                !isRegistered ? 'text-red-600' : ''
              }`}
            >
              {isRegistered ? t('signOut') : t('signOutWarning')}
            </h2>
            {!isRegistered ? (
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">⚠️</span>
                  <p className="text-amber-900 font-bold">{t('accountNotLinked')}</p>
                </div>
                <p className="text-gray-800">{t('signOutWarningMessage')}</p>
                <div className="pl-4 space-y-1 text-sm text-gray-700">
                  <p>• {t('signOutWarningProfile')}</p>
                  <p>• {t('signOutWarningRounds')}</p>
                  <p>• {t('signOutWarningOther')}</p>
                </div>
                <p className="text-red-700 font-medium">{t('signOutPreventLoss')}</p>
              </div>
            ) : (
              <p className="text-gray-600 mb-6">{t('signOutConfirm')}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowSignOutDialog(false);
                  handleSignOut();
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  isRegistered ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
