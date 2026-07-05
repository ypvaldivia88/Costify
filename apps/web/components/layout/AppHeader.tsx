'use client';

import { Calculator } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import type { NavItemMeta } from '@costify/client-data';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { CloudSyncStatus } from '@/components/settings/CloudSyncStatus';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/auth/types';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user?: SessionUser | null;
  navItems?: NavItemMeta[];
  cloudSync?: {
    status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
    direction: 'none' | 'pull' | 'push';
    pending: boolean;
    lastSyncedAt: number;
    errorMessage: string | null;
    syncNow: () => void;
  };
}

export function AppHeader({ activeTab, onTabChange, cloudSync, user, navItems = NAV_ITEMS }: AppHeaderProps) {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60 safe-top">
      <div className="max-w-5xl mx-auto px-4 min-h-14 h-14 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow shrink-0">
            <Calculator className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight truncate">Costify</h1>
            {user?.tenantName && (
              <p className="text-[11px] text-muted truncate leading-tight">{user.tenantName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={cn(
                  'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeTab === id
                    ? 'bg-brand-muted text-brand-foreground shadow-sm'
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
              className="hidden md:inline-flex items-center min-h-11 px-3 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
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
