'use client';

import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  Package,
  PackagePlus,
  Scale,
  Warehouse,
} from 'lucide-react';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation, RawMaterial, StockAlert } from '@costify/shared/domain/types';
import type { SessionUser } from '@/lib/auth/types';
import { formatCurrency } from '@costify/shared/format/currency';
import type { AppTab } from '@costify/client-data';
import { useActivePriceReviewAlerts } from '@/hooks/use-exchange-rates-context';
import { PriceReviewAlerts } from '@/components/settings/PriceReviewAlerts';
import { TrialBanner } from '@/components/layout/TrialBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { WarehouseSubview } from '@/components/warehouses/WarehouseSubNav';

export type HomeLaunchOptions = {
  productsMode?: 'create';
  warehouseSubview?: WarehouseSubview;
};

interface HomeViewProps {
  user: SessionUser | null | undefined;
  inventory: ProductCalculation[];
  materials: RawMaterial[];
  warehouses: { id: string; name: string }[];
  stockAlerts: StockAlert[];
  stockValuation: { rawMaterialsValue: number; productsValue: number; totalValue: number };
  salesCount: number;
  onNavigate: (tab: AppTab, options?: HomeLaunchOptions) => void;
  onNavigateToTarget?: (target: PriceReviewAlertTarget) => void;
  className?: string;
}

function KpiCard({
  label,
  value,
  hint,
  variant = 'default',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  variant?: 'default' | 'alert';
  className?: string;
}) {
  return (
    <Card
      variant={variant === 'alert' ? 'accent' : 'muted'}
      className={cn('p-4 sm:p-5', className)}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums tracking-tight',
          variant === 'alert' ? 'text-brand' : 'text-foreground'
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function HomeView({
  user,
  inventory,
  materials,
  warehouses,
  stockAlerts,
  stockValuation,
  salesCount,
  onNavigate,
  onNavigateToTarget,
  className,
}: HomeViewProps) {
  const { alerts: priceAlerts } = useActivePriceReviewAlerts(materials, inventory);
  const isEmpty = inventory.length === 0 && materials.length === 0;
  const alertCount = stockAlerts.length + priceAlerts.length;

  return (
    <div className={cn('space-y-6 max-w-3xl', className)}>
      <TrialBanner user={user} />

      {isEmpty ? (
        <Card variant="accent" className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Configura tu negocio</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sigue estos pasos para empezar a calcular costos y controlar inventario.
            </p>
          </div>
          <ol className="space-y-2 text-sm">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('raw-materials')}
                className="inline-flex items-center gap-2 font-medium text-brand hover:underline min-h-11"
              >
                <Boxes className="w-4 h-4" />
                1. Registra tu primer insumo
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('products', { productsMode: 'create' })}
                className="inline-flex items-center gap-2 font-medium text-brand hover:underline min-h-11"
              >
                <Package className="w-4 h-4" />
                2. Crea un producto con ficha de costo
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('warehouses')}
                className="inline-flex items-center gap-2 font-medium text-brand hover:underline min-h-11"
              >
                <Warehouse className="w-4 h-4" />
                3. Revisa stock en almacenes
              </button>
            </li>
          </ol>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Valor inventario"
          value={formatCurrency(stockValuation.totalValue)}
          hint={`${inventory.length} productos · ${materials.length} insumos`}
        />
        <KpiCard
          label="Alertas"
          value={String(alertCount)}
          hint={alertCount > 0 ? 'Requieren atención' : 'Todo en orden'}
          variant={alertCount > 0 ? 'alert' : 'default'}
        />
        <KpiCard
          label="Almacenes"
          value={String(warehouses.length)}
          hint={salesCount > 0 ? `${salesCount} ventas importadas` : 'Sin ventas importadas'}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {alertCount > 0 ? (
        <section aria-label="Alertas pendientes" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Pendientes
          </h2>
          <PriceReviewAlerts
            materials={materials}
            products={inventory}
            onNavigateToTarget={onNavigateToTarget}
          />
          {stockAlerts.length > 0 ? (
            <Card variant="accent" className="p-4">
              <p className="text-sm font-medium">
                {stockAlerts.length === 1
                  ? '1 alerta de stock bajo'
                  : `${stockAlerts.length} alertas de stock bajo`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 min-h-11"
                onClick={() => onNavigate('warehouses', { warehouseSubview: 'alerts' })}
              >
                Ver en almacenes
              </Button>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Acciones rápidas" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="min-h-12 justify-start gap-3 h-auto py-3 px-4"
            onClick={() => onNavigate('products', { productsMode: 'create' })}
          >
            <PackagePlus className="w-5 h-5 shrink-0 text-brand" />
            <span className="text-left">
              <span className="block font-semibold">Nuevo producto</span>
              <span className="block text-xs text-muted-foreground font-normal">Ficha de costo</span>
            </span>
          </Button>
          <Button
            variant="outline"
            className="min-h-12 justify-start gap-3 h-auto py-3 px-4"
            onClick={() => onNavigate('warehouses', { warehouseSubview: 'movements' })}
          >
            <ArrowRightLeft className="w-5 h-5 shrink-0 text-brand" />
            <span className="text-left">
              <span className="block font-semibold">Registrar movimiento</span>
              <span className="block text-xs text-muted-foreground font-normal">Entrada o salida</span>
            </span>
          </Button>
          <Button
            variant="outline"
            className="min-h-12 justify-start gap-3 h-auto py-3 px-4"
            onClick={() => onNavigate('reconciliation')}
          >
            <Scale className="w-5 h-5 shrink-0 text-brand" />
            <span className="text-left">
              <span className="block font-semibold">Conciliar ventas</span>
              <span className="block text-xs text-muted-foreground font-normal">POS vs inventario</span>
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}
