'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useAppDataCore } from './use-app-data-core';
import type { AppDataContextValue, AppDataUser } from './types';

const AppDataContext = createContext<AppDataContextValue | null>(null);

export interface AppDataProviderProps {
  children: ReactNode;
  user: AppDataUser | null;
  onDenyWrite: (message: string) => void;
}

export function AppDataProvider({ children, user, onDenyWrite }: AppDataProviderProps) {
  const stableDeny = useCallback((message: string) => onDenyWrite(message), [onDenyWrite]);
  const value = useAppDataCore({ user, onDenyWrite: stableDeny });
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}

export function mapSessionToAppDataUser(
  user: {
    accessLevel?: AppDataUser['accessLevel'];
    workspaceId?: string;
    tenantId?: string;
    trialProductLimit?: number;
    trialRawMaterialLimit?: number;
  } | null
): AppDataUser | null {
  if (!user) return null;
  return {
    accessLevel: user.accessLevel,
    workspaceId: user.workspaceId,
    tenantId: user.tenantId,
    trialProductLimit: user.trialProductLimit,
    trialRawMaterialLimit: user.trialRawMaterialLimit,
  };
}
