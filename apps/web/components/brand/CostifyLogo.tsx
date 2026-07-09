'use client';

import type { SVGProps } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export interface CostifyMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
  pageColor?: string;
  lineColor?: string;
  copperColor?: string;
}

export function CostifyMark({
  size = 48,
  pageColor,
  lineColor,
  copperColor,
  className,
  ...props
}: CostifyMarkProps) {
  const { resolved } = useTheme();
  const isDark = resolved === 'dark';

  const page = pageColor ?? (isDark ? '#292524' : '#F7F4ED');
  const line = lineColor ?? (isDark ? '#44403C' : '#D6D3D1');
  const copper = copperColor ?? (isDark ? '#F59E0B' : '#B45309');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-label'] ? undefined : true}
      className={className}
      {...props}
    >
      <rect x="11" y="10" width="42" height="46" rx="5" fill="#047857" opacity="0.35" />
      <rect x="9" y="8" width="42" height="46" rx="5" fill={isDark ? '#34D399' : '#059669'} />
      <circle cx="13" cy="18" r="2.2" fill={isDark ? '#10B981' : '#047857'} />
      <circle cx="13" cy="26" r="2.2" fill={isDark ? '#10B981' : '#047857'} />
      <circle cx="13" cy="34" r="2.2" fill={isDark ? '#10B981' : '#047857'} />
      <circle cx="13" cy="42" r="2.2" fill={isDark ? '#10B981' : '#047857'} />
      <rect x="17" y="12" width="30" height="38" rx="2.5" fill={page} />
      <line x1="21" y1="22" x2="43" y2="22" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="28" x2="43" y2="28" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="34" x2="40" y2="34" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="42" x2="38" y2="42" stroke={copper} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="38.5" width="10" height="7" rx="1.5" fill={copper} opacity="0.15" />
      <text
        x="41"
        y="44"
        textAnchor="middle"
        fill={copper}
        fontSize="6"
        fontFamily="ui-monospace, monospace"
        fontWeight="700"
      >
        $
      </text>
    </svg>
  );
}

export interface CostifyLogoProps {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  wordmarkClassName?: string;
  /** Use landing typography/colors (default true on landing pages) */
  landing?: boolean;
}

const SIZE_MAP = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
} as const;

const WORDMARK_CLASS = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-[1.75rem]',
  xl: 'text-[2.5rem]',
} as const;

export function CostifyLogo({
  variant = 'full',
  size = 'md',
  className,
  wordmarkClassName,
  landing = false,
}: CostifyLogoProps) {
  const markSize = SIZE_MAP[size];

  if (variant === 'mark') {
    return <CostifyMark size={markSize} className={className} aria-label="Costify" />;
  }

  const wordmarkColor = landing
    ? 'text-landing-ink'
    : 'text-foreground';

  return (
    <span
      className={cn('inline-flex items-center gap-3 shrink-0', className)}
      aria-label="Costify"
    >
      <CostifyMark size={markSize} className="shrink-0" />
      <span
        className={cn(
          'font-semibold tracking-tight leading-none',
          landing ? 'font-display' : 'font-bold',
          wordmarkColor,
          WORDMARK_CLASS[size],
          wordmarkClassName
        )}
      >
        Costify
      </span>
    </span>
  );
}
