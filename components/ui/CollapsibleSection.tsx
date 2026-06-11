'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <details
      className={cn(
        'group rounded-xl border border-border bg-surface-muted/50 overflow-hidden',
        className
      )}
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {summary && <p className="text-xs text-muted mt-0.5">{summary}</p>}
        </div>
        <ChevronDown className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-0 border-t border-border/60">{children}</div>
    </details>
  );
}
