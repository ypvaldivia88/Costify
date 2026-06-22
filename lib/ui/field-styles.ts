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

/** Minimum 44×44px touch target for icon-only controls (mobile-friendly). */
export const iconButtonClassName = cn(
  'inline-flex items-center justify-center p-2.5 min-w-11 min-h-11 rounded-xl transition-colors active:scale-[0.97]'
);

export const iconButtonMutedClassName = cn(
  iconButtonClassName,
  'text-muted hover:text-foreground hover:bg-surface-muted'
);

export const iconButtonDangerClassName = cn(
  iconButtonClassName,
  'text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
);

/** Segmented nav / chip controls with comfortable tap area. */
export const segmentClassName = cn(
  'inline-flex items-center gap-1.5 shrink-0 min-h-11 px-4 rounded-xl text-sm font-semibold border transition-colors active:scale-[0.98]'
);
