'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthState } from 'react-firebase-hooks/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/services/userService';
import { useLocale } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function AuthScreen() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [user, loading] = useAuthState(auth);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('th');

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!user || loading) return;
      try {
        const appUser = await userService.getUserById(user.uid);
        const hasName = !!appUser && !!String(appUser.name ?? '').trim();
        if (hasName) {
          router.push(`/${locale}`);
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [user, loading, router, locale]);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'weak-password':
        return t('passwordTooWeak');
      case 'email-already-in-use':
        return t('accountAlreadyExists');
      case 'user-not-found':
        return t('noAccountFound');
      case 'wrong-password':
        return t('incorrectPassword');
      case 'invalid-email':
        return t('invalidEmail');
      case 'user-disabled':
        return t('accountDisabled');
      case 'too-many-requests':
        return t('tooManyAttempts');
      case 'operation-not-allowed':
        return t('emailPasswordNotEnabled');
      default:
        return t('authenticationFailed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage(t('enterValidEmail'));
      setIsLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      await userService.signInOrSignUp({
        email: email.trim(),
        password,
        isLogin,
        language: isLogin ? 'th' : selectedLanguage,
      });
      router.push(`/${locale}`);
    } catch (error: any) {
      const code = error?.code || error?.message || 'unknown';
      setErrorMessage(getErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMessage(t('pleaseEnterEmailAddress'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setErrorMessage(null);
      alert(t('passwordResetEmailSent'));
    } catch (error: any) {
      const code = error?.code || 'unknown';
      setErrorMessage(getErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-4xl font-bold">GG</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">{t('appTitle')}</h1>
          <h2 className="text-xl font-semibold text-center mb-1">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-8">
            {isLogin ? t('signInToContinue') : t('signUpToGetStarted')}
          </p>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('yourEmailExample')}
              className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type={obscurePassword ? 'password' : 'text'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterYourPassword')}
                className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                disabled={isLoading}
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

          {/* Language Selector (only in signup) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('settingsLanguage')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-input bg-input-background rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              >
                <option value="en">{t('languageEnglish')}</option>
                <option value="th">{t('languageThai')}</option>
              </select>
            </div>
          )}

          {/* Forgot Password (only in login) */}
          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isLoading}
              className="text-sm text-primary hover:underline"
              >
                {t('forgotPassword')}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
              <p className="text-sm text-error">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              </div>
            ) : (
              isLogin ? t('signIn') : t('signUp')
            )}
          </button>

          {/* Toggle Login/Signup */}
          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null);
              }}
              disabled={isLoading}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? t('signUp') : t('signIn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

