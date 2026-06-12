import { useEffect, useState } from 'react';
import { Input, type InputProps } from '@/components/ui/Input';

interface NumericInputProps extends Omit<InputProps, 'value' | 'onChange' | 'onChangeText'> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericInput({ value, onChange, ...props }: NumericInputProps) {
  const [text, setText] = useState(value ? String(value) : '');

  useEffect(() => {
    const parsed = Number(text.replace(',', '.'));
    if (!text || Number.isNaN(parsed)) {
      if (value === 0) setText('');
      return;
    }
    if (parsed !== value) setText(String(value));
  }, [value]);

  return (
    <Input
      {...props}
      keyboardType="decimal-pad"
      value={text}
      onChangeText={(next) => {
        const cleaned = next.replace(/[^0-9.,]/g, '');
        setText(cleaned);
        const parsed = Number(cleaned.replace(',', '.'));
        onChange(Number.isNaN(parsed) ? 0 : parsed);
      }}
    />
  );
}
