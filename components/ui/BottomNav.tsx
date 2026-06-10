'use client';

import { Calculator, LayoutList, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AppTab = 'calculator' | 'inventory' | 'settings';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  inventoryCount: number;
}

const tabs: { id: AppTab; label: string; icon: typeof Calculator }[] = [
  { id: 'calculator', label: 'Calcular', icon: Calculator },
  { id: 'inventory', label: 'Historial', icon: LayoutList },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export function BottomNav({ activeTab, onTabChange, inventoryCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-zinc-200 safe-bottom">
      <div className="flex items-stretch">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-16 transition-colors',
                active ? 'text-emerald-700' : 'text-zinc-400'
              )}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {id === 'inventory' && inventoryCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {inventoryCount > 9 ? '9+' : inventoryCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
