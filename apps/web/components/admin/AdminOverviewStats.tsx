'use client';

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
import { StatCard } from '@/components/ui/StatCard';

interface AdminOverviewStatsProps {
  stats: AdminOverviewStats;
}

export function AdminOverviewStatsGrid({ stats }: AdminOverviewStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-4">
        <StatCard
          label="Clientes totales"
          value={String(stats.totalTenants)}
          subtext={`${stats.activeTenants} activos · ${stats.pendingTenants} pendientes`}
          variant="accent"
        />
      </Card>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <StatCard
            label="Usuarios"
            value={String(stats.totalUsers)}
            subtext="Sin contar super admin"
          />
          <Users className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <StatCard
            label="MRR estimado"
            value={`$${stats.estimatedMrrUsd.toFixed(0)}`}
            subtext="Suscripciones activas (USD/mes)"
            variant="accent"
          />
          <DollarSign className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <StatCard
            label="Suscripciones"
            value={String(stats.activeSubscriptions)}
            subtext={`${stats.pendingPayments} pago pendiente · ${stats.expiredSubscriptions} vencidas`}
            variant={stats.pendingPayments > 0 ? 'warning' : 'default'}
          />
          <CreditCard className="w-4 h-4 text-muted shrink-0 mt-0.5" />
        </div>
      </Card>

      {stats.pendingTenants > 0 ? (
        <Card className="p-4 sm:col-span-2 xl:col-span-4 border-brand/30 bg-brand-muted/15">
          <div className="flex items-center gap-2 text-sm">
            <Clock3 className="w-4 h-4 text-brand shrink-0" />
            <p>
              <strong>{stats.pendingTenants}</strong> solicitud
              {stats.pendingTenants === 1 ? '' : 'es'} pendiente
              {stats.pendingTenants === 1 ? '' : 's'} de aprobación — revisa la tabla de clientes.
            </p>
          </div>
        </Card>
      ) : null}

      {stats.suspendedTenants > 0 ? (
        <Card className="p-4 sm:col-span-2 xl:col-span-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <UserX className="w-4 h-4 shrink-0" />
            <p>
              <strong>{stats.suspendedTenants}</strong> cliente
              {stats.suspendedTenants === 1 ? '' : 's'} suspendido
              {stats.suspendedTenants === 1 ? '' : 's'}.
            </p>
          </div>
        </Card>
      ) : null}

      {stats.totalTenants === 0 ? (
        <Card className="p-4 sm:col-span-2 xl:col-span-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Building2 className="w-4 h-4 shrink-0" />
            <p>Aún no hay clientes registrados.</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
