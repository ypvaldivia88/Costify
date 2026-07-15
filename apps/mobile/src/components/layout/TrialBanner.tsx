import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import type { SessionUser } from '@/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const VISIBLE_MS = 8000;
const FADE_MS = 600;
const dismissedBannerKeys = new Set<string>();

interface TrialBannerProps {
  user: SessionUser | null | undefined;
}

function getBannerKey(user: SessionUser): string {
  return `${user.userId}:${user.accessLevel}:${user.subscriptionStatus ?? ''}`;
}

function getBannerMessage(user: SessionUser): string {
  if (user.accessLevel === 'trial') {
    const remaining =
      user.trialEndsAt != null ? formatTrialRemaining(user.trialEndsAt) : null;
    const limits = `Hasta ${user.trialProductLimit ?? 5} productos en prueba`;
    return remaining ? `${limits} · ${remaining}` : limits;
  }
  return 'Solo lectura hasta activar tu suscripción';
}

export function TrialBanner({ user }: TrialBannerProps) {
  const { colors } = useTheme();
  const { refresh } = useAuth();
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isTrial = user?.accessLevel === 'trial';
  const isReadonly = user?.accessLevel === 'readonly';

  useEffect(() => {
    if (!user || !shouldShowAccessBanner(user)) {
      setVisible(false);
      return;
    }
    const bannerKey = getBannerKey(user);
    if (!isReadonly && dismissedBannerKeys.has(bannerKey)) {
      setVisible(false);
      return;
    }
    setVisible(true);
    opacity.setValue(1);
    const fadeTimer = setTimeout(() => {
      if (isReadonly) return;
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          dismissedBannerKeys.add(bannerKey);
          setVisible(false);
        }
      });
    }, VISIBLE_MS);
    return () => clearTimeout(fadeTimer);
  }, [user?.accessLevel, user?.subscriptionStatus, user?.userId, opacity, user, isReadonly]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (!user || !visible || !shouldShowAccessBanner(user)) {
    return null;
  }

  if (isReadonly) {
    return (
      <View
        style={[
          styles.readonlyBanner,
          { borderColor: colors.warning, backgroundColor: colors.accentSurface },
        ]}
      >
        <Text style={[styles.text, styles.readonlyText, { color: colors.muted }]}>
          {getBannerMessage(user)}. Si el administrador ya activó tu cuenta, actualiza la sesión.
        </Text>
        <Pressable
          onPress={() => void handleRefresh()}
          disabled={refreshing}
          style={[styles.refreshButton, { borderColor: colors.border }]}
        >
          <RefreshCw size={14} color={colors.foreground} />
          <Text style={[styles.refreshLabel, { color: colors.foreground }]}>
            {refreshing ? 'Actualizando…' : 'Actualizar sesión'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity,
          borderColor: isTrial ? colors.brand : colors.warning,
          backgroundColor: isTrial ? colors.brandMuted : colors.accentSurface,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.muted }]}>{getBannerMessage(user)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  readonlyBanner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  text: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
  readonlyText: { textAlign: 'left' },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshLabel: { fontSize: 13, fontWeight: '600' },
});
