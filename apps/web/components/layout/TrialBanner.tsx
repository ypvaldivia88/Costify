'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, RefreshCw, X } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  WHATSAPP_SUPPORT_NUMBER,
} from '@costify/shared/domain/subscription';
import { cn } from '@/lib/utils';

interface TrialBannerProps {
  user: SessionUser | null | undefined;
  className?: string;
  onOpenSubscription?: () => void;
  onRefresh?: () => Promise<void>;
}

export function TrialBanner({ user, className, onOpenSubscription, onRefresh }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [user?.accessLevel, user?.subscriptionStatus, user?.userId]);

  if (!shouldShowAccessBanner(user) || dismissed) {
    return null;
  }

  const isTrial = user?.accessLevel === 'trial';
  const trialRemaining =
    user?.trialEndsAt != null ? formatTrialRemaining(user.trialEndsAt) : null;

  const whatsappUrl = buildWhatsAppPaymentUrl(
    buildWhatsAppPaymentMessage({
      businessName: user?.tenantName ?? 'Mi negocio',
      contactName: user?.name ?? '',
      email: user?.email ?? '',
      plan: 'monthly',
      priceUsd: 10,
      isRenewal: !isTrial,
    })
  );

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm relative',
        isTrial
          ? 'border-brand/40 bg-brand-muted/40 text-foreground'
          : 'border-amber-500/40 bg-amber-500/10 text-foreground',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <p className="font-semibold flex-1">
          {isTrial
            ? user?.tenantPending
              ? 'Cuenta en periodo de prueba'
              : 'Periodo de prueba activo'
            : 'Cuenta en modo solo lectura'}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-foreground p-1 -m-1"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {isTrial ? (
          <>
            Prueba Costify con hasta {user?.trialProductLimit ?? 5} productos y{' '}
            {user?.trialRawMaterialLimit ?? 10} materias primas en este dispositivo.
            {trialRemaining ? ` ${trialRemaining}.` : ''}
            {user?.tenantPending
              ? ' Envía el pago por WhatsApp y espera la activación para sincronizar en la nube.'
              : ' Activa tu suscripción para desbloquear todo el acceso.'}
          </>
        ) : (
          'Tu periodo de prueba terminó o la suscripción no está activa. Puedes consultar tus datos, pero no editarlos hasta renovar.'
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Activar por WhatsApp ({WHATSAPP_SUPPORT_NUMBER})
        </a>
        {onOpenSubscription ? (
          <button
            type="button"
            onClick={onOpenSubscription}
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-muted"
          >
            Ver suscripción
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-muted"
          >
            Ir a ajustes
          </Link>
        )}
        {onRefresh ? (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Actualizar estado
          </button>
        ) : null}
      </div>
    </div>
  );
}
