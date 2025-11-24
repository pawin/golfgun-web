import { ReactElement } from 'react';
import HomePage from '@/components/pages/HomePage';
import AuthScreen from '@/components/pages/AuthScreen';
import CoursesScreen from '@/components/pages/CoursesScreen';
import MyRoundsScreen from '@/components/pages/MyRoundsScreen';
import RoundDetailScreen from '@/components/pages/RoundDetailScreen';
import RoundSettingsScreen from '@/components/pages/RoundSettingsScreen';
import ProfileScreen from '@/components/pages/ProfileScreen';
import EditProfileScreen from '@/components/pages/EditProfileScreen';
import StartRoundScreen from '@/components/pages/StartRoundScreen';
import UsernameScreen from '@/components/pages/UsernameScreen';
import AdminCoursesScreen from '@/components/pages/AdminCoursesScreen';
import AdminRoundsScreen from '@/components/pages/AdminRoundsScreen';
import AdminUsersScreen from '@/components/pages/AdminUsersScreen';
import { DesignSystemShowcase } from '@/components/pages/DesignSystemShowcase';
import { notFound } from 'next/navigation';

export interface RouteParams {
  [key: string]: string;
}

export interface RouteHandler {
  component: ReactElement;
  params: RouteParams;
}

/**
 * Manually handles routing based on the path segments.
 * You can customize this function to handle any URL pattern you want.
 * 
 * @param slug - Array of path segments (e.g., ['rounds', '123'] for /rounds/123)
 * @param searchParams - URL search parameters
 * @returns RouteHandler with component and parsed params
 */
export function handleRoute(
  slug: string[],
  searchParams: Record<string, string | string[] | undefined> = {}
): RouteHandler {
  let effectiveSlug = slug;

  const liffStateParam = searchParams['liff.state'];
  
  const liffState = Array.isArray(liffStateParam)
    ? liffStateParam[0]
    : liffStateParam;

  if (liffState) {
    try {
      const decodedState = decodeURIComponent(liffState);
      const normalizedState = decodedState.startsWith('/')
        ? decodedState.slice(1)
        : decodedState;
      const liffSlug = normalizedState.split('/').filter(Boolean);

      if (liffSlug.length > 0) {
        effectiveSlug = liffSlug;
      }
      console.log('effectiveSlug', effectiveSlug);
    } catch (error) {
      console.warn('Failed to parse liff.state parameter', error);
    }
  }

  // Handle root path
  if (
    effectiveSlug.length === 0 ||
    (effectiveSlug.length === 1 && effectiveSlug[0] === '')
  ) {
    return {
      component: <HomePage />,
      params: {},
    };
  }

  const [first, second, third, ...rest] = effectiveSlug;

  // Handle /rounds
  if (first === 'rounds' && !second) {
    return {
      component: <MyRoundsScreen />,
      params: {},
    };
  }

  // Handle /rounds/{id}
  if (first === 'rounds' && second && !third) {
    return {
      component: <RoundDetailScreen />,
      params: { id: second },
    };
  }

  // Handle /rounds/{id}/settings
  if (first === 'rounds' && second && third === 'settings' && !rest.length) {
    return {
      component: <RoundSettingsScreen />,
      params: { id: second },
    };
  }

  // Handle /profile/{userId}
  if (first === 'profile' && second && second !== 'edit' && !third) {
    return {
      component: <ProfileScreen />,
      params: { userId: second },
    };
  }

  // Handle /profile/edit
  if (first === 'profile' && second === 'edit' && !third) {
    return {
      component: <EditProfileScreen />,
      params: {},
    };
  }

  // Handle /courses
  if (first === 'courses' && !second) {
    return {
      component: <CoursesScreen />,
      params: {},
    };
  }

  // Handle /auth
  if (first === 'auth' && !second) {
    return {
      component: <AuthScreen />,
      params: {},
    };
  }

  // Handle /start-round
  if (first === 'start-round' && !second) {
    return {
      component: <StartRoundScreen />,
      params: {},
    };
  }

  // Handle /username
  if (first === 'username' && !second) {
    return {
      component: <UsernameScreen />,
      params: {},
    };
  }

  // Handle /admin/courses
  if (first === 'admin' && second === 'courses' && !third) {
    return {
      component: <AdminCoursesScreen />,
      params: {},
    };
  }

  // Handle /admin/rounds
  if (first === 'admin' && second === 'rounds' && !third) {
    return {
      component: <AdminRoundsScreen />,
      params: {},
    };
  }

  // Handle /admin/users
  if (first === 'admin' && second === 'users' && !third) {
    return {
      component: <AdminUsersScreen />,
      params: {},
    };
  }

  // Handle /design
  if (first === 'ds' && !second) {
    return {
      component: <DesignSystemShowcase />,
      params: {},
    };
  }

  // If no route matches, return 404
  notFound();
}

