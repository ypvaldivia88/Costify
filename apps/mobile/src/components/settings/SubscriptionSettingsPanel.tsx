import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import { isSubscriptionActive } from '@costify/shared/domain/access';
import { apiFetch, requestSubscriptionPlanChange } from '@/api/client';
import type { AccountDetails, SessionUser } from '@/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/ui/Card';
import { SubscriptionPanel } from '@/components/settings/SubscriptionPanel';

interface SubscriptionSettingsPanelProps {
  user: SessionUser | null | undefined;
}

export function SubscriptionSettingsPanel({ user }: SubscriptionSettingsPanelProps) {
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    const response = await apiFetch('/api/account');
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos de la suscripción.');
    }
    const json = (await response.json()) as AccountDetails;
    setAccount(json);
    return json;
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const json = await loadAccount();
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
        <Text style={{ color: colors.muted, fontSize: 14 }}>Cargando suscripción…</Text>
      </Card>
    );
  }

  if (!account?.tenant) {
    return null;
  }

  async function handleChangePlan(plan: SubscriptionPlan) {
    await requestSubscriptionPlanChange(plan);
    await loadAccount();
    await refresh();
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
