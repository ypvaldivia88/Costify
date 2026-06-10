'use client';

import { Calculator } from 'lucide-react';
import type { AppTab } from '@/components/ui/BottomNav';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const navItems: { id: AppTab; label: string }[] = [
  { id: 'calculator', label: 'Calculadora' },
  { id: 'inventory', label: 'Historial' },
  { id: 'settings', label: 'Ajustes' },
];

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Calculator className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 leading-tight">Costify</h1>
            <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
              Ficha de costos para MIPYME
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                activeTab === id
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
