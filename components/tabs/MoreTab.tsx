'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faLink, faMap, faCog, faGlobe, faInfoCircle, faMobileAlt, faSignOutAlt, faEye, faEyeSlash, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { linkWithCredential, EmailAuthProvider, type User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { AppUser } from '@/lib/models/appUser';
import { getInitials, colorFromName } from '@/lib/utils/validator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AppIconHomeLink } from '@/components/ui/AppIconHomeLink';

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
      window.location.reload();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-subtle pb-20">
      <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3 z-100">
        <AppIconHomeLink />
        <h1 className="text-xl font-semibold">{t('more')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Section */}
        {appUser && (
          <>
            <div
              onClick={() => router.push(`/${locale}/profile/edit`)}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-muted"
            >
              <Avatar className="w-16 h-16 flex-shrink-0">
                {appUser.pictureUrl ? <AvatarImage src={appUser.pictureUrl} alt={appUser.name} /> : null}
                <AvatarFallback className="text-white font-bold text-lg" style={{ backgroundColor: colorFromName(appUser.name) }}>
                  {getInitials(appUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">{appUser.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {appUser.email || t('noEmailLinked')}
                </p>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground" />
            </div>

            {/* Link Account Warning */}
            {!isRegistered && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning text-xl" />
                  <p className="flex-1 text-warning text-sm">{t('linkAccountWarning')}</p>
                </div>
                <button
                  onClick={() => setShowLinkDialog(true)}
                  className="w-full px-4 py-2 border border-warning text-warning rounded-lg font-medium hover:bg-warning/10 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faLink} />
                  {t('linkAccount')}
                </button>
              </div>
            )}
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div
              onClick={() => router.push(`/${locale}/admin/courses`)}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCog} className="text-xl" />
                <span className="font-medium">Admin • Courses</span>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground" />
            </div>
            <div
              onClick={() => router.push(`/${locale}/admin/rounds`)}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCog} className="text-xl" />
                <span className="font-medium">Admin • Rounds</span>
              </div>
              <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground" />
            </div>
          </>
        )}

        {/* Language */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faGlobe} className="text-xl" />
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
              className="px-3 py-1 border border-input bg-input-background rounded"
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="th">{t('languageThai')}</option>
            </select>
          </div>
        </div>

        {/* About */}
        <div className="bg-card border border-border rounded-lg divide-y">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-xl" />
              <span className="font-medium">{t('about')}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-8">{t('aboutSubtitle')}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faMobileAlt} className="text-xl" />
              <div>
                <span className="font-medium">{t('version')}</span>
                <span className="text-sm text-muted-foreground ml-2">1.0.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => setShowSignOutDialog(true)}
          className="w-full bg-card border border-error/30 rounded-lg p-4 flex items-center gap-3 text-error font-medium hover:bg-error/10"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          {t('signOut')}
        </button>
      </div>

      {/* Link Account Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">{t('linkEmailTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t('linkAccountWarningText')}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder={t('yourEmailExample')}
                  className="w-full px-3 py-2 border border-input bg-input-background rounded-lg"
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
                    className="w-full px-3 py-2 border border-input bg-input-background rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setObscurePassword(!obscurePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  >
                    <FontAwesomeIcon icon={obscurePassword ? faEye : faEyeSlash} />
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
                className="flex-1 px-4 py-2 border border-border rounded-lg"
                disabled={isLinking}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLinkAccount}
                disabled={isLinking || !linkEmail.trim() || !linkPassword}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium disabled:bg-muted"
              >
                {isLinking ? '...' : t('linkAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Dialog */}
      {showSignOutDialog && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h2
              className={`text-lg font-bold mb-4 ${
                !isRegistered ? 'text-error' : ''
              }`}
            >
              {isRegistered ? t('signOut') : t('signOutWarning')}
            </h2>
            {!isRegistered ? (
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" />
                  <p className="text-warning font-bold">{t('accountNotLinked')}</p>
                </div>
                <p className="text-foreground">{t('signOutWarningMessage')}</p>
                <div className="pl-4 space-y-1 text-sm text-muted-foreground">
                  <p>• {t('signOutWarningProfile')}</p>
                  <p>• {t('signOutWarningRounds')}</p>
                  <p>• {t('signOutWarningOther')}</p>
                </div>
                <p className="text-error font-medium">{t('signOutPreventLoss')}</p>
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">{t('signOutConfirm')}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutDialog(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowSignOutDialog(false);
                  handleSignOut();
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  isRegistered ? 'bg-success text-success-foreground' : 'bg-error'
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
