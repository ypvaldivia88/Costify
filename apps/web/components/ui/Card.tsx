import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'accent' | 'glass';
}

const variants = {
  default: 'bg-card border-border shadow-sm ring-1 ring-foreground/5',
  muted: 'bg-surface-muted border-border/80 ring-1 ring-foreground/5',
  accent: 'bg-accent-surface border-accent-border ring-1 ring-brand/10',
  glass: 'glass shadow-float border-transparent',
};

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 sm:p-6',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Card as ShadcnCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/shadcn-card';
