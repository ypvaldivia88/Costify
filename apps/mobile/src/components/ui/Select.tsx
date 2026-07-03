import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ label, value, onValueChange, children }: SelectProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text> : null}
      <View style={[styles.pickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={[styles.picker, { color: colors.foreground }]}
          dropdownIconColor={colors.muted}
          mode={Platform.OS === 'android' ? 'dropdown' : undefined}
        >
          {children}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  pickerWrap: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
});
