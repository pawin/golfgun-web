import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'th',
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

