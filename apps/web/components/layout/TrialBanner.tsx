'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const VISIBLE_MS = 8000;
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
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<'in' | 'out' | 'hidden'>('hidden');
  const [refreshing, setRefreshing] = useState(false);
  const isTrial = user?.accessLevel === 'trial';
  const isReadonly = user?.accessLevel === 'readonly';

  useEffect(() => {
    if (!user || !shouldShowAccessBanner(user)) {
      setPhase('hidden');
      return;
    }
    const bannerKey = getBannerKey(user);
    if (!isReadonly && dismissedBannerKeys.has(bannerKey)) {
      setPhase('hidden');
      return;
    }
    setPhase('in');
    const fadeTimer = setTimeout(() => setPhase('out'), VISIBLE_MS);
    const hideTimer = setTimeout(() => {
      if (!isReadonly) {
        dismissedBannerKeys.add(bannerKey);
      }
      setPhase('hidden');
    }, VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [user?.accessLevel, user?.subscriptionStatus, user?.userId, user, isReadonly]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updated = await refresh();
      if (updated?.accessLevel === 'full') {
        showToast('Sesión actualizada. Ya puedes editar.', 'success');
      } else {
        showToast(
          'La suscripción sigue pendiente. El administrador debe pulsar «Activar acceso completo» en el panel.',
          'error'
        );
      }
    } catch {
      showToast('No se pudo actualizar la sesión. Vuelve a iniciar sesión.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  if (!user || phase === 'hidden' || !shouldShowAccessBanner(user)) {
    return null;
  }

  if (isReadonly) {
    return (
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-center sm:text-left border rounded-lg px-3 py-2 border-amber-500/30 bg-amber-500/10',
          className
        )}
      >
        <p className="flex-1 text-muted-foreground">
          {getBannerMessage(user)}. Si el administrador ya activó tu cuenta, actualiza la sesión.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 w-full sm:w-auto"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          Actualizar sesión
        </Button>
      </div>
    );
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
