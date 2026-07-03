import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightAdornment?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, style, rightAdornment, ...props },
  ref
) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text> : null}
      <View style={styles.fieldWrap}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              color: colors.foreground,
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
            },
            rightAdornment ? styles.inputWithAdornment : null,
            style,
          ]}
          {...props}
        />
        {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      {!error && hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  fieldWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  inputWithAdornment: {
    paddingRight: 44,
  },
  adornment: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: { fontSize: 12 },
  hint: { fontSize: 12 },
});
