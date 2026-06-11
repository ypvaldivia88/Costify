'use client';

import { useEffect, useState } from 'react';
import {
  formatNumericDisplay,
  isNumericPartial,
  parseNumericInput,
} from '@/lib/format/numeric-input';
import { cn } from '@/lib/utils';

interface NumericFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode'
> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericField({ value, onChange, onBlur, onFocus, className, ...props }: NumericFieldProps) {
  const [text, setText] = useState(() => formatNumericDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(formatNumericDisplay(value));
    }
  }, [value, focused]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.');
        if (!isNumericPartial(raw)) return;
        setText(raw);
        onChange(parseNumericInput(raw));
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        if (text.trim() === '') {
          setText('');
        } else {
          const parsed = parseNumericInput(text);
          setText(Number.isFinite(parsed) ? String(parsed) : '');
        }
        onBlur?.(e);
      }}
      className={cn(
        'min-h-11 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all',
        className
      )}
    />
  );
}
