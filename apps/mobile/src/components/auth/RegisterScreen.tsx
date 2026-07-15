import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Building2, CheckCircle2, Moon, Sun } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SubscriptionPlan } from '@costify/shared/domain/subscription';
import {
  getSubscriptionDiscountPercent,
  getSubscriptionPlanPriceUsd,
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_INCLUDED_LOCATIONS,
  SUBSCRIPTION_MONTHLY_PRICE_USD,
  SUBSCRIPTION_PLAN_LABELS,
  formatSubscriptionLocationBreakdown,
} from '@costify/shared/domain/subscription';
import { registerRequest } from '@/api/client';
import { CostifyLogoLockup } from '@/components/brand/CostifyLogoLockup';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { NumericInput } from '@/components/ui/NumericInput';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

interface RegisterScreenProps {
  onBackToLogin: () => void;
}

export function RegisterScreen({ onBackToLogin }: RegisterScreenProps) {
  const { colors, scheme, toggleScheme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [form, setForm] = useState({
    businessName: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    plan: 'monthly' as SubscriptionPlan,
    locationCount: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    planLabel: string;
    priceUsd: number;
    whatsappUrl: string;
    message: string;
  } | null>(null);

  const planOptions = useMemo(
    () =>
      PLANS.map((plan) => ({
        plan,
        label: SUBSCRIPTION_PLAN_LABELS[plan],
        priceUsd: getSubscriptionPlanPriceUsd(plan, form.locationCount),
        discountPercent: getSubscriptionDiscountPercent(plan),
      })),
    [form.locationCount]
  );

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (form.adminPassword !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await registerRequest({
        businessName: form.businessName.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
        plan: form.plan,
        locationCount: form.locationCount,
      });
      setSuccess(result);
      void Linking.openURL(result.whatsappUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={toggleScheme}
            style={[styles.themeBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          >
            {scheme === 'dark' ? (
              <Sun size={18} color={colors.foreground} />
            ) : (
              <Moon size={18} color={colors.foreground} />
            )}
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <CostifyLogoLockup size="xl" />
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Tu solicitud quedará pendiente hasta confirmar el pago por WhatsApp
            </Text>
          </View>

          {success ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.successHeader}>
                <CheckCircle2 size={24} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.successTitle, { color: colors.foreground }]}>Solicitud enviada</Text>
                  <Text style={[styles.successBody, { color: colors.muted }]}>{success.message}</Text>
                  <Text style={[styles.successBody, { color: colors.foreground, marginTop: 8 }]}>
                    Plan: {success.planLabel} ({success.priceUsd} USD)
                  </Text>
                </View>
              </View>

              <Text style={[styles.successBody, { color: colors.muted }]}>
                Te redirigimos a WhatsApp para confirmar el pago y activar tu cuenta.
              </Text>

              <Pressable onPress={onBackToLogin} style={styles.loginLink}>
                <Text style={[styles.loginLinkText, { color: colors.brand }]}>
                  Volver a iniciar sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionTitleRow}>
                <Building2 size={16} color={colors.brand} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datos del negocio</Text>
              </View>

              <Input
                label="Nombre del negocio"
                value={form.businessName}
                onChangeText={(businessName) => setForm((prev) => ({ ...prev, businessName }))}
              />
              <Input
                label="Correo de contacto"
                value={form.contactEmail}
                onChangeText={(contactEmail) => setForm((prev) => ({ ...prev, contactEmail }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="opcional"
              />

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                Administrador del negocio
              </Text>
              <Input
                label="Tu nombre"
                value={form.adminName}
                onChangeText={(adminName) => setForm((prev) => ({ ...prev, adminName }))}
              />
              <Input
                label="Correo de acceso"
                value={form.adminEmail}
                onChangeText={(adminEmail) => setForm((prev) => ({ ...prev, adminEmail }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <PasswordInput
                label="Contraseña"
                value={form.adminPassword}
                onChangeText={(adminPassword) => setForm((prev) => ({ ...prev, adminPassword }))}
                hint="Mínimo 8 caracteres"
              />
              <PasswordInput
                label="Confirmar contraseña"
                value={form.confirmPassword}
                onChangeText={(confirmPassword) => setForm((prev) => ({ ...prev, confirmPassword }))}
              />

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                Locales
              </Text>
              <Text style={[styles.planHint, { color: colors.muted }]}>
                {SUBSCRIPTION_INCLUDED_LOCATIONS} local incluido. +$
                {SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes por local adicional.
              </Text>
              <View style={styles.planGrid}>
                {[1, 2, 3].map((count) => {
                  const selected = form.locationCount === count;
                  return (
                    <Pressable
                      key={count}
                      onPress={() => setForm((prev) => ({ ...prev, locationCount: count }))}
                      style={[
                        styles.planCard,
                        {
                          borderColor: selected ? colors.brand : colors.border,
                          backgroundColor: selected ? colors.brandMuted : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text style={[styles.planName, { color: colors.foreground }]}>
                        {count === 3 ? '3 o más' : String(count)}
                      </Text>
                    </Pressable>
                  );
                })}
                {form.locationCount > 3 ? (
                  <View style={[styles.planCard, { borderColor: colors.brand, minWidth: 120, flex: 1 }]}>
                    <NumericInput
                      label="Nº locales"
                      value={form.locationCount}
                      onChange={(locationCount) =>
                        setForm((prev) => ({
                          ...prev,
                          locationCount: Math.min(20, Math.max(3, locationCount || 3)),
                        }))
                      }
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setForm((prev) => ({ ...prev, locationCount: 4 }))}
                    style={[
                      styles.planCard,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surfaceMuted,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <Text style={[styles.planName, { color: colors.foreground, textAlign: 'center' }]}>
                      4+
                    </Text>
                  </Pressable>
                )}
              </View>
              <Text style={[styles.planHint, { color: colors.muted }]}>
                {formatSubscriptionLocationBreakdown(form.locationCount)}
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>
                Plan de suscripción
              </Text>
              <Text style={[styles.planHint, { color: colors.muted }]}>
                Base {SUBSCRIPTION_MONTHLY_PRICE_USD} USD/mes (1 local). Descuento en planes de 6 meses y anual.
              </Text>

              <View style={styles.planGrid}>
                {planOptions.map((option) => {
                  const selected = form.plan === option.plan;
                  return (
                    <Pressable
                      key={option.plan}
                      onPress={() => setForm((prev) => ({ ...prev, plan: option.plan }))}
                      style={[
                        styles.planCard,
                        {
                          borderColor: selected ? colors.brand : colors.border,
                          backgroundColor: selected ? colors.brandMuted : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Text style={[styles.planName, { color: colors.foreground }]}>{option.label}</Text>
                      <Text style={[styles.planPrice, { color: colors.foreground }]}>
                        {option.priceUsd} USD
                      </Text>
                      <Text style={[styles.planMeta, { color: colors.muted }]}>
                        {option.discountPercent > 0
                          ? `Ahorra ${option.discountPercent}%`
                          : 'Sin permanencia'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <Text style={[styles.error, { color: colors.danger, backgroundColor: colors.dangerMuted }]}>
                  {error}
                </Text>
              ) : null}

              <Button
                onPress={() => void handleSubmit()}
                disabled={
                  submitting ||
                  !form.businessName ||
                  !form.adminName ||
                  !form.adminEmail ||
                  !form.adminPassword ||
                  !form.confirmPassword
                }
              >
                {submitting ? (
                  <View style={styles.submitting}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitText}>Enviando solicitud…</Text>
                  </View>
                ) : (
                  'Solicitar registro'
                )}
              </Button>

              <Pressable onPress={onBackToLogin} style={styles.loginLink}>
                <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 14 }}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={{ color: colors.brand, fontWeight: '700' }}>Iniciar sesión</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 20 },
  hero: { alignItems: 'center', gap: 12, paddingTop: 4 },
  subtitle: { fontSize: 14, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  planHint: { fontSize: 12, lineHeight: 16 },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planCard: {
    flex: 1,
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  planName: { fontSize: 13, fontWeight: '700' },
  planPrice: { fontSize: 18, fontWeight: '800' },
  planMeta: { fontSize: 11 },
  error: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  submitting: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
  loginLink: { marginTop: 4, paddingVertical: 8 },
  loginLinkText: { textAlign: 'center', fontSize: 14, fontWeight: '700' },
  successHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  successTitle: { fontSize: 17, fontWeight: '700' },
  successBody: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
