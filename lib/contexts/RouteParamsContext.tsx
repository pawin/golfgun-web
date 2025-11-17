'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { RouteParams } from '@/lib/utils/router';

const RouteParamsContext = createContext<RouteParams>({});

interface RouteParamsProviderProps {
  params: RouteParams;
  children: ReactNode;
}

export function RouteParamsProvider({ params, children }: RouteParamsProviderProps) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>;
}

export function useRouteParams<T extends RouteParams = RouteParams>() {
  return useContext(RouteParamsContext) as T;
}

