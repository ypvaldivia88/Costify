import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent';
}

const variants = {
  default: 'bg-white border-zinc-200/80 shadow-sm',
  muted: 'bg-zinc-50 border-zinc-200/60',
  accent: 'bg-emerald-50 border-emerald-200/80',
};

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl border p-4 sm:p-5', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
