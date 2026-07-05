'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import { isSubscriptionActive } from '@costify/shared/domain/access';
import type { AccountDetails } from '@/lib/auth/account';
import type { SessionUser } from '@/lib/auth/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { SubscriptionPanel } from '@/components/settings/SubscriptionPanel';

interface SubscriptionSettingsPanelProps {
  user?: SessionUser | null;
}

export function SubscriptionSettingsPanel({ user }: SubscriptionSettingsPanelProps) {
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccount = useCallback(async () => {
    const response = await fetch('/api/account', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos de la suscripción.');
    }
    return (await response.json()) as AccountDetails;
  }, []);

  const refreshAccess = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      const latest = await loadAccount();
      setAccount(latest);
      if (isSubscriptionActive(latest.tenant?.subscription)) {
        showToast('Suscripción activa. Acceso completo habilitado.', 'success');
      } else {
        showToast('Estado actualizado.', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar.', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [refresh, loadAccount, showToast]);

  useEffect(() => {
    void (async () => {
      try {
        const json = await loadAccount();
        setAccount(json);
        if (
          isSubscriptionActive(json.tenant?.subscription) &&
          user?.accessLevel !== 'full'
        ) {
          await refresh();
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error al cargar.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAccount, refresh, showToast, user?.accessLevel]);

  if (!user || user.role !== 'tenant_admin') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted">Cargando suscripción…</p>
      </Card>
    );
  }

  if (!account?.tenant) {
    return null;
  }

  async function handleChangePlan(plan: SubscriptionPlan) {
    const response = await fetch('/api/account/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan }),
    });
    const json = (await response.json()) as AccountDetails & { error?: string };
    if (!response.ok) {
      throw new Error(json.error || 'No se pudo actualizar la suscripción.');
    }
    setAccount(json);
    await refresh();
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-semibold">Estado de acceso</p>
        <p className="text-xs text-muted mt-1 mb-3">
          Si ya pagaste o el administrador activó tu plan, actualiza el estado sin cerrar sesión.
        </p>
        <Button type="button" variant="outline" onClick={() => void refreshAccess()} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando…' : 'Actualizar estado de cuenta'}
        </Button>
      </Card>
      <SubscriptionPanel
        businessName={account.tenant.name}
        contactName={account.user.name}
        contactEmail={account.tenant.contactEmail || account.user.email}
        subscription={account.tenant.subscription}
        manageable
        onChangePlan={handleChangePlan}
      />
    </div>
  );
}
