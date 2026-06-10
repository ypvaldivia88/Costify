import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
  secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700',
  ghost: 'text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200',
  danger: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  outline: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100',
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
