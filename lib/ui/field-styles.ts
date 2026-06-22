import { cn } from '@/lib/utils';

export const fieldClassName = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-border bg-surface/80 text-foreground',
  'placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-brand',
  'transition-all duration-200 hover:border-brand/30'
);

export const fieldClassNameCompact = cn(
  'min-h-11 px-3 py-2 text-sm rounded-xl border border-border bg-surface/80 text-foreground',
  'placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-brand',
  'transition-all duration-200 hover:border-brand/30'
);

export const selectClassName = fieldClassName;
