'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import type { AccountDetails } from '@/lib/auth/account';
import type { SessionUser } from '@/lib/auth/types';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { SubscriptionPanel } from '@/components/settings/SubscriptionPanel';

interface SubscriptionSettingsPanelProps {
  user?: SessionUser | null;
}

export function SubscriptionSettingsPanel({ user }: SubscriptionSettingsPanelProps) {
  const { showToast } = useToast();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    const response = await fetch('/api/account', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos de la suscripción.');
    }
    return (await response.json()) as AccountDetails;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setAccount(await loadAccount());
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Error al cargar.', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAccount, showToast]);

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
  }

  return (
    <SubscriptionPanel
      businessName={account.tenant.name}
      contactName={account.user.name}
      contactEmail={account.tenant.contactEmail || account.user.email}
      subscription={account.tenant.subscription}
      manageable
      onChangePlan={handleChangePlan}
    />
  );
}
