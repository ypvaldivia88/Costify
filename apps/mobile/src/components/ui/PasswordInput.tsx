import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Input, type InputProps } from '@/components/ui/Input';

export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightAdornment'> {}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(function PasswordInput(
  props,
  ref
) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      {...props}
      secureTextEntry={!visible}
      rightAdornment={
        <Pressable
          onPress={() => setVisible((value) => !value)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={styles.toggle}
        >
          {visible ? (
            <EyeOff size={20} color={colors.muted} />
          ) : (
            <Eye size={20} color={colors.muted} />
          )}
        </Pressable>
      }
    />
  );
});

const styles = StyleSheet.create({
  toggle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
