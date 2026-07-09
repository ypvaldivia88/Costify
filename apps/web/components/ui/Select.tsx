'use client';

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn-select';

interface SelectOption {
  value: string;
  label: ReactNode;
}

function parseOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const el = child as ReactElement<{ value?: string | number; children?: ReactNode }>;
      return {
        value: String(el.props.value ?? ''),
        label: el.props.children,
      };
    });
}

interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function Select({
  label,
  hint,
  error,
  value,
  onChange,
  id,
  className,
  disabled,
  children,
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const options = parseOptions(children);

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={selectId} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      <SelectRoot
        value={value ?? null}
        onValueChange={(next) => onChange?.({ target: { value: next ?? '' } })}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn(
            'w-full min-h-12 h-12 rounded-xl border-border bg-surface px-4 text-base text-foreground',
            'dark:bg-input/30 dark:hover:bg-input/50',
            error && 'border-destructive',
            className
          )}
        >
          <SelectValue placeholder="Seleccionar…" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export {
  Select as ShadcnSelectRoot,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn-select';
