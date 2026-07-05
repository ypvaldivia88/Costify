import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageCircle, RefreshCw, X } from 'lucide-react-native';
import type { SessionUser } from '@/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import {
  buildWhatsAppPaymentMessage,
  buildWhatsAppPaymentUrl,
  WHATSAPP_SUPPORT_NUMBER,
} from '@costify/shared/domain/subscription';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';

interface TrialBannerProps {
  user: SessionUser | null | undefined;
  onOpenSubscription?: () => void;
  onRefresh?: () => Promise<void>;
}

export function TrialBanner({ user, onOpenSubscription, onRefresh }: TrialBannerProps) {
  const { colors } = useTheme();
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
    <View
      style={[
        styles.banner,
        {
          borderColor: isTrial ? colors.brand : colors.warning,
          backgroundColor: isTrial ? colors.brandMuted : colors.accentSurface,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground, flex: 1 }]}>
          {isTrial
            ? user?.tenantPending
              ? 'Cuenta en periodo de prueba'
              : 'Periodo de prueba activo'
            : 'Cuenta en modo solo lectura'}
        </Text>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={8}
          accessibilityLabel="Cerrar aviso"
          style={styles.iconBtn}
        >
          <X size={16} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={[styles.body, { color: colors.muted }]}>
        {isTrial ? (
          <>
            Prueba con hasta {user?.trialProductLimit ?? 5} productos y{' '}
            {user?.trialRawMaterialLimit ?? 10} materias primas.
            {trialRemaining ? ` ${trialRemaining}.` : ''}
            {user?.tenantPending
              ? ' Envía el pago por WhatsApp y espera la activación para sincronizar.'
              : ' Activa tu suscripción para desbloquear todo.'}
          </>
        ) : (
          'Tu prueba terminó o la suscripción no está activa. Solo puedes consultar tus datos hasta renovar.'
        )}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => void Linking.openURL(whatsappUrl)}
          style={styles.whatsappBtn}
        >
          <MessageCircle size={14} color="#fff" />
          <Text style={styles.whatsappText}>WhatsApp ({WHATSAPP_SUPPORT_NUMBER})</Text>
        </Pressable>
        {onOpenSubscription ? (
          <Button variant="outline" onPress={onOpenSubscription}>
            Ver suscripción
          </Button>
        ) : null}
        {onRefresh ? (
          <Button variant="outline" onPress={() => void handleRefresh()} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <>
                <RefreshCw size={14} color={colors.foreground} />
                <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 13 }}>
                  {' '}Actualizar estado
                </Text>
              </>
            )}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 14, fontWeight: '800' },
  iconBtn: { padding: 2 },
  body: { fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  whatsappText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
