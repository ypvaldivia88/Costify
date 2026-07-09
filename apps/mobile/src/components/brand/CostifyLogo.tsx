import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';

export interface CostifyMarkProps {
  size?: number;
  pageColor?: string;
  lineColor?: string;
  copperColor?: string;
}

/** "Libreta de Costos" mark for React Native — transparent background. */
export function CostifyMark({
  size = 48,
  pageColor = '#F7F4ED',
  lineColor = '#D6D3D1',
  copperColor = '#B45309',
}: CostifyMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x="11" y="10" width="42" height="46" rx="5" fill="#047857" opacity="0.35" />
      <Rect x="9" y="8" width="42" height="46" rx="5" fill="#059669" />
      <Circle cx="13" cy="18" r="2.2" fill="#047857" />
      <Circle cx="13" cy="26" r="2.2" fill="#047857" />
      <Circle cx="13" cy="34" r="2.2" fill="#047857" />
      <Circle cx="13" cy="42" r="2.2" fill="#047857" />
      <Rect x="17" y="12" width="30" height="38" rx="2.5" fill={pageColor} />
      <Line x1="21" y1="22" x2="43" y2="22" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="21" y1="28" x2="43" y2="28" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="21" y1="34" x2="40" y2="34" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="21" y1="42" x2="38" y2="42" stroke={copperColor} strokeWidth="2.5" strokeLinecap="round" />
      <Rect x="36" y="38.5" width="10" height="7" rx="1.5" fill={copperColor} opacity="0.15" />
      <SvgText
        x="41"
        y="44"
        textAnchor="middle"
        fill={copperColor}
        fontSize="6"
        fontWeight="700"
      >
        $
      </SvgText>
    </Svg>
  );
}

const SIZE_MAP = { sm: 32, md: 44, lg: 56, xl: 72 } as const;
const WORDMARK_SIZE = { sm: 20, md: 26, lg: 32, xl: 38 } as const;

export interface CostifyLogoProps {
  variant?: 'full' | 'mark';
  size?: keyof typeof SIZE_MAP;
  foregroundColor?: string;
  pageColor?: string;
  lineColor?: string;
  copperColor?: string;
}

export function CostifyLogo({
  variant = 'full',
  size = 'md',
  foregroundColor = '#1C1917',
  pageColor,
  lineColor,
  copperColor,
}: CostifyLogoProps) {
  const markSize = SIZE_MAP[size];

  if (variant === 'mark') {
    return (
      <CostifyMark
        size={markSize}
        pageColor={pageColor}
        lineColor={lineColor}
        copperColor={copperColor}
      />
    );
  }

  return (
    <>
      <CostifyMark
        size={markSize}
        pageColor={pageColor}
        lineColor={lineColor}
        copperColor={copperColor}
      />
      {/* Wordmark rendered by parent as Text for native font stack */}
    </>
  );
}

export function getCostifyLogoSizes(size: keyof typeof SIZE_MAP) {
  return { mark: SIZE_MAP[size], wordmark: WORDMARK_SIZE[size] };
}
