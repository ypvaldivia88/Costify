import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'accent' | 'warning';
  className?: string;
}

const valueVariants = {
  default: 'text-foreground',
  accent: 'text-gradient-brand',
  warning: 'text-amber-600 dark:text-amber-400',
};

export function StatCard({ label, value, subtext, variant = 'default', className }: StatCardProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={cn('text-xl sm:text-2xl font-bold tabular-nums tracking-tight', valueVariants[variant])}>
        {value}
      </p>
      {subtext && <p className="text-xs text-muted">{subtext}</p>}
    </div>
  );
}
