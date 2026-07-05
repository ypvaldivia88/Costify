import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import type { SessionUser } from '@/auth/types';
import { formatTrialRemaining } from '@costify/shared/domain/access';
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
}

export function TrialBanner({ user, onOpenSubscription }: TrialBannerProps) {
  const { colors } = useTheme();

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
    <View
      style={[
        styles.banner,
        {
          borderColor: isTrial ? colors.brand : colors.warning,
          backgroundColor: isTrial ? colors.brandMuted : colors.accentSurface,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        {isTrial
          ? user.tenantPending
            ? 'Cuenta en periodo de prueba'
            : 'Periodo de prueba activo'
          : 'Cuenta en modo solo lectura'}
      </Text>
      <Text style={[styles.body, { color: colors.muted }]}>
        {isTrial ? (
          <>
            Prueba con hasta {user.trialProductLimit ?? 5} productos y{' '}
            {user.trialRawMaterialLimit ?? 10} materias primas.
            {trialRemaining ? ` ${trialRemaining}.` : ''}
            {user.tenantPending
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
  title: { fontSize: 14, fontWeight: '800' },
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
