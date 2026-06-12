import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface NumericFieldProps extends Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText'> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericField({ value, onChange, style, ...props }: NumericFieldProps) {
  const { colors } = useTheme();

  return (
    <TextInput
      keyboardType="decimal-pad"
      value={value ? String(value) : ''}
      onChangeText={(text) => {
        const parsed = Number(text.replace(',', '.'));
        onChange(Number.isNaN(parsed) ? 0 : parsed);
      }}
      placeholderTextColor={colors.muted}
      style={[
        styles.field,
        {
          color: colors.foreground,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 40,
  },
});
