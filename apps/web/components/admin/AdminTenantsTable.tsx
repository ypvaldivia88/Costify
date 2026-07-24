'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Download,
  MessageCircle,
  Search,
  XCircle,
} from 'lucide-react';
import type { AdminTenantRow } from '@/lib/admin/types';
import type { AccountStatus } from '@/lib/auth/types';
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
} from '@costify/shared/domain/subscription';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  formatAdminDateShort,
  subscriptionStatusTone,
  tenantStatusLabel,
  tenantStatusTone,
} from '@/lib/admin/format';

type StatusFilter = 'all' | AccountStatus;
type SortKey = 'createdAt' | 'name' | 'status';

interface AdminTenantsTableProps {
  tenants: AdminTenantRow[];
  selectedTenantId: string | null;
  onSelectTenant: (tenantId: string) => void;
  onApprove: (tenantId: string) => void;
  onReject: (tenantId: string) => void;
}

function exportTenantsCsv(tenants: AdminTenantRow[]) {
  const headers = [
    'Negocio',
    'Correo contacto',
    'Admin',
    'Correo admin',
    'Estado',
    'Plan',
    'Suscripción',
    'Precio USD',
    'Usuarios',
    'Productos',
    'Materias primas',
    'Registro',
    'Tenant ID',
  ];

  const rows = tenants.map((tenant) => {
    const subscription = tenant.subscription;
    return [
      tenant.name,
      tenant.contactEmail,
      tenant.adminName ?? '',
      tenant.adminEmail ?? '',
      tenantStatusLabel(tenant.status),
      subscription ? SUBSCRIPTION_PLAN_LABELS[subscription.plan] : '',
      subscription ? SUBSCRIPTION_STATUS_LABELS[subscription.status] : '',
      subscription ? String(subscription.priceUsd) : '',
      String(tenant.userCount),
      String(tenant.workspace?.productCount ?? 0),
      String(tenant.workspace?.rawMaterialCount ?? 0),
      formatAdminDateShort(tenant.createdAt),
      tenant.tenantId,
    ];
  });

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `costify-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminTenantsTable({
  tenants,
  selectedTenantId,
  onSelectTenant,
  onApprove,
  onReject,
}: AdminTenantsTableProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredTenants = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = tenants.filter((tenant) => {
      if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
      if (!needle) return true;

      const haystack = [
        tenant.name,
        tenant.contactEmail,
        tenant.adminEmail ?? '',
        tenant.adminName ?? '',
        tenant.tenantId,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(needle);
    });

    return filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'es');
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status, 'es');
      } else {
        cmp = a.createdAt - b.createdAt;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [tenants, query, statusFilter, sortKey, sortAsc]);

  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'active', label: 'Activos' },
    { id: 'suspended', label: 'Suspendidos' },
  ];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="font-semibold">Directorio de clientes</h3>
          <p className="text-xs text-muted mt-0.5">
            {filteredTenants.length} de {tenants.length} registros · incluye pendientes y activos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => exportTenantsCsv(filteredTenants)}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSortKey('createdAt');
              setSortAsc((value) => !value);
            }}
          >
            {sortAsc ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
            Fecha
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por negocio, correo o ID…"
            className="w-full min-h-11 pl-9 pr-3 rounded-xl border border-border bg-surface text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors',
                  active
                    ? 'border-brand bg-brand-muted text-brand'
                    : 'border-border text-muted hover:bg-surface-muted'
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border hidden md:block">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-surface-muted/80 text-left">
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5 font-semibold">Negocio</th>
              <th className="px-3 py-2.5 font-semibold">Contacto</th>
              <th className="px-3 py-2.5 font-semibold">Estado</th>
              <th className="px-3 py-2.5 font-semibold">Plan</th>
              <th className="px-3 py-2.5 font-semibold">Suscripción</th>
              <th className="px-3 py-2.5 font-semibold">Uso</th>
              <th className="px-3 py-2.5 font-semibold">Registro</th>
              <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted">
                  No hay clientes que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => {
                const subscription = tenant.subscription;
                const whatsappUrl =
                  tenant.status === 'pending' && subscription && tenant.adminEmail
                    ? buildWhatsAppPaymentUrl(
                        buildWhatsAppPaymentMessage({
                          businessName: tenant.name,
                          contactName: tenant.adminName ?? tenant.name,
                          email: tenant.adminEmail,
                          plan: subscription.plan,
                          priceUsd: subscription.priceUsd,
                          locationCount: subscription.locationCount,
                        })
                      )
                    : null;

                return (
                  <tr
                    key={tenant.tenantId}
                    className={cn(
                      'border-t border-border cursor-pointer hover:bg-surface-muted/60 transition-colors',
                      selectedTenantId === tenant.tenantId && 'bg-brand-muted/30'
                    )}
                    onClick={() => onSelectTenant(tenant.tenantId)}
                  >
                    <td className="px-3 py-3 align-top">
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-[11px] text-muted font-mono mt-0.5 truncate max-w-[180px]">
                        {tenant.tenantId}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-xs">{tenant.contactEmail}</p>
                      {tenant.adminEmail && tenant.adminEmail !== tenant.contactEmail ? (
                        <p className="text-[11px] text-muted mt-0.5">Admin: {tenant.adminEmail}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={cn(
                          'inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full',
                          tenantStatusTone(tenant.status)
                        )}
                      >
                        {tenantStatusLabel(tenant.status, {
                          createdAt: tenant.createdAt,
                          subscription: tenant.subscription,
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      {subscription ? SUBSCRIPTION_PLAN_LABELS[subscription.plan] : '—'}
                      {subscription ? (
                        <p className="text-muted mt-0.5">{subscription.priceUsd.toFixed(2)} USD</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {subscription ? (
                        <span
                          className={cn(
                            'inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full',
                            subscriptionStatusTone(subscription.status)
                          )}
                        >
                          {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-muted">
                      <p>{tenant.userCount} usuario{tenant.userCount === 1 ? '' : 's'}</p>
                      <p className="mt-0.5">
                        {tenant.workspace?.productCount ?? 0} prod. ·{' '}
                        {tenant.workspace?.rawMaterialCount ?? 0} MP
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-muted whitespace-nowrap">
                      {formatAdminDateShort(tenant.createdAt)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div
                        className="flex justify-end gap-1.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {tenant.status === 'pending' ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => onApprove(tenant.tenantId)}
                              title="Aprobar"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onReject(tenant.tenantId)}
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                        {whatsappUrl ? (
                          <Button type="button" size="sm" variant="outline" asChild>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredTenants.length === 0 ? (
          <p className="text-sm text-center text-muted py-8">No hay clientes que coincidan con los filtros.</p>
        ) : (
          filteredTenants.map((tenant) => {
            const subscription = tenant.subscription;
            const whatsappUrl =
              tenant.status === 'pending' && subscription && tenant.adminEmail
                ? buildWhatsAppPaymentUrl(
                    buildWhatsAppPaymentMessage({
                      businessName: tenant.name,
                      contactName: tenant.adminName ?? tenant.name,
                      email: tenant.adminEmail,
                      plan: subscription.plan,
                      priceUsd: subscription.priceUsd,
                      locationCount: subscription.locationCount,
                    })
                  )
                : null;

            return (
              <button
                key={tenant.tenantId}
                type="button"
                onClick={() => onSelectTenant(tenant.tenantId)}
                className={cn(
                  'w-full text-left rounded-xl border border-border p-4 space-y-3 transition-colors',
                  selectedTenantId === tenant.tenantId
                    ? 'border-brand/40 bg-brand-muted/20'
                    : 'bg-surface hover:bg-surface-muted/60'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{tenant.name}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{tenant.contactEmail}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      tenantStatusTone(tenant.status)
                    )}
                  >
                    {tenantStatusLabel(tenant.status, {
                      createdAt: tenant.createdAt,
                      subscription: tenant.subscription,
                    })}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  {subscription ? (
                    <>
                      <span
                        className={cn(
                          'inline-flex font-semibold px-2 py-0.5 rounded-full',
                          subscriptionStatusTone(subscription.status)
                        )}
                      >
                        {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
                      </span>
                      <span>{SUBSCRIPTION_PLAN_LABELS[subscription.plan]}</span>
                      <span>{subscription.priceUsd.toFixed(2)} USD</span>
                    </>
                  ) : (
                    <span>Sin suscripción</span>
                  )}
                  <span>·</span>
                  <span>{tenant.userCount} usuario{tenant.userCount === 1 ? '' : 's'}</span>
                  <span>·</span>
                  <span>{formatAdminDateShort(tenant.createdAt)}</span>
                </div>

                {tenant.status === 'pending' || whatsappUrl ? (
                  <div className="flex flex-wrap gap-2 pt-1" onClick={(event) => event.stopPropagation()}>
                    {tenant.status === 'pending' ? (
                      <>
                        <Button type="button" size="sm" onClick={() => onApprove(tenant.tenantId)}>
                          <CheckCircle2 className="w-4 h-4" />
                          Aprobar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(tenant.tenantId)}
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </Button>
                      </>
                    ) : null}
                    {whatsappUrl ? (
                      <Button type="button" size="sm" variant="outline" asChild>
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
