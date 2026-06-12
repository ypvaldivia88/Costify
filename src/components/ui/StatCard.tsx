import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface StatCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'accent' | 'warning';
}

export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const { colors } = useTheme();
  const valueColor =
    variant === 'accent' ? colors.brand : variant === 'warning' ? colors.warning : colors.foreground;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '800' },
});
