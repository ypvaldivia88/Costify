'use client';

import type { SVGProps } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export interface CostifyMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function CostifyMark({ size = 48, className, ...props }: CostifyMarkProps) {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';
  const brand = isDark ? '#34D399' : '#059669';
  const brandDark = isDark ? '#10B981' : '#047857';
  const bars = isDark
    ? ['#6EE7B7', '#34D399', '#10B981']
    : ['#6EE7B7', '#10B981', '#047857'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('shrink-0', className)}
      {...props}
    >
      <path
        d="M44 12C33 12 24 21 24 32s9 20 20 20c4 0 8-1 11-3"
        stroke={brand}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="30" y="38" width="4" height="8" rx="1" fill={bars[0]} />
      <rect x="36" y="34" width="4" height="12" rx="1" fill={bars[1]} />
      <rect x="42" y="28" width="4" height="18" rx="1" fill={bars[2]} />
      <circle cx="32" cy="32" r="3" fill={brandDark} opacity="0.9" />
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
      <span className={cn('font-bold tracking-tight text-foreground', WORDMARK[size])}>Costify</span>
    </span>
  );
}
