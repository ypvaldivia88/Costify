import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-brand text-white hover:opacity-90 active:opacity-80 shadow-sm',
  secondary: 'bg-foreground text-background hover:opacity-90 active:opacity-80',
  ghost: 'text-muted hover:bg-surface-muted hover:text-foreground',
  danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40',
  outline: 'border border-border text-foreground hover:bg-surface-muted',
};

const sizes = {
  sm: 'px-3 py-2 text-xs min-h-9',
  md: 'px-4 py-2.5 text-sm min-h-11',
  lg: 'px-5 py-3 text-base min-h-12',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
