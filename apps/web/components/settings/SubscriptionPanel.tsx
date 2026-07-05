'use client';

import { useState } from 'react';
import { CreditCard, MessageCircle } from 'lucide-react';
import type { SubscriptionPlan, TenantSubscription } from '@costify/shared/domain/subscription';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatSubscriptionExpiry,
  getSubscriptionPlanPriceUsd,
  getSubscriptionStatusLabel,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
  WHATSAPP_SUPPORT_NUMBER,
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
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(subscription?.plan ?? 'monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const whatsappUrl = buildWhatsAppPaymentUrl(
    buildWhatsAppPaymentMessage({
      businessName,
      contactName,
      email: contactEmail,
      plan: subscription.plan,
      priceUsd: subscription.priceUsd,
      isRenewal: !needsPayment || isExpired,
    })
  );

  async function handleChangePlan() {
    if (!subscription || !onChangePlan || selectedPlan === subscription.plan) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await onChangePlan(selectedPlan);
      setSuccess('Plan actualizado. Envía el comprobante por WhatsApp para activarlo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el plan.');
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
            ? 'Gestiona tu plan y envía el pago por WhatsApp.'
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
            <p className="text-sm font-semibold">Cambiar plan</p>
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
              disabled={saving || selectedPlan === subscription.plan}
              onClick={() => void handleChangePlan()}
            >
              {saving ? 'Guardando…' : 'Solicitar cambio de plan'}
            </Button>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            {success ? <p className="text-xs text-brand">{success}</p> : null}
          </div>
        ) : null}

        {needsPayment ? (
          <div className="rounded-xl border border-brand/30 bg-brand-muted/40 p-4 space-y-3">
            <p className="text-sm text-foreground">
              El pago se gestiona de forma personal. Escríbenos por WhatsApp al{' '}
              <strong>{WHATSAPP_SUPPORT_NUMBER}</strong> para pagar y solicitar la activación o
              renovación de tu cuenta.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 min-h-11 px-4 py-2.5 text-sm bg-brand-gradient text-white hover:brightness-110 active:brightness-95 shadow-glow"
            >
              <MessageCircle className="w-4 h-4" />
              Pagar o renovar por WhatsApp
            </a>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Para renovar antes del vencimiento, contáctanos por WhatsApp ({WHATSAPP_SUPPORT_NUMBER}
            ).
          </p>
        )}
      </div>
    </Card>
  );
}
