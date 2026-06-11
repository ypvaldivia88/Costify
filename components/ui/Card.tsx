import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent';
}

const variants = {
  default: 'bg-surface border-border shadow-sm',
  muted: 'bg-surface-muted border-border/80',
  accent: 'bg-accent-surface border-accent-border',
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
