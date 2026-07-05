'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import type { SubscriptionPlan, TenantSubscription } from '@costify/shared/domain/subscription';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatSubscriptionExpiry,
  getSubscriptionPlanPriceUsd,
  getSubscriptionStatusLabel,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface SubscriptionPanelProps {
  businessName: string;
  contactName: string;
  contactEmail: string;
  subscription?: TenantSubscription | null;
  manageable?: boolean;
  onChangePlan?: (plan: SubscriptionPlan) => Promise<void>;
}

function statusStyles(subscription: TenantSubscription): string {
  if (subscription.status === 'active') {
    if (subscription.expiresAt && subscription.expiresAt < Date.now()) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    }
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
  if (subscription.status === 'pending_payment') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
  }
  return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
}

export function SubscriptionPanel({
  businessName,
  contactName,
  contactEmail,
  subscription,
  manageable = false,
  onChangePlan,
}: SubscriptionPanelProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription?.requestedPlan ?? subscription?.plan ?? 'monthly'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscription) return;
    setSelectedPlan(subscription.requestedPlan ?? subscription.plan);
  }, [subscription?.plan, subscription?.requestedPlan, subscription]);

  if (!subscription) {
    return (
      <Card>
        <SectionHeader
          icon={CreditCard}
          title="Plan de suscripción"
          description="No hay información de suscripción para este negocio."
        />
      </Card>
    );
  }

  const isExpired =
    subscription.status === 'active' &&
    Boolean(subscription.expiresAt && subscription.expiresAt < Date.now());
  const needsPayment = subscription.status === 'pending_payment' || isExpired;
  const planChanged = selectedPlan !== subscription.plan;
  const hasPendingPlanChange =
    Boolean(subscription.requestedPlan) && subscription.requestedPlan !== subscription.plan;
  const canRequestPlan = needsPayment || planChanged;

  function openWhatsAppForPlan(plan: SubscriptionPlan) {
    const priceUsd = getSubscriptionPlanPriceUsd(plan);
    const url = buildWhatsAppPaymentUrl(
      buildWhatsAppPaymentMessage({
        businessName,
        contactName,
        email: contactEmail,
        plan,
        priceUsd,
        isRenewal: !needsPayment || isExpired,
      })
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleRequestPlan() {
    if (!onChangePlan || !canRequestPlan) return;
    setSaving(true);
    setError(null);
    try {
      if (planChanged) {
        await onChangePlan(selectedPlan);
      }
      openWhatsAppForPlan(selectedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        icon={CreditCard}
        title="Plan de suscripción"
        description={
          manageable
            ? 'Elige tu plan y continúa por WhatsApp para pagar.'
            : 'Estado de tu plan y opciones de pago o renovación'
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              statusStyles(subscription)
            )}
          >
            {isExpired ? 'Vencida' : getSubscriptionStatusLabel(subscription)}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {SUBSCRIPTION_PLAN_LABELS[subscription.plan]}
          </span>
        </div>

        {hasPendingPlanChange && subscription.requestedPlan ? (
          <p className="text-xs text-muted">
            Cambio solicitado: {SUBSCRIPTION_PLAN_LABELS[subscription.requestedPlan]} (pendiente de
            confirmación)
          </p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
            <dt className="text-xs text-muted">Precio del plan</dt>
            <dd className="font-semibold mt-1">{subscription.priceUsd.toFixed(2)} USD</dd>
            {subscription.discountPercent > 0 ? (
              <p className="text-xs text-muted mt-1">
                {subscription.discountPercent}% de descuento sobre el precio mensual
              </p>
            ) : (
              <p className="text-xs text-muted mt-1">
                {subscription.monthlyPriceUsd.toFixed(2)} USD / mes
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
            <dt className="text-xs text-muted">Vencimiento</dt>
            <dd className="font-semibold mt-1">
              {subscription.status === 'active'
                ? formatSubscriptionExpiry(subscription.expiresAt)
                : 'Pendiente de activación'}
            </dd>
          </div>
        </dl>

        {manageable && onChangePlan ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Plan</p>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_PLANS.map((planId) => {
                const selected = selectedPlan === planId;
                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => setSelectedPlan(planId)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                      selected ? 'border-brand bg-brand-muted' : 'border-border hover:bg-surface-muted'
                    )}
                  >
                    <span className="block">{SUBSCRIPTION_PLAN_LABELS[planId]}</span>
                    <span className="block text-xs text-muted mt-1">
                      {getSubscriptionPlanPriceUsd(planId).toFixed(2)} USD
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              disabled={saving || !canRequestPlan}
              onClick={() => void handleRequestPlan()}
            >
              {saving ? 'Abriendo WhatsApp…' : 'Continuar por WhatsApp'}
            </Button>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>
        ) : needsPayment ? (
          <Button type="button" onClick={() => openWhatsAppForPlan(subscription.plan)}>
            Continuar por WhatsApp
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
