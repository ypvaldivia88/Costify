'use client';

import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/marketing/site-header';
import { MarketingFooter } from '@/components/marketing/footer';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface PublicShellProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function PublicShell({ children, showFooter = true }: PublicShellProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="fixed top-4 right-4 z-50 safe-fixed-top-right is-overlay">
        <ThemeToggle className="border border-border bg-card shadow-sm" />
      </div>
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>
      {showFooter ? <MarketingFooter /> : null}
    </div>
  );
}
