'use client';

import { CostifyLogo } from '@/components/brand/CostifyLogo';
import { cn } from '@/lib/utils';
import { NAV_BY_ID, type NavItem } from '@/lib/navigation/tabs';
import type { AppTab, NavGroupMeta } from '@costify/client-data';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface AppSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  groups: NavGroupMeta[];
  accountGroup?: NavGroupMeta | null;
  tenantName?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  className?: string;
}

function SidebarNav({
  activeTab,
  onTabChange,
  groups,
  onNavigate,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  groups: NavGroupMeta[];
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Navegación principal">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map((tabId) => {
              const meta = NAV_BY_ID[tabId] as NavItem;
              const Icon = meta.icon;
              const active = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => {
                    onTabChange(tabId);
                    onNavigate?.();
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-brand-muted text-brand-foreground border border-brand/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  activeTab,
  onTabChange,
  groups,
  accountGroup,
  tenantName,
  onNavigate,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  groups: NavGroupMeta[];
  accountGroup?: NavGroupMeta | null;
  tenantName?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto">
        {tenantName ? (
          <p className="px-3 mb-4 text-xs text-muted-foreground truncate">{tenantName}</p>
        ) : null}
        <SidebarNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          groups={groups}
          onNavigate={onNavigate}
        />
      </div>
      {accountGroup ? (
        <div className="shrink-0 border-t border-border/60 pt-4 mt-2">
          <SidebarNav
            activeTab={activeTab}
            onTabChange={onTabChange}
            groups={[accountGroup]}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar({
  activeTab,
  onTabChange,
  groups,
  accountGroup,
  tenantName,
  mobileOpen = false,
  onMobileOpenChange,
  className,
}: AppSidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:w-60 xl:w-64 shrink-0 border-r border-border/60 bg-background/50',
          className
        )}
      >
        <div className="sticky top-14 flex flex-col max-h-[calc(100dvh-3.5rem)] px-3 py-5">
          <SidebarBody
            activeTab={activeTab}
            onTabChange={onTabChange}
            groups={groups}
            accountGroup={accountGroup}
            tenantName={tenantName}
          />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[min(100%,18.5rem)] p-0 flex flex-col">
          <SheetHeader className="border-b border-border px-4 py-4 text-left shrink-0">
            <CostifyLogo size="sm" />
            <SheetTitle className="text-left text-sm font-semibold truncate mt-2">
              {tenantName ?? 'Costify'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 px-3 py-4 overflow-hidden flex flex-col">
            <SidebarBody
              activeTab={activeTab}
              onTabChange={onTabChange}
              groups={groups}
              accountGroup={accountGroup}
              onNavigate={() => onMobileOpenChange?.(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
