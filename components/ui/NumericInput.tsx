'use client';

import { useNumericField } from '@/hooks/use-numeric-field';
import { Input } from './Input';

interface NumericInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'inputMode'
> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericInput({ value, onChange, onBlur, onFocus, ...props }: NumericInputProps) {
  const { text, handleChange, handleFocus, handleBlur } = useNumericField({ value, onChange });

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={(e) => {
        handleFocus();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        handleBlur();
        onBlur?.(e);
      }}
    />
  );
}
