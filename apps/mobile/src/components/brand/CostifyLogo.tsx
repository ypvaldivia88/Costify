import Svg, { Circle, Path, Rect } from 'react-native-svg';

const MARK_COLORS = {
  brand: '#059669',
  brandDark: '#047857',
} as const;

export interface CostifyMarkProps {
  size?: number;
  brandColor?: string;
  brandDarkColor?: string;
  isDark?: boolean;
}

/** Geometric Costify mark — C arc with ascending bars (cost → margin). */
export function CostifyMark({
  size = 48,
  brandColor,
  brandDarkColor,
  isDark = false,
}: CostifyMarkProps) {
  const brand = brandColor ?? (isDark ? '#34D399' : MARK_COLORS.brand);
  const brandDark = brandDarkColor ?? (isDark ? '#10B981' : MARK_COLORS.brandDark);
  const bars = isDark
    ? ['#6EE7B7', '#34D399', '#10B981']
    : ['#6EE7B7', '#10B981', '#047857'];

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M44 12C33 12 24 21 24 32s9 20 20 20c4 0 8-1 11-3"
        stroke={brand}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Rect x={30} y={38} width={4} height={8} rx={1} fill={bars[0]} />
      <Rect x={36} y={34} width={4} height={12} rx={1} fill={bars[1]} />
      <Rect x={42} y={28} width={4} height={18} rx={1} fill={bars[2]} />
      <Circle cx={32} cy={32} r={3} fill={brandDark} opacity={0.9} />
    </Svg>
  );
}

const SIZE_MAP = { sm: 32, md: 44, lg: 56, xl: 72 } as const;
const WORDMARK_SIZE = { sm: 20, md: 26, lg: 32, xl: 38 } as const;

export interface CostifyLogoProps {
  variant?: 'full' | 'mark';
  size?: keyof typeof SIZE_MAP;
  isDark?: boolean;
}

export function CostifyLogo({ variant = 'full', size = 'md', isDark = false }: CostifyLogoProps) {
  const markSize = SIZE_MAP[size];

  if (variant === 'mark') {
    return <CostifyMark size={markSize} isDark={isDark} />;
  }

  return <CostifyMark size={markSize} isDark={isDark} />;
}

export function getCostifyLogoSizes(size: keyof typeof SIZE_MAP) {
  return { mark: SIZE_MAP[size], wordmark: WORDMARK_SIZE[size] };
}
