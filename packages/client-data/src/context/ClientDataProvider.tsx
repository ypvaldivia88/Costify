import { createContext, useContext, type ReactNode } from 'react';
import type { ExchangeRateSnapshot } from '@costify/shared/domain/exchange-rates';
import type { AppBackupInput } from '@costify/shared/backup/backup-core';
import type { ScopedStoragePort } from '../storage/types';
import type { SyncDirection, SyncResult, SyncStatus, WorkspaceDocument } from '../sync/types';

export interface SyncApi {
  isOnline(): boolean;
  applyRemoteWorkspace(
    workspace: WorkspaceDocument | Omit<WorkspaceDocument, 'createdAt'>
  ): Promise<void>;
  collectLocalData(): Promise<AppBackupInput>;
  syncWithCloud(workspaceId: string, tenantId?: string): Promise<SyncResult>;
  touchLocalData(): Promise<void>;
}

export interface OnlineEvents {
  subscribe(onOnline: () => void, onOffline: () => void): () => void;
}

export interface ClientDataContextValue {
  storage: ScopedStoragePort;
  sync: SyncApi;
  onlineEvents: OnlineEvents;
  fetchExchangeSnapshot: () => Promise<ExchangeRateSnapshot>;
}

const ClientDataContext = createContext<ClientDataContextValue | null>(null);

export function ClientDataProvider({
  value,
  children,
}: {
  value: ClientDataContextValue;
  children: ReactNode;
}) {
  return <ClientDataContext.Provider value={value}>{children}</ClientDataContext.Provider>;
}

export function useClientData(): ClientDataContextValue {
  const ctx = useContext(ClientDataContext);
  if (!ctx) {
    throw new Error('useClientData must be used within ClientDataProvider');
  }
  return ctx;
}

export function useStorage(): ScopedStoragePort {
  return useClientData().storage;
}

export function useSyncApi(): SyncApi {
  return useClientData().sync;
}

export type { SyncStatus, SyncDirection, SyncResult };
