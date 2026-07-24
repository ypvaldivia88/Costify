import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CostifyLogoLockup } from '@/components/brand/CostifyLogoLockup';
import { useAuth } from '@/context/AuthContext';
import { isDeviceOnline } from '@/config/connectivity';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';

interface LoginScreenProps {
  onRegister?: () => void;
}

export function LoginScreen({ onRegister }: LoginScreenProps) {
  const { login } = useAuth();
  const { colors, scheme, toggleScheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);
  const passwordYRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isDeviceOnline()) {
      setError(
        'Sin conexión. Inicia sesión una vez con internet; después la app recordará tu cuenta hasta 7 días.'
      );
    }
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToPassword = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, passwordYRef.current - 24), animated: true });
    });
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
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
          contentContainerStyle={[
            styles.content,
            keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 24 } : null,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <CostifyLogoLockup size="xl" />
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Inicia sesión para gestionar tu negocio con precisión
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="tu@empresa.com"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View
              onLayout={(event) => {
                passwordYRef.current = event.nativeEvent.layout.y;
              }}
            >
              <PasswordInput
                ref={passwordRef}
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
                placeholder="••••••••"
                returnKeyType="done"
                onFocus={scrollToPassword}
                onSubmitEditing={() => void handleSubmit()}
              />
            </View>
            {error ? (
              <Text style={[styles.error, { color: colors.danger, backgroundColor: colors.dangerMuted }]}>
                {error}
              </Text>
            ) : null}
            <Button onPress={() => void handleSubmit()} disabled={submitting || !email || !password}>
              {submitting ? (
                <View style={styles.submitting}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitText}>Entrando…</Text>
                </View>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </View>

          <Text style={[styles.footer, { color: colors.muted }]}>
            Calculadora de costos para MIPYME en Cuba
          </Text>
          {onRegister ? (
            <Pressable onPress={onRegister} style={styles.registerLink}>
              <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 14 }}>
                ¿No tienes cuenta?{' '}
                <Text style={{ color: colors.brand, fontWeight: '700' }}>Registra tu negocio</Text>
              </Text>
            </Pressable>
          ) : null}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 24,
  },
  hero: { alignItems: 'center', gap: 12, paddingTop: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  error: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  submitting: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 'auto' },
  registerLink: { paddingVertical: 4 },
});
