import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import LiffProvider from '@/components/providers/LiffProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import { DebugLoggerView } from '@/components/ui/DebugLoggerView';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LiffProvider>
        <AuthProvider>
          {children}
          {/* <DebugLoggerView /> */}
        </AuthProvider>
      </LiffProvider>
    </NextIntlClientProvider>
  );
}

