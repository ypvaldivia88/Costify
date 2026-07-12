'use client';

import type { AdminChartSlice } from '@/lib/admin/types';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface AdminBarChartProps {
  title: string;
  description?: string;
  data: AdminChartSlice[];
  barClassName?: string;
  emptyLabel?: string;
}

export function AdminBarChart({
  title,
  description,
  data,
  barClassName,
  emptyLabel = 'Sin datos',
}: AdminBarChartProps) {
  const max = Math.max(...data.map((item) => item.count), 1);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="p-4 h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-sm">{title}</h3>
        {description ? <p className="text-xs text-muted mt-0.5">{description}</p> : null}
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const widthPercent = Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-muted-foreground truncate">{item.label}</span>
                  <span className="font-semibold tabular-nums shrink-0">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-brand transition-all', barClassName)}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

interface AdminChartsGridProps {
  tenantsByStatus: AdminChartSlice[];
  tenantsByPlan: AdminChartSlice[];
  registrationsByMonth: AdminChartSlice[];
}

export function AdminChartsGrid({
  tenantsByStatus,
  tenantsByPlan,
  registrationsByMonth,
}: AdminChartsGridProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <AdminBarChart title="Clientes por estado" data={tenantsByStatus} />
      <AdminBarChart title="Planes contratados" data={tenantsByPlan} barClassName="bg-emerald-500" />
      <AdminBarChart
        title="Registros (últimos 6 meses)"
        description="Nuevos negocios por mes"
        data={registrationsByMonth}
        barClassName="bg-sky-500"
        emptyLabel="Sin registros en el periodo"
      />
    </div>
  );
}
