import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type CardVariant = 'default' | 'muted' | 'accent';

interface CardProps extends ViewProps {
  variant?: CardVariant;
}

export function Card({ variant = 'default', style, ...props }: CardProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === 'accent'
      ? colors.accentSurface
      : variant === 'muted'
        ? colors.surfaceMuted
        : colors.surface;

  const borderColor = variant === 'accent' ? colors.accentBorder : colors.border;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor, borderColor },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
