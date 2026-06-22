'use client';

import { cn } from '@/lib/utils';

export type WarehouseSubview = 'stock' | 'movements' | 'warehouses' | 'alerts';

const SUBVIEWS: { id: WarehouseSubview; label: string }[] = [
  { id: 'stock', label: 'Stock actual' },
  { id: 'movements', label: 'Movimientos' },
  { id: 'warehouses', label: 'Almacenes' },
  { id: 'alerts', label: 'Alertas' },
];

interface WarehouseSubNavProps {
  active: WarehouseSubview;
  onChange: (view: WarehouseSubview) => void;
  alertCount?: number;
}

export function WarehouseSubNav({ active, onChange, alertCount = 0 }: WarehouseSubNavProps) {
  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
      aria-label="Secciones de almacén"
    >
      {SUBVIEWS.map(({ id, label }) => {
        const isActive = active === id;
        const showBadge = id === 'alerts' && alertCount > 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-1.5 shrink-0 min-h-10 px-4 rounded-xl text-sm font-semibold border transition-colors',
              isActive
                ? 'border-brand bg-brand-muted text-brand-foreground'
                : 'border-border text-muted hover:text-foreground hover:bg-surface-muted'
            )}
          >
            {label}
            {showBadge && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
