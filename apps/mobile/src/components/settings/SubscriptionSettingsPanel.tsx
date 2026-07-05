import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import { isSubscriptionActive } from '@costify/shared/domain/access';
import { apiFetch, requestSubscriptionPlanChange } from '@/api/client';
import type { AccountDetails, SessionUser } from '@/auth/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
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
  const [refreshing, setRefreshing] = useState(false);

  const loadAccount = useCallback(async () => {
    const response = await apiFetch('/api/account');
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos de la suscripción.');
    }
    const json = (await response.json()) as AccountDetails;
    setAccount(json);
    return json;
  }, []);

  const refreshAccess = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      const latest = await loadAccount();
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
    <View style={styles.stack}>
      <Card>
        <Text style={[styles.refreshTitle, { color: colors.foreground }]}>
          Estado de acceso
        </Text>
        <Text style={[styles.refreshHint, { color: colors.muted }]}>
          Si ya pagaste o el administrador activó tu plan, actualiza el estado sin cerrar sesión.
        </Text>
        <Button variant="outline" onPress={() => void refreshAccess()} disabled={refreshing}>
          <RefreshCw size={14} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>
            {refreshing ? ' Actualizando…' : ' Actualizar estado de cuenta'}
          </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  refreshTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  refreshHint: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
});
