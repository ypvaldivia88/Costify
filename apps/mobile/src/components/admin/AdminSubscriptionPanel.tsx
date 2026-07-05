import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import type { PublicTenant } from '@/auth/types';
import type { SubscriptionAdminAction, SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  formatSubscriptionExpiry,
  getSubscriptionStatusLabel,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
} from '@costify/shared/domain/subscription';
import { apiFetch } from '@/api/client';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface AdminSubscriptionPanelProps {
  tenant: PublicTenant;
  onUpdated: () => void;
}

export function AdminSubscriptionPanel({ tenant, onUpdated }: AdminSubscriptionPanelProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const subscription = tenant.subscription;
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription?.requestedPlan ?? subscription?.plan ?? 'monthly'
  );
  const [saving, setSaving] = useState(false);

  if (!subscription) {
    return (
      <Card>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Sin datos de suscripción.</Text>
      </Card>
    );
  }

  const runAction = async (action: SubscriptionAdminAction, plan?: SubscriptionPlan) => {
    setSaving(true);
    try {
      const response = await apiFetch(`/api/admin/tenants/${tenant.tenantId}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ action, plan }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo actualizar la suscripción.');
      }
      showToast('Suscripción actualizada.', 'success');
      onUpdated();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error al actualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="accent">
      <SectionHeader
        icon={CreditCard}
        title="Gestionar suscripción"
        description="Activa, renueva o cambia el plan del cliente"
      />

      <View style={styles.stack}>
        <View style={styles.meta}>
          <Text style={[styles.label, { color: colors.muted }]}>Estado actual</Text>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {getSubscriptionStatusLabel(subscription)} · {SUBSCRIPTION_PLAN_LABELS[subscription.plan]}
          </Text>
          <Text style={[styles.hint, { color: colors.muted }]}>
            {subscription.priceUsd.toFixed(2)} USD
            {subscription.expiresAt
              ? ` · Vence: ${formatSubscriptionExpiry(subscription.expiresAt)}`
              : ''}
          </Text>
          {subscription.requestedPlan && subscription.requestedPlan !== subscription.plan ? (
            <Text style={[styles.requestedPlan, { color: colors.warning }]}>
              Solicitud del cliente: cambio a {SUBSCRIPTION_PLAN_LABELS[subscription.requestedPlan]}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Plan a aplicar</Text>
        <View style={styles.planGrid}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const selected = selectedPlan === plan;
            return (
              <Pressable
                key={plan}
                onPress={() => setSelectedPlan(plan)}
                style={[
                  styles.planCard,
                  {
                    borderColor: selected ? colors.brand : colors.border,
                    backgroundColor: selected ? colors.brandMuted : colors.surfaceMuted,
                  },
                ]}
              >
                <Text style={[styles.planName, { color: colors.foreground }]}>
                  {SUBSCRIPTION_PLAN_LABELS[plan]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button disabled={saving} onPress={() => void runAction('activate', selectedPlan)}>
            Activar plan
          </Button>
          <Button disabled={saving} variant="outline" onPress={() => void runAction('renew', selectedPlan)}>
            Renovar
          </Button>
          <Button disabled={saving} variant="outline" onPress={() => void runAction('set_plan', selectedPlan)}>
            Cambiar plan
          </Button>
          <Button disabled={saving} variant="outline" onPress={() => void runAction('pending')}>
            Pendiente de pago
          </Button>
          <Button disabled={saving} variant="outline" onPress={() => void runAction('expire')}>
            Marcar vencida
          </Button>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12, marginTop: 4 },
  meta: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700' },
  value: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 16 },
  requestedPlan: { fontSize: 12, lineHeight: 16, marginTop: 4, fontWeight: '600' },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planCard: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  planName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  actions: { gap: 8 },
});
