'use client';

import { useEffect, useState } from 'react';
import type { SessionUser } from '@/lib/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import { cn } from '@/lib/utils';

const VISIBLE_MS = 4500;
const FADE_MS = 600;
const dismissedBannerKeys = new Set<string>();

interface TrialBannerProps {
  user: SessionUser | null | undefined;
  className?: string;
}

function getBannerKey(user: SessionUser): string {
  return `${user.userId}:${user.accessLevel}:${user.subscriptionStatus ?? ''}`;
}

function getBannerMessage(user: SessionUser): string {
  if (user.accessLevel === 'trial') {
    const remaining =
      user.trialEndsAt != null ? formatTrialRemaining(user.trialEndsAt) : null;
    const limits = `Hasta ${user.trialProductLimit ?? 5} productos en prueba`;
    return remaining ? `${limits} · ${remaining}` : limits;
  }
  return 'Solo lectura hasta activar tu suscripción';
}

export function TrialBanner({ user, className }: TrialBannerProps) {
  const [phase, setPhase] = useState<'in' | 'out' | 'hidden'>('hidden');
  const isTrial = user?.accessLevel === 'trial';

  useEffect(() => {
    if (!user || !shouldShowAccessBanner(user)) {
      setPhase('hidden');
      return;
    }
    const bannerKey = getBannerKey(user);
    if (dismissedBannerKeys.has(bannerKey)) {
      setPhase('hidden');
      return;
    }
    setPhase('in');
    const fadeTimer = setTimeout(() => setPhase('out'), VISIBLE_MS);
    const hideTimer = setTimeout(() => {
      dismissedBannerKeys.add(bannerKey);
      setPhase('hidden');
    }, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [user?.accessLevel, user?.subscriptionStatus, user?.userId, user]);

  if (!user || phase === 'hidden' || !shouldShowAccessBanner(user)) {
    return null;
  }

  return (
    <p
      className={cn(
        'text-xs text-center text-muted border rounded-lg px-3 py-2 transition-opacity duration-[600ms]',
        isTrial ? 'border-brand/30 bg-brand-muted/30' : 'border-amber-500/30 bg-amber-500/10',
        phase === 'out' ? 'opacity-0' : 'opacity-100',
        className
      )}
    >
      {getBannerMessage(user)}
    </p>
  );
}
