'use client';

import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import type { NavItemMeta } from '@costify/client-data';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { CloudSyncStatus } from '@/components/settings/CloudSyncStatus';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/auth/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl safe-top">
      <div className="page-container min-h-14 h-14 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CostifyLogo size="sm" className="shrink-0" />
          {user?.tenantName && (
            <p className="text-xs text-muted-foreground truncate leading-tight hidden sm:block max-w-[120px] md:max-w-[180px]">
              {user.tenantName}
            </p>
          )}
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
                  'px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 min-h-10',
                  activeTab === id
                    ? 'bg-brand-muted text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              className="hidden md:inline-flex items-center min-h-11 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Salir
            </button>
          )}
          {user && (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="md:hidden inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground"
                aria-label="Menú de cuenta"
              >
                <Menu className="size-5" />
              </button>
              <SheetContent side="right" className="w-[min(100%,20rem)]">
                <SheetHeader>
                  <SheetTitle className="text-left truncate">{user.tenantName ?? 'Mi cuenta'}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <p className="text-xs text-muted-foreground px-1">{user.email}</p>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
