'use client';

import { useEffect, useState } from 'react';
import {
  formatNumericDisplay,
  isNumericPartial,
  parseNumericInput,
} from '@/lib/format/numeric-input';
import { Input } from './Input';

interface NumericInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'inputMode'
> {
  value: number;
  onChange: (value: number) => void;
}

export function NumericInput({ value, onChange, onBlur, onFocus, ...props }: NumericInputProps) {
  const [text, setText] = useState(() => formatNumericDisplay(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(formatNumericDisplay(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    if (!isNumericPartial(raw)) return;
    setText(raw);
    onChange(parseNumericInput(raw));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    if (text.trim() === '') {
      setText('');
    } else {
      const parsed = parseNumericInput(text);
      setText(Number.isFinite(parsed) ? String(parsed) : '');
    }
    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
