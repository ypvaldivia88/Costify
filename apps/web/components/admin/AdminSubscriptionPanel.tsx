'use client';

import { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import type { PublicTenant } from '@/lib/auth/types';
import type { SubscriptionAdminAction, SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  formatSubscriptionExpiry,
  formatSubscriptionLocationBreakdown,
  getSubscriptionPlanPriceUsd,
  getSubscriptionStatusLabel,
  isSubscriptionCurrentlyActive,
  normalizeLocationCount,
  SUBSCRIPTION_MAX_LOCATION_COUNT,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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
  const [locationCount, setLocationCount] = useState(subscription?.locationCount ?? 1);
  const [saving, setSaving] = useState(false);

  if (!subscription) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Sin datos de suscripción.</p>
      </Card>
    );
  }

  const subscriptionLive = isSubscriptionCurrentlyActive(subscription);
  const previewPrice = getSubscriptionPlanPriceUsd(selectedPlan, locationCount);

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
        title="Suscripción"
        description="Activa el plan para que el cliente deje el modo solo lectura"
      />

      <div className="mt-3 rounded-xl border border-border bg-background/80 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Estado en base de datos</p>
        <p className="text-sm font-semibold">
          {getSubscriptionStatusLabel(subscription)} · {SUBSCRIPTION_PLAN_LABELS[subscription.plan]}
        </p>
        <p className="text-xs text-muted-foreground">
          {subscription.priceUsd.toFixed(2)} USD · {formatSubscriptionLocationBreakdown(subscription.locationCount)}
          {subscription.expiresAt ? ` · Vence ${formatSubscriptionExpiry(subscription.expiresAt)}` : ''}
        </p>
        {!subscriptionLive ? (
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium pt-1">
            El cliente verá <strong>solo lectura</strong> hasta que pulses «Activar acceso completo».
            Debe recargar la app o volver a entrar.
          </p>
        ) : (
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium pt-1">
            Acceso completo activo en el servidor.
          </p>
        )}
        {subscription.requestedPlan && subscription.requestedPlan !== subscription.plan ? (
          <p className="text-xs text-amber-700 dark:text-amber-300 pt-1">
            Solicitud del cliente: {SUBSCRIPTION_PLAN_LABELS[subscription.requestedPlan]}
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Locales facturados"
          type="number"
          min={1}
          max={SUBSCRIPTION_MAX_LOCATION_COUNT}
          value={String(locationCount)}
          onChange={(e) =>
            setLocationCount(normalizeLocationCount(Number(e.target.value) || 1))
          }
        />
        <p className="text-xs text-muted-foreground -mt-2">
          {formatSubscriptionLocationBreakdown(locationCount)} · {previewPrice.toFixed(2)} USD /{' '}
          {SUBSCRIPTION_PLAN_LABELS[selectedPlan]}
        </p>

        <div>
          <p className="text-sm font-semibold mb-2">Plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const selected = selectedPlan === plan;
              return (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'min-h-11 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors text-left',
                    selected ? 'border-brand bg-brand-muted' : 'border-border hover:bg-muted/50'
                  )}
                >
                  {SUBSCRIPTION_PLAN_LABELS[plan]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={() => void runAction('activate', selectedPlan)}
          >
            <RefreshCw className="w-4 h-4" />
            Activar acceso completo
          </Button>
          <p className="text-xs text-muted-foreground">
            Equivale a cobrar y activar el plan seleccionado. Usa esto tras aprobar un cliente o renovar el demo.
          </p>
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Otras acciones
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void runAction('renew', selectedPlan)}
            >
              Renovar periodo
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void runAction('set_plan', selectedPlan)}
            >
              Cambiar plan (pendiente pago)
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void runAction('pending')}
            >
              Marcar pendiente de pago
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              className="text-destructive hover:text-destructive"
              onClick={() => void runAction('expire')}
            >
              Marcar vencida
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
