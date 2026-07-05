import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import type { SubscriptionPlan, TenantSubscription } from '@costify/shared/domain/subscription';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  formatSubscriptionExpiry,
  getSubscriptionPlanPriceUsd,
  getSubscriptionStatusLabel,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLANS,
} from '@costify/shared/domain/subscription';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface SubscriptionPanelProps {
  businessName: string;
  contactName: string;
  contactEmail: string;
  subscription?: TenantSubscription | null;
  manageable?: boolean;
  onChangePlan?: (plan: SubscriptionPlan) => Promise<void>;
}

function statusColors(
  subscription: TenantSubscription,
  colors: ReturnType<typeof useTheme>['colors']
): { bg: string; text: string } {
  if (subscription.status === 'active') {
    if (subscription.expiresAt && subscription.expiresAt < Date.now()) {
      return { bg: colors.accentSurface, text: colors.warning };
    }
    return { bg: colors.brandMuted, text: colors.brandForeground };
  }
  if (subscription.status === 'pending_payment') {
    return { bg: '#dbeafe', text: '#1e40af' };
  }
  return { bg: colors.dangerMuted, text: colors.danger };
}

export function SubscriptionPanel({
  businessName,
  contactName,
  contactEmail,
  subscription,
  manageable = false,
  onChangePlan,
}: SubscriptionPanelProps) {
  const { colors, scheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(subscription?.plan ?? 'monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const badge = statusColors(subscription, colors);
  const pendingPaymentBg = scheme === 'dark' ? '#172554' : '#dbeafe';
  const pendingPaymentText = scheme === 'dark' ? '#dbeafe' : '#1e40af';
  const planChanged = selectedPlan !== subscription.plan;
  const canRequestPlan = needsPayment || planChanged;

  function openWhatsAppForPlan(plan: SubscriptionPlan) {
    const priceUsd = getSubscriptionPlanPriceUsd(plan);
    const url = buildWhatsAppPaymentUrl(
      buildWhatsAppPaymentMessage({
        businessName,
        contactName,
        email: contactEmail,
        plan,
        priceUsd,
        isRenewal: !needsPayment || isExpired,
      })
    );
    void Linking.openURL(url);
  }

  async function handleRequestPlan() {
    if (!onChangePlan || !canRequestPlan) return;
    setSaving(true);
    setError(null);
    try {
      if (planChanged) {
        await onChangePlan(selectedPlan);
      }
      openWhatsAppForPlan(selectedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <SectionHeader
        icon={CreditCard}
        title="Plan de suscripción"
        description={
          manageable
            ? 'Elige tu plan y continúa por WhatsApp para pagar.'
            : 'Estado de tu plan y opciones de pago o renovación'
        }
      />

      <View style={styles.stack}>
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  subscription.status === 'pending_payment' ? pendingPaymentBg : badge.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    subscription.status === 'pending_payment' ? pendingPaymentText : badge.text,
                },
              ]}
            >
              {isExpired ? 'Vencida' : getSubscriptionStatusLabel(subscription)}
            </Text>
          </View>
          <Text style={[styles.planLabel, { color: colors.foreground }]}>
            {SUBSCRIPTION_PLAN_LABELS[subscription.plan]}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={[styles.stat, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Precio del plan</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {subscription.priceUsd.toFixed(2)} USD
            </Text>
            <Text style={[styles.statHint, { color: colors.muted }]}>
              {subscription.discountPercent > 0
                ? `${subscription.discountPercent}% de descuento`
                : `${subscription.monthlyPriceUsd.toFixed(2)} USD / mes`}
            </Text>
          </View>
          <View style={[styles.stat, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Vencimiento</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {subscription.status === 'active'
                ? formatSubscriptionExpiry(subscription.expiresAt)
                : 'Pendiente de activación'}
            </Text>
          </View>
        </View>

        {manageable && onChangePlan ? (
          <View style={styles.planSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Plan</Text>
            <View style={styles.planGrid}>
              {SUBSCRIPTION_PLANS.map((planId) => {
                const selected = selectedPlan === planId;
                return (
                  <Pressable
                    key={planId}
                    onPress={() => setSelectedPlan(planId)}
                    style={[
                      styles.planOption,
                      {
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brandMuted : colors.surfaceMuted,
                      },
                    ]}
                  >
                    <Text style={[styles.planOptionLabel, { color: colors.foreground }]}>
                      {SUBSCRIPTION_PLAN_LABELS[planId]}
                    </Text>
                    <Text style={[styles.planOptionPrice, { color: colors.muted }]}>
                      {getSubscriptionPlanPriceUsd(planId).toFixed(2)} USD
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button onPress={() => void handleRequestPlan()} disabled={saving || !canRequestPlan}>
              {saving ? 'Abriendo WhatsApp…' : 'Continuar por WhatsApp'}
            </Button>
            {error ? <Text style={[styles.feedback, { color: colors.danger }]}>{error}</Text> : null}
          </View>
        ) : needsPayment ? (
          <Button onPress={() => openWhatsAppForPlan(subscription.plan)}>
            Continuar por WhatsApp
          </Button>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  planLabel: { fontSize: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statHint: { fontSize: 12, lineHeight: 16 },
  planSection: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planOption: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    alignItems: 'center',
  },
  planOptionLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  planOptionPrice: { fontSize: 11, textAlign: 'center' },
  feedback: { fontSize: 12, lineHeight: 16 },
});
