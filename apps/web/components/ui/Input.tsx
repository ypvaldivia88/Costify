import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { ShadcnInput } from '@/components/ui/shadcn-input';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, type, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}
      {isPassword ? (
        <PasswordInput
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
      ) : (
        <ShadcnInput
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          className={cn(error && 'border-destructive', className)}
          {...props}
        />
      )}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
