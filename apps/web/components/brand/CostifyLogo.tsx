'use client';

import type { SVGProps } from 'react';
import {
  COSTIFY_C_ARC,
  COSTIFY_MARGIN_TICK,
  COSTIFY_MARK_BARS,
  COSTIFY_MARK_VIEWBOX,
  getCostifyMarkPalette,
} from '@costify/ui-tokens';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export interface CostifyMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  /** Force palette; defaults to current theme. */
  isDark?: boolean;
}

export function CostifyMark({ size = 48, className, isDark, ...props }: CostifyMarkProps) {
  const { resolved } = useTheme();
  const dark = isDark ?? resolved === 'dark';
  const palette = getCostifyMarkPalette(dark);

  return (
    <svg
      width={size}
      height={size}
      viewBox={COSTIFY_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        d={COSTIFY_C_ARC}
        stroke={palette.arc}
        strokeWidth={palette.arcWidth}
        strokeLinecap="round"
        fill="none"
      />
      {COSTIFY_MARK_BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={bar.rx}
          fill={palette.bars[index]}
          opacity={palette.barOpacities[index]}
        />
      ))}
      <rect
        x={COSTIFY_MARGIN_TICK.x}
        y={COSTIFY_MARGIN_TICK.y}
        width={COSTIFY_MARGIN_TICK.width}
        height={COSTIFY_MARGIN_TICK.height}
        rx={COSTIFY_MARGIN_TICK.rx}
        fill={palette.margin}
      />
    </svg>
  );
}

export interface CostifyLogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = { sm: 32, md: 40, lg: 48, xl: 56 } as const;
const WORDMARK = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' } as const;

export function CostifyLogo({ variant = 'full', size = 'md', className }: CostifyLogoProps) {
  const markSize = SIZE_MAP[size];

  if (variant === 'mark') {
    return <CostifyMark size={markSize} aria-label="Costify" />;
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5 shrink-0', className)} aria-label="Costify">
      <CostifyMark size={markSize} />
      <span
        className={cn(
          'font-bold tracking-tight text-foreground',
          WORDMARK[size]
        )}
      >
        Cost<span className="text-brand">ify</span>
      </span>
    </span>
  );
}
