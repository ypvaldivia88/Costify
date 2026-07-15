'use client';

import { LayoutGrid } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/navigation/tabs';
import type { AppTab } from '@/lib/navigation/tabs';
import { PRIMARY_BOTTOM_TAB_IDS, type NavItemMeta } from '@costify/client-data';
import { cn } from '@/lib/utils';

export type { AppTab };

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenMenu: () => void;
  productsCount: number;
  alertCount?: number;
  navItems?: NavItemMeta[];
}

export function BottomNav({
  activeTab,
  onTabChange,
  onOpenMenu,
  productsCount,
  alertCount = 0,
}: BottomNavProps) {
  const primaryItems = NAV_ITEMS.filter((item) => PRIMARY_BOTTOM_TAB_IDS.includes(item.id));
  const isSecondaryActive = !PRIMARY_BOTTOM_TAB_IDS.includes(activeTab);

  return (
    <nav
      className="is-overlay fixed bottom-0 inset-x-0 z-50 md:hidden safe-bottom px-4 pb-3"
      aria-label="Navegación principal"
    >
      <div className="glass rounded-2xl shadow-float border border-border/60">
        <div className="flex items-stretch">
          {primaryItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const count =
              id === 'home' || id === 'warehouses'
                ? alertCount
                : id === 'products'
                  ? productsCount
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
                  {count > 0 ? (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center',
                        id === 'home' || id === 'warehouses' ? 'bg-red-500' : 'bg-brand'
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                </span>
                <span className={cn('text-[11px] font-semibold', active && 'text-brand')}>
                  {label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-current={isSecondaryActive ? 'page' : undefined}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[60px] transition-all duration-200 active:scale-[0.97] rounded-xl',
              isSecondaryActive ? 'text-brand' : 'text-muted'
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                isSecondaryActive && 'bg-brand-muted'
              )}
            >
              <LayoutGrid className="w-5 h-5" strokeWidth={isSecondaryActive ? 2.5 : 2} />
            </span>
            <span className={cn('text-[11px] font-semibold', isSecondaryActive && 'text-brand')}>
              Más
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
