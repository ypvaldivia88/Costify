'use client';

import { CreditCard, MessageCircle } from 'lucide-react';
import type { TenantSubscription } from '@costify/shared/domain/subscription';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatSubscriptionExpiry,
  getSubscriptionStatusLabel,
  SUBSCRIPTION_PLAN_LABELS,
  WHATSAPP_SUPPORT_NUMBER,
} from '@costify/shared/domain/subscription';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

interface SubscriptionPanelProps {
  businessName: string;
  contactName: string;
  contactEmail: string;
  subscription?: TenantSubscription | null;
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
}: SubscriptionPanelProps) {
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

  return (
    <Card>
      <SectionHeader
        icon={CreditCard}
        title="Plan de suscripción"
        description="Estado de tu plan y opciones de pago o renovación"
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
