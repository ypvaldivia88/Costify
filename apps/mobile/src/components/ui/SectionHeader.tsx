import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Icon size={18} color={colors.brand} />
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {description ? (
        <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '700', flex: 1, flexShrink: 1 },
  description: { fontSize: 13, lineHeight: 18 },
});
