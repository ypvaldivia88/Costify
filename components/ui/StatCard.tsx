import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'accent' | 'warning';
  className?: string;
}

const valueVariants = {
  default: 'text-zinc-900',
  accent: 'text-emerald-700',
  warning: 'text-amber-700',
};

export function StatCard({ label, value, subtext, variant = 'default', className }: StatCardProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn('text-xl sm:text-2xl font-bold tabular-nums', valueVariants[variant])}>
        {value}
      </p>
      {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
    </div>
  );
}
