'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/types';
import { formatTrialRemaining } from '@costify/shared/domain/access';
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
}

export function TrialBanner({ user, className, onOpenSubscription }: TrialBannerProps) {
  if (!user || user.role === 'super_admin' || user.accessLevel === 'full') {
    return null;
  }

  const isTrial = user.accessLevel === 'trial';
  const trialRemaining =
    user.trialEndsAt != null ? formatTrialRemaining(user.trialEndsAt) : null;

  const whatsappUrl = buildWhatsAppPaymentUrl(
    buildWhatsAppPaymentMessage({
      businessName: user.tenantName ?? 'Mi negocio',
      contactName: user.name,
      email: user.email,
      plan: 'monthly',
      priceUsd: 10,
      isRenewal: !isTrial,
    })
  );

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        isTrial
          ? 'border-brand/40 bg-brand-muted/40 text-foreground'
          : 'border-amber-500/40 bg-amber-500/10 text-foreground',
        className
      )}
    >
      <p className="font-semibold">
        {isTrial
          ? user.tenantPending
            ? 'Cuenta en periodo de prueba'
            : 'Periodo de prueba activo'
          : 'Cuenta en modo solo lectura'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        {isTrial ? (
          <>
            Prueba Costify con hasta {user.trialProductLimit ?? 5} productos y{' '}
            {user.trialRawMaterialLimit ?? 10} materias primas en este dispositivo.
            {trialRemaining ? ` ${trialRemaining}.` : ''}
            {user.tenantPending
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
      </div>
    </div>
  );
}
