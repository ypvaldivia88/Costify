import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-brand-gradient text-white hover:brightness-110 active:brightness-95 shadow-glow hover:shadow-[0_8px_32px_rgba(5,150,105,0.28)]',
  secondary: 'bg-foreground text-background hover:opacity-90 active:opacity-80 shadow-elevated',
  ghost: 'text-muted hover:bg-surface-muted hover:text-foreground',
  danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40',
  outline: 'border border-border text-foreground hover:bg-surface-muted hover:border-brand/30',
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
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
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
