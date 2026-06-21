'use client';

import { Calculator } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { CloudSyncStatus } from '@/components/settings/CloudSyncStatus';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/auth/types';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user?: SessionUser | null;
  cloudSync?: {
    status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
    direction: 'none' | 'pull' | 'push';
    pending: boolean;
    lastSyncedAt: number;
    errorMessage: string | null;
    syncNow: () => void;
  };
}

export function AppHeader({ activeTab, onTabChange, cloudSync, user }: AppHeaderProps) {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Calculator className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight truncate">Costify</h1>
          {user?.tenantName && (
            <p className="text-xs text-muted truncate">{user.tenantName}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                  activeTab === id
                    ? 'bg-brand-muted text-brand-foreground'
                    : 'text-muted hover:text-foreground hover:bg-surface-muted'
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          {cloudSync && (
            <CloudSyncStatus
              compact
              status={cloudSync.status}
              direction={cloudSync.direction}
              pending={cloudSync.pending}
              lastSyncedAt={cloudSync.lastSyncedAt}
              errorMessage={cloudSync.errorMessage}
              onSync={cloudSync.syncNow}
            />
          )}
          {user && (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex px-3 py-2 rounded-lg text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-muted"
            >
              Salir
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
