'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { usePriceReviewAlerts } from '@/hooks/use-exchange-rates-context';
import type { ProductCalculation, RawMaterial } from '@/lib/domain/types';

interface PriceReviewAlertsProps {
  materials: RawMaterial[];
  products: ProductCalculation[];
}

export function PriceReviewAlerts({ materials, products }: PriceReviewAlertsProps) {
  const alerts = usePriceReviewAlerts(materials, products);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const Icon = alert.severity === 'warning' ? AlertTriangle : Info;
        const styles =
          alert.severity === 'warning'
            ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
            : 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100';

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{alert.message}</p>
          </div>
        );
      })}
    </div>
  );
}
