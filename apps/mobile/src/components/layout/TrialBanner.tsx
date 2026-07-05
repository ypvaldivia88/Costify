import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import type { SessionUser } from '@/auth/types';
import { formatTrialRemaining, shouldShowAccessBanner } from '@costify/shared/domain/access';
import { useTheme } from '@/context/ThemeContext';

const VISIBLE_MS = 4500;
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
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);
  const isTrial = user?.accessLevel === 'trial';

  useEffect(() => {
    if (!user || !shouldShowAccessBanner(user)) {
      setVisible(false);
      return;
    }
    const bannerKey = getBannerKey(user);
    if (dismissedBannerKeys.has(bannerKey)) {
      setVisible(false);
      return;
    }
    setVisible(true);
    opacity.setValue(1);
    const fadeTimer = setTimeout(() => {
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
  }, [user?.accessLevel, user?.subscriptionStatus, user?.userId, opacity, user]);

  if (!user || !visible || !shouldShowAccessBanner(user)) {
    return null;
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
  text: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
