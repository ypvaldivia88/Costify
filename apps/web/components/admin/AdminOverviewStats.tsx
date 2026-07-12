'use client';

import type { ReactNode } from 'react';
import {
  Building2,
  Clock3,
  CreditCard,
  DollarSign,
  Users,
  UserX,
} from 'lucide-react';
import type { AdminOverviewStats } from '@/lib/admin/types';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface AdminKpiCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  valueClassName?: string;
}

function AdminKpiCard({ icon, title, value, detail, valueClassName }: AdminKpiCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-3 min-h-[8.5rem]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand">
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted leading-snug">{title}</p>
      </div>
      <p className={cn('text-3xl font-bold tabular-nums tracking-tight text-foreground', valueClassName)}>
        {value}
      </p>
      <p className="text-sm text-muted leading-relaxed">{detail}</p>
    </Card>
  );
}

interface AdminOverviewStatsProps {
  stats: AdminOverviewStats;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function AdminOverviewStatsGrid({ stats }: AdminOverviewStatsProps) {
  const pendingLabel = plural(stats.pendingTenants, 'espera aprobación', 'esperan aprobación');
  const suspendedLabel = plural(stats.suspendedTenants, 'suspendido', 'suspendidos');

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon={<Building2 className="w-4 h-4" aria-hidden />}
          title="Negocios registrados"
          value={String(stats.totalTenants)}
          detail={`${stats.activeTenants} ${plural(stats.activeTenants, 'activo', 'activos')} · ${stats.pendingTenants} ${pendingLabel}`}
          valueClassName="text-brand"
        />
        <AdminKpiCard
          icon={<Users className="w-4 h-4" aria-hidden />}
          title="Cuentas de usuario"
          value={String(stats.totalUsers)}
          detail="Personas con login en un negocio (no incluye super admin)."
        />
        <AdminKpiCard
          icon={<DollarSign className="w-4 h-4" aria-hidden />}
          title="Ingreso mensual estimado"
          value={`$${stats.estimatedMrrUsd.toFixed(0)}`}
          detail={
            stats.activeSubscriptions > 0
              ? `Suma de ${stats.activeSubscriptions} ${plural(stats.activeSubscriptions, 'suscripción activa', 'suscripciones activas')} (USD/mes).`
              : 'Sin suscripciones activas con pago confirmado.'
          }
          valueClassName="text-brand"
        />
        <AdminKpiCard
          icon={<CreditCard className="w-4 h-4" aria-hidden />}
          title="Estado de suscripciones"
          value={String(stats.activeSubscriptions)}
          detail={`${stats.activeSubscriptions} ${plural(stats.activeSubscriptions, 'activa', 'activas')} · ${stats.pendingPayments} sin pagar · ${stats.expiredSubscriptions} ${plural(stats.expiredSubscriptions, 'vencida', 'vencidas')}`}
          valueClassName={stats.pendingPayments > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
        />
      </div>

      {stats.pendingTenants > 0 ? (
        <Card className="p-4 border-brand/30 bg-brand-muted/15">
          <div className="flex items-start gap-3 text-sm">
            <Clock3 className="w-5 h-5 text-brand shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">
                {stats.pendingTenants}{' '}
                {plural(stats.pendingTenants, 'negocio nuevo', 'negocios nuevos')} sin aprobar
              </p>
              <p className="text-muted mt-1">
                Aparecen en la tabla con estado <strong>Pendiente</strong>. Revísalos, confirma el pago
                por WhatsApp y pulsa Aprobar.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {stats.suspendedTenants > 0 ? (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3 text-sm">
            <UserX className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-amber-900 dark:text-amber-100">
              <strong>{stats.suspendedTenants}</strong> {suspendedLabel} — no pueden usar la app hasta
              que los reactives.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
