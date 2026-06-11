'use client';

import { Calculator } from 'lucide-react';
import type { AppTab } from '@/components/ui/BottomNav';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const navItems: { id: AppTab; label: string }[] = [
  { id: 'calculator', label: 'Calculadora' },
  { id: 'raw-materials', label: 'Materias primas' },
  { id: 'inventory', label: 'Historial' },
  { id: 'settings', label: 'Ajustes' },
];

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Calculator className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground leading-tight truncate">Costify</h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
