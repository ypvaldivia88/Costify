'use client';

import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import type { NavItemMeta } from '@costify/client-data';
import { cn } from '@/lib/utils';

export type { AppTab };

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  productsCount: number;
  rawMaterialsCount?: number;
  alertCount?: number;
  navItems?: NavItemMeta[];
}

export function BottomNav({
  activeTab,
  onTabChange,
  productsCount,
  rawMaterialsCount = 0,
  alertCount = 0,
  navItems = NAV_ITEMS,
}: BottomNavProps) {
  const visibleIds = new Set(navItems.map((item) => item.id));
  const items = NAV_ITEMS.filter((item) => visibleIds.has(item.id));

  return (
    <nav
      className="is-overlay fixed bottom-0 inset-x-0 z-50 md:hidden safe-bottom px-4 pb-3"
      aria-label="Navegación principal"
    >
      <div className="glass rounded-2xl shadow-float border border-border/60">
        <div className="flex items-stretch">
          {items.map(({ id, label, icon: Icon }) => {
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
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[60px] transition-all duration-200 active:scale-[0.97] rounded-xl',
                  active ? 'text-brand' : 'text-muted'
                )}
              >
                <span
                  className={cn(
                    'relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                    active && 'bg-brand-muted'
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  {count > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center',
                        id === 'warehouses' ? 'bg-red-500' : 'bg-brand'
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </span>
                <span className={cn('text-[11px] font-semibold', active && 'text-brand')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
