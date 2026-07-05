'use client';

import { AlertTriangle, ChevronRight, Info, X } from 'lucide-react';
import type { PriceReviewAlertTarget } from '@costify/shared/domain/exchange-rates';
import type { ProductCalculation, RawMaterial } from '@costify/shared/domain/types';
import { useActivePriceReviewAlerts } from '@/hooks/use-exchange-rates-context';

interface PriceReviewAlertsProps {
  materials: RawMaterial[];
  products: ProductCalculation[];
  onNavigateToTarget?: (target: PriceReviewAlertTarget) => void;
  className?: string;
}

export function PriceReviewAlerts({
  materials,
  products,
  onNavigateToTarget,
  className = '',
}: PriceReviewAlertsProps) {
  const { alerts, dismissAlert } = useActivePriceReviewAlerts(materials, products);

  if (alerts.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {alerts.map((alert) => {
        const Icon = alert.severity === 'warning' ? AlertTriangle : Info;
        const styles =
          alert.severity === 'warning'
            ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
            : 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100';

        const canNavigate = Boolean(alert.target && onNavigateToTarget);

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-2 rounded-xl border px-3 py-3 text-sm ${styles}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <button
              type="button"
              disabled={!canNavigate}
              onClick={() => alert.target && onNavigateToTarget?.(alert.target)}
              className={`min-w-0 flex-1 text-left ${canNavigate ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
            >
              <p>{alert.message}</p>
              {canNavigate && alert.actionLabel ? (
                <p className="mt-1 text-xs font-semibold opacity-80">{alert.actionLabel}</p>
              ) : null}
            </button>
            {canNavigate ? <ChevronRight className="w-4 h-4 shrink-0 mt-1 opacity-70" /> : null}
            <button
              type="button"
              aria-label="Cerrar alerta"
              onClick={(event) => {
                event.stopPropagation();
                dismissAlert(alert.id);
              }}
              className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
