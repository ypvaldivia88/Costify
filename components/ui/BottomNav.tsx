'use client';

import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { cn } from '@/lib/utils';

export type { AppTab };

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  productsCount: number;
  rawMaterialsCount?: number;
  alertCount?: number;
}

export function BottomNav({
  activeTab,
  onTabChange,
  productsCount,
  rawMaterialsCount = 0,
  alertCount = 0,
}: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-surface/95 backdrop-blur-md border-t border-border safe-bottom"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const count =
            id === 'products'
              ? productsCount
              : id === 'raw-materials'
                ? rawMaterialsCount
                : id === 'warehouses'
                  ? alertCount
                  : 0;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-16 transition-colors active:scale-[0.98]',
                active ? 'text-brand' : 'text-muted'
              )}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                      id === 'warehouses' ? 'bg-red-500' : 'bg-brand'
                    }`}
                  >
                    {count > 99 ? '99+' : count}
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
