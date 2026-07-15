import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import {
  COSTIFY_APP_ICON_BG,
  COSTIFY_C_ARC,
  COSTIFY_ICON_GRADIENT,
  COSTIFY_MARGIN_TICK,
  COSTIFY_MARK_BARS,
  COSTIFY_MARK_VIEWBOX,
  getCostifyAppIconPalette,
  getCostifyMarkPalette,
} from '@costify/ui-tokens';

export interface CostifyMarkProps {
  size?: number;
  isDark?: boolean;
  /** Filled app-icon style on brand gradient (splash, store). */
  variant?: 'inline' | 'app';
}

export function CostifyMark({
  size = 48,
  isDark = false,
  variant = 'inline',
}: CostifyMarkProps) {
  const inlinePalette = getCostifyMarkPalette(isDark);
  const appPalette = getCostifyAppIconPalette();
  const palette = variant === 'app' ? appPalette : inlinePalette;
  const arcWidth = variant === 'app' ? 5.5 : inlinePalette.arcWidth;

  return (
    <Svg width={size} height={size} viewBox={COSTIFY_MARK_VIEWBOX} fill="none">
      {variant === 'app' ? (
        <Defs>
          <LinearGradient id="costifyIconBg" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={COSTIFY_ICON_GRADIENT.start} />
            <Stop offset="1" stopColor={COSTIFY_ICON_GRADIENT.end} />
          </LinearGradient>
        </Defs>
      ) : null}
      {variant === 'app' ? (
        <Rect
          x={COSTIFY_APP_ICON_BG.x}
          y={COSTIFY_APP_ICON_BG.y}
          width={COSTIFY_APP_ICON_BG.width}
          height={COSTIFY_APP_ICON_BG.height}
          rx={COSTIFY_APP_ICON_BG.rx}
          fill="url(#costifyIconBg)"
        />
      ) : null}
      <Path
        d={COSTIFY_C_ARC}
        stroke={palette.arc}
        strokeWidth={arcWidth}
        strokeLinecap="round"
        fill="none"
      />
      {COSTIFY_MARK_BARS.map((bar, index) => (
        <Rect
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
      <Rect
        x={COSTIFY_MARGIN_TICK.x}
        y={COSTIFY_MARGIN_TICK.y}
        width={COSTIFY_MARGIN_TICK.width}
        height={COSTIFY_MARGIN_TICK.height}
        rx={COSTIFY_MARGIN_TICK.rx}
        fill={palette.margin}
      />
    </Svg>
  );
}

const SIZE_MAP = { sm: 32, md: 44, lg: 56, xl: 72 } as const;

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
  return { mark: SIZE_MAP[size] };
}
