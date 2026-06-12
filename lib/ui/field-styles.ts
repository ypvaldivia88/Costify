import { cn } from '@/lib/utils';

export const fieldClassName = cn(
  'w-full min-h-11 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground',
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all'
);

export const fieldClassNameCompact = cn(
  'min-h-11 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-foreground',
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand transition-all'
);

export const selectClassName = fieldClassName;
