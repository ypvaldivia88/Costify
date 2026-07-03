'use client';

import { useNumericField } from '@/hooks/use-numeric-field';
import { fieldClassNameCompact } from '@/lib/ui/field-styles';
import { cn } from '@/lib/utils';

interface NumericFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode'
> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericField({ value, onChange, onBlur, onFocus, className, ...props }: NumericFieldProps) {
  const { text, handleChange, handleFocus, handleBlur } = useNumericField({ value, onChange });

  return (
    <input
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
      className={cn(fieldClassNameCompact, className)}
    />
  );
}
