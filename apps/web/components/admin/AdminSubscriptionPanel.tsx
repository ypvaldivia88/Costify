'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import type { PublicTenant } from '@/lib/auth/types';
import type { SubscriptionAdminAction, SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  formatSubscriptionExpiry,
  formatSubscriptionLocationBreakdown,
  getSubscriptionPlanPriceUsd,
  getSubscriptionStatusLabel,
  normalizeLocationCount,
  SUBSCRIPTION_MAX_LOCATION_COUNT,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface AdminSubscriptionPanelProps {
  tenant: PublicTenant;
  onUpdated: () => void;
}

export function AdminSubscriptionPanel({ tenant, onUpdated }: AdminSubscriptionPanelProps) {
  const { showToast } = useToast();
  const subscription = tenant.subscription;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription?.requestedPlan ?? subscription?.plan ?? 'monthly'
  );
  const [locationCount, setLocationCount] = useState(
    subscription?.locationCount ?? 1
  );
  const [saving, setSaving] = useState(false);

  if (!subscription) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted">Sin datos de suscripción.</p>
      </Card>
    );
  }

  const runAction = async (action: SubscriptionAdminAction, plan?: SubscriptionPlan) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenant.tenantId}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          plan,
          locationCount: normalizeLocationCount(locationCount),
        }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo actualizar la suscripción.');
      }
      showToast('Suscripción actualizada.', 'success');
      onUpdated();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 border-brand/30 bg-brand-muted/20">
      <SectionHeader
        icon={CreditCard}
        title="Gestionar suscripción"
        description="Activa, renueva o cambia el plan del cliente"
      />

      <div className="space-y-4 mt-2">
        <div>
          <p className="text-xs text-muted">Estado actual</p>
          <p className="text-sm font-semibold">
            {getSubscriptionStatusLabel(subscription)} · {SUBSCRIPTION_PLAN_LABELS[subscription.plan]}
          </p>
          <p className="text-xs text-muted mt-1">
            {subscription.priceUsd.toFixed(2)} USD ·{' '}
            {formatSubscriptionLocationBreakdown(subscription.locationCount)}
            {subscription.expiresAt
              ? ` · Vence: ${formatSubscriptionExpiry(subscription.expiresAt)}`
              : ''}
          </p>
          {subscription.requestedPlan && subscription.requestedPlan !== subscription.plan ? (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
              Solicitud del cliente: cambio a {SUBSCRIPTION_PLAN_LABELS[subscription.requestedPlan]}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Locales facturados</p>
          <input
            type="number"
            min={1}
            max={SUBSCRIPTION_MAX_LOCATION_COUNT}
            value={locationCount}
            onChange={(e) =>
              setLocationCount(normalizeLocationCount(Number(e.target.value) || 1))
            }
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted mt-1">
            {formatSubscriptionLocationBreakdown(locationCount)} ·{' '}
            {getSubscriptionPlanPriceUsd(selectedPlan, locationCount).toFixed(2)} USD con plan{' '}
            {SUBSCRIPTION_PLAN_LABELS[selectedPlan]}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Plan a aplicar</p>
          <div className="grid grid-cols-3 gap-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const selected = selectedPlan === plan;
              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                    selected ? 'border-brand bg-brand-muted' : 'border-border hover:bg-surface-muted'
                  )}
                >
                  {SUBSCRIPTION_PLAN_LABELS[plan]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={saving} onClick={() => void runAction('activate', selectedPlan)}>
            Activar plan
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void runAction('renew', selectedPlan)}>
            Renovar
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void runAction('set_plan', selectedPlan)}>
            Cambiar plan
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void runAction('pending')}>
            Pendiente de pago
          </Button>
          <Button type="button" variant="outline" disabled={saving} onClick={() => void runAction('expire')}>
            Marcar vencida
          </Button>
        </div>
      </div>
    </Card>
  );
}
