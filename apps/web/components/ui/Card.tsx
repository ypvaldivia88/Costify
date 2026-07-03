import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent' | 'glass';
}

const variants = {
  default: 'bg-surface border-border shadow-elevated',
  muted: 'bg-surface-muted border-border/80',
  accent: 'bg-accent-surface border-accent-border',
  glass: 'glass shadow-float',
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
