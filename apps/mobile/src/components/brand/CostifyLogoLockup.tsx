import { View, Text, StyleSheet } from 'react-native';
import { CostifyMark } from '@/components/brand/CostifyLogo';
import { useTheme } from '@/context/ThemeContext';

const SIZE_MAP = { sm: 32, md: 44, lg: 56, xl: 72 } as const;
const WORDMARK_SIZE = { sm: 20, md: 26, lg: 32, xl: 38 } as const;

export interface CostifyLogoLockupProps {
  variant?: 'full' | 'mark';
  size?: keyof typeof SIZE_MAP;
  align?: 'center' | 'left';
}

export function CostifyLogoLockup({
  variant = 'full',
  size = 'lg',
  align = 'center',
}: CostifyLogoLockupProps) {
  const { colors, scheme } = useTheme();
  const markSize = SIZE_MAP[size];
  const isDark = scheme === 'dark';

  if (variant === 'mark') {
    return (
      <CostifyMark
        size={markSize}
        pageColor={isDark ? '#292524' : '#F7F4ED'}
        lineColor={isDark ? '#44403C' : '#D6D3D1'}
        copperColor={isDark ? '#F59E0B' : '#B45309'}
      />
    );
  }

  return (
    <View style={[styles.row, align === 'center' ? styles.center : styles.left]}>
      <CostifyMark
        size={markSize}
        pageColor={isDark ? '#292524' : '#F7F4ED'}
        lineColor={isDark ? '#44403C' : '#D6D3D1'}
        copperColor={isDark ? '#F59E0B' : '#B45309'}
      />
      <Text style={[styles.wordmark, { color: colors.foreground, fontSize: WORDMARK_SIZE[size] }]}>
        Costify
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  center: { justifyContent: 'center' },
  left: { justifyContent: 'flex-start' },
  wordmark: { fontWeight: '800', letterSpacing: -0.5 },
});
