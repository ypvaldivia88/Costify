'use client';

import { LogOut, Menu } from 'lucide-react';
import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { CloudSyncStatus } from '@/components/settings/CloudSyncStatus';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/auth/types';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';

interface AppHeaderProps {
  user?: SessionUser | null;
  onOpenSidebar?: () => void;
  cloudSync?: {
    status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
    direction: 'none' | 'pull' | 'push';
    pending: boolean;
    lastSyncedAt: number;
    errorMessage: string | null;
    syncNow: () => void;
  };
}

export function AppHeader({ cloudSync, user, onOpenSidebar }: AppHeaderProps) {
  const { logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl safe-top">
      <div className="page-container min-h-14 h-14 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground shrink-0"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-5" />
          </button>
          <CostifyLogo size="sm" className="shrink-0" />
          {user?.tenantName ? (
            <p className="text-xs text-muted-foreground truncate leading-tight hidden sm:block max-w-[140px] md:max-w-[200px]">
              {user.tenantName}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {cloudSync ? (
            <CloudSyncStatus
              compact
              status={cloudSync.status}
              direction={cloudSync.direction}
              pending={cloudSync.pending}
              lastSyncedAt={cloudSync.lastSyncedAt}
              errorMessage={cloudSync.errorMessage}
              onSync={cloudSync.syncNow}
            />
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="hidden md:inline-flex items-center min-h-11 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Salir
            </button>
          ) : null}
          {user ? (
            <Sheet open={accountOpen} onOpenChange={setAccountOpen}>
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                className="md:hidden inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground"
                aria-label="Menú de cuenta"
              >
                <LogOut className="size-4" />
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
                      setAccountOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
